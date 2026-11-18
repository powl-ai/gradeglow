import { Figtree } from "next/font/google";
import { LegalBody } from "./LegalSheet";
import { legalDoc, type LegalId } from "./legal";
import "./neu.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--gn-font", display: "swap" });

/** Legal text as its own page, for links from outside the app (App Store, e-mails). */
export default function LegalPage({ id }: { id: LegalId }) {
  return (
    <main className={`gn gn-legal-page ${figtree.variable}`} style={{ position: "static", overflow: "visible" }}>
      <div>
        <h1>{legalDoc(id).title}</h1>
        <LegalBody id={id} />
        <p className="gn-note" style={{ textAlign: "center", marginTop: 16 }}><a className="gn-link" href="/" style={{ color: "var(--acc-ink)" }}>Zu GradeGlow</a></p>
      </div>
    </main>
  );
}
