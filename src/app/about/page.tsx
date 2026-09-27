import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import LegalCloseButton from "@/components/LegalCloseButton";
import { getStorePacks } from "@/lib/data";
import { PACK_PRICE_LABEL } from "@/lib/stripe/catalog";
import { aboutPageJsonLd, faqJsonLd, PACK_BLURBS, pageMetadata } from "@/lib/seo";

const FAQS = [
  {
    question: "What is PlayPointy?",
    answer:
      "PlayPointy is a Who is more likely to party card game you play in the browser with friends. You swipe illustrated cards, pick the person, and keep the round going.",
  },
  {
    question: "Is PlayPointy free?",
    answer:
      "Yes. The Starter Chaos pack is free with 30 cards. Extra packs cost a one-time unlock.",
  },
  {
    question: "Do I need to download an app?",
    answer:
      "No. Open playpointy.com on your phone and play. You can add it to your home screen if you want.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can start immediately. Sign in is only for restoring purchases and unlocking paid packs.",
  },
  {
    question: "How do you play Who is more likely to?",
    answer:
      "Read the card, point at the person in your group, roast them, then swipe to the next card. No host, no setup, no scoreboard.",
  },
  {
    question: "What age is PlayPointy for?",
    answer:
      "The game is meant for adults. Packs can be spicy or dark. Checkout asks you to confirm you are 18, or 14–17 with a parent’s consent.",
  },
  {
    question: "Does PlayPointy work offline?",
    answer:
      "You need a connection to open the game. After that you play on one phone in the room — nobody else downloads anything.",
  },
  {
    question: "How do I restore a purchase?",
    answer:
      "Open the store, tap the account icon, and enter the same email you used at checkout. We’ll send a one-time code.",
  },
  {
    question: "How do I share a card?",
    answer:
      "Tap Send to Friend. Your friend gets a link to that card and can play PlayPointy in the browser.",
  },
];

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "About",
  absoluteTitle: "About PlayPointy – Who is more likely to party game",
  description:
    "PlayPointy is a free Who is more likely to party card game in your browser. Learn how to play, see the card packs, and start a round with friends.",
  path: "/about",
});

export default function AboutPage() {
  const packs = getStorePacks();

  return (
    <main className="relative h-full bg-white text-neutral-900">
      <JsonLd data={[aboutPageJsonLd(), faqJsonLd(FAQS)]} />
      <div className="pointer-events-none absolute top-8 right-6 z-10">
        <div className="pointer-events-auto">
          <LegalCloseButton />
        </div>
      </div>
      <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-10 px-6 pt-8 pb-12">
        <p className="pr-12 text-sm font-medium tracking-wide text-neutral-500 uppercase">
          Party card game
        </p>
        <div className="space-y-4">
          <h1 className="pr-12 text-4xl font-bold tracking-tight">PlayPointy</h1>
          <p className="text-xl font-medium leading-snug">
            Who is more likely to… the party card game in your browser.
          </p>
          <p className="text-base leading-relaxed text-neutral-700">
            No download. No account. Pass one phone around and start roasting
            your friends.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Play free
          </Link>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to play</h2>
          <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-neutral-700">
            <li>Open PlayPointy on one phone and sit in a circle.</li>
            <li>
              Read the card: &ldquo;Who is more likely to…&rdquo; and point at
              the person.
            </li>
            <li>Swipe to the next card. Keep going until someone quits.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Card packs</h2>
          <p className="text-base leading-relaxed text-neutral-700">
            Starter Chaos is free. Extra packs are a one-time unlock for{" "}
            {PACK_PRICE_LABEL} each.
          </p>
          <ul className="space-y-3">
            {packs.map((pack) => (
              <li key={pack.id}>
                <p className="font-semibold">
                  {pack.name}{" "}
                  <span className="font-normal text-neutral-500">
                    · {pack.cardCount} cards
                    {pack.id === "starter-chaos" ? " · free" : ""}
                  </span>
                </p>
                <p className="text-sm leading-relaxed text-neutral-700">
                  {PACK_BLURBS[pack.id] ??
                    "More Who is more likely to questions for your group."}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">FAQ</h2>
          {FAQS.map((faq) => (
            <div key={faq.question} className="space-y-1">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-base leading-relaxed text-neutral-700">
                {faq.answer}
              </p>
            </div>
          ))}
        </section>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-neutral-200 pt-6 text-sm">
          <Link href="/" className="underline underline-offset-2">
            Play PlayPointy
          </Link>
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
          <Link href="/imprint" className="underline underline-offset-2">
            Imprint
          </Link>
        </nav>
      </div>
      </div>
    </main>
  );
}
