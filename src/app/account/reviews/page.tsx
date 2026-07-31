import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/store/star-rating";

export default async function AccountReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("store_reviews")
    .select("*, store_books(title, slug)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Reviews</h1>
      {!reviews?.length ? (
        <p className="text-gray-600">You haven&apos;t written any reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const book = review.store_books as { title: string; slug: string } | null;
            return (
              <div key={review.id} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="font-medium">{book?.title}</p>
                <StarRating rating={review.rating} showCount={false} />
                {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                <p className="mt-1 text-sm text-gray-600">{review.body}</p>
                <p className="mt-2 text-xs capitalize text-gray-400">Status: {review.status}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
