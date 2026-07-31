import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ received: true });

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const supabase = await createServiceClient();
      await supabase
        .from("store_orders")
        .update({
          status: "paid",
          payment_status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", orderId);
      await supabase.from("store_order_events").insert({
        order_id: orderId,
        status: "paid",
        note: "Payment received via Stripe",
      });
    }
  }

  return NextResponse.json({ received: true });
}
