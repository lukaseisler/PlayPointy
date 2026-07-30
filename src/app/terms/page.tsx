import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions – PlayPointy",
  description: "Terms and conditions for PlayPointy.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions (GTC)">
      <Section title="1. Scope of Application, Contractual Language & Privacy">
        <p>
          These General Terms and Conditions (hereinafter &quot;GTC&quot;) apply
          to all contracts concluded between Lukas Eisler, Breitenäckergasse
          2/3/12, 2483 Ebreichsdorf, Austria (hereinafter &quot;Provider&quot;,
          &quot;we&quot;, or &quot;us&quot;) and consumers (hereinafter
          &quot;User&quot; or &quot;you&quot;) via the website playpointy.com.
          The contract language is English. The processing of personal data is
          governed by our Privacy Policy, available at{" "}
          <Link
            href="/privacy"
            className="text-neutral-900 underline underline-offset-2"
          >
            /privacy
          </Link>
          .
        </p>
      </Section>

      <Section title="2. User Eligibility & Age Restriction">
        <p>
          By placing an order, you confirm that you are at least 18 years old,
          or if you are between 14 and 18 years old, that you have the consent
          of your legal guardian. Note: Content warnings (e.g., &quot;16+&quot;)
          are mere content recommendations and do not replace the legal age
          requirements for purchasing. The free &quot;Starter Pack&quot; can be
          played without a contract or account.
        </p>
      </Section>

      <Section title="3. Contractual Partner & Contact">
        <p>
          Lukas Eisler
          <br />
          Breitenäckergasse 2/3/12
          <br />
          2483 Ebreichsdorf
          <br />
          Austria
          <br />
          Email:{" "}
          <a
            href="mailto:hello@playpointy.com"
            className="text-neutral-900 underline underline-offset-2"
          >
            hello@playpointy.com
          </a>
        </p>
      </Section>

      <Section title="4. User Accounts & Data Deletion">
        <p>
          To access purchased content, a user account is created upon your first
          purchase. You are responsible for your login credentials. If you
          voluntarily request the deletion of your account (GDPR right to
          erasure), you acknowledge that the technical basis for accessing your
          purchased packs is destroyed, and access will be permanently lost.
          Statutory warranty and withdrawal rights remain unaffected.
        </p>
      </Section>

      <Section title="5. Subject of the Contract, Technical Steps & Conclusion">
        <p>
          The subject is the paid provision of digital content (individual card
          packs or bundles) for the browser game &quot;PlayPointy&quot;. The
          technical steps to conclude a contract are: Selecting a pack or bundle
          in the store -&gt; Login -&gt; Accepting the GTC and the explicit
          waiver of withdrawal via respective separate checkboxes -&gt; Clicking
          the binding payment button (e.g., &quot;Order with obligation to
          pay&quot; or &quot;Buy now&quot;). The contract is legally concluded
          the moment you click this payment button, the payment is successful,
          and we immediately unlock the content in your account.
        </p>
      </Section>

      <Section title="6. Prices, Payment & Provision">
        <p>
          All prices are total prices including statutory VAT. Payment is
          processed via Stripe. Content is provided immediately after successful
          payment. If the payment process fails or is declined, no contract is
          concluded, and no content is unlocked.
        </p>
      </Section>

      <Section title="7. Right of Withdrawal & Explicit Waiver">
        <p>
          Consumers generally have a statutory right of withdrawal of 14 days.
        </p>
        <p>
          Exception for digital content: The right of withdrawal expires
          prematurely if we have begun executing the contract.
        </p>
        <p>
          By checking the separate, mandatory waiver box during checkout, you
          explicitly agree to the immediate execution of the contract and
          acknowledge that you lose your right of withdrawal once the digital
          content is unlocked. You will receive a confirmation of this contract
          and your consent via email.
        </p>
      </Section>

      <Section title="8. Usage Rights & &quot;Share&quot; Feature">
        <p>
          We grant you a simple, non-exclusive, non-transferable right to use
          the digital content for personal, non-commercial purposes. You may not
          distribute or commercially exploit the content. Exception: Sharing
          individual cards via the game&apos;s official &quot;Send a friend&quot;
          link is permitted. The recipient may view the shared content, but
          acquires no ownership or permanent access rights.
        </p>
      </Section>

      <Section title="9. Warranty and Liability (AT Law)">
        <p>
          Statutory warranty rights apply (especially the Austrian Consumer
          Warranty Act, VGG). We are liable without limitation for damages
          arising from injury to life, body, or health, as well as for intent
          and gross negligence. In cases of slight negligence, we are only
          liable for the breach of essential contractual obligations, limited to
          the foreseeable, typical damage.
        </p>
      </Section>

      <Section title="10. Service Availability and Termination">
        <p>
          We strive to keep &quot;PlayPointy&quot; running smoothly but do not
          guarantee an eternal &quot;lifetime&quot; access, as the game requires
          our servers to function. We reserve the right to discontinue the
          service. In such a case, we will announce this reasonably in advance.
          Your statutory rights (including warranty claims under the VGG) remain
          unaffected by this clause.
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We reserve the right to amend these GTC at any time. The version of
          the GTC applicable to your order is the one in effect at the time of
          purchase.
        </p>
      </Section>

      <Section title="12. Alternative Dispute Resolution & Applicable Law">
        <p>
          The EU Commission provides an ODR platform:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-neutral-900 underline underline-offset-2"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          . We are not obliged to participate in arbitration proceedings.
          Austrian law applies (excluding CISG), provided this does not deprive
          you of mandatory consumer protection laws of your country of
          residence.
        </p>
      </Section>

      <Section title="13. Severability Clause">
        <p>
          Should individual provisions of these GTC be invalid, the remainder of
          the contract remains valid. The invalid provision will be replaced by
          the relevant statutory provisions.
        </p>
      </Section>
    </LegalPage>
  );
}
