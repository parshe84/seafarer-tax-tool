import { NextRequest, NextResponse } from "next/server";
import type { CalculatorInput, CalculatorResult } from "@/app/lib/types";
import { getMessages } from "@/app/lib/i18n";

const t = getMessages();

// TODO: Replace the whole body of this file with a real per-country tax rule
// base (Philippines / Ukraine / India / Indonesia / Croatia / Poland / ...).
// The real logic should take into account:
//   - citizenship vs. country of tax residence (these can differ);
//   - number of days at sea in the reporting period (thresholds for benefits
//     vary by country, e.g. the OFW exemption in the Philippines, the UK's
//     seafarer's earnings deduction, etc.);
//   - vessel flag and contract type (affects eligibility in some countries);
//   - current filing deadlines and forms, which change year to year.
// TODO (i18n): once real rule content exists, the checklist/disclaimer text
// below will need to be localized per country/locale together with that
// content — that is a separate concern from the generic UI strings in
// messages/*.json, which this stub already reads for its own error text.
// For now this returns a fixed test stub to validate the UI/UX and data flow.

export async function POST(request: NextRequest) {
  let body: CalculatorInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: t.api.invalidRequest },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body.citizenship !== "string" ||
    typeof body.taxResidenceCountry !== "string" ||
    typeof body.daysAtSea !== "number" ||
    Number.isNaN(body.daysAtSea) ||
    body.daysAtSea < 0 ||
    body.daysAtSea > 366
  ) {
    return NextResponse.json(
      { error: t.api.validationError },
      { status: 400 }
    );
  }

  // TODO: real logic to pick the checklist and savings estimate belongs here,
  // based on body.citizenship, body.taxResidenceCountry, body.daysAtSea, body.vesselFlag.
  const result: CalculatorResult = {
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

  return NextResponse.json(result);
}
