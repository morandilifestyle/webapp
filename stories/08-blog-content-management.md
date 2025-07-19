# User Story: Blog and Content Management

## Story Information
- **Story ID**: US-008
- **Epic**: Content Management System
- **Priority**: Medium
- **Story Points**: 8

## User Story
**As a** content manager  
**I want** to create and manage blog posts and promotional content  
**So that** I can engage customers with valuable information about sustainable textiles and wellness

## Acceptance Criteria
1. **Blog Management System**
   - Create, edit, and publish blog posts
   - Rich text editor with formatting options
   - Image and media upload capabilities
   - Blog post categories and tags
   - Draft and scheduled publishing
   - SEO optimization tools (meta tags, URLs)
   - Blog post versioning and history

2. **Content Organization**
   - Blog categories (Sustainability, Wellness, Product Guides, etc.)
   - Tag system for content organization
   - Featured posts and trending content
   - Related posts suggestions
   - Content search and filtering
   - Content calendar and scheduling

3. **Blog Display and User Experience**
   - Responsive blog listing page
   - Individual blog post pages with social sharing
   - Blog post comments and engagement
   - Newsletter subscription integration
   - Related products linking
   - Reading time estimation
   - Table of contents for long posts

4. **Promotional Content**
   - Banner and promotional content management
   - Seasonal campaign content
   - Product spotlight features
   - Customer testimonials and stories
   - Sustainability content and impact stories
   - Video content integration

5. **SEO and Analytics**
   - SEO meta tag management
   - Structured data markup
   - Google Analytics integration
   - Content performance tracking
   - Search engine optimization tools
   - Social media preview cards

6. **Content Moderation**
   - Comment moderation system
   - Spam detection and filtering
   - Content approval workflow
   - User-generated content management
   - Content quality scoring

## Technical Implementation Notes

### Frontend Implementation
- **Blog Editor**: Rich text editor (TinyMCE or Quill)
- **Blog Listing**: Responsive grid with filtering
- **Blog Post**: Full-width article layout
- **Content Management**: Admin interface for content creation
- **Media Library**: Image and video management
- **SEO Tools**: Meta tag and structured data management

### Backend Implementation
- **Content Service**: Handle blog CRUD operations
- **Media Service**: Image upload and processing
- **SEO Service**: Meta tag and structured data generation
- **Analytics Service**: Content performance tracking
- **Comment Service**: Comment moderation and management
- **Search Service**: Content search and indexing

### Database Schema
```sql
-- Blog posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, archived
    published_at TIMESTAMP,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[], -- Array of tags
    reading_time INTEGER, -- Estimated reading time in minutes
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog categories
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES blog_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog post categories (many-to-many)
CREATE TABLE blog_post_categories (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- Blog comments
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES blog_comments(id),
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotional content
CREATE TABLE promotional_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- banner, campaign, testimonial, video
    content_data JSONB,
    display_location VARCHAR(100), -- homepage, product_page, blog
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content analytics
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- blog_post, promotional_content
    event_type VARCHAR(50) NOT NULL, -- view, like, share, comment
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    subscription_source VARCHAR(100), -- blog, checkout, popup
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
```
# Blog Management
GET    /api/blog/posts                 # List blog posts
POST   /api/blog/posts                 # Create blog post
GET    /api/blog/posts/:slug           # Get blog post
PUT    /api/blog/posts/:id             # Update blog post
DELETE /api/blog/posts/:id             # Delete blog post
GET    /api/blog/categories            # List categories
POST   /api/blog/categories            # Create category

# Blog Comments
GET    /api/blog/posts/:id/comments    # Get post comments
POST   /api/blog/posts/:id/comments    # Add comment
PUT    /api/comments/:id               # Update comment
DELETE /api/comments/:id               # Delete comment

# Content Management
GET    /api/admin/content              # List all content
POST   /api/admin/content              # Create content
PUT    /api/admin/content/:id          # Update content
DELETE /api/admin/content/:id          # Delete content
GET    /api/admin/content/analytics    # Content analytics

# Newsletter
POST   /api/newsletter/subscribe       # Subscribe to newsletter
POST   /api/newsletter/unsubscribe     # Unsubscribe from newsletter
```

### Content Management System
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
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
  categories: BlogCategory[];
  createdAt: Date;
  updatedAt: Date;
}

interface PromotionalContent {
  id: string;
  title: string;
  contentType: 'banner' | 'campaign' | 'testimonial' | 'video';
  contentData: any;
  displayLocation: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  sortOrder: number;
}

interface ContentAnalytics {
  contentId: string;
  contentType: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  averageTimeOnPage: number;
}
```

### SEO Implementation
```javascript
// Structured data for blog posts
const generateStructuredData = (post) => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.metaDescription,
    "image": post.featuredImage,
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Morandi Lifestyle",
      "logo": {
        "@type": "ImageObject",
        "url": "https://morandi.com/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://morandi.com/blog/${post.slug}`
    }
  };
};
```

## Dependencies and Prerequisites
- **User System**: User authentication for content creation
- **Media Storage**: AWS S3 for image and video storage
- **Search System**: Full-text search for blog content
- **Email Service**: Newsletter subscription management
- **Analytics System**: Content performance tracking
- **SEO Tools**: Meta tag and structured data generation

## Definition of Done
- [ ] Blog post creation and editing works properly
- [ ] Rich text editor supports all required formatting
- [ ] Image upload and media management functions correctly
- [ ] Blog categories and tags organize content effectively
- [ ] Blog listing and individual post pages display correctly
- [ ] SEO optimization tools work as expected
- [ ] Content scheduling and publishing works
- [ ] Comment system with moderation is functional
- [ ] Newsletter subscription integration works
- [ ] Content analytics and performance tracking is accurate
- [ ] Mobile responsiveness for all blog content
- [ ] Social sharing functionality works
- [ ] Unit tests cover all content management functions
- [ ] Integration tests verify blog workflow
- [ ] Performance testing shows blog load under 2 seconds
- [ ] Accessibility requirements are met (WCAG 2.1 AA)

## Story Points Estimation
**8 Story Points** - This is a medium complexity story involving content management, SEO optimization, and user engagement features.

## Risk Assessment
- **Medium Risk**: Rich text editor integration complexity
- **Low Risk**: Content organization and display
- **Mitigation**: Use proven rich text editor libraries and thorough testing

## Notes
- Consider implementing content personalization based on user behavior
- Plan for content backup and version control
- Ensure compliance with content copyright and licensing
- Consider implementing content recommendation engine 