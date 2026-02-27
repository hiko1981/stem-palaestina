import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { rtlLocales, type Locale } from "@/i18n/config";
import TopBar from "@/components/layout/TopBar";
import AppShell from "@/components/layout/AppShell";
import LangMissLogger from "@/components/features/LangMissLogger";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className="flex min-h-screen flex-col antialiased">
        <NextIntlClientProvider messages={messages}>
          <TopBar />
          <AppShell>{children}</AppShell>
          <LangMissLogger />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
