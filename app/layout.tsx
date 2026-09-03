import type { Metadata, Viewport } from "next";
import { defaultLocale, getMessages } from "@/app/lib/i18n";
import { LocaleProvider } from "@/app/lib/LocaleContext";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import "./globals.css";

const t = getMessages();

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale}>
      <body>
        <LocaleProvider>
          <div className="site-header">
            <LanguageSwitcher />
          </div>
          <div className="page">{children}</div>
        </LocaleProvider>
      </body>
    </html>
  );
}
