import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GradeGlowAppHost from "../components/GradeGlowAppHost";
import { APPEARANCE_BOOTSTRAP_SCRIPT } from "../lib/appearance";
import PwaRegister from "../components/PwaRegister";
import AdSenseScript from "../components/AdSenseScript";
import "./globals.css";
import "./mobile-ui.css";
import "./homescreen-icons.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gradeglow.app"),
  title: {
    default: "GradeGlow",
    template: "%s · GradeGlow",
  },
  description: "Tracke Module, ECTS, Noten, Zielnoten, Prüfungen und deinen Bachelor-Fortschritt.",
  applicationName: "GradeGlow",
  manifest: "/manifest.webmanifest?v=2",
  appleWebApp: {
    capable: true,
    title: "GradeGlow",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any", type: "image/x-icon" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=2"],
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#161b2e" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP_SCRIPT }} /></head>
      <body className="h-full flex flex-col">
        <PwaRegister />
        <AdSenseScript />
        <GradeGlowAppHost>{children}</GradeGlowAppHost>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
