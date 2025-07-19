'use client';

import React, { useState } from 'react';
import { Review } from '@/types/review';
import { ReviewsAPI } from '@/lib/api/reviews';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Calendar, 
  CheckCircle,
  Edit,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface ReviewDisplayProps {
  review: Review;
  onVote?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isOwnReview?: boolean;
}

export function ReviewDisplay({
  review,
  onVote,
  onReport,
  onEdit,
  onDelete,
  showActions = true,
  isOwnReview = false,
}: ReviewDisplayProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVote = async (voteType: 'helpful' | 'unhelpful') => {
    if (isVoting) return;

    try {
      setIsVoting(true);
      await ReviewsAPI.voteReview(review.id, { voteType });
      onVote?.();
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = async () => {
    if (isReporting) return;

    try {
      setIsReporting(true);
      await ReviewsAPI.reportReview(review.id, {
        reportReason: 'inappropriate',
        reportDescription: 'This review violates community guidelines',
      });
      onReport?.();
    } catch (error) {
      console.error('Error reporting review:', error);
    } finally {
      setIsReporting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !confirm('Are you sure you want to delete this review?')) return;

    try {
      setIsDeleting(true);
      await ReviewsAPI.deleteReview(review.id);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const helpfulPercentage = review.helpfulVotes + review.unhelpfulVotes > 0
    ? Math.round((review.helpfulVotes / (review.helpfulVotes + review.unhelpfulVotes)) * 100)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {review.user.name}
                </span>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
                {review.isEdited && (
                  <Badge variant="outline" className="text-xs">
                    Edited
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <StarRating rating={review.rating} size="sm" />
                <span>•</span>
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1">
              {isOwnReview && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {!isOwnReview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                  disabled={isReporting}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">{review.title}</h3>
          
          <p className="text-gray-700 whitespace-pre-wrap">{review.reviewText}</p>
          
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {review.images.map((image, index) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-md">
                  <Image
                    src={image.imageUrl}
                    alt={image.altText || `Review image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {showActions && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('helpful')}
                  disabled={isVoting}
                  className="h-8 px-3 text-sm"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpfulVotes})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('unhelpful')}
                  disabled={isVoting}
                  className="h-8 px-3 text-sm"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  ({review.unhelpfulVotes})
                </Button>
                {helpfulPercentage > 0 && (
                  <span className="text-xs text-gray-500">
                    {helpfulPercentage}% found this helpful
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 