import type { HTMLAttributes } from "react";
import { getAppIconVisual } from "../lib/glowRewards";
import type { AppIconId } from "../types";

type LogoSize = "sm" | "md" | "lg";
type LogoTone = "light" | "dark" | "glass";

type GradeGlowLogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: LogoSize;
  tone?: LogoTone;
  appIconId?: AppIconId | string;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "h-10 w-10 rounded-2xl text-sm",
  md: "h-12 w-12 rounded-2xl text-base",
  lg: "h-16 w-16 rounded-3xl text-xl",
};

const toneClasses: Record<LogoTone, string> = {
  light: "bg-white text-violet-950 shadow-lg shadow-fuchsia-950/20 ring-white/60",
  dark: "bg-slate-950 text-white shadow-xl shadow-violet-950/20 ring-white/10",
  glass: "bg-white/15 text-white shadow-xl shadow-violet-950/20 ring-white/15 backdrop-blur",
};

export default function GradeGlowLogo({
  size = "md",
  tone = "light",
  appIconId = "default",
  className = "",
  ...props
}: GradeGlowLogoProps) {
  const iconVisual = getAppIconVisual(appIconId);
  const usesDefaultIcon = iconVisual.id === "default";

  return (
    <div
      aria-label={`${iconVisual.label} GradeGlow Logo`}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-black tracking-[-0.14em] ring-1 ${sizeClasses[size]} ${usesDefaultIcon ? toneClasses[tone] : iconVisual.shellClassName} ${className}`}
      {...props}
    >
      <div className={`absolute inset-0 ${iconVisual.glowClassName}`} />
      <span className={`relative translate-x-[-0.04em] ${usesDefaultIcon ? "" : iconVisual.glyphClassName}`}>G</span>
      <span className={`relative translate-x-[-0.12em] ${usesDefaultIcon ? "" : iconVisual.glyphClassName}`}>G</span>
      <span className={`absolute right-[18%] top-[18%] text-[0.52em] leading-none drop-shadow-sm ${iconVisual.sparkleClassName}`}>
        ✦
      </span>
    </div>
  );
}
