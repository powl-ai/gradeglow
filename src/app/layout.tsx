import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaRegister from "../components/PwaRegister";
import AdSenseScript from "../components/AdSenseScript";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gradeglow.app"),
  title: {
    default: "GradeGlow",
    template: "%s · GradeGlow",
  },
  description: "Tracke Module, ECTS, Noten, Zielnoten, Prüfungen und deinen Bachelor-Fortschritt.",
  applicationName: "GradeGlow",
  manifest: "/manifest.webmanifest",
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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <AdSenseScript />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
