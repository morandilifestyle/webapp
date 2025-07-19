import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get all reviews for moderation
router.get('/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      status = 'pending',
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products (
          id,
          name,
          slug
        ),
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
      `);

    // Filter by status
    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    } else if (status === 'rejected') {
      query = query.eq('is_approved', false).not('rejection_reason', 'is', null);
    }

    // Apply sorting
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Error fetching reviews for moderation:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting reviews:', countError);
      return res.status(500).json({ error: 'Failed to count reviews' });
    }

    // Transform reviews data
    const transformedReviews = (reviews as any[])?.map((review: any) => ({
      id: review.id,
      productId: review.product_id,
      userId: review.user_id,
      rating: review.rating,
      title: review.title,
      reviewText: review.review_text,
      isVerifiedPurchase: review.is_verified_purchase,
      isApproved: review.is_approved,
      isEdited: review.is_edited,
      helpfulVotes: review.helpful_votes,
      unhelpfulVotes: review.unhelpful_votes,
      rejectionReason: review.rejection_reason,
      images: review.review_images?.map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
      })) || [],
      product: {
        id: review.products.id,
        name: review.products.name,
        slug: review.products.slug,
      },
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
      currentPage: parseInt(page as string),
      totalPages: Math.ceil((count || 0) / parseInt(limit as string)),
      hasNextPage: offset + parseInt(limit as string) < (count || 0),
      hasPreviousPage: parseInt(page as string) > 1,
    });
  } catch (error) {
    console.error('Error in admin reviews GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve review
router.put('/reviews/:reviewId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNotes } = req.body;

    // Check if review exists
    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review status
    const { data: updatedReview, error: updateError } = await supabase
      .from('product_reviews')
      .update({
        is_approved: true,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving review:', updateError);
      return res.status(500).json({ error: 'Failed to approve review' });
    }

    res.json({
      success: true,
      message: 'Review approved successfully',
      review: {
        id: updatedReview.id,
        isApproved: updatedReview.is_approved,
        adminNotes: updatedReview.admin_notes,
        updatedAt: updatedReview.updated_at,
      }
    });
  } catch (error) {
    console.error('Error in approve review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject review
router.put('/reviews/:reviewId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check if review exists
    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review status
    const { data: updatedReview, error: updateError } = await supabase
      .from('product_reviews')
      .update({
        is_approved: false,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting review:', updateError);
      return res.status(500).json({ error: 'Failed to reject review' });
    }

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review: {
        id: updatedReview.id,
        isApproved: updatedReview.is_approved,
        rejectionReason: updatedReview.rejection_reason,
        adminNotes: updatedReview.admin_notes,
        updatedAt: updatedReview.updated_at,
      }
    });
  } catch (error) {
    console.error('Error in reject review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk approve reviews
router.post('/reviews/bulk-approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reviewIds, adminNotes } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ error: 'Review IDs array is required' });
    }

    // Update multiple reviews
    const { data: updatedReviews, error: updateError } = await supabase
      .from('product_reviews')
      .update({
        is_approved: true,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .in('id', reviewIds)
      .select();

    if (updateError) {
      console.error('Error bulk approving reviews:', updateError);
      return res.status(500).json({ error: 'Failed to approve reviews' });
    }

    res.json({
      success: true,
      message: `${updatedReviews?.length || 0} reviews approved successfully`,
      approvedCount: updatedReviews?.length || 0
    });
  } catch (error) {
    console.error('Error in bulk approve reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review analytics for admin
router.get('/reviews/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `created_at >= '${startDate}' AND created_at <= '${endDate}'`;
    }

    // Get review statistics
    const { data: stats, error: statsError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact' });

    if (statsError) {
      console.error('Error fetching review stats:', statsError);
      return res.status(500).json({ error: 'Failed to fetch review statistics' });
    }

    // Get pending reviews count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false);

    if (pendingError) {
      console.error('Error counting pending reviews:', pendingError);
      return res.status(500).json({ error: 'Failed to count pending reviews' });
    }

    // Get approved reviews count
    const { count: approvedCount, error: approvedError } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);

    if (approvedError) {
      console.error('Error counting approved reviews:', approvedError);
      return res.status(500).json({ error: 'Failed to count approved reviews' });
    }

    // Get average rating
    const { data: avgRating, error: avgError } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('is_approved', true);

    if (avgError) {
      console.error('Error calculating average rating:', avgError);
      return res.status(500).json({ error: 'Failed to calculate average rating' });
    }

    const totalRating = (avgRating as any[])?.reduce((sum, review) => sum + review.rating, 0) || 0;
    const averageRating = (avgRating as any[])?.length > 0 ? totalRating / (avgRating as any[]).length : 0;

    res.json({
      totalReviews: stats?.length || 0,
      pendingReviews: pendingCount || 0,
      approvedReviews: approvedCount || 0,
      averageRating: Math.round(averageRating * 100) / 100,
      reviewRate: stats?.length > 0 ? ((approvedCount || 0) / stats.length * 100).toFixed(2) : '0',
    });
  } catch (error) {
    console.error('Error in review analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review reports
router.get('/reviews/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = supabase
      .from('review_reports')
      .select(`
        *,
        product_reviews (
          id,
          title,
          review_text,
          rating,
          is_approved
        ),
        users!review_reports_reporter_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('report_status', status);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1);

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching review reports:', reportsError);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('review_reports')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting reports:', countError);
      return res.status(500).json({ error: 'Failed to count reports' });
    }

    // Transform reports data
    const transformedReports = (reports as any[])?.map((report: any) => ({
      id: report.id,
      reviewId: report.review_id,
      reporterId: report.reporter_id,
      reportReason: report.report_reason,
      reportDescription: report.report_description,
      reportStatus: report.report_status,
      adminNotes: report.admin_notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      review: {
        id: report.product_reviews.id,
        title: report.product_reviews.title,
        reviewText: report.product_reviews.review_text,
        rating: report.product_reviews.rating,
        isApproved: report.product_reviews.is_approved,
      },
      reporter: {
        id: report.users.id,
        name: `${report.users.first_name} ${report.users.last_name}`,
        email: report.users.email,
      }
    })) || [];

    res.json({
      reports: transformedReports,
      totalCount: count || 0,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil((count || 0) / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Error in review reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update report status
router.put('/reviews/reports/:reportId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, reviewed, or resolved' });
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('review_reports')
      .update({
        report_status: status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report status:', updateError);
      return res.status(500).json({ error: 'Failed to update report status' });
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: {
        id: updatedReport.id,
        status: updatedReport.report_status,
        adminNotes: updatedReport.admin_notes,
        updatedAt: updatedReport.updated_at,
      }
    });
  } catch (error) {
    console.error('Error in update report status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 