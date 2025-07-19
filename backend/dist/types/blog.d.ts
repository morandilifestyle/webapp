export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    authorId: string;
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    publishedAt?: Date;
    metaTitle?: string;
    metaDescription?: string;
    tags: string[];
    readingTime: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    author?: {
        id: string;
        name: string;
        email: string;
    };
    categories?: BlogCategory[];
}
export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    parent?: BlogCategory;
    children?: BlogCategory[];
}
export interface BlogComment {
    id: string;
    postId: string;
    userId?: string;
    parentId?: string;
    authorName?: string;
    authorEmail?: string;
    content: string;
    isApproved: boolean;
    isSpam: boolean;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    parent?: BlogComment;
    replies?: BlogComment[];
}
export interface PromotionalContent {
    id: string;
    title: string;
    contentType: 'banner' | 'campaign' | 'testimonial' | 'video';
    contentData: any;
    displayLocation: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ContentAnalytics {
    id: string;
    contentId: string;
    contentType: string;
    eventType: 'view' | 'like' | 'share' | 'comment';
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface NewsletterSubscription {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    subscriptionSource?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BlogPostCreateRequest {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    status?: 'draft' | 'published' | 'scheduled' | 'archived';
    publishedAt?: Date;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    isFeatured?: boolean;
    categoryIds?: string[];
}
export interface BlogPostUpdateRequest {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    status?: 'draft' | 'published' | 'scheduled' | 'archived';
    publishedAt?: Date;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    isFeatured?: boolean;
    categoryIds?: string[];
}
export interface BlogCommentCreateRequest {
    postId: string;
    content: string;
    parentId?: string;
    authorName?: string;
    authorEmail?: string;
}
export interface BlogFilters {
    status?: 'draft' | 'published' | 'scheduled' | 'archived';
    categoryId?: string;
    authorId?: string;
    isFeatured?: boolean;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'published_at' | 'title' | 'view_count';
    sortOrder?: 'asc' | 'desc';
}
export interface ContentAnalyticsSummary {
    contentId: string;
    contentType: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    averageTimeOnPage: number;
    uniqueVisitors: number;
}
export interface BlogPostWithAnalytics extends BlogPost {
    analytics?: ContentAnalyticsSummary;
}
//# sourceMappingURL=blog.d.ts.map