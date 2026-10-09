import Image from "next/image";

export type MascotMood = "neutral" | "happy" | "sleepy" | "panic" | "celebrate";

const images: Record<MascotMood, string> = {
  neutral: "/mascots/anglerfish-focused.webp?v=60",
  happy: "/mascots/anglerfish-happy.webp?v=60",
  sleepy: "/mascots/anglerfish-sleepy.webp?v=60",
  panic: "/mascots/anglerfish-panic.webp?v=60",
  celebrate: "/mascots/anglerfish-celebrate.webp?v=60",
};

export default function Mascot({ mood = "neutral", className = "" }: { mood?: MascotMood; className?: string }) {
  return <Image src={images[mood]} width={384} height={384} unoptimized loading="eager" fetchPriority="high"
    className={`gg-glow-mascot ${className}`.trim()} data-mood={mood}
    alt="Dein Anglerfisch-Lernbegleiter" />;
}
