"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { moderateReviewAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/store/star-rating";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  created_at: string;
};

export function AdminReviewsManager({ reviews }: { reviews: Review[] }) {
  const [pending, startTransition] = useTransition();

  function moderate(id: string, status: string) {
    startTransition(async () => {
      await moderateReviewAction(id, status);
      toast.success(`Review ${status}`);
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Review Moderation</h1>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <StarRating rating={review.rating} showCount={false} />
                <p className="mt-1 font-medium">{review.author_name}</p>
                {review.title && <p className="font-medium">{review.title}</p>}
                <p className="mt-1 text-sm text-gray-600">{review.body}</p>
                <p className="mt-1 text-xs text-gray-400 capitalize">Status: {review.status}</p>
              </div>
              {review.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moderate(review.id, "approved")} disabled={pending}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => moderate(review.id, "rejected")} disabled={pending}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
}
