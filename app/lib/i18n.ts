import en from "@/messages/en.json";
import tl from "@/messages/tl.json";
import uk from "@/messages/uk.json";
import hi from "@/messages/hi.json";
import pl from "@/messages/pl.json";

// Active locales. To add a language later:
//   1. Create messages/<code>.json — it only needs the keys you've actually
//      translated so far; anything missing falls back to English automatically.
//   2. import <code> from "@/messages/<code>.json";
//   3. Add the code to `locales` and to `partialMessagesByLocale` below.
// No component changes are needed — they all read text via useLocale().t.
export const locales = ["en", "tl", "uk", "hi", "pl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// Human-readable names shown in the language switcher, in each language's
// own script.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tl: "Filipino",
  uk: "Українська",
  hi: "हिन्दी",
  pl: "Polski",
};

export type Messages = typeof en;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// English is the only locale required to be complete; every other locale is
// a partial override — only the keys that have actually been translated so
// far. getMessages() below fills in anything missing from English.
const partialMessagesByLocale: Record<Locale, DeepPartial<Messages>> = {
  en,
  tl,
  uk,
  hi,
  pl,
};

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: DeepPartial<T> | undefined
): T {
  if (!override) return base;

  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const overrideValue = (override as Record<string, unknown>)[key];
    const baseValue = base[key];

    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      baseValue &&
      typeof baseValue === "object"
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as DeepPartial<Record<string, unknown>>
      );
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }
  return result as T;
}

// Returns the full message set for a locale, with any key missing from that
// locale's file filled in from English.
export function getMessages(locale: Locale = defaultLocale): Messages {
  return deepMerge(en, partialMessagesByLocale[locale]);
}
