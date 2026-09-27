import type { Metadata } from "next";
import { SITE_URL } from "@/lib/share";

export const SITE_NAME = "PlayPointy";
export { SITE_URL };

export const SEO_TITLE =
  "PlayPointy – Who is more likely to? Free party card game";
export const SEO_DESCRIPTION =
  "Play Who is more likely to with your friends in the browser. No download, no account. Start free with 30 cards, then unlock packs for roasts, nights out, and chaos.";

export const PACK_STORE_HOOKS: Record<string, string> = {
  "starter-chaos": "Free pack - premium feel.",
  "dark-evil": "Who is the meanest here?",
  "roast-friends": "They deserve it!",
  "toxic-love": "Who sucks romantically?",
  "unhinged-nights": "Who makes the worst decisions?",
};

export const PACK_BLURBS: Record<string, string> = {
  "starter-chaos":
    "The free 30-card starter. Warm up the group with classic Who is more likely to questions.",
  "dark-evil":
    "Darker, meaner prompts for groups that like a little evil.",
  "roast-friends":
    "Roast your friends on purpose. Best with people who can take it.",
  "toxic-love":
    "Dating, situationships, and messy romance questions.",
  "unhinged-nights":
    "Nights out, drunk stories, and bad decisions.",
};

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "PlayPointy – Who is more likely to party card game",
} as const;

export function canonicalUrl(path = "/"): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  index = true,
  image,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: string;
  index?: boolean;
  image?: { url: string; width?: number; height?: number; alt?: string };
}): Metadata {
  const url = canonicalUrl(path);
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: absoluteTitle ?? title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle ?? title,
      description,
      images: [ogImage.url],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon-512x512.png?v=20260927`,
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "GameApplication",
        genre: "Party game",
        operatingSystem: "Any",
        inLanguage: "en",
        description: SEO_DESCRIPTION,
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: "2.99",
          priceCurrency: "EUR",
          offerCount: 5,
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function aboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About PlayPointy",
    url: `${SITE_URL}/about`,
    description:
      "How to play PlayPointy, the free Who is more likely to party card game.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#app` },
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
