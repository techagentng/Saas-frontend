import type { Metadata } from "next";

import {
  LegalDocument,
  LegalList,
  LegalMail,
  LegalNote,
  type LegalSection,
} from "@/app/(public)/_components/legal-document";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy — ${LEGAL.productName}`,
  description: `How ${LEGAL.productName} collects, uses, and protects information for businesses that take bookings and for the customers who book with them.`,
  alternates: { canonical: `${LEGAL.siteUrl}/privacy` },
};

const SECTIONS: readonly LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who this policy covers",
    body: (
      <>
        <p>
          {LEGAL.productName} is booking software for service businesses. Businesses use it to
          create a workspace, publish a service menu, organise staff, and take bookings from their
          own customers online. It is offered at {LEGAL.domain}.
        </p>
        <p>
          This policy applies to the {LEGAL.productName} website, the business dashboard, and the
          public booking pages we host on behalf of businesses using the Service. It covers two
          different groups of people, and the difference matters a great deal — see the next
          section.
        </p>
      </>
    ),
  },
  {
    id: "two-roles",
    title: "Our two different roles",
    body: (
      <>
        <p>
          {LEGAL.productName} handles two categories of information, and our responsibilities are
          not the same for each.
        </p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900">
              Information about businesses that use {LEGAL.productName}.
            </strong>{" "}
            When you register an account, create a workspace, and set up your services, we decide
            how that information is used. We are the data controller for it, and this policy
            describes what we do.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              Information about a business’s own customers.
            </strong>{" "}
            When someone books an appointment, a table, a room, or a ride through a business’s
            booking page, that booking belongs to the business. The business decides why it is
            collected and what happens to it. We only store and process it on that business’s
            instructions, as their data processor.
          </li>
        </LegalList>
        <LegalNote>
          If you booked something through a business and want your information corrected or
          deleted, contact that business directly — they control it, and they can act on your
          request far faster than we can. If you cannot reach them, write to us at{" "}
          <LegalMail address={LEGAL.privacyEmail} /> and we will help you make contact.
        </LegalNote>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>
          <strong className="font-semibold text-slate-900">Account information.</strong> To create
          an account we ask for an email address and a password, and nothing else. We do not ask
          for your name at sign-up. Your password is never stored in a readable form — only a
          cryptographic hash of it is kept, which cannot be reversed back into your password. We
          also record your account status and the times your account was created and last updated.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Workspace information.</strong> When you
          set up a business you provide a business name, a URL for your booking page, and
          optionally a description, a contact email address, a contact phone number, and a
          timezone. You also tell us your type of business — currently nail technician, restaurant,
          hotel, or transport — which determines which features your dashboard shows.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Service catalogue.</strong> The services
          you offer, along with their descriptions, durations, prices, and currency, and whether a
          service is active or archived.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Team information.</strong> The people
          you invite to your workspace, the roles you assign them, and the permissions those roles
          carry.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Booking information.</strong> Details
          your customers submit when booking with you, held on your behalf as described above.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Technical information.</strong> Our
          servers record standard request data — IP address, browser and device type, pages
          requested, and timestamps — which we use to keep the Service running, to enforce rate
          limits, and to investigate abuse and security incidents.
        </p>
      </>
    ),
  },
  {
    id: "what-we-dont-collect",
    title: "What we do not collect",
    body: (
      <>
        <p>Being specific about this is more useful than a long list of what we might collect.</p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900">No card or bank details.</strong>{" "}
            {LEGAL.productName} does not process payments and has no payment provider connected.
            Money between a business and its customers is handled entirely outside the Service.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              No advertising or analytics trackers.
            </strong>{" "}
            We run no third-party analytics, no advertising pixels, and no cross-site tracking.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              No sale of personal information.
            </strong>{" "}
            We do not sell, rent, or trade personal information, and we do not share it with data
            brokers or advertisers.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">
              No special-category data by design.
            </strong>{" "}
            We do not ask for health, biometric, religious, or similar sensitive information.
            Please do not enter it into free-text fields such as service descriptions or booking
            notes.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          {LEGAL.productName} uses one cookie, and it exists purely to keep you signed in. There
          are no analytics, advertising, or tracking cookies, which is why you are not asked to
          accept a cookie banner.
        </p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900">Session refresh cookie.</strong> Set
            when you sign in and marked HttpOnly, so JavaScript on the page cannot read it. Its
            path is restricted to our authentication endpoints, so the browser only sends it where
            it is needed. It lets you stay signed in across page reloads, and it is replaced with a
            fresh value each time it is used.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Access token.</strong> Held only in
            your browser’s memory for the duration of the tab. It is never written to a cookie or
            to local storage, and it disappears when you close or reload the tab.
          </li>
        </LegalList>
        <p>
          Signing out clears both. Blocking the session cookie will prevent you from staying signed
          in.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How and why we use information",
    body: (
      <>
        <p>
          Under the {LEGAL.dataProtectionAct} we must have a lawful basis for each use. Ours are:
        </p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900">To provide the Service</strong> —
            creating your account, running your workspace, publishing your booking page, and
            storing your bookings. Basis: performance of our contract with you.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">To keep the Service secure</strong> —
            authenticating sign-ins, enforcing rate limits, isolating each workspace’s data, and
            investigating abuse. Basis: our legitimate interest in a secure platform.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">To support you</strong> — responding
            when you contact us and sending essential notices about your account or material
            changes to the Service. Basis: performance of our contract and our legitimate
            interests.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">To improve the Service</strong> —
            understanding which features are used and where errors occur, using aggregated and
            operational data. Basis: our legitimate interests.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">To meet legal obligations</strong> —
            where the law requires us to retain or disclose information. Basis: legal obligation.
          </li>
        </LegalList>
        <p>
          We will not send you marketing email without your consent, and any marketing we do send
          will include a way to unsubscribe.
        </p>
      </>
    ),
  },
  {
    id: "public-pages",
    title: "Information you deliberately make public",
    body: (
      <p>
        Your booking page is public by design — that is the point of it. Your business name, your
        chosen URL, your description, your service names, durations, and prices, and any contact
        details you add to your public profile can be viewed by anyone with the link and may be
        indexed by search engines. Treat those fields as published information and do not put
        anything private in them.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "When we share information",
    body: (
      <>
        <p>We share information only in these situations:</p>
        <LegalList>
          <li>
            <strong className="font-semibold text-slate-900">Service providers.</strong> Companies
            that host our infrastructure, store our database, and deliver our transactional email.
            They act on our instructions, may only use the information to provide their service to
            us, and are bound by confidentiality obligations.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Within your workspace.</strong>{" "}
            Information in a workspace is visible to the members of that workspace according to the
            roles and permissions its owner has assigned.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Legal requirements.</strong> Where we
            are required to disclose information by law, by a court, or by a competent regulator,
            or where disclosure is necessary to protect our rights, safety, or property, or those
            of our users or the public.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Business transfers.</strong> If we are
            involved in a merger, acquisition, financing, or sale of assets, information may be
            transferred as part of that transaction. We will notify you before your information
            becomes subject to a materially different privacy policy.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect information",
    body: (
      <>
        <p>Security measures built into the Service include:</p>
        <LegalList>
          <li>Passwords stored only as irreversible cryptographic hashes.</li>
          <li>Encryption in transit using HTTPS across the site, the dashboard, and the API.</li>
          <li>
            Workspace isolation, so each business’s data is separated at the data layer and
            requests are checked against the workspace they claim to belong to.
          </li>
          <li>
            Role-based access control, so members only reach the features their assigned
            permissions allow.
          </li>
          <li>
            Short-lived access tokens kept in memory, paired with a session credential that is
            replaced every time it is used, limiting the value of any single intercepted token.
          </li>
        </LegalList>
        <p>
          No online service can promise perfect security. If we become aware of a breach affecting
          your personal information, we will notify you and the {LEGAL.supervisoryAuthority} as
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep information",
    body: (
      <LegalList>
        <li>
          <strong className="font-semibold text-slate-900">Account and workspace data</strong> —
          for as long as your account is open.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">After you close your account</strong> —
          deleted or irreversibly anonymised within 90 days, except where we must keep it longer to
          comply with a legal obligation or to resolve a dispute.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Booking data</strong> — retained for as
          long as the business that collected it maintains its workspace, and deleted on that
          business’s instruction.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Security and request logs</strong> —
          typically kept for up to 12 months.
        </li>
        <li>
          <strong className="font-semibold text-slate-900">Backups</strong> — deleted data may
          persist in encrypted backups for a short period before those backups expire on their
          normal cycle.
        </li>
      </LegalList>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Under the {LEGAL.dataProtectionAct}, and under comparable laws elsewhere, you have the
          right to:
        </p>
        <LegalList>
          <li>Ask what personal information we hold about you and get a copy of it.</li>
          <li>Have inaccurate or incomplete information corrected.</li>
          <li>
            Ask us to delete your information where there is no overriding reason to keep it.
          </li>
          <li>Ask us to restrict how we use your information while a concern is resolved.</li>
          <li>
            Receive information you gave us in a portable, machine-readable format, or ask us to
            transfer it.
          </li>
          <li>
            Object to processing based on our legitimate interests, including any direct marketing.
          </li>
          <li>Withdraw consent at any time, where we relied on your consent.</li>
        </LegalList>
        <p>
          Write to <LegalMail address={LEGAL.privacyEmail} /> to exercise any of these. We will
          respond within 30 days. We may ask you to confirm your identity first, so that we do not
          disclose your information to someone else. There is no charge for a reasonable request.
        </p>
        <p>
          If you are unhappy with our response, you may complain to the{" "}
          {LEGAL.supervisoryAuthority} or to the data protection authority where you live.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Where information is stored",
    body: (
      <p>
        Our infrastructure and service providers may store and process information in countries
        other than {LEGAL.jurisdictionShort}. Where information is transferred outside{" "}
        {LEGAL.jurisdictionShort}, we take the steps required by the {LEGAL.dataProtectionAct} to
        make sure it remains protected to an equivalent standard, including using providers that
        offer appropriate contractual safeguards.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {LEGAL.productName} is a tool for businesses and is not directed at children. We do not
        knowingly collect personal information from anyone under 18 in the course of providing
        accounts. If you believe a child has given us personal information, contact{" "}
        <LegalMail address={LEGAL.privacyEmail} /> and we will delete it. Where a business uses the
        Service to take bookings that may involve minors, that business is responsible for
        obtaining any consent its own laws require.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the Service develops. The date at the top always shows the
        current version. If a change materially affects your rights or how we use your
        information, we will give you notice by email or in the dashboard before it takes effect.
        Continuing to use {LEGAL.productName} after a change takes effect means you accept the
        updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        <p>
          Questions about this policy, or about how your information is handled, can go to{" "}
          <LegalMail address={LEGAL.privacyEmail} />. For anything else, including support, write
          to <LegalMail address={LEGAL.supportEmail} />.
        </p>
        <p>
          {LEGAL.productName} · {LEGAL.domain}
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      effectiveDate={LEGAL.effectiveDate}
      lastUpdated={LEGAL.lastUpdated}
      summary={
        <>
          <p>
            We collect an email address and a password to create your account, plus the business
            details and services you choose to add. We do not sell your information, we run no
            advertising or analytics trackers, and we use exactly one cookie — the one that keeps
            you signed in.
          </p>
          <p>
            Bookings your customers make belong to you, not to us. We hold them on your behalf and
            act on your instructions.
          </p>
        </>
      }
      sections={SECTIONS}
    />
  );
}
