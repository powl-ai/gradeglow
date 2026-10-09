import manifest from "../../../manifest";
import { HOME_SCREEN_ICONS, homeScreenIconPath, isHomeScreenIcon } from "../../../../lib/homeScreenIcons";

export const dynamicParams = false;
export const generateStaticParams = () => HOME_SCREEN_ICONS.map(icon => ({ style: icon.id }));

export async function GET(_request: Request, { params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  if (!isHomeScreenIcon(style)) return new Response("Unknown icon", { status: 404 });
  return Response.json({
    ...manifest(),
    ...(style === "anglerfish-dark" ? { theme_color: "#161b2e", background_color: "#161b2e" } : {}),
    // Same identity, scope and launch URL for every installation style.
    icons: style === "anglerfish" ? manifest().icons : [
      { src: homeScreenIconPath(style, 192), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: homeScreenIconPath(style, 512), sizes: "512x512", type: "image/png", purpose: style === "anglerfish-dark" ? "any" : "any maskable" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
