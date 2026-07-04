import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GradeGlow – Noten & ECTS Tracker",
    short_name: "GradeGlow",
    description:
      "Tracke Module, ECTS, Noten, Einzelleistungen, Prüfungen, Zielnoten und deinen Bachelor-Fortschritt.",
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    orientation: "portrait",
    background_color: "#fbf7ff",
    theme_color: "#7c3aed",
    categories: ["education", "productivity", "utilities"],
    prefer_related_applications: false,
    lang: "de-DE",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard öffnen",
        short_name: "Dashboard",
        description: "GradeGlow Dashboard öffnen",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Plan öffnen",
        short_name: "Plan",
        description: "Prüfungen und Lernplan öffnen",
        url: "/exams",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Timer starten",
        short_name: "Timer",
        description: "Fokus-Timer öffnen",
        url: "/timer",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Feedback geben",
        short_name: "Feedback",
        description: "Bug, Wunsch oder Beta-Feedback senden",
        url: "/feedback",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
