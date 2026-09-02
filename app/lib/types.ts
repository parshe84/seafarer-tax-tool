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

export interface CalculatorInput {
  citizenship: Country;
  taxResidenceCountry: Country;
  daysAtSea: number;
  vesselFlag?: string;
  /** Optional, used only where the country's savings estimate needs it (e.g. Philippines). */
  annualIncomeUsd?: number;
}

export interface ChecklistItem {
  title: string;
  description: string;
}

export interface CalculatorResult {
  checklist: ChecklistItem[];
  /** Null when a real dollar estimate cannot be computed (e.g. no income given) — show estimatedSavingsNote instead. */
  estimatedSavingsUsd: number | null;
  /** Explanation to show in place of a dollar figure when estimatedSavingsUsd is null. */
  estimatedSavingsNote?: string;
  disclaimer: string;
}
