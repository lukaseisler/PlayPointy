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
      {/* Kein pt am Scroll-Container: ein sticky Kind kann nicht ueber die
          Content-Box hinaus, sonst scrollt Text sichtbar oberhalb des X. */}
      <div className="flex h-full flex-col overflow-y-auto bg-white px-6 pb-8">
        <LegalHashScroll />
        {/* -mx-6/px-6: volle Breite, damit gescrollter Text unter der Leiste
            verschwindet statt neben dem X durchzuscheinen. */}
        <div className="sticky top-0 z-10 -mx-6 flex justify-end bg-white px-6 pt-8 pb-2">
          <LegalCloseButton />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <div className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-neutral-600">
          {children}
        </div>
        <Link
          href="/"
          className="mt-8 block w-full rounded-full bg-neutral-900 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Back to Game
        </Link>
      </div>
    </PhoneFrame>
  );
}
