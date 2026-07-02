export type MonetizationPlacement = "home-free-card" | "premium-explainer" | "post-session";

export type MonetizationSlot = {
  id: MonetizationPlacement;
  label: string;
  allowed: boolean;
  reason: string;
};

export const monetizationSlots: MonetizationSlot[] = [
  {
    id: "home-free-card",
    label: "ruhige Sponsor Card im Free-Bereich",
    allowed: true,
    reason: "Kann klar als Werbung markiert werden und liegt nicht direkt in einer Lernsitzung.",
  },
  {
    id: "premium-explainer",
    label: "Plus-Vorteile statt Werbung",
    allowed: true,
    reason: "Beste erste Monetarisierung für eine Lern-App, weil sie Fokus nicht stört.",
  },
  {
    id: "post-session",
    label: "nach abgeschlossener Session",
    allowed: false,
    reason: "Erst später prüfen. Keine Ads während Timer, Fokus oder direkt neben kritischen Buttons.",
  },
];
