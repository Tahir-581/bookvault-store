"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/store/wishlist";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-600">Your wishlist is empty.</p>
          <Link href="/books"><Button className="mt-4">Browse Books</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.bookId} className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
              <div className="relative h-24 w-16 bg-gray-50">
                <Image src={item.coverUrl} alt={item.title} fill className="object-contain" />
              </div>
              <div className="flex-1">
                <Link href={`/dp/${item.title.toLowerCase().replace(/\s+/g, "-")}`} className="font-medium hover:text-[#C7511F]">
                  {item.title}
                </Link>
                <p className="text-sm text-gray-500">{item.author}</p>
              </div>
              <button onClick={() => removeItem(item.bookId)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
