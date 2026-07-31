import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Imprint – PlayPointy",
  description: "Legal imprint for PlayPointy.",
};

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <p className="font-medium text-neutral-900">Lukas Eisler</p>
      <p>
        Breitenäckergasse 2/3/12
        <br />
        2483 Ebreichsdorf
        <br />
        Austria
      </p>
      <p>
        <a
          href="mailto:hello@playpointy.com"
          className="text-neutral-900 underline underline-offset-2"
        >
          hello@playpointy.com
        </a>
      </p>

      <h2 className="pt-2 text-base font-semibold text-neutral-900">
        Online Dispute Resolution (EU)
      </h2>
      <p>
        The European Commission provides a platform for online dispute resolution
        (ODR), which can be accessed at:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-neutral-900 underline underline-offset-2"
        >
          https://ec.europa.eu/consumers/odr
        </a>
        .
      </p>
      <p>
        We are not willing or obliged to participate in dispute resolution
        proceedings before a consumer arbitration board.
      </p>
    </LegalPage>
  );
}
