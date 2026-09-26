import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { FREE_PACK_ID, getPackById, getStorePreviewPath } from "@/lib/data";
import { getStripePriceId } from "@/lib/stripe/catalog";
import { getSiteUrl, getStripe, getStripeAssetOrigin } from "@/lib/stripe/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/publicConfig";
import {
  formatTeaserCardIds,
  sanitizeTeaserCardIds,
} from "@/lib/teaserCards";

export const runtime = "nodejs";

type Body = {
  packId?: string;
  acceptTerms?: boolean;
  acceptWithdrawalWaiver?: boolean;
  teaserCardIds?: unknown;
};

/**
 * Pack preview → Stripe. Logged-in buyers carry user_id; guests leave email
 * to Stripe Checkout and the webhook attaches the pack by that email.
 */
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

  let userId: string | null = null;
  let userEmail: string | null = null;

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (token) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (!userError && user) {
      userId = user.id;
      userEmail = user.email ?? null;
    }
  }

  try {
    const stripe = getStripe();
    const site = getSiteUrl();
    const assetOrigin = getStripeAssetOrigin();
    const pack = getPackById(packId);
    const previewPath = getStorePreviewPath(packId);
    const previewUrl = previewPath ? `${assetOrigin}/${previewPath}` : null;

    const teaserCardIds = sanitizeTeaserCardIds(packId, body.teaserCardIds);

    const price = await stripe.prices.retrieve(priceId);
    const productId = typeof price.product === "string" ? price.product : price.product.id;
    await stripe.products.update(productId, {
      ...(pack?.name ? { name: pack.name } : {}),
      ...(pack ? { description: `${pack.cardCount} cards` } : {}),
      ...(previewUrl ? { images: [previewUrl] } : {}),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${site}/?checkout=success&pack_id=${encodeURIComponent(packId)}`,
      cancel_url: `${site}/?checkout=cancel`,
      ...(userId ? { client_reference_id: userId } : {}),
      ...(userEmail ? { customer_email: userEmail } : {}),
      locale: "auto",
      // stripe@22 types omit branding_settings; Checkout API accepts it.
      ...({
        branding_settings: {
          display_name: "PlayPointy",
          logo: {
            type: "url",
            url: `${assetOrigin}/playpointyapplogo.png`,
          },
        },
      } as object),
      custom_text: {
        submit: {
          message:
            "By paying you confirm the Terms and that you want instant access. You lose the 14-day right of withdrawal once the pack unlocks.",
        },
      },
      metadata: {
        ...(userId ? { user_id: userId } : {}),
        pack_id: packId,
        accept_terms: "1",
        accept_withdrawal_waiver: "1",
        guest: userId ? "0" : "1",
        ...(teaserCardIds
          ? { teaser_cards: formatTeaserCardIds(teaserCardIds) }
          : {}),
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
