import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import NeuApp from "../../neu/NeuApp";

// The new GradeGlow runs here in parallel to the old app until it replaces it.
const figtree = Figtree({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], variable: "--gn-font", display: "swap" });

export const metadata: Metadata = { title: "GradeGlow Neu" };

export default function NeuPage() {
  return <NeuApp fontClass={figtree.variable} />;
}
