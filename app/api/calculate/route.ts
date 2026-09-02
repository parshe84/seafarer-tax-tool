import { NextRequest, NextResponse } from "next/server";
import type {
  CalculatorInput,
  CalculatorResult,
  ChecklistItem,
} from "@/app/lib/types";
import { getMessages } from "@/app/lib/i18n";

const t = getMessages();

// TODO: Replace the stub branch below (buildStubResult) with real per-country
// tax rule bases for the remaining countries (Ukraine / India / Indonesia /
// Croatia / Poland / ...), one at a time. Philippines is implemented below
// as the first real example.
// TODO (i18n): once real rule content exists for a country, its
// checklist/disclaimer text will need to be localized per locale together
// with that content — a separate concern from the generic UI strings in
// messages/*.json, which this file already reads for its own error text.

export async function POST(request: NextRequest) {
  let body: CalculatorInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.api.invalidRequest }, { status: 400 });
  }

  if (
    !body ||
    typeof body.citizenship !== "string" ||
    typeof body.taxResidenceCountry !== "string" ||
    typeof body.daysAtSea !== "number" ||
    Number.isNaN(body.daysAtSea) ||
    body.daysAtSea < 0 ||
    body.daysAtSea > 366 ||
    (body.annualIncomeUsd !== undefined &&
      (typeof body.annualIncomeUsd !== "number" ||
        Number.isNaN(body.annualIncomeUsd) ||
        body.annualIncomeUsd < 0))
  ) {
    return NextResponse.json({ error: t.api.validationError }, { status: 400 });
  }

  const result: CalculatorResult =
    body.citizenship === "Philippines" &&
    body.taxResidenceCountry === "Philippines"
      ? calculatePhilippinesResult(body)
      : buildStubResult();

  return NextResponse.json(result);
}

// --- Philippines --------------------------------------------------------
//
// Sources: BIR Revenue Regulations No. 1-2011, NIRC Section 23(C),
// RR No. 4-2024.
//
// A Filipino citizen working as a seafarer is classified as a "non-resident
// citizen" for tax purposes when all of the following hold:
//   1. Registered as an OFW/OCW with POEA and holds a valid Overseas
//      Employment Certificate (OEC).
//   2. Holds a Seafarer's Identification Record Book (SIRB) / Seaman's Book
//      issued by MARINA.
//   3. Employed on a vessel engaged EXCLUSIVELY in international trade —
//      NOT a Philippine-flagged vessel in coastwise/domestic trade (income
//      from that is taxable).
// As a non-resident citizen, only Philippine-sourced income (e.g. local
// rent, local business) is taxable — seafaring salary is not. If seafaring
// salary is the seafarer's only income, no income tax return is required
// at all (RR No. 4-2024). Separately, OFWs with a valid OEC are exempt from
// travel tax on departure/arrival.
//
// IMPORTANT: eligibility here does NOT depend on a "days at sea" threshold
// (unlike, e.g., UK or India rules) — the days-at-sea field is shown in the
// checklist purely as a general documentation reminder, never as a decision
// factor for this country.

// Fixed approximate USD/PHP rate used only to translate an optional
// self-reported USD income into PHP tax brackets and back. Not a live rate.
// TODO: replace with a periodically-updated exchange rate if this estimate
// needs to stay accurate over time.
const USD_TO_PHP_RATE = 58;

// TRAIN Act progressive income tax brackets (annual, in PHP), applied here
// only to estimate the tax the seafarer would otherwise have owed — i.e.
// the amount the exemption effectively saves them.
const TRAIN_ACT_BRACKETS_PHP: { upTo: number; rate: number }[] = [
  { upTo: 250_000, rate: 0 },
  { upTo: 400_000, rate: 0.15 },
  { upTo: 800_000, rate: 0.2 },
  { upTo: 2_000_000, rate: 0.25 },
  { upTo: 8_000_000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
];

function calculateTrainActTaxPhp(incomePhp: number): number {
  let tax = 0;
  let previousLimit = 0;

  for (const bracket of TRAIN_ACT_BRACKETS_PHP) {
    if (incomePhp <= previousLimit) break;
    const taxableInBracket = Math.min(incomePhp, bracket.upTo) - previousLimit;
    tax += taxableInBracket * bracket.rate;
    previousLimit = bracket.upTo;
  }

  return tax;
}

const PHILIPPINES_DISCLAIMER =
  "This is general information based on BIR Revenue Regulations No. 1-2011, " +
  "NIRC Section 23(C), and RR No. 4-2024 — it is not tax advice. Rules can " +
  "change and individual circumstances vary. Confirm your specific situation " +
  "with the BIR or an accredited Philippine tax consultant before relying on " +
  "this estimate.";

function calculatePhilippinesResult(input: CalculatorInput): CalculatorResult {
  const checklist: ChecklistItem[] = [
    {
      title: "Confirm your POEA registration and OEC are valid",
      description:
        "The income tax exemption applies only while you hold an active Overseas Employment Certificate (OEC) as a registered OFW/OCW.",
    },
    {
      title: "Get or renew your Seafarer's Identification Record Book (Seaman's Book) with MARINA",
      description:
        "Your SIRB is core proof of your seafaring status and employment record.",
    },
    {
      title: "Confirm with your employer that the vessel is engaged in international trade",
      description:
        "The exemption applies to seafarers on vessels engaged exclusively in international trade. Income from a Philippine-flagged vessel in coastwise/domestic trade is taxable and does not qualify.",
    },
    {
      title: "Keep your employer's BIR Form 2316 as supporting documentation",
      description:
        "Hold on to this and your contracts/SIRB entries as your documentation trail, including records of your days served at sea.",
    },
    {
      title: "You likely do not need to file an income tax return",
      description:
        "Under RR No. 4-2024, if your seafaring salary is your only income, no income tax return filing is required. If you also have other Philippine-sourced income (e.g. rent, a local business), that income may still need to be declared.",
    },
  ];

  let estimatedSavingsUsd: number | null = null;
  let estimatedSavingsNote: string | undefined;

  if (input.annualIncomeUsd && input.annualIncomeUsd > 0) {
    const incomePhp = input.annualIncomeUsd * USD_TO_PHP_RATE;
    const wouldBeTaxPhp = calculateTrainActTaxPhp(incomePhp);
    estimatedSavingsUsd = Math.round(wouldBeTaxPhp / USD_TO_PHP_RATE);
  } else {
    estimatedSavingsNote =
      "Exact savings estimate requires your annual income.";
  }

  return {
    checklist,
    estimatedSavingsUsd,
    estimatedSavingsNote,
    disclaimer: PHILIPPINES_DISCLAIMER,
  };
}

// --- Stub for all other countries ---------------------------------------

function buildStubResult(): CalculatorResult {
  return {
    checklist: [
      {
        title: "File Form X by April 30",
        description:
          "Stub: the specific form for your country of tax residence will appear here.",
      },
      {
        title: "Collect Document Z (proof of days at sea)",
        description:
          "Stub: the list of required vessel documents will depend on your country and vessel flag.",
      },
      {
        title: "Submit the benefit claim to the tax authority",
        description:
          "Stub: the exact procedure and filing authority will be determined by the real rule base.",
      },
    ],
    estimatedSavingsUsd: 1250,
    disclaimer:
      "This is a test estimate from a stub, not a real calculation. Final amounts will appear once the per-country tax rule base is connected.",
  };
}
