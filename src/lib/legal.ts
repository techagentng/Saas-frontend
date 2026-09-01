/**
 * Single source of truth for the identity strings used across the legal
 * pages (`/privacy`, `/terms`). Centralized so a rename or a change of
 * contact address is one edit here, not a hunt through two long documents.
 *
 * NOTE: the marketing UI (components/ui/Logo.tsx, marketing/Footer.tsx,
 * app/(public)/page.tsx metadata) still reads "BookFlow". That rename is
 * deliberately out of scope for the legal pages — see the handover notes.
 */
export const LEGAL = {
  /** Product/service name as it appears in the legal documents. */
  productName: "IweApps",
  /** Public address where the Service is offered. */
  domain: "iweapps.com",
  siteUrl: "https://iweapps.com",

  /**
   * Contact addresses. These must actually resolve (or forward) before
   * launch — a policy that names an unreachable address is worse than one
   * that names none.
   */
  privacyEmail: "privacy@iweapps.com",
  legalEmail: "legal@iweapps.com",
  supportEmail: "support@iweapps.com",

  /**
   * Update BOTH when the documents change materially. `effectiveDate` is
   * when the current version took effect; `lastUpdated` is shown to users.
   */
  effectiveDate: "1 September 2026",
  lastUpdated: "1 September 2026",

  /** Governing law for the Terms, and the matching data-protection regime. */
  jurisdiction: "the Federal Republic of Nigeria",
  jurisdictionShort: "Nigeria",
  dataProtectionAct: "Nigeria Data Protection Act 2023 (NDPA)",
  supervisoryAuthority: "Nigeria Data Protection Commission (NDPC)",
} as const;
