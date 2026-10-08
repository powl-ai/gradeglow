export const HOME_SCREEN_ICONS = [
  { id: "light", label: "Hell" },
  { id: "dark", label: "Dunkel" },
  { id: "rose", label: "Rosé" },
] as const;
export type HomeScreenIcon = typeof HOME_SCREEN_ICONS[number]["id"];
export const isHomeScreenIcon = (value: string): value is HomeScreenIcon => HOME_SCREEN_ICONS.some(icon => icon.id === value);
export const homeScreenIconPath = (style: HomeScreenIcon, size: 180 | 192 | 512) => `/icons/home-${style}-${size}.png`;
