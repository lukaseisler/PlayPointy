import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Imprint – PlayPointy",
  description: "Legal imprint for PlayPointy.",
};

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <p>
        This is a placeholder imprint page for PlayPointy. Full legal details
        (company name, address, contact, and responsible person) will be added
        here before the public launch.
      </p>
      <p>
        For questions in the meantime, please contact us at{" "}
        <span className="text-neutral-900">hello@playpointy.com</span>.
      </p>
    </LegalPage>
  );
}
