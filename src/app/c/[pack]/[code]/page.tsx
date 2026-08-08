import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Game from "@/components/Game";
import PhoneFrame from "@/components/PhoneFrame";
import {
  FREE_PACK_ID,
  displayTitle,
  getCardByPackAndCode,
  getCardsForPack,
  getStorePacks,
} from "@/lib/data";
import {
  OG_SHARE_DESCRIPTION,
  OG_SHARE_TITLE,
  SITE_URL,
  absoluteOgImageUrl,
  buildShareUrl,
} from "@/lib/share";
import { shuffle } from "@/lib/shuffle";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ pack: string; code: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { pack, code } = await params;
  const card = getCardByPackAndCode(pack, code);
  if (!card) {
    return { title: "PlayPointy" };
  }

  // Title = Produkt-Hook (größer in WhatsApp), Description = Brand-Domain.
  const ogTitle = OG_SHARE_TITLE;
  const ogDescription = OG_SHARE_DESCRIPTION;
  const image = absoluteOgImageUrl(card);
  const url = buildShareUrl(card);
  const pageTitle = `${displayTitle(card.text)} | PlayPointy`;

  return {
    metadataBase: new URL(SITE_URL),
    title: pageTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: "website",
      siteName: "PlayPointy",
      images: image
        ? [
            {
              url: image,
              secureUrl: image,
              type: "image/jpeg",
              width: 800,
              height: 1000,
              alt: displayTitle(card.text),
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: image ? [image] : [],
    },
  };
}

/**
 * Viral Share-Route: /c/[pack-name]/[3-char-code]
 * Zeigt die geteilte Karte zuerst; danach setzt Game die Queue aus den
 * aktiven Packs des Nutzers fort (localStorage / Starter-Fallback).
 */
export default async function ShareCardPage({ params }: SharePageProps) {
  const { pack, code } = await params;
  const featuredCard = getCardByPackAndCode(pack, code);
  if (!featuredCard) notFound();

  const freeCards = shuffle(getCardsForPack(FREE_PACK_ID));
  const storePacks = getStorePacks();

  return (
    <PhoneFrame>
      <ErrorBoundary>
        <AuthProvider>
          <Game
            initialCards={freeCards}
            storePacks={storePacks}
            featuredCard={featuredCard}
          />
        </AuthProvider>
      </ErrorBoundary>
    </PhoneFrame>
  );
}
