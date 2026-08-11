import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { FREE_PACK_ID } from "@/lib/data";
import { getStripePriceId } from "@/lib/stripe/catalog";
import { getSiteUrl, getStripe } from "@/lib/stripe/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/publicConfig";

export const runtime = "nodejs";

type Body = {
  packId?: string;
  acceptTerms?: boolean;
  acceptWithdrawalWaiver?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const packId = body.packId?.trim();
  if (!packId || packId === FREE_PACK_ID) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }
  if (!body.acceptTerms || !body.acceptWithdrawalWaiver) {
    return NextResponse.json(
      { error: "Please accept the terms and withdrawal waiver." },
      { status: 400 },
    );
  }

  const priceId = getStripePriceId(packId);
  if (!priceId) {
    return NextResponse.json({ error: "Pack not for sale" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const site = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${site}/?checkout=success&pack_id=${encodeURIComponent(packId)}`,
      cancel_url: `${site}/?checkout=cancel`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        accept_terms: "1",
        accept_withdrawal_waiver: "1",
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout could not be started" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout create failed", err);
    return NextResponse.json(
      { error: "Checkout could not be started" },
      { status: 500 },
    );
  }
}
