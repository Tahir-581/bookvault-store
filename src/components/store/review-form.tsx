"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { submitReviewAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReviewForm({ bookId, slug }: { bookId: string; slug: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("book_id", bookId);
    formData.set("slug", slug);
    startTransition(async () => {
      const result = await submitReviewAction(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Review submitted for moderation");
        e.currentTarget.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 font-bold">Write a review</h3>
      <div className="mb-3">
        <Label>Rating</Label>
        <select name="rating" required className="mt-1 w-full rounded border px-3 py-2 text-sm">
          <option value="5">5 — Excellent</option>
          <option value="4">4 — Good</option>
          <option value="3">3 — Average</option>
          <option value="2">2 — Poor</option>
          <option value="1">1 — Terrible</option>
        </select>
      </div>
      <div className="mb-3">
        <Label>Title</Label>
        <Input name="title" placeholder="Summarize your experience" />
      </div>
      <div className="mb-3">
        <Label>Review</Label>
        <textarea
          name="body"
          required
          rows={4}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="What did you think of this book?"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
