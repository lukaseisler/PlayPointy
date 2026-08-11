import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function grantEntitlement(session: Stripe.Checkout.Session) {
  const userId =
    session.metadata?.user_id || session.client_reference_id || null;
  const packId = session.metadata?.pack_id || null;
  if (!userId || !packId) {
    throw new Error("Missing user_id or pack_id on checkout session");
  }

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const admin = createAdminClient();
  const { error } = await admin.from("entitlements").upsert(
    {
      user_id: userId,
      pack_id: packId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntent,
    },
    { onConflict: "user_id,pack_id" },
  );
  if (error) throw error;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("stripe webhook signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        await grantEntitlement(session);
      }
    }
  } catch (err) {
    console.error("stripe webhook handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
