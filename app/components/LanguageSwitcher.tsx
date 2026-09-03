"use client";

import { locales, LOCALE_LABELS, type Locale } from "@/app/lib/i18n";
import { useLocale } from "@/app/lib/LocaleContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <select
      className="language-switcher"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
    >
      {locales.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
