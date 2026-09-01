import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalDocument,
  LegalList,
  LegalMail,
  LegalNote,
  type LegalSection,
} from "@/app/(public)/_components/legal-document";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service — ${LEGAL.productName}`,
  description: `The agreement between ${LEGAL.productName} and the businesses that use it to publish services and take bookings online.`,
  alternates: { canonical: `${LEGAL.siteUrl}/terms` },
};

const SECTIONS: readonly LegalSection[] = [
  {
    id: "agreement",
    title: "This agreement",
    body: (
      <>
        <p>
          These Terms of Service govern your use of {LEGAL.productName}, the booking platform
          available at {LEGAL.domain} (the “Service”). By creating an account, or by using the
          Service in any way, you agree to these terms. If you do not agree, do not use the
          Service.
        </p>
        <p>
          If you accept these terms on behalf of a company or other organisation, you confirm that
          you have the authority to bind it, and “you” means that organisation.
        </p>
        <p>
          Our <Link href="/privacy" className="font-medium text-brand-600 dark:text-brand-400 underline-offset-4 hover:underline">Privacy Policy</Link>{" "}
          explains how we handle information and forms part of this agreement.
        </p>
      </>
    ),
  },
  {
    id: "early-access",
    title: "Early access",
    body: (
      <>
        <p>
          {LEGAL.productName} is in active development and is currently offered as an early-access
          product. That has practical consequences you should weigh before you rely on it:
        </p>
        <LegalList>
          <li>Features may change substantially, or be removed, without a long notice period.</li>
          <li>We do not offer a guaranteed uptime level, and interruptions should be expected.</li>
          <li>
            The Service is provided free of charge for now. There are no paid plans and no billing.
          </li>
        </LegalList>
        <LegalNote>
          Keep your own records of anything you cannot afford to lose. Do not use early-access{" "}
          {LEGAL.productName} as the only place your booking or customer data exists.
        </LegalNote>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <>
        <p>
          You must be at least 18 years old to create an account. You need a valid email address
          and a password of between 8 and 128 characters.
        </p>
        <p>
          You are responsible for keeping your password confidential and for everything that
          happens under your account. Tell us at <LegalMail address={LEGAL.supportEmail} /> as soon
          as you suspect unauthorised access. We may suspend an account while we investigate a
          credible security concern.
        </p>
        <p>
          Give us accurate information and keep it current. Do not share one account between
          several people — invite them to your workspace instead, so that each person has their own
          credentials and the right permissions.
        </p>
      </>
    ),
  },
  {
    id: "workspaces",
    title: "Workspaces and booking page URLs",
    body: (
      <>
        <p>
          A workspace represents one business. When you create one you choose a URL for your public
          booking page. URLs use lowercase letters, numbers, and hyphens only, must be unique across
          the Service, and are allocated first come, first served. Some words are reserved for
          platform use — “admin” and “book” among them — and cannot be claimed.
        </p>
        <p>
          You also choose a business type when you create a workspace. It determines which features
          your dashboard shows and, once set, it is fixed for that workspace.
        </p>
        <p>
          We may reclaim or rename a URL that impersonates someone else, infringes a trade mark,
          is used to mislead, or is registered in bulk without genuine use. Where we can, we will
          contact you first.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content and your data",
    body: (
      <>
        <p>
          Everything you put into the Service — your business details, service catalogue, prices,
          team structure, and the bookings your customers make — remains yours. We claim no
          ownership of it.
        </p>
        <p>
          You grant us the limited licence we need to operate the Service: to host, store, back up,
          reproduce, and display your content so that your dashboard works and your booking page is
          visible to the customers you want to reach. This licence exists only to run the Service
          for you, and it ends when you delete the content or close your account, subject to the
          retention periods in the Privacy Policy.
        </p>
        <p>
          You are responsible for the accuracy and legality of what you publish, including your
          service descriptions and the prices you advertise.
        </p>
      </>
    ),
  },
  {
    id: "your-customers",
    title: "Your obligations to your own customers",
    body: (
      <>
        <p>
          This is the most important section for any business using {LEGAL.productName}, so it is
          stated plainly.
        </p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900 dark:text-white">
              The booking is between you and your customer.
            </strong>{" "}
            We are not a party to it. We do not supply the service being booked, and we make no
            promises to your customers about it on your behalf.
          </li>
          <li>
            <strong className="font-semibold text-slate-900 dark:text-white">
              You set and honour your own policies.
            </strong>{" "}
            Cancellations, no-shows, deposits, refunds, rescheduling, and complaints are yours to
            define and to handle. Publish them clearly to your customers.
          </li>
          <li>
            <strong className="font-semibold text-slate-900 dark:text-white">
              You control your customers’ personal data.
            </strong>{" "}
            You decide what you collect and why. You must have your own privacy notice, a lawful
            basis for collecting the data, and a way for your customers to exercise their rights.
            We process that data only on your instructions.
          </li>
          <li>
            <strong className="font-semibold text-slate-900 dark:text-white">
              You meet the rules of your own industry.
            </strong>{" "}
            Licensing, health and safety, hygiene, consumer protection, tax, and any
            sector-specific regulation that applies to your business remain your responsibility.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <p>
        {LEGAL.productName} does not process payments. It does not take card details, hold funds,
        or move money between you and your customers. Any payment for a booking is arranged
        directly between you and your customer, by whatever method you choose, and any dispute
        about it is between the two of you. If we introduce paid plans or payment features, we will
        publish updated terms and give you notice before they apply to you.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to use {LEGAL.productName} to:</p>
        <LegalList>
          <li>
            break any law, or offer goods or services that are illegal where you or your customers
            are located;
          </li>
          <li>
            impersonate another business or person, or misrepresent your affiliation with anyone;
          </li>
          <li>
            defraud your customers, advertise services you cannot deliver, or publish prices you do
            not intend to honour;
          </li>
          <li>
            upload malware, or attempt to gain access to another workspace, account, or any part of
            our systems you are not authorised to reach;
          </li>
          <li>
            probe or test the security of the Service without our written permission, or
            circumvent rate limits, authentication, or permission checks;
          </li>
          <li>
            scrape, crawl, or bulk-extract data from the Service, or place unreasonable load on our
            infrastructure;
          </li>
          <li>
            copy, decompile, or reverse engineer the Service, or resell access to it as your own
            product;
          </li>
          <li>publish content that is harassing, hateful, or sexually exploitative.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "team-members",
    title: "Team members and permissions",
    body: (
      <p>
        A workspace owner controls who is invited and what each role may do. You are responsible
        for the people you invite and for keeping their permissions appropriate — including
        removing access promptly when someone leaves. Anyone you invite must also follow these
        terms.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability, support, and changes",
    body: (
      <p>
        We aim to keep {LEGAL.productName} available and working well, but we do not guarantee that
        it will be uninterrupted or error-free. We may modify, suspend, or discontinue any part of
        the Service. If we plan to discontinue the Service entirely, or make a change that would
        materially reduce its core functionality for you, we will give you reasonable notice and a
        way to export your data. Support is offered on a best-effort basis by email at{" "}
        <LegalMail address={LEGAL.supportEmail} />.
      </p>
    ),
  },
  {
    id: "our-ip",
    title: "Our intellectual property",
    body: (
      <p>
        The Service itself — the software, design, interface, documentation, name, and logo —
        belongs to us and is protected by intellectual property law. These terms grant you a
        limited, non-exclusive, non-transferable right to use the Service while this agreement is
        in force. They transfer no ownership. You may not use our name or branding to suggest that
        we endorse your business without our written permission. Feedback you send us may be used
        freely to improve the Service, without obligation to you.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          You may stop using the Service and close your account at any time by contacting{" "}
          <LegalMail address={LEGAL.supportEmail} />.
        </p>
        <p>
          We may suspend or terminate your access if you materially breach these terms, if your use
          creates a legal risk or a security risk to others, or if we are required to do so by law.
          Where the circumstances allow, we will warn you and give you a chance to put things
          right.
        </p>
        <p>
          When an account closes, your public booking page stops working and your data is handled
          according to the retention periods in the Privacy Policy. Export anything you want to
          keep before you close your account. Sections that by their nature should survive — those
          covering your content licence, intellectual property, disclaimers, liability, indemnity,
          and governing law — continue to apply afterwards.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        To the fullest extent permitted by law, the Service is provided “as is” and “as available”,
        without warranties of any kind, whether express or implied, including implied warranties of
        merchantability, fitness for a particular purpose, and non-infringement. We do not warrant
        that the Service will meet your requirements, that it will be available uninterrupted or
        secure, that defects will be corrected, or that your data will never be lost. Nothing in
        these terms excludes any liability that cannot lawfully be excluded, including liability
        for death or personal injury caused by negligence, or for fraud.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, neither we nor our suppliers will be liable for any
        indirect, incidental, special, consequential, or punitive damages, nor for any loss of
        profits, revenue, goodwill, bookings, or data, arising out of or connected with your use of
        the Service, even if we have been advised that such loss is possible. Our total aggregate
        liability arising out of or relating to this agreement will not exceed the greater of the
        total amount you paid us for the Service in the twelve months before the claim arose, or
        fifty thousand Naira (₦50,000). Because the Service is currently free of charge, you should
        assume this cap is the latter figure.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to indemnify and hold us harmless from any claim, demand, loss, or expense —
        including reasonable legal fees — brought by a third party and arising from your content,
        your use of the Service, your breach of these terms, your dealings with your own customers,
        or your failure to meet an obligation you owe them under consumer or data protection law.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as the Service develops. The date at the top always shows the
        current version. For material changes we will give notice by email or in the dashboard
        before they take effect. If you continue using {LEGAL.productName} after that, you accept
        the updated terms. If you do not accept them, stop using the Service and close your
        account.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms and any dispute arising out of them are governed by the laws of{" "}
        {LEGAL.jurisdiction}, without regard to conflict of law rules. The courts of{" "}
        {LEGAL.jurisdictionShort} have exclusive jurisdiction, although we may seek injunctive
        relief in any court with proper jurisdiction to protect our intellectual property. Before
        starting formal proceedings, please contact us at{" "}
        <LegalMail address={LEGAL.legalEmail} /> so we can try to resolve the matter directly.
      </p>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <p>
        These terms, together with the Privacy Policy, are the entire agreement between us about
        the Service. If any provision is found unenforceable, the rest stays in force. Our failure
        to enforce a provision is not a waiver of it. You may not transfer your rights under this
        agreement without our consent; we may transfer ours in connection with a merger,
        acquisition, or sale of assets. Nothing here creates a partnership, joint venture, agency,
        or employment relationship between us.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        <p>
          Questions about these terms can go to <LegalMail address={LEGAL.legalEmail} />. For
          support, write to <LegalMail address={LEGAL.supportEmail} />.
        </p>
        <p>
          {LEGAL.productName} · {LEGAL.domain}
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      effectiveDate={LEGAL.effectiveDate}
      lastUpdated={LEGAL.lastUpdated}
      summary={
        <>
          <p>
            {LEGAL.productName} gives your business a booking page and a dashboard. Your content
            and your bookings stay yours; we host them so the Service works.
          </p>
          <p>
            Bookings are agreements between you and your customer — we are not a party to them, we
            do not process payments, and your cancellation and refund policies are yours to set and
            honour. The Service is in early access and free for now, so keep your own copy of
            anything you cannot lose.
          </p>
        </>
      }
      sections={SECTIONS}
    />
  );
}
