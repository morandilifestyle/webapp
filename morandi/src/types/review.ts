export interface Review {
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
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  voteType: 'helpful' | 'unhelpful';
  createdAt: Date;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reportReason: string;
  reportDescription?: string;
  reportStatus: 'pending' | 'reviewed' | 'resolved';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewAnalytics {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  verifiedReviews: number;
  recentReviews: number;
  lastUpdated: Date;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  reviewText: string;
  images?: File[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  reviewText?: string;
  images?: File[];
}

export interface ReviewVoteRequest {
  voteType: 'helpful' | 'unhelpful';
}

export interface ReportReviewRequest {
  reportReason: string;
  reportDescription?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  totalCount: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReviewFilters {
  rating?: number;
  sortBy?: 'helpful' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  hasPurchase: boolean;
  hasReview: boolean;
}

export interface ReviewModerationRequest {
  action: 'approve' | 'reject' | 'edit';
  adminNotes?: string;
  editedReview?: {
    rating?: number;
    title?: string;
    reviewText?: string;
  };
} 