import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PlayPointy",
  description:
    "PlayPointy is a browser-based party card game. Play Who is more likely to questions with friends. No download required.",
};

/** Public app info page for Google OAuth brand verification (not linked from the game). */
export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-white px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
          Application homepage
        </p>
        <h1 className="text-4xl font-bold tracking-tight">PlayPointy</h1>
        <p className="text-lg font-medium">
          The app name is PlayPointy.
        </p>
        <h2 className="text-xl font-semibold">Purpose of this application</h2>
        <p className="text-base leading-relaxed text-neutral-700">
          PlayPointy is a party card game you play in the web browser with your
          friends. The purpose of PlayPointy is to ask fun &ldquo;Who is more
          likely to…&rdquo; questions, swipe through illustrated cards, and
          unlock optional card packs. No app store download is required.
        </p>
        <p className="text-base leading-relaxed text-neutral-700">
          You can start playing PlayPointy immediately without creating an
          account. Optional sign-in with Google or email is available only to
          restore purchases and unlock paid packs.
        </p>
        <p className="text-base leading-relaxed text-neutral-700">
          Official website:{" "}
          <a
            href="https://playpointy.com"
            className="font-medium underline underline-offset-2"
          >
            https://playpointy.com
          </a>
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm">
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
          <Link href="/imprint" className="underline underline-offset-2">
            Imprint
          </Link>
          <Link href="/" className="underline underline-offset-2">
            Open PlayPointy game
          </Link>
        </nav>
      </div>
    </main>
  );
}
