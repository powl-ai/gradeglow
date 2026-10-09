import Image from "next/image";

export type MascotMood = "neutral" | "happy" | "sleepy" | "panic" | "celebrate";

const images: Record<MascotMood, string> = {
  neutral: "/mascots/anglerfish-focused.png",
  happy: "/mascots/anglerfish-happy.png",
  sleepy: "/mascots/anglerfish-sleepy.png",
  panic: "/mascots/anglerfish-panic.png",
  celebrate: "/mascots/anglerfish-celebrate.png",
};

export default function Mascot({ mood = "neutral", className = "" }: { mood?: MascotMood; className?: string }) {
  return <Image src={images[mood]} width={1024} height={1024} unoptimized
    className={`gg-glow-mascot ${className}`.trim()} data-mood={mood}
    alt="Dein Anglerfisch-Lernbegleiter" />;
}
