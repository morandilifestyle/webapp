import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireUser, requireAdmin } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Extend Request interface to include uploadedImages
declare global {
  namespace Express {
    interface Request {
      uploadedImages?: string[];
    }
  }
}

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple file upload handling (without multer for now)
const handleImageUpload = (req: any, res: any, next: any) => {
  // This is a simplified version - in production, you'd use multer or cloud storage
  const imageUrls: string[] = [];
  
  // For now, we'll accept image URLs in the request body
  if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
    imageUrls.push(...req.body.imageUrls);
  }
  
  req.uploadedImages = imageUrls;
  next();
};

// Get product reviews
router.get('/products/:productId/reviews', async (req: any, res) => {
  try {
    const { productId } = req.params;
    const {
      rating,
      sortBy = 'helpful',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        ),
        review_images (
          id,
          image_url,
          alt_text,
          sort_order
        )
      `)
      .eq('product_id', productId)
      .eq('is_approved', true);

    // Apply rating filter
    if (rating) {
      query = query.eq('rating', parseInt(rating as string));
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,review_text.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'helpful':
        query = query.order('helpful_votes', { ascending: sortOrder === 'asc' });
        break;
      case 'date':
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
        break;
      case 'rating':
        query = query.order('rating', { ascending: sortOrder === 'asc' });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('is_approved', true);

    if (countError) {
      console.error('Error counting reviews:', countError);
      return res.status(500).json({ error: 'Failed to count reviews' });
    }

    // Get review analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('review_analytics')
      .select('*')
      .eq('product_id', productId)
      .single();

    // Transform reviews data
    const transformedReviews = (reviews as any[])?.map((review: any) => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      orderId: review.order_id,
      rating: review.rating,
      title: review.title,
      reviewText: review.review_text,
      isVerifiedPurchase: review.is_verified_purchase,
      isApproved: review.is_approved,
      isEdited: review.is_edited,
      helpfulVotes: review.helpful_votes,
      unhelpfulVotes: review.unhelpful_votes,
      images: review.review_images?.map((img: any) => ({
        id: img.id,
        reviewId: img.review_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
        createdAt: img.created_at,
      })) || [],
      user: {
        id: review.users.id,
        name: `${review.users.first_name} ${review.users.last_name}`,
        email: review.users.email,
      },
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    })) || [];

    res.json({
      reviews: transformedReviews,
      totalCount: count || 0,
      averageRating: analytics?.average_rating || 0,
      ratingDistribution: analytics?.rating_distribution || {},
      hasNextPage: offset + parseInt(limit as string) < (count || 0),
      hasPreviousPage: parseInt(page as string) > 1,
    });
  } catch (error) {
    console.error('Error in reviews GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create review
router.post('/', authenticateToken, handleImageUpload, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, rating, title, reviewText } = req.body;

    // Input validation
    if (!productId || !rating || !title || !reviewText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate title length
    if (title.length < 3 || title.length > 255) {
      return res.status(400).json({ error: 'Title must be between 3 and 255 characters' });
    }

    // Validate review text length
    if (reviewText.length < 10 || reviewText.length > 2000) {
      return res.status(400).json({ error: 'Review text must be between 10 and 2000 characters' });
    }

    // Check if user can review this product
    const { data: canReview, error: canReviewError } = await supabase
      .rpc('can_user_review_product', {
        p_user_id: userId,
        p_product_id: productId,
      });

    if (canReviewError) {
      console.error('Error checking review eligibility:', canReviewError);
      return res.status(500).json({ error: 'Failed to check review eligibility' });
    }

    if (!canReview) {
      return res.status(403).json({ 
        error: 'You cannot review this product. You must purchase it first and not have already reviewed it.' 
      });
    }

    // Check if user has purchased the product
    const { data: hasPurchase, error: purchaseError } = await supabase
      .rpc('verify_purchase_for_review', {
        p_user_id: userId,
        p_product_id: productId,
      });

    if (purchaseError) {
      console.error('Error checking purchase:', purchaseError);
      return res.status(500).json({ error: 'Failed to verify purchase' });
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating: parseInt(rating),
        title,
        review_text: reviewText,
        is_verified_purchase: hasPurchase,
        is_approved: false, // Requires admin approval
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    // Handle review images if provided
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      const imagePromises = req.uploadedImages.map((imageUrl: string, index: number) => {
        return supabase
          .from('review_images')
          .insert({
            review_id: review.id,
            image_url: imageUrl,
            alt_text: `Review image ${index + 1}`,
            sort_order: index
          });
      });

      try {
        await Promise.all(imagePromises);
      } catch (imageError) {
        console.error('Error saving review images:', imageError);
        // Don't fail the review creation if image saving fails
      }
    }

    res.status(201).json({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      rating: review.rating,
      title: review.title,
      reviewText: review.review_text,
      isVerifiedPurchase: review.is_verified_purchase,
      isApproved: review.is_approved,
      createdAt: review.created_at,
    });
  } catch (error) {
    console.error('Error in review POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update review
router.put('/:reviewId', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.userId;
    const { reviewId } = req.params;
    const { rating, title, reviewText } = req.body;

    // Check if review exists and belongs to user
    const { data: existingReview, error: fetchError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }

    // Check if review is within 30 days
    const reviewDate = new Date(existingReview.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (reviewDate < thirtyDaysAgo) {
      return res.status(403).json({ error: 'Reviews can only be edited within 30 days' });
    }

    // Update review
    const updateData: any = {
      is_edited: true,
    };

    if (rating) updateData.rating = parseInt(rating);
    if (title) updateData.title = title;
    if (reviewText) updateData.review_text = reviewText;

    const { data: updatedReview, error: updateError } = await supabase
      .from('product_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }

    // Note: Image upload functionality would be implemented here
    // For now, we'll skip image handling

    res.json({
      id: updatedReview.id,
      productId: updatedReview.product_id,
      userId: updatedReview.user_id,
      rating: updatedReview.rating,
      title: updatedReview.title,
      reviewText: updatedReview.review_text,
      isVerifiedPurchase: updatedReview.is_verified_purchase,
      isApproved: updatedReview.is_approved,
      isEdited: updatedReview.is_edited,
      updatedAt: updatedReview.updated_at,
    });
  } catch (error) {
    console.error('Error in review PUT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete review
router.delete('/:reviewId', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.userId;
    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return res.status(500).json({ error: 'Failed to delete review' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error in review DELETE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on review
router.post('/:reviewId/vote', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.userId;
    const { reviewId } = req.params;
    const { voteType } = req.body;

    if (!voteType || !['helpful', 'unhelpful'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if user already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('review_votes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('review_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id);

      if (updateError) {
        console.error('Error updating vote:', updateError);
        return res.status(500).json({ error: 'Failed to update vote' });
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabase
        .from('review_votes')
        .insert({
          review_id: reviewId,
          user_id: userId,
          vote_type: voteType,
        });

      if (insertError) {
        console.error('Error creating vote:', insertError);
        return res.status(500).json({ error: 'Failed to create vote' });
      }
    }

    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error in review vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report review
router.post('/:reviewId/report', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.userId;
    const { reviewId } = req.params;
    const { reportReason, reportDescription } = req.body;

    if (!reportReason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Create report
    const { error: reportError } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reporter_id: userId,
        report_reason: reportReason,
        report_description: reportDescription,
      });

    if (reportError) {
      console.error('Error creating report:', reportError);
      return res.status(500).json({ error: 'Failed to create report' });
    }

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error in review report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user can review product
router.get('/products/:productId/can-review', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.userId;
    const { productId } = req.params;

    const { data: canReview, error } = await supabase
      .rpc('can_user_review_product', {
        p_user_id: userId,
        p_product_id: productId,
      });

    if (error) {
      console.error('Error checking review eligibility:', error);
      return res.status(500).json({ error: 'Failed to check review eligibility' });
    }

    // Get additional info
    const { data: hasPurchase } = await supabase
      .rpc('verify_purchase_for_review', {
        p_user_id: userId,
        p_product_id: productId,
      });

    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    res.json({
      canReview: !!canReview,
      hasPurchase: !!hasPurchase,
      hasReview: !!existingReview,
      reason: canReview ? undefined : 'You must purchase this product first and not have already reviewed it.',
    });
  } catch (error) {
    console.error('Error in can-review check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review analytics
router.get('/products/:productId/reviews/analytics', async (req: any, res) => {
  try {
    const { productId } = req.params;

    const { data: analytics, error } = await supabase
      .from('review_analytics')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching analytics:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    res.json({
      productId,
      totalReviews: analytics?.total_reviews || 0,
      averageRating: analytics?.average_rating || 0,
      ratingDistribution: analytics?.rating_distribution || {},
      verifiedReviews: 0, // Would need to calculate this
      recentReviews: 0, // Would need to calculate this
      lastUpdated: analytics?.last_updated || new Date(),
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 