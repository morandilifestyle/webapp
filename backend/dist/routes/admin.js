"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
router.get('/reviews', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
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
        if (status === 'pending') {
            query = query.eq('is_approved', false);
        }
        else if (status === 'approved') {
            query = query.eq('is_approved', true);
        }
        else if (status === 'rejected') {
            query = query.eq('is_approved', false).not('rejection_reason', 'is', null);
        }
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        query = query.range(offset, offset + parseInt(limit) - 1);
        const { data: reviews, error: reviewsError } = await query;
        if (reviewsError) {
            console.error('Error fetching reviews for moderation:', reviewsError);
            return res.status(500).json({ error: 'Failed to fetch reviews' });
        }
        const { count, error: countError } = await supabase
            .from('product_reviews')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('Error counting reviews:', countError);
            return res.status(500).json({ error: 'Failed to count reviews' });
        }
        const transformedReviews = reviews?.map((review) => ({
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
            images: review.review_images?.map((img) => ({
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
            currentPage: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit)),
            hasNextPage: offset + parseInt(limit) < (count || 0),
            hasPreviousPage: parseInt(page) > 1,
        });
    }
    catch (error) {
        console.error('Error in admin reviews GET:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/reviews/:reviewId/approve', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { adminNotes } = req.body;
        const { data: review, error: fetchError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('id', reviewId)
            .single();
        if (fetchError || !review) {
            return res.status(404).json({ error: 'Review not found' });
        }
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
    }
    catch (error) {
        console.error('Error in approve review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/reviews/:reviewId/reject', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rejectionReason, adminNotes } = req.body;
        if (!rejectionReason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        const { data: review, error: fetchError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('id', reviewId)
            .single();
        if (fetchError || !review) {
            return res.status(404).json({ error: 'Review not found' });
        }
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
    }
    catch (error) {
        console.error('Error in reject review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/reviews/bulk-approve', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { reviewIds, adminNotes } = req.body;
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({ error: 'Review IDs array is required' });
        }
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
    }
    catch (error) {
        console.error('Error in bulk approve reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/reviews/analytics', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = '';
        if (startDate && endDate) {
            dateFilter = `created_at >= '${startDate}' AND created_at <= '${endDate}'`;
        }
        const { data: stats, error: statsError } = await supabase
            .from('product_reviews')
            .select('*', { count: 'exact' });
        if (statsError) {
            console.error('Error fetching review stats:', statsError);
            return res.status(500).json({ error: 'Failed to fetch review statistics' });
        }
        const { count: pendingCount, error: pendingError } = await supabase
            .from('product_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);
        if (pendingError) {
            console.error('Error counting pending reviews:', pendingError);
            return res.status(500).json({ error: 'Failed to count pending reviews' });
        }
        const { count: approvedCount, error: approvedError } = await supabase
            .from('product_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', true);
        if (approvedError) {
            console.error('Error counting approved reviews:', approvedError);
            return res.status(500).json({ error: 'Failed to count approved reviews' });
        }
        const { data: avgRating, error: avgError } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('is_approved', true);
        if (avgError) {
            console.error('Error calculating average rating:', avgError);
            return res.status(500).json({ error: 'Failed to calculate average rating' });
        }
        const totalRating = avgRating?.reduce((sum, review) => sum + review.rating, 0) || 0;
        const averageRating = avgRating?.length > 0 ? totalRating / avgRating.length : 0;
        res.json({
            totalReviews: stats?.length || 0,
            pendingReviews: pendingCount || 0,
            approvedReviews: approvedCount || 0,
            averageRating: Math.round(averageRating * 100) / 100,
            reviewRate: stats?.length > 0 ? ((approvedCount || 0) / stats.length * 100).toFixed(2) : '0',
        });
    }
    catch (error) {
        console.error('Error in review analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/reviews/reports', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
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
        if (status !== 'all') {
            query = query.eq('report_status', status);
        }
        query = query.order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);
        const { data: reports, error: reportsError } = await query;
        if (reportsError) {
            console.error('Error fetching review reports:', reportsError);
            return res.status(500).json({ error: 'Failed to fetch reports' });
        }
        const { count, error: countError } = await supabase
            .from('review_reports')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('Error counting reports:', countError);
            return res.status(500).json({ error: 'Failed to count reports' });
        }
        const transformedReports = reports?.map((report) => ({
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
            currentPage: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit)),
        });
    }
    catch (error) {
        console.error('Error in review reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/reviews/reports/:reportId', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in update report status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map