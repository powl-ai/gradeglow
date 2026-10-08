// Render original vector icon variants. Sharp is bundled by Next's image tooling.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../public/icons/", import.meta.url);
const palettes = {
  light: ["#fff6ff", "#dfc8f8", "#53346f", "#cb8bca"],
  dark: ["#393044", "#17141e", "#edceff", "#f2d99f"],
  rose: ["#fbe4ef", "#daaccd", "#592b50", "#a95883"],
};
for (const [name, [top, bottom, glyph, sparkle]] of Object.entries(palettes)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <circle cx="154" cy="86" r="176" fill="${glyph}" opacity=".035"/>
    <path d="M78 119Q145 61 245 69" fill="none" stroke="${glyph}" stroke-width="3" opacity=".12" stroke-linecap="round"/>
    <g fill="none" stroke="${glyph}" stroke-width="31" stroke-linecap="round" stroke-linejoin="round">
      <path d="M216 207C187 172 136 180 117 221C91 278 126 337 182 329C212 325 230 302 230 270H188"/>
      <path d="M362 207C333 172 282 180 263 221C237 278 272 337 328 329C358 325 376 302 376 270H334"/>
    </g>
    <path d="m386 109 9 21 21 9-21 9-9 21-9-21-21-9 21-9Z" fill="${sparkle}"/>
  </svg>`;
  await writeFile(new URL(`home-${name}.svg`, root), svg);
  for (const size of [180, 192, 512]) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(fileURLToPath(new URL(`home-${name}-${size}.png`, root)));
}
console.log("Generated 3 icon styles in 180, 192 and 512px; SVG sources retained.");
