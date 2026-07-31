import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound();

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("store_content_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: page.body.replace(/\n/g, "<br/>") }}
      />
    </div>
  );
}
