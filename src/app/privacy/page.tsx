import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy – PlayPointy",
  description: "Privacy policy for PlayPointy.",
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

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="1. Data Controller">
        <p>Responsible for data processing on this website is:</p>
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

      <Section title="2. Scope and Categories of Data Processed">
        <p>
          We process personal data strictly in accordance with the General Data
          Protection Regulation (GDPR) and the Austrian Data Protection Act
          (DSG). Depending on your interaction with PlayPointy, we process the
          following categories of data:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account Data:</strong> Email address and OAuth user
            identifiers provided by Google, or email address when signing in
            with a one-time code, when logging in or creating an account.
          </li>
          <li>
            <strong>Transaction &amp; Purchase Data:</strong> Order history,
            purchased card packs/bundles, and transaction metadata. (Note:
            Payment card details are processed directly and securely by Stripe;
            we do not store full payment card details on our servers).
          </li>
          <li>
            <strong>Technical &amp; Log Data:</strong> Temporary IP addresses,
            browser type, operating system, and technical request logs.
          </li>
          <li>
            <strong>Communication &amp; Marketing Data:</strong> Email address,
            Double Opt-In (DOI) confirmation timestamp, and subscription
            preferences (for users aged 16+ or with legal guardian consent).
          </li>
          <li>
            <strong>Support Data:</strong> Communication content when contacting
            us via email (retained until your inquiry is fully resolved).
          </li>
        </ul>
      </Section>

      <Section title="3. Legal Bases for Processing">
        <p>
          Processing occurs under the following legal grounds (Art. 6(1) GDPR):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Contract Performance (Art. 6(1)(b) GDPR):</strong> Provision
            of user accounts, unlocking and storing purchased digital card packs,
            and executing payment transactions.
          </li>
          <li>
            <strong>Legitimate Interests (Art. 6(1)(f) GDPR):</strong> Secure
            website delivery, prevention of bot attacks/fraud, privacy-friendly
            aggregated traffic measurement, and internal business management.
          </li>
          <li>
            <strong>Consent (Art. 6(1)(a) GDPR):</strong> Subscription to
            optional email updates regarding new pack releases.
          </li>
          <li>
            <strong>Legal Obligation (Art. 6(1)(c) GDPR):</strong> Compliance
            with statutory tax and accounting retention requirements.
          </li>
        </ul>
      </Section>

      <Section title="4. Essential Third-Party Services">
        <p>
          To operate PlayPointy, process transactions, and securely host
          content, we rely on the following third-party service providers:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase:</strong> Backend database and user account
            authentication (Google sign-in and email one-time codes).
          </li>
          <li>
            <strong>Google:</strong> OAuth identity provider for sign-in.
          </li>
          <li>
            <strong>Resend:</strong> Email delivery for one-time sign-in codes
            (and transactional mail related to authentication).
          </li>
          <li>
            <strong>Stripe (including Apple Pay / Google Pay):</strong>{" "}
            Processing of payment transactions.
          </li>
          <li>
            <strong>Cloudflare (Pages &amp; R2):</strong> Global hosting,
            content delivery, and network security for web assets and card
            images.
          </li>
        </ul>
      </Section>

      <Section title="5. Cookies, Local Storage &amp; Privacy-Friendly Analytics">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Strictly Necessary Security Cookies:</strong> Cloudflare may
            place essential security cookies (such as __cf_bm) solely to
            distinguish human visitors from automated bots. These are strictly
            necessary to secure the service (no consent required under TKG 2021
            / ePrivacy).
          </li>
          <li>
            <strong>Essential Local Storage (Game State):</strong> We use
            browser local storage and session storage to save active pack
            selections, a short-lived purchase intent after sign-in, and a
            cached list of unlocked packs on your device. This is strictly
            necessary for core game and restore functionality.
          </li>
          <li>
            <strong>No Marketing or Tracking Cookies:</strong> We do not use
            advertising cookies, marketing pixels (e.g., Google Analytics, Meta
            Pixel), or cross-site user tracking.
          </li>
          <li>
            <strong>Aggregated Web Analytics:</strong> We use cookieless,
            privacy-preserving web analytics (via Cloudflare Web Analytics) to
            measure aggregated traffic patterns without creating individual user
            profiles or cross-site tracking.
          </li>
        </ul>
      </Section>

      <Section title="6. Data Transfers to Third Countries (USA)">
        <p>
          Some service providers (e.g., Supabase, Stripe, Cloudflare, Google,
          Resend) process data in third countries outside the European Economic
          Area (EEA), including the US. Transfers to certified US entities are
          based on the EU-U.S. Data Privacy Framework (DPF) or Standard
          Contractual Clauses (SCCs) approved by the European Commission.
        </p>
      </Section>

      <Section title="7. Retention Periods">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account &amp; Purchased Packs Data:</strong> Stored for the
            duration of your active account or as long as necessary to fulfill
            the contract and handle potential statutory claims.
          </li>
          <li>
            <strong>Tax &amp; Transaction Records:</strong> Required billing and
            order data are retained for 7 years to comply with statutory
            requirements under Austrian tax law (§ 132 BAO), even if an account
            is deleted.
          </li>
          <li>
            <strong>Technical Log Data:</strong> Server logs are automatically
            deleted or anonymized within short retention windows.
          </li>
          <li>
            <strong>Marketing Data:</strong> Retained until you withdraw your
            consent or unsubscribe.
          </li>
        </ul>
      </Section>

      <Section title="8. Automated Decision-Making &amp; Profiling">
        <p>
          We do not use automated decision-making or profiling under Art. 22
          GDPR.
        </p>
      </Section>

      <Section title="9. Your Rights, Consent Withdrawal &amp; Complaints">
        <p>Under the GDPR, you have the following rights:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Access, Rectification, Restriction &amp; Data Portability:</strong>{" "}
            You may request access to, correction of, restriction of processing
            (Art. 18 GDPR), or data portability (Art. 20 GDPR) for your personal
            data where applicable.
          </li>
          <li>
            <strong>Account Deletion (Right to Erasure):</strong> You can
            request account deletion via email at{" "}
            <a
              href="mailto:hello@playpointy.com"
              className="text-neutral-900 underline underline-offset-2"
            >
              hello@playpointy.com
            </a>
            . Note: Account deletion permanently removes your technical access
            to purchased digital content. Statutory warranty and withdrawal
            rights remain unaffected. Transaction records required for tax
            compliance will be retained for the statutory period.
          </li>
          <li>
            <strong>Withdrawal of Consent:</strong> You may withdraw email
            subscription consent at any time via the &quot;Unsubscribe&quot;
            link in any email. Withdrawal does not affect the lawfulness of
            processing carried out prior to withdrawal.
          </li>
          <li>
            <strong>Right to Object:</strong> You may object to processing based
            on legitimate interests (Art. 6(1)(f) GDPR) on grounds relating to
            your particular situation.
          </li>
          <li>
            <strong>Supervisory Authority:</strong> You have the right to lodge
            a complaint with the competent supervisory authority: Österreichische
            Datenschutzbehörde (DSB), Barichgasse 40-42, 1030 Vienna, Austria (
            <a
              href="https://www.dsb.gv.at"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-neutral-900 underline underline-offset-2"
            >
              https://www.dsb.gv.at
            </a>
            ).
          </li>
        </ul>
        <p>
          For any privacy inquiries, contact us at{" "}
          <a
            href="mailto:hello@playpointy.com"
            className="text-neutral-900 underline underline-offset-2"
          >
            hello@playpointy.com
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
