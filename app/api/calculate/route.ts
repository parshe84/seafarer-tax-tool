import { NextRequest, NextResponse } from "next/server";
import type {
  CalculatorInput,
  CalculatorResult,
  ChecklistItem,
  FamilyLocation,
  YesNoNotSure,
} from "@/app/lib/types";
import { FAMILY_LOCATIONS, YES_NO_NOT_SURE } from "@/app/lib/types";
import { getMessages, locales, type Locale } from "@/app/lib/i18n";

const t = getMessages();

// TODO: Replace the stub branch below (buildStubResult) with real per-country
// tax rule bases for the remaining countries (Indonesia / Croatia / ...),
// one at a time. Philippines, Ukraine, India and Poland are implemented
// below as real examples.
// TODO (i18n): the client now sends `locale` (the UI language the request
// was made in — see app/lib/LocaleContext.tsx), but every calculate*Result()
// function below still returns hardcoded English checklist/disclaimer text
// regardless of it. Once translated tax content exists for a country (e.g.
// Filipino content for Philippines, Ukrainian for Ukraine), branch on
// `body.locale` inside the relevant calculate*Result() function to return
// that language's content, falling back to English for anything untranslated.
// This is a separate concern from the generic UI strings in messages/*.json,
// which this file already reads (in English) for its own error text.

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
        body.annualIncomeUsd < 0)) ||
    (body.daysInUkraine !== undefined &&
      (typeof body.daysInUkraine !== "number" ||
        Number.isNaN(body.daysInUkraine) ||
        body.daysInUkraine < 0 ||
        body.daysInUkraine > 366)) ||
    (body.familyLocation !== undefined &&
      !FAMILY_LOCATIONS.includes(body.familyLocation as FamilyLocation)) ||
    (body.vesselInternationalTransport !== undefined &&
      !YES_NO_NOT_SURE.includes(
        body.vesselInternationalTransport as YesNoNotSure
      )) ||
    (body.shipownerInDttCountry !== undefined &&
      !YES_NO_NOT_SURE.includes(body.shipownerInDttCountry as YesNoNotSure)) ||
    (body.locale !== undefined &&
      !locales.includes(body.locale as Locale))
  ) {
    return NextResponse.json({ error: t.api.validationError }, { status: 400 });
  }

  let result: CalculatorResult;
  if (
    body.citizenship === "Philippines" &&
    body.taxResidenceCountry === "Philippines"
  ) {
    result = calculatePhilippinesResult(body);
  } else if (
    body.citizenship === "Ukraine" &&
    body.taxResidenceCountry === "Ukraine"
  ) {
    result = calculateUkraineResult(body);
  } else if (
    body.citizenship === "India" &&
    body.taxResidenceCountry === "India"
  ) {
    result = calculateIndiaResult(body);
  } else if (
    body.citizenship === "Poland" &&
    body.taxResidenceCountry === "Poland"
  ) {
    result = calculatePolandResult(body);
  } else {
    result = buildStubResult();
  }

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

// --- Ukraine --------------------------------------------------------------
//
// Source: Tax Code of Ukraine, individual tax residency test.
//
// Unlike the Philippines, Ukraine has NO automatic exemption for seafaring
// income. Everything hinges on tax residency status, which is determined by
// facts (center of vital interests, physical presence), not by registration.
// We only classify a *likely* status here from two self-reported facts —
// where the seafarer's immediate family / permanent home currently is, and
// how many days they physically spent in Ukraine over the last 12 months —
// and we are explicit whenever the classification is not confident enough
// to act on.
//
// IMPORTANT: when the likely status is "resident", the income figure below
// is a potential tax LIABILITY, not a saving — the UI must present it as
// "estimated tax exposure", never as "savings".

// 18% personal income tax (PDFO) + 1.5% military levy on worldwide income
// for tax residents. Ukraine's flat rate needs no local-currency bracket
// conversion, so this is applied directly to the self-reported USD income.
const UKRAINE_RESIDENT_TAX_RATE = 0.18 + 0.015;

const UKRAINE_DISCLAIMER =
  "Residency status under the Tax Code of Ukraine is determined by facts " +
  "and reviewed individually, not by this tool. The final determination " +
  "rests with the State Tax Service of Ukraine (DPS). This is general " +
  "information, not tax advice — confirm your specific situation with a " +
  "qualified Ukrainian tax consultant before relying on this estimate.";

function calculateUkraineResult(input: CalculatorInput): CalculatorResult {
  const { familyLocation, daysInUkraine } = input;

  if (familyLocation === "Ukraine") {
    return ukraineLikelyResidentResult(input);
  }

  if (familyLocation === "Outside Ukraine") {
    if (typeof daysInUkraine !== "number") {
      return ukraineUnclearResult(
        "Your residency status needs individual review — we don't have enough information about your time in Ukraine to classify it."
      );
    }
    if (daysInUkraine < 183) {
      return ukraineLikelyNonResidentResult(input);
    }
    return ukraineUnclearResult(
      "Your residency status is ambiguous: your family/home is outside Ukraine, but you spent 183 days or more in Ukraine, which can itself trigger residency under the 183-day test. Your residency status needs individual review."
    );
  }

  // familyLocation is "Not sure" or not provided at all — do not guess.
  return ukraineUnclearResult(
    "Your residency status needs individual review — we don't have enough information to classify it."
  );
}

function ukraineLikelyResidentResult(
  input: CalculatorInput
): CalculatorResult {
  const checklist: ChecklistItem[] = [
    {
      title: "Confirm your residency status officially if in doubt",
      description:
        "If you're unsure this classification is right, you can request an individual tax consultation or ruling from the State Tax Service (DPS) to confirm your status.",
    },
    {
      title: "File a foreign income declaration by May 1",
      description:
        "Ukrainian tax residents must declare worldwide income, including seafaring salary earned abroad, in their annual tax return.",
    },
    {
      title: "Pay the resulting tax liability by August 1",
      description:
        "The 18% personal income tax (PDFO) plus 1.5% military levy is due by this date for the prior reporting year.",
    },
    {
      title: "Request proof of foreign tax paid from your employer/agent, if applicable",
      description:
        "A credit against Ukrainian tax is only possible with a legalized certificate from the foreign tax authority, authenticated through a Ukrainian consulate. Flag states typically withhold nothing, so this credit is rarely available in practice — do not assume it will offset your liability.",
    },
  ];

  let estimatedSavingsUsd: number | null = null;
  let estimatedSavingsNote: string;

  if (input.annualIncomeUsd && input.annualIncomeUsd > 0) {
    estimatedSavingsUsd = Math.round(
      input.annualIncomeUsd * UKRAINE_RESIDENT_TAX_RATE
    );
    estimatedSavingsNote =
      "This reflects the tax you may owe unless your non-resident status is confirmed — it is not a saving.";
  } else {
    estimatedSavingsNote =
      "Estimated tax exposure requires your annual income. If your resident status is confirmed, tax applies at 19.5% (18% PDFO + 1.5% military levy) on worldwide income.";
  }

  return {
    checklist,
    estimatedSavingsUsd,
    estimatedSavingsNote,
    estimatedAmountLabel: "Estimated tax exposure",
    estimatedAmountKind: "exposure",
    disclaimer: UKRAINE_DISCLAIMER,
  };
}

function ukraineLikelyNonResidentResult(
  input: CalculatorInput
): CalculatorResult {
  const checklist: ChecklistItem[] = [
    {
      title: "Be ready to substantiate the facts if the tax authority asks",
      description:
        "Keep evidence of where your family/permanent home is and how many days you spent in Ukraine — the DPS can request these at any time.",
    },
    {
      title: "Keep your passport stamps / seaman's book as proof of days outside Ukraine",
      description:
        "This is your primary evidence for the physical presence side of the residency test.",
    },
    {
      title: "Get a written residency ruling from the tax authority if uncertainty persists long-term",
      description:
        "For an ongoing or high-value situation, a formal written request to the DPS removes the ambiguity instead of relying on a self-assessment.",
    },
  ];

  let estimatedSavingsUsd: number | null = null;
  let estimatedSavingsNote: string | undefined;

  if (input.annualIncomeUsd && input.annualIncomeUsd > 0) {
    estimatedSavingsUsd = Math.round(
      input.annualIncomeUsd * UKRAINE_RESIDENT_TAX_RATE
    );
  } else {
    estimatedSavingsNote =
      "Exact savings estimate requires your annual income.";
  }

  return {
    checklist,
    estimatedSavingsUsd,
    estimatedSavingsNote,
    estimatedAmountLabel: "Estimated savings",
    estimatedAmountKind: "savings",
    disclaimer: UKRAINE_DISCLAIMER,
  };
}

function ukraineUnclearResult(note: string): CalculatorResult {
  const checklist: ChecklistItem[] = [
    {
      title: "Get an individual residency assessment before filing",
      description:
        "Contact the State Tax Service (DPS) or a qualified Ukrainian tax consultant with your specific facts — family location, days in Ukraine, and any other ties — before assuming either resident or non-resident treatment.",
    },
    {
      title: "Keep records of your family's location and your travel dates",
      description:
        "Whichever status ultimately applies, you'll need evidence of where your family/home is and dated proof (passport stamps, seaman's book) of your time in and out of Ukraine.",
    },
  ];

  return {
    checklist,
    estimatedSavingsUsd: null,
    estimatedSavingsNote: note,
    estimatedAmountLabel: "Residency status",
    estimatedAmountKind: "unclear",
    disclaimer: UKRAINE_DISCLAIMER,
  };
}

// --- India ------------------------------------------------------------
//
// Sources: CBDT Notification No. 70/2015, CBDT Circular 13/2017, the
// Income-tax Act 1961 (in effect through FY2025-26), and the Income-tax Act
// 2025 (effective FY2026-27).
//
// Indian seafarers have a DIFFERENT residency test from the ordinary
// 182/60-day NRI test used for other Indian citizens: a seafarer is
// non-resident (NRI) for tax purposes if they spend 184 days or more
// OUTSIDE India for the purpose of employment on a foreign ship in a
// financial year. Crucially, days covered by a CDC (Continuous Discharge
// Certificate) -endorsed voyage that starts or ends at an Indian port are
// entirely excluded from "days in India" — even if the vessel physically
// entered Indian waters during that voyage. From FY2026-27, a formal
// employment contract proving employment outside India is required; without
// it, NRI status may not be recognized.
//
// If NRI status holds, only India-sourced income is taxable — the foreign
// seafaring salary is not. We reuse the existing daysAtSea field as the
// "days outside India for employment" figure (no separate field), per the
// same seafarer-specific test.

const INDIA_NRI_DAYS_THRESHOLD = 184;

const INDIA_DISCLAIMER =
  "This reflects the seafarer-specific NRI test under CBDT Notification " +
  "No. 70/2015 and Circular 13/2017, based on the Income-tax Act 1961 (in " +
  "effect through FY2025-26) and the incoming Income-tax Act 2025 " +
  "(effective FY2026-27, with tightened requirements including a formal " +
  "employment contract proving employment outside India). This is general " +
  "information, not tax advice — confirm your specific residential status " +
  "and applicable rules, especially the contract requirement, with a " +
  "qualified Indian tax professional.";

function calculateIndiaResult(input: CalculatorInput): CalculatorResult {
  if (input.daysAtSea >= INDIA_NRI_DAYS_THRESHOLD) {
    return {
      checklist: [
        {
          title: "Keep a copy of your CDC covering all voyages",
          description:
            "Your Continuous Discharge Certificate (CDC) is your primary evidence of days outside India — days on a CDC-endorsed voyage starting or ending at an Indian port are excluded entirely from 'days in India', even if the vessel entered Indian waters during that voyage.",
        },
        {
          title: "Make sure you have a formal employment contract proving employment outside India",
          description:
            "From FY2026-27 under the Income Tax Act 2025, a formal contract with your foreign employer/manning agency confirming employment outside India is required — without it, your NRI status may not be recognized.",
        },
        {
          title: "Receive your salary into an NRE account",
          description:
            "Being paid into a Non-Resident External (NRE) account is commonly used as supporting evidence of NRI status, alongside your CDC.",
        },
        {
          title: "Keep a month-by-month record of your voyage days",
          description:
            "Retain this in case the Income Tax Department requests a detailed breakdown of your time on board and ashore.",
        },
      ],
      estimatedSavingsUsd: null,
      estimatedSavingsNote:
        "Your foreign seafaring income is not taxable in India as an NRI. An exact dollar savings figure depends on the income tax slab you would otherwise fall into — consult a tax professional for a precise number.",
      estimatedAmountLabel: "Estimated savings",
      estimatedAmountKind: "savings",
      disclaimer: INDIA_DISCLAIMER,
    };
  }

  return {
    checklist: [
      {
        title: "Get your residential status formally reviewed",
        description:
          "With fewer than 184 days outside India for employment, you may not meet the seafarer NRI test. Have a tax professional review your specific facts before assuming either status.",
      },
      {
        title: "Determine which tax regime applies (old vs. new)",
        description:
          "Indian income tax has two parallel regimes with different slabs and deductions — which one is more favorable depends on your full financial picture.",
      },
    ],
    estimatedSavingsUsd: null,
    estimatedSavingsNote:
      "You may not qualify for NRI seafarer status — consult a tax professional to review your residential status and applicable tax regime.",
    estimatedAmountLabel: "Residency status",
    estimatedAmountKind: "unclear",
    disclaimer: INDIA_DISCLAIMER,
  };
}

// --- Poland -------------------------------------------------------------
//
// Source: Art. 21 ust. 1 pkt 23c of the Polish PIT Act (in force since 2020).
//
// The exemption requires BOTH:
//   1. The vessel is engaged in international transport of cargo/passengers
//      by sea for at least 50% of the seafarer's actual working time (this
//      excludes tugboats/dredgers below that threshold).
//   2. The shipowner's actual management/head office is in a country that
//      has a double taxation treaty (DTT) with Poland.
// If both hold, foreign seafaring income is fully exempt from Polish PIT
// (exemption with progression — it can still affect the rate on other
// taxable Polish income). If the shipowner isn't in a DTT country, this
// exemption doesn't apply and a proportional deduction may be possible only
// with proof of foreign tax actually paid — a complex case needing
// individual review. If the vessel doesn't meet the international-transport
// threshold, the exemption doesn't apply at all.

const POLAND_DISCLAIMER =
  "Poland's seafarer tax rules are currently under active legislative " +
  "reform in 2026 — a new law extending PIT exemption (passed by the " +
  "Sejm) is pending Senate approval and, for some provisions, European " +
  "Commission consent. This calculator reflects the CURRENTLY confirmed " +
  "law (Art. 21(1)(23c)). Rules may change — verify current status before " +
  "filing.";

function calculatePolandResult(input: CalculatorInput): CalculatorResult {
  const { vesselInternationalTransport, shipownerInDttCountry } = input;

  if (
    vesselInternationalTransport === "Yes" &&
    shipownerInDttCountry === "Yes"
  ) {
    return {
      checklist: [
        {
          title: "Request a certificate from your shipowner/agency with the required data set",
          description:
            "There's no official form, but the certificate must include: your full name, PESEL (if any), address, employment periods with dates, vessel name and flag, income amount, and the shipowner's details including tax ID and legal form.",
        },
        {
          title: "Remember this is \"exemption with progression\"",
          description:
            "Your foreign seafaring income is exempt from PIT itself, but it can still affect the tax rate applied to any other taxable income you have in Poland.",
        },
        {
          title: "Keep your full documentation package",
          description:
            "Polish tax authorities in 2026 are actively auditing these declarations — an incomplete document package is a common reason those audits escalate.",
        },
      ],
      estimatedSavingsUsd: null,
      estimatedSavingsNote:
        "This income is exempt from Polish PIT under Art. 21(1)(23c). An exact dollar savings figure depends on the Polish PIT scale that would otherwise apply — consult a tax professional for a precise number.",
      estimatedAmountLabel: "Estimated savings",
      estimatedAmountKind: "savings",
      disclaimer: POLAND_DISCLAIMER,
    };
  }

  if (vesselInternationalTransport === "No") {
    return polandUnclearResult(
      "Poland's PIT exemption under Art. 21(1)(23c) applies only to seafarers on vessels engaged in international transport of cargo/passengers by sea for at least 50% of actual working time. Based on your answer, your vessel does not meet this threshold, so the exemption does not apply. Your income may still be taxable in Poland depending on your overall situation — consult a tax professional."
    );
  }

  if (shipownerInDttCountry === "No") {
    return polandUnclearResult(
      "The Art. 21(1)(23c) exemption doesn't apply because your shipowner's actual management isn't in a country with a double taxation treaty (DTT) with Poland. A proportional deduction may be possible instead, but only with proof that tax was actually paid abroad — this is a complex case that needs individual review by a tax professional."
    );
  }

  return polandUnclearResult(
    "We don't have enough information to determine whether the Art. 21(1)(23c) exemption applies. Please answer both eligibility questions, or consult a tax professional with your specific vessel and employer details."
  );
}

function polandUnclearResult(note: string): CalculatorResult {
  return {
    checklist: [
      {
        title: "Get your eligibility reviewed by a tax professional",
        description:
          "Confirm whether your vessel meets the international-transport threshold and whether your shipowner's management is in a DTT country before assuming any tax treatment.",
      },
      {
        title: "Keep records of your vessel's activity split and your employer's registered management location",
        description:
          "You'll need evidence of both facts regardless of which tax treatment ultimately applies.",
      },
    ],
    estimatedSavingsUsd: null,
    estimatedSavingsNote: note,
    estimatedAmountLabel: "Tax treatment",
    estimatedAmountKind: "unclear",
    disclaimer: POLAND_DISCLAIMER,
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
