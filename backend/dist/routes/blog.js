"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const blogService_1 = require("../services/blogService");
const router = express_1.default.Router();
router.get('/posts', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            categoryId: req.query.categoryId,
            authorId: req.query.authorId,
            isFeatured: req.query.isFeatured === 'true',
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            search: req.query.search,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        const posts = await blogService_1.blogService.getBlogPosts(filters);
        res.json(posts);
    }
    catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});
router.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await blogService_1.blogService.getBlogPostBySlug(slug);
        if (!post) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        await blogService_1.blogService.trackContentView(post.id, 'blog_post', req.user?.userId);
        res.json(post);
    }
    catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});
router.post('/posts', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'author']), async (req, res) => {
    try {
        const postData = req.body;
        const post = await blogService_1.blogService.createBlogPost(postData, req.user.userId);
        res.status(201).json(post);
    }
    catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});
router.put('/posts/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'author']), async (req, res) => {
    try {
        const { id } = req.params;
        const postData = req.body;
        const existingPost = await blogService_1.blogService.getBlogPostById(id);
        if (!existingPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        if (req.user.role !== 'admin' && existingPost.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to edit this post' });
        }
        const post = await blogService_1.blogService.updateBlogPost(id, postData);
        res.json(post);
    }
    catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({ error: 'Failed to update blog post' });
    }
});
router.delete('/posts/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'author']), async (req, res) => {
    try {
        const { id } = req.params;
        const existingPost = await blogService_1.blogService.getBlogPostById(id);
        if (!existingPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        if (req.user.role !== 'admin' && existingPost.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        await blogService_1.blogService.deleteBlogPost(id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ error: 'Failed to delete blog post' });
    }
});
router.get('/categories', async (req, res) => {
    try {
        const categories = await blogService_1.blogService.getBlogCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching blog categories:', error);
        res.status(500).json({ error: 'Failed to fetch blog categories' });
    }
});
router.post('/categories', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const category = await blogService_1.blogService.createBlogCategory(req.body);
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Error creating blog category:', error);
        res.status(500).json({ error: 'Failed to create blog category' });
    }
});
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await blogService_1.blogService.getBlogComments(postId);
        res.json(comments);
    }
    catch (error) {
        console.error('Error fetching blog comments:', error);
        res.status(500).json({ error: 'Failed to fetch blog comments' });
    }
});
router.post('/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const commentData = {
            ...req.body,
            postId
        };
        const comment = await blogService_1.blogService.createBlogComment(commentData, req.user?.userId);
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('Error creating blog comment:', error);
        res.status(500).json({ error: 'Failed to create blog comment' });
    }
});
router.put('/comments/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const { error } = await blogService_1.blogService.supabase
            .from('blog_comments')
            .update({ content })
            .eq('id', id)
            .eq('user_id', req.user.userId);
        if (error) {
            throw error;
        }
        res.json({ message: 'Comment updated successfully' });
    }
    catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});
router.delete('/comments/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await blogService_1.blogService.deleteComment(id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});
router.put('/comments/:id/approve', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await blogService_1.blogService.approveComment(id);
        res.json({ message: 'Comment approved successfully' });
    }
    catch (error) {
        console.error('Error approving comment:', error);
        res.status(500).json({ error: 'Failed to approve comment' });
    }
});
router.get('/promotional', async (req, res) => {
    try {
        const location = req.query.location;
        const content = await blogService_1.blogService.getPromotionalContent(location);
        res.json(content);
    }
    catch (error) {
        console.error('Error fetching promotional content:', error);
        res.status(500).json({ error: 'Failed to fetch promotional content' });
    }
});
router.post('/newsletter/subscribe', async (req, res) => {
    try {
        const { email, firstName, lastName, source } = req.body;
        const subscription = await blogService_1.blogService.subscribeToNewsletter(email, firstName, lastName, source);
        res.status(201).json(subscription);
    }
    catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});
router.post('/newsletter/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        await blogService_1.blogService.unsubscribeFromNewsletter(email);
        res.json({ message: 'Successfully unsubscribed from newsletter' });
    }
    catch (error) {
        console.error('Error unsubscribing from newsletter:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
    }
});
router.get('/analytics/:contentId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { contentId } = req.params;
        const contentType = req.query.contentType;
        if (!contentType) {
            return res.status(400).json({ error: 'Content type is required' });
        }
        const analytics = await blogService_1.blogService.getContentAnalytics(contentId, contentType);
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching content analytics:', error);
        res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
});
router.get('/admin/content', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };
        const posts = await blogService_1.blogService.getBlogPosts(filters);
        res.json(posts);
    }
    catch (error) {
        console.error('Error fetching admin content:', error);
        res.status(500).json({ error: 'Failed to fetch admin content' });
    }
});
router.get('/admin/content/analytics', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { contentId, contentType } = req.query;
        if (!contentId || !contentType) {
            return res.status(400).json({ error: 'Content ID and content type are required' });
        }
        const analytics = await blogService_1.blogService.getContentAnalytics(contentId, contentType);
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching admin analytics:', error);
        res.status(500).json({ error: 'Failed to fetch admin analytics' });
    }
});
exports.default = router;
//# sourceMappingURL=blog.js.map