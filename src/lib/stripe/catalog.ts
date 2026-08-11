/** Display price for paid packs (EUR). Keep in sync with Stripe Prices. */
export const PACK_PRICE_LABEL = "€2.99";

/** Stripe Price IDs (Test mode) keyed by PlayPointy pack id. */
export const PACK_STRIPE_PRICE_IDS: Record<string, string> = {
  "dark-evil": "price_1U2UKL5BtNnSqVOsPWc8Uj78",
  "roast-friends": "price_1U2UKx5BtNnSqVOsZVrp7zVU",
  "toxic-love": "price_1U2ULR5BtNnSqVOsAcu6JEfl",
  "unhinged-nights": "price_1U2UM55BtNnSqVOsSod79iHY",
};

export function getStripePriceId(packId: string): string | null {
  return PACK_STRIPE_PRICE_IDS[packId] ?? null;
}
