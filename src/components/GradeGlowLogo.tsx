import type { HTMLAttributes } from "react";

type LogoSize = "sm" | "md" | "lg";
type LogoTone = "light" | "dark" | "glass";

type GradeGlowLogoProps = HTMLAttributes<HTMLDivElement> & {
  size?: LogoSize;
  tone?: LogoTone;
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
  className = "",
  ...props
}: GradeGlowLogoProps) {
  return (
    <div
      aria-label="GradeGlow Logo"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-black tracking-[-0.14em] ring-1 ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(240,171,252,0.95),transparent_32%),linear-gradient(135deg,rgba(124,58,237,0.18),rgba(236,72,153,0.18))]" />
      <span className="relative translate-x-[-0.04em]">G</span>
      <span className="relative translate-x-[-0.12em]">G</span>
      <span className="absolute right-[18%] top-[18%] text-[0.52em] leading-none text-fuchsia-300 drop-shadow-sm">
        ✦
      </span>
    </div>
  );
}
