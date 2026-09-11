import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SiteChrome from "@/components/SiteChrome";
import RevealInit from "@/components/RevealInit";
import RouteProgress from "@/components/RouteProgress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexoraTV — Streaming nouvelle génération",
    template: "%s — NexoraTV",
  },
  description:
    "NexoraTV : des milliers de chaînes, films et séries en direct. Une expérience de streaming moderne, fluide et sans coupure.",
  applicationName: "NexoraTV",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "NexoraTV — Streaming nouvelle génération",
    description:
      "Des milliers de chaînes, films et séries en direct sur tous vos écrans.",
    images: [{ url: "/logo-full.png", width: 480, height: 480 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NexoraTV — Streaming nouvelle génération",
    description:
      "Des milliers de chaînes, films et séries en direct sur tous vos écrans.",
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <RouteProgress />
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </SiteChrome>
        <RevealInit />
      </body>
    </html>
  );
}
