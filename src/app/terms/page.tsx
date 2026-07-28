import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions – PlayPointy",
  description: "Terms and conditions for PlayPointy.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These are placeholder Terms &amp; Conditions for PlayPointy. The final
        terms covering digital goods, refunds, and sponsored content will be
        published here before the public launch.
      </p>
      <p>
        By using PlayPointy you agree that this page will be updated with the
        complete legal text prior to go-live.
      </p>
    </LegalPage>
  );
}
