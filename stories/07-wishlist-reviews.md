# User Story: Wishlist and Reviews

## Story Information
- **Story ID**: US-007
- **Epic**: User Engagement System
- **Priority**: Medium
- **Story Points**: 8

## User Story
**As a** customer  
**I want** to save products to my wishlist and leave reviews  
**So that** I can track items I'm interested in and share my experience with others

## Acceptance Criteria
1. **Wishlist Functionality**
   - User can add products to wishlist from product pages
   - User can view all wishlist items in a dedicated page
   - User can remove items from wishlist
   - User can move items from wishlist to cart
   - Wishlist persists across browser sessions
   - Wishlist is private to the user account
   - Wishlist shows product availability and price changes

2. **Product Reviews System**
   - Users can leave reviews only after purchasing products
   - Review form includes rating (1-5 stars), title, and detailed review
   - Reviews require admin approval before publication
   - Reviews show verified purchase badge
   - Users can edit their own reviews within 30 days
   - Users can report inappropriate reviews
   - Review helpfulness voting system

3. **Review Display and Management**
   - Reviews are displayed on product detail pages
   - Reviews are sorted by helpfulness, date, and rating
   - Review filtering by rating (1-5 stars)
   - Review search functionality
   - Review pagination for large numbers of reviews
   - Review analytics (average rating, total reviews)

4. **Review Moderation**
   - Admin can approve, reject, or edit reviews
   - Spam detection and filtering
   - Review quality scoring
   - Bulk review management
   - Review notification system
   - Review analytics dashboard

5. **Social Features**
   - Share wishlist with friends (optional)
   - Review helpfulness voting
   - Review response from business
   - Review photo upload capability
   - Review sentiment analysis

6. **Mobile Experience**
   - Mobile-optimized wishlist interface
   - Easy review submission on mobile
   - Touch-friendly rating interface
   - Offline wishlist access

## Technical Implementation Notes

### Frontend Implementation
- **Wishlist Component**: Heart icon toggle with animation
- **Wishlist Page**: Grid layout with product cards
- **Review Form**: Star rating component with text input
- **Review Display**: Paginated list with filtering
- **Review Moderation**: Admin interface for review management
- **Mobile Optimization**: Touch-friendly interfaces

### Backend Implementation
- **Wishlist Service**: Handle wishlist operations
- **Review Service**: Review CRUD and moderation
- **Notification Service**: Review approval notifications
- **Analytics Service**: Review analytics and insights
- **Spam Detection**: Automated spam filtering
- **Image Service**: Review photo upload and processing

### Database Schema
```sql
-- Wishlist items
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Product reviews
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review images
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL, -- 'helpful', 'unhelpful'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- Review reports
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id),
    report_reason VARCHAR(100) NOT NULL,
    report_description TEXT,
    report_status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review analytics
CREATE TABLE review_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_distribution JSONB, -- {1: 10, 2: 5, 3: 15, 4: 30, 5: 40}
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
```
# Wishlist
GET    /api/wishlist                    # Get user wishlist
POST   /api/wishlist/items              # Add item to wishlist
DELETE /api/wishlist/items/:id          # Remove from wishlist
POST   /api/wishlist/items/:id/move     # Move to cart

# Reviews
GET    /api/products/:id/reviews        # Get product reviews
POST   /api/products/:id/reviews        # Create review
PUT    /api/reviews/:id                 # Update review
DELETE /api/reviews/:id                 # Delete review
POST   /api/reviews/:id/vote            # Vote on review
POST   /api/reviews/:id/report          # Report review

# Admin Review Management
GET    /api/admin/reviews               # List all reviews
PUT    /api/admin/reviews/:id/approve   # Approve review
PUT    /api/admin/reviews/:id/reject    # Reject review
GET    /api/admin/reviews/analytics     # Review analytics
```

### Review System Implementation
```typescript
interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title: string;
  reviewText: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isEdited: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  images: ReviewImage[];
  createdAt: Date;
  updatedAt: Date;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

interface ReviewAnalytics {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  verifiedReviews: number;
  recentReviews: number;
}
```

### Review Moderation System
```javascript
// Spam detection rules
const spamDetectionRules = {
  minReviewLength: 10,
  maxReviewLength: 2000,
  suspiciousKeywords: ['spam', 'fake', 'scam'],
  maxReviewsPerUser: 10,
  minTimeBetweenReviews: 24 * 60 * 60 * 1000, // 24 hours
};

// Review quality scoring
const calculateReviewQuality = (review) => {
  let score = 0;
  
  // Length bonus
  if (review.text.length > 100) score += 10;
  if (review.text.length > 500) score += 20;
  
  // Verified purchase bonus
  if (review.isVerifiedPurchase) score += 30;
  
  // Helpfulness bonus
  score += review.helpfulVotes * 5;
  score -= review.unhelpfulVotes * 2;
  
  return score;
};
```

## Dependencies and Prerequisites
- **User System**: User authentication and profiles
- **Product System**: Product data and availability
- **Order System**: Purchase verification for reviews
- **Image Storage**: AWS S3 for review photos
- **Notification System**: Review approval notifications
- **Analytics System**: Review analytics and insights

## Definition of Done
- [ ] Users can add/remove products from wishlist
- [ ] Wishlist persists across sessions and devices
- [ ] Users can leave reviews after purchase
- [ ] Review system includes rating, title, and text
- [ ] Reviews require admin approval before publication
- [ ] Review helpfulness voting works correctly
- [ ] Review moderation tools are functional
- [ ] Review analytics and insights are accurate
- [ ] Mobile wishlist and review interfaces work
- [ ] Review spam detection prevents abuse
- [ ] Review photo upload functionality works
- [ ] Unit tests cover all wishlist and review functions
- [ ] Integration tests verify review workflow
- [ ] Performance testing shows wishlist load under 1 second
- [ ] Accessibility requirements are met (WCAG 2.1 AA)

## Story Points Estimation
**8 Story Points** - This is a medium complexity story involving user engagement features, review moderation, and social functionality.

## Risk Assessment
- **Medium Risk**: Review spam and moderation complexity
- **Low Risk**: Wishlist functionality implementation
- **Mitigation**: Implement robust spam detection and moderation tools

## Notes
- Consider implementing review response system for business
- Plan for review sentiment analysis and insights
- Ensure compliance with review authenticity regulations
- Consider implementing review incentives for verified purchases 