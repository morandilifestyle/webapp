import { supabase } from '../index';
import { 
  BlogPost, 
  BlogCategory, 
  BlogComment, 
  PromotionalContent,
  ContentAnalytics,
  NewsletterSubscription,
  BlogPostCreateRequest,
  BlogPostUpdateRequest,
  BlogCommentCreateRequest,
  BlogFilters,
  ContentAnalyticsSummary
} from '../types/blog';

export class BlogService {
  public supabase = supabase;
  // Blog Posts
  async getBlogPosts(filters: BlogFilters = {}): Promise<BlogPost[]> {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:users(id, name, email),
        categories:blog_post_categories(
          category:blog_categories(*)
        )
      `);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.categoryId) {
      query = query.eq('blog_post_categories.category_id', filters.categoryId);
    }
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching blog posts: ${error.message}`);
    }

    return data?.map(this.mapBlogPostFromDB) || [];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:users(id, name, email),
        categories:blog_post_categories(
          category:blog_categories(*)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Post not found
      }
      throw new Error(`Error fetching blog post: ${error.message}`);
    }

    return this.mapBlogPostFromDB(data);
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:users(id, name, email),
        categories:blog_post_categories(
          category:blog_categories(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching blog post: ${error.message}`);
    }

    return this.mapBlogPostFromDB(data);
  }

  async createBlogPost(postData: BlogPostCreateRequest, authorId: string): Promise<BlogPost> {
    // Generate slug if not provided
    const slug = postData.slug || this.generateSlug(postData.title);
    
    // Calculate reading time
    const readingTime = this.calculateReadingTime(postData.content);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: postData.title,
        slug,
        excerpt: postData.excerpt,
        content: postData.content,
        featured_image: postData.featuredImage,
        author_id: authorId,
        status: postData.status || 'draft',
        published_at: postData.publishedAt,
        meta_title: postData.metaTitle,
        meta_description: postData.metaDescription,
        tags: postData.tags || [],
        reading_time: readingTime,
        is_featured: postData.isFeatured || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating blog post: ${error.message}`);
    }

    // Add categories if provided
    if (postData.categoryIds && postData.categoryIds.length > 0) {
      await this.addCategoriesToPost(data.id, postData.categoryIds);
    }

    return this.mapBlogPostFromDB(data);
  }

  async updateBlogPost(id: string, postData: BlogPostUpdateRequest): Promise<BlogPost> {
    const updateData: any = {};
    
    if (postData.title) updateData.title = postData.title;
    if (postData.slug) updateData.slug = postData.slug;
    if (postData.excerpt !== undefined) updateData.excerpt = postData.excerpt;
    if (postData.content) {
      updateData.content = postData.content;
      updateData.reading_time = this.calculateReadingTime(postData.content);
    }
    if (postData.featuredImage !== undefined) updateData.featured_image = postData.featuredImage;
    if (postData.status) updateData.status = postData.status;
    if (postData.publishedAt) updateData.published_at = postData.publishedAt;
    if (postData.metaTitle) updateData.meta_title = postData.metaTitle;
    if (postData.metaDescription) updateData.meta_description = postData.metaDescription;
    if (postData.tags) updateData.tags = postData.tags;
    if (postData.isFeatured !== undefined) updateData.is_featured = postData.isFeatured;

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating blog post: ${error.message}`);
    }

    // Update categories if provided
    if (postData.categoryIds) {
      await this.updatePostCategories(id, postData.categoryIds);
    }

    return this.mapBlogPostFromDB(data);
  }

  async deleteBlogPost(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting blog post: ${error.message}`);
    }
  }

  // Blog Categories
  async getBlogCategories(): Promise<BlogCategory[]> {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Error fetching blog categories: ${error.message}`);
    }

    return data?.map(this.mapBlogCategoryFromDB) || [];
  }

  async createBlogCategory(categoryData: Partial<BlogCategory>): Promise<BlogCategory> {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert({
        name: categoryData.name!,
        slug: categoryData.slug!,
        description: categoryData.description,
        parent_id: categoryData.parentId,
        sort_order: categoryData.sortOrder || 0,
        is_active: categoryData.isActive !== false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating blog category: ${error.message}`);
    }

    return this.mapBlogCategoryFromDB(data);
  }

  // Blog Comments
  async getBlogComments(postId: string): Promise<BlogComment[]> {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        user:users(id, name, email),
        replies:blog_comments(*, user:users(id, name, email))
      `)
      .eq('post_id', postId)
      .eq('is_approved', true)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching blog comments: ${error.message}`);
    }

    return data?.map(this.mapBlogCommentFromDB) || [];
  }

  async createBlogComment(commentData: BlogCommentCreateRequest, userId?: string): Promise<BlogComment> {
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: commentData.postId,
        user_id: userId,
        parent_id: commentData.parentId,
        author_name: commentData.authorName,
        author_email: commentData.authorEmail,
        content: commentData.content,
        is_approved: !userId, // Auto-approve if user is logged in
        ip_address: '127.0.0.1', // In production, get from request
        user_agent: 'Unknown' // In production, get from request
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating blog comment: ${error.message}`);
    }

    return this.mapBlogCommentFromDB(data);
  }

  async approveComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .update({ is_approved: true })
      .eq('id', commentId);

    if (error) {
      throw new Error(`Error approving comment: ${error.message}`);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
  }

  // Promotional Content
  async getPromotionalContent(location?: string): Promise<PromotionalContent[]> {
    let query = supabase
      .from('promotional_content')
      .select('*')
      .eq('is_active', true);

    if (location) {
      query = query.eq('display_location', location);
    }

    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching promotional content: ${error.message}`);
    }

    return data?.map(this.mapPromotionalContentFromDB) || [];
  }

  // Newsletter
  async subscribeToNewsletter(email: string, firstName?: string, lastName?: string, source?: string): Promise<NewsletterSubscription> {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .upsert({
        email,
        first_name: firstName,
        last_name: lastName,
        subscription_source: source,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error subscribing to newsletter: ${error.message}`);
    }

    return this.mapNewsletterSubscriptionFromDB(data);
  }

  async unsubscribeFromNewsletter(email: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('email', email);

    if (error) {
      throw new Error(`Error unsubscribing from newsletter: ${error.message}`);
    }
  }

  // Analytics
  async trackContentView(contentId: string, contentType: string, userId?: string, sessionId?: string): Promise<void> {
    const { error } = await supabase
      .from('content_analytics')
      .insert({
        content_id: contentId,
        content_type: contentType,
        event_type: 'view',
        user_id: userId,
        session_id: sessionId,
        ip_address: '127.0.0.1', // In production, get from request
        user_agent: 'Unknown' // In production, get from request
      });

    if (error) {
      console.error('Error tracking content view:', error);
    }
  }

  async getContentAnalytics(contentId: string, contentType: string): Promise<ContentAnalyticsSummary> {
    const { data, error } = await supabase
      .from('content_analytics')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (error) {
      throw new Error(`Error fetching content analytics: ${error.message}`);
    }

    const analytics = data || [];
    const views = analytics.filter(a => a.event_type === 'view').length;
    const likes = analytics.filter(a => a.event_type === 'like').length;
    const shares = analytics.filter(a => a.event_type === 'share').length;
    const comments = analytics.filter(a => a.event_type === 'comment').length;
    const uniqueVisitors = new Set(analytics.map(a => a.user_id || a.session_id)).size;
    const engagementRate = views > 0 ? ((likes + shares + comments) / views) * 100 : 0;

    return {
      contentId,
      contentType,
      views,
      likes,
      shares,
      comments,
      engagementRate,
      averageTimeOnPage: 0, // Would need additional tracking
      uniqueVisitors
    };
  }

  // Helper methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async addCategoriesToPost(postId: string, categoryIds: string[]): Promise<void> {
    const categoryData = categoryIds.map(categoryId => ({
      post_id: postId,
      category_id: categoryId
    }));

    const { error } = await supabase
      .from('blog_post_categories')
      .insert(categoryData);

    if (error) {
      throw new Error(`Error adding categories to post: ${error.message}`);
    }
  }

  private async updatePostCategories(postId: string, categoryIds: string[]): Promise<void> {
    // Delete existing categories
    await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    // Add new categories
    if (categoryIds.length > 0) {
      await this.addCategoriesToPost(postId, categoryIds);
    }
  }

  // Database mapping methods
  private mapBlogPostFromDB(data: any): BlogPost {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featured_image,
      authorId: data.author_id,
      status: data.status,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
      tags: data.tags || [],
      readingTime: data.reading_time,
      viewCount: data.view_count,
      likeCount: data.like_count,
      commentCount: data.comment_count,
      isFeatured: data.is_featured,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      author: data.author ? {
        id: data.author.id,
        name: data.author.name,
        email: data.author.email
      } : undefined,
      categories: data.categories?.map((c: any) => this.mapBlogCategoryFromDB(c.category)) || []
    };
  }

  private mapBlogCategoryFromDB(data: any): BlogCategory {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parent_id,
      sortOrder: data.sort_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at)
    };
  }

  private mapBlogCommentFromDB(data: any): BlogComment {
    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      parentId: data.parent_id,
      authorName: data.author_name,
      authorEmail: data.author_email,
      content: data.content,
      isApproved: data.is_approved,
      isSpam: data.is_spam,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at),
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email
      } : undefined,
      replies: data.replies?.map((r: any) => this.mapBlogCommentFromDB(r)) || []
    };
  }

  private mapPromotionalContentFromDB(data: any): PromotionalContent {
    return {
      id: data.id,
      title: data.title,
      contentType: data.content_type,
      contentData: data.content_data,
      displayLocation: data.display_location,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapNewsletterSubscriptionFromDB(data: any): NewsletterSubscription {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      isActive: data.is_active,
      subscriptionSource: data.subscription_source,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const blogService = new BlogService(); 