import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seafarer Tax Optimizer",
  description:
    "Узнай, какие налоговые льготы тебе положены как моряку, и сколько денег ты можешь сэкономить.",
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
    <html lang="ru">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
