import Link from "next/link";
import LegalCloseButton from "@/components/LegalCloseButton";
import LegalHashScroll from "@/components/LegalHashScroll";
import PhoneFrame from "@/components/PhoneFrame";

/**
 * Schlichtes Layout fuer Legal-Seiten (/imprint, /terms, /privacy):
 * gleicher Phone-Frame wie das Spiel, zentrierter Text, Back-Link.
 */
export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="relative h-full">
        <div className="pointer-events-none absolute top-8 right-6 z-10">
          <div className="pointer-events-auto">
            <LegalCloseButton />
          </div>
        </div>
        <div className="flex h-full flex-col overflow-y-auto bg-white px-6 pb-8 pt-8">
          <LegalHashScroll />
          <h1 className="pr-12 text-2xl font-semibold text-neutral-900">
            {title}
          </h1>
        <div className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-neutral-600">
          {children}
        </div>
        <Link
          href="/"
          className="mt-8 block w-full rounded-full bg-neutral-900 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Back to Game
        </Link>
        <Link
          href="/about"
          className="mt-3 block text-center text-sm text-neutral-500 underline underline-offset-2"
        >
          About PlayPointy
        </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
