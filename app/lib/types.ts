import type { Locale } from "@/app/lib/i18n";

export const COUNTRIES = [
  "Philippines",
  "Ukraine",
  "India",
  "Indonesia",
  "Croatia",
  "Poland",
  "Other",
] as const;

export type Country = (typeof COUNTRIES)[number];

// Used only for the Ukraine residency test (shown conditionally in the form
// when citizenship and tax residence are both "Ukraine").
export const FAMILY_LOCATIONS = ["Ukraine", "Outside Ukraine", "Not sure"] as const;
export type FamilyLocation = (typeof FAMILY_LOCATIONS)[number];

// Used for the Poland exemption test's two yes/no/unsure eligibility questions.
export const YES_NO_NOT_SURE = ["Yes", "No", "Not sure"] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE)[number];

export interface CalculatorInput {
  citizenship: Country;
  taxResidenceCountry: Country;
  daysAtSea: number;
  vesselFlag?: string;
  /** Optional, used only where the country's savings/exposure estimate needs it (e.g. Philippines, Ukraine). */
  annualIncomeUsd?: number;
  /** Ukraine residency test only: where the seafarer's family / permanent home currently is. */
  familyLocation?: FamilyLocation;
  /** Ukraine residency test only: physical days spent in Ukraine over the last 12 months. */
  daysInUkraine?: number;
  /** Poland exemption test only: vessel in international sea transport of cargo/passengers >=50% of working time. */
  vesselInternationalTransport?: YesNoNotSure;
  /** Poland exemption test only: shipowner's actual management/head office is in a country with a DTT with Poland. */
  shipownerInDttCountry?: YesNoNotSure;
  /** UI language the request was made in. Not yet used to localize the response — see TODO in app/api/calculate/route.ts. */
  locale?: Locale;
}

export interface ChecklistItem {
  title: string;
  description: string;
}

export interface CalculatorResult {
  checklist: ChecklistItem[];
  /** Null when a real dollar estimate cannot be computed (e.g. no income given, or status unclear) — show estimatedSavingsNote instead. */
  estimatedSavingsUsd: number | null;
  /** Caveat/explanation shown alongside (or instead of, when null) the dollar figure. */
  estimatedSavingsNote?: string;
  /** Overrides the generic "Estimated savings" label — e.g. "Estimated tax exposure" when the amount is a potential liability, not a saving. */
  estimatedAmountLabel?: string;
  /** Controls how the UI presents the amount: a saving/exemption, a potential liability, or an undetermined status. Defaults to "savings". */
  estimatedAmountKind?: "savings" | "exposure" | "unclear";
  disclaimer: string;
}
