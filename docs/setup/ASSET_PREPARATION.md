# Anglerfisch-Assets – Aufbereitung

Ausführung: built-in Imagegen für Bildbearbeitung; mechanische PNG-/ICO-Größenkonvertierung mit der vorhandenen Next.js-Abhängigkeit sharp. Keine neuen Projekt-Dependencies.

| Originaldatei | Verwendung | Projektdatei |
| --- | --- | --- |
| C62EAF0E-C3A2-44C9-A243-E9059418C963.jpeg | Happy | public/mascots/anglerfish-happy.png |
| 3DCAC050-4622-4428-BC4C-42D345D51BFE.jpeg | Proud | public/mascots/anglerfish-proud.png |
| 5CAE6061-7E13-42D9-AAE5-9D7F239EE8B8.jpeg | Focused / neutral | public/mascots/anglerfish-focused.png |
| 58BA0304-B05C-4D30-A12B-B91CCCB36B96.jpeg | Sleepy | public/mascots/anglerfish-sleepy.png |
| 1FDD8308-4E44-402A-B47B-61E3AA4F5565.jpeg | Panic | public/mascots/anglerfish-panic.png |
| 7811818B-141B-47E9-87CD-20984CED8EB8.jpeg | Celebrate | public/mascots/anglerfish-celebrate.png |
| CDCE505E-E022-41F5-B46D-6967EE6B7A90.jpeg | App-Icon | public/icons/apple-touch-icon.png, icon-192.png, icon-512.png, maskable-512.png; public/favicon.ico |

## Cutout-Prompt

Für jede Pose wurde der folgende Prompt mit dem passenden Pose-Namen verwendet:

> Use case: background-extraction. Edit target: the attached original GradeGlow anglerfish [pose] pose. Remove ONLY the white background and export with real transparent alpha. Preserve the EXACT existing fish unchanged: same silhouette, body, face, eye expression, pose, mouth, tooth count and placement, texture, fins, purple/blue colors and warm glowing yellow lure. Keep every existing decorative bubble, star, motion line, droplet, confetti or Z symbol unchanged; preserve the soft colored rim glow with translucent alpha, no white halo or white rectangle. Remove the white negative space inside the lure's arch too. Do not add, remove, redesign, repaint or reinterpret the character or its teeth. Output a square transparent PNG with the same full original composition and comfortable padding. This is a cutout of the original, not a new illustration.

## Icon-Prompt

> Use case: precise-object-edit. Edit target: the attached GradeGlow anglerfish app-icon image. Change ONLY its outer background framing: remove the black pixels outside the rounded square and extend the existing cyan-blue-lavender-pink gradient smoothly to ALL four corners of a FULL square canvas. The output must be a full-bleed, opaque square PNG app icon, without baked-in round corners, without borders, without black exterior, no transparency. Preserve the exact fish, same sly friendly half-lidded eye expression, same teeth and their count, smile, lighting, fins, lure, sparkles, all colors and position. No lettering. Do not redraw or invent a new character. Preserve the original image interior; only outpaint the missing corners.

## Maskable-Prompt

> Use case: precise-object-edit. Edit target: the attached full square GradeGlow anglerfish app icon. Create the maskable counterpart. Keep the exact same character, face, sly friendly expression, teeth and tooth count, lure, fins, sparkles, rendering and palette. Change ONLY scale/layout: reduce and center the fish AND its lure so their entire silhouette fits well INSIDE the central safe circle of diameter 76% of the square (center at 50%,50%). Add generous gradient-only padding around it; the fish should occupy roughly 55% to 60% of the canvas width and height. Extend the same cyan-blue-lavender-pink gradient seamlessly to the full canvas with no transparency, no rounded corners, no inset square, no frame, no border. No text. This is the same app icon with extra safe padding for arbitrary Android launcher masks. Avoid redesigning or repainting the fish.
