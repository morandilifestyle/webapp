import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { blogService } from '../services/blogService';
import { BlogPostCreateRequest, BlogPostUpdateRequest, BlogCommentCreateRequest, BlogFilters } from '../types/blog';

const router = express.Router();

// Blog Posts
router.get('/posts', async (req, res) => {
  try {
    const filters: BlogFilters = {
      status: req.query.status as any,
      categoryId: req.query.categoryId as string,
      authorId: req.query.authorId as string,
      isFeatured: req.query.isFeatured === 'true',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const posts = await blogService.getBlogPosts(filters);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await blogService.getBlogPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Track view
    await blogService.trackContentView(post.id, 'blog_post', req.user?.userId);

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/posts', authenticateToken, requireRole(['admin', 'author']), async (req, res) => {
  try {
    const postData: BlogPostCreateRequest = req.body;
    const post = await blogService.createBlogPost(postData, req.user!.userId);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/posts/:id', authenticateToken, requireRole(['admin', 'author']), async (req, res) => {
  try {
    const { id } = req.params;
    const postData: BlogPostUpdateRequest = req.body;
    
    // Check if user can edit this post
    const existingPost = await blogService.getBlogPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    if (req.user!.role !== 'admin' && existingPost.authorId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const post = await blogService.updateBlogPost(id, postData);
    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/posts/:id', authenticateToken, requireRole(['admin', 'author']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user can delete this post
    const existingPost = await blogService.getBlogPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    if (req.user!.role !== 'admin' && existingPost.authorId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await blogService.deleteBlogPost(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Blog Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await blogService.getBlogCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({ error: 'Failed to fetch blog categories' });
  }
});

router.post('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const category = await blogService.createBlogCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating blog category:', error);
    res.status(500).json({ error: 'Failed to create blog category' });
  }
});

// Blog Comments
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await blogService.getBlogComments(postId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching blog comments:', error);
    res.status(500).json({ error: 'Failed to fetch blog comments' });
  }
});

router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const commentData: BlogCommentCreateRequest = {
      ...req.body,
      postId
    };

    const comment = await blogService.createBlogComment(commentData, req.user?.userId);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating blog comment:', error);
    res.status(500).json({ error: 'Failed to create blog comment' });
  }
});

router.put('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // For now, we'll just update the content
    // In a full implementation, you'd want to get the comment first and check permissions
    const { error } = await blogService.supabase
      .from('blog_comments')
      .update({ content })
      .eq('id', id)
      .eq('user_id', req.user!.userId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/comments/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.deleteComment(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.put('/comments/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.approveComment(id);
    res.json({ message: 'Comment approved successfully' });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

// Promotional Content
router.get('/promotional', async (req, res) => {
  try {
    const location = req.query.location as string;
    const content = await blogService.getPromotionalContent(location);
    res.json(content);
  } catch (error) {
    console.error('Error fetching promotional content:', error);
    res.status(500).json({ error: 'Failed to fetch promotional content' });
  }
});

// Newsletter
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName, source } = req.body;
    const subscription = await blogService.subscribeToNewsletter(email, firstName, lastName, source);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    await blogService.unsubscribeFromNewsletter(email);
    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
  }
});

// Analytics (Admin only)
router.get('/analytics/:contentId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { contentId } = req.params;
    const contentType = req.query.contentType as string;
    
    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    const analytics = await blogService.getContentAnalytics(contentId, contentType);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
});

// Admin Content Management
router.get('/admin/content', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const filters: BlogFilters = {
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const posts = await blogService.getBlogPosts(filters);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin content:', error);
    res.status(500).json({ error: 'Failed to fetch admin content' });
  }
});

router.get('/admin/content/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { contentId, contentType } = req.query;
    
    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'Content ID and content type are required' });
    }

    const analytics = await blogService.getContentAnalytics(contentId as string, contentType as string);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

export default router; 