import { BlogPost, BlogCategory, BlogComment, PromotionalContent, NewsletterSubscription, BlogPostCreateRequest, BlogPostUpdateRequest, BlogCommentCreateRequest, BlogFilters, ContentAnalyticsSummary } from '../types/blog';
export declare class BlogService {
    supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
    getBlogPosts(filters?: BlogFilters): Promise<BlogPost[]>;
    getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
    getBlogPostById(id: string): Promise<BlogPost | null>;
    createBlogPost(postData: BlogPostCreateRequest, authorId: string): Promise<BlogPost>;
    updateBlogPost(id: string, postData: BlogPostUpdateRequest): Promise<BlogPost>;
    deleteBlogPost(id: string): Promise<void>;
    getBlogCategories(): Promise<BlogCategory[]>;
    createBlogCategory(categoryData: Partial<BlogCategory>): Promise<BlogCategory>;
    getBlogComments(postId: string): Promise<BlogComment[]>;
    createBlogComment(commentData: BlogCommentCreateRequest, userId?: string): Promise<BlogComment>;
    approveComment(commentId: string): Promise<void>;
    deleteComment(commentId: string): Promise<void>;
    getPromotionalContent(location?: string): Promise<PromotionalContent[]>;
    subscribeToNewsletter(email: string, firstName?: string, lastName?: string, source?: string): Promise<NewsletterSubscription>;
    unsubscribeFromNewsletter(email: string): Promise<void>;
    trackContentView(contentId: string, contentType: string, userId?: string, sessionId?: string): Promise<void>;
    getContentAnalytics(contentId: string, contentType: string): Promise<ContentAnalyticsSummary>;
    private generateSlug;
    private calculateReadingTime;
    private addCategoriesToPost;
    private updatePostCategories;
    private mapBlogPostFromDB;
    private mapBlogCategoryFromDB;
    private mapBlogCommentFromDB;
    private mapPromotionalContentFromDB;
    private mapNewsletterSubscriptionFromDB;
}
export declare const blogService: BlogService;
//# sourceMappingURL=blogService.d.ts.map