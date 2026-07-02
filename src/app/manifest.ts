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
        name: "Profil bearbeiten",
        short_name: "Profil",
        description: "Studiengang, Name und Ziel-ECTS bearbeiten",
        url: "/settings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "GradeGlow Plus",
        short_name: "Plus",
        description: "Free-, Beta- und Premium-Grenzen ansehen",
        url: "/premium",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Beta Launch Center",
        short_name: "Launch",
        description: "Beta-Reife, Testplan und Release-Blocker prüfen",
        url: "/launch",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
