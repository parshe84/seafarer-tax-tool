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
}

export interface ChecklistItem {
  title: string;
  description: string;
}

export interface CalculatorResult {
  checklist: ChecklistItem[];
  estimatedSavingsUsd: number;
  disclaimer: string;
}
