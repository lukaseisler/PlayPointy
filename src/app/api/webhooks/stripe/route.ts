import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function resolveUserId(session: Stripe.Checkout.Session): Promise<string> {
  const fromMeta =
    session.metadata?.user_id || session.client_reference_id || null;
  if (fromMeta) return fromMeta;

  const email = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  )
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Guest checkout missing customer email");
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser(
    {
      email,
      email_confirm: true,
    },
  );
  if (created?.user?.id) return created.user.id;

  // Already registered — page through Auth users (fine at current scale).
  const msg = (createError?.message ?? "").toLowerCase();
  if (!msg.includes("already") && !msg.includes("registered") && createError) {
    throw createError;
  }

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found?.id) return found.id;
    if (data.users.length < 200) break;
  }

  throw new Error(`Could not resolve Supabase user for ${email}`);
}

async function grantEntitlement(session: Stripe.Checkout.Session) {
  const packId = session.metadata?.pack_id || null;
  if (!packId) {
    throw new Error("Missing pack_id on checkout session");
  }
  const userId = await resolveUserId(session);

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
