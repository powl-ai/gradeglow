import { Figtree } from "next/font/google";
import NeuApp from "../neu/NeuApp";

// The new GradeGlow. The old app stays reachable under /alt until everything has moved over.
const figtree = Figtree({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], variable: "--gn-font", display: "swap" });

export default function Home() {
  return <NeuApp fontClass={figtree.variable} />;
}
