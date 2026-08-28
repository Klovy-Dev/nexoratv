import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RevealInit from "@/components/RevealInit";

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
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <RevealInit />
      </body>
    </html>
  );
}
