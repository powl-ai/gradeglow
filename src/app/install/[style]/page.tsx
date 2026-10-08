import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOME_SCREEN_ICONS, homeScreenIconPath, isHomeScreenIcon } from "../../../lib/homeScreenIcons";

export const dynamicParams = false;
export const generateStaticParams = () => HOME_SCREEN_ICONS.map(icon => ({ style: icon.id }));

export async function generateMetadata({ params }: { params: Promise<{ style: string }> }): Promise<Metadata> {
  const { style } = await params;
  if (!isHomeScreenIcon(style)) return {};
  return {
    title: "GradeGlow hinzufügen",
    manifest: `/install/${style}/manifest.webmanifest`,
    icons: {
      icon: [{ url: homeScreenIconPath(style, 192), sizes: "192x192", type: "image/png" }],
      apple: [{ url: homeScreenIconPath(style, 180), sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function InstallPage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  if (!isHomeScreenIcon(style)) notFound();
  const label = HOME_SCREEN_ICONS.find(icon => icon.id === style)?.label;
  return <main className="gg-install-page">
    <Link className="gg-install-back" href="/settings">‹ Zurück zu GradeGlow</Link>
    <Image src={homeScreenIconPath(style, 180)} width={96} height={96} alt={`GradeGlow App-Icon – ${label}`} unoptimized />
    <p>DEIN HOMESCREEN. DEIN GLOW.</p><h1>GradeGlow hinzufügen</h1>
    <div className="gg-install-instructions"><h2>Auf dem iPhone</h2><ol><li>Diese Seite in Safari öffnen.</li><li>Auf „Teilen“ und dann „Zum Home-Bildschirm“ tippen.</li><li>Das angezeigte Icon prüfen und „Hinzufügen“ wählen. „Als Web-App öffnen“ aktiviert lassen, falls angezeigt.</li></ol><p>Bereits installiert? Das alte Icon bleibt zunächst erhalten. Behalte es, bis du geprüft hast, dass die neue Verknüpfung dein Konto und deine Daten richtig öffnet. Lösche keine Website-Daten.</p><h2>Auf Android</h2><p>Im Browsermenü „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen. Bei einer vorhandenen Installation kann der Browser das bisherige Icon beibehalten.</p></div>
    <Link className="gg-homescreen-install" href="/">GradeGlow öffnen ↗</Link>
  </main>;
}
