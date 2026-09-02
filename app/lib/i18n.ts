import en from "@/messages/en.json";

// Active locales. Add a code here once its messages/<code>.json file exists
// and is registered below — e.g. "tl" for Filipino, "uk" for Ukrainian.
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = typeof en;

const messagesByLocale: Record<Locale, Messages> = {
  en,
};

// To add a language later:
//   1. Create messages/<code>.json with the exact same keys as messages/en.json.
//   2. import <code> from "@/messages/<code>.json";
//   3. Add the code to `locales` above and to `messagesByLocale` below.
// No component changes are needed — they all read text via getMessages().
export function getMessages(locale: Locale = defaultLocale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}
