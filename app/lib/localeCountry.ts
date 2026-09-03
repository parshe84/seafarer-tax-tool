import type { Locale } from "@/app/lib/i18n";
import type { Country } from "@/app/lib/types";

// Maps each non-English locale to the country its tax content is meant for.
// Used to suggest/default a citizenship or to localize country-specific tax
// content once it exists (see the TODO in app/api/calculate/route.ts).
// "en" has no single associated country — it's the fallback locale.
export const LOCALE_HOME_COUNTRY: Partial<Record<Locale, Country>> = {
  tl: "Philippines",
  uk: "Ukraine",
  hi: "India",
  pl: "Poland",
};

export function getHomeCountryForLocale(locale: Locale): Country | undefined {
  return LOCALE_HOME_COUNTRY[locale];
}
