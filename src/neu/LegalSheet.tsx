"use client";

import { useState } from "react";
import { LEGAL_DOCS, LEGAL_UPDATED, legalDoc, type LegalId } from "./legal";

/** The text of one legal document, in the new app's style. */
export function LegalBody({ id }: { id: LegalId }) {
  const doc = legalDoc(id);
  return (
    <div className="gn-stack gn-legal">
      {doc.blocks.map((block) => (
        <section key={block.title} className="gn-card">
          <h2 className="gn-h3">{block.title}</h2>
          {block.items && <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          {block.text && <p>{block.text}</p>}
        </section>
      ))}
      <p className="gn-muted gn-note" style={{ textAlign: "center" }}>Stand: {LEGAL_UPDATED}</p>
    </div>
  );
}

/** In-app sheet, so reading the legal pages adds no browser history to swipe back into. */
export default function LegalSheet({ initial, onClose }: { initial: LegalId; onClose: () => void }) {
  const [id, setId] = useState<LegalId>(initial);
  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label="Rechtliches">
      <header className="gn-sheet-head">
        <span />
        <strong>Rechtliches</strong>
        <button type="button" className="gn-link" onClick={onClose}>Fertig</button>
      </header>
      <div className="gn-sheet-body">
        <div className="gn-seg" style={{ marginBottom: 16, background: "var(--soft)" }}>
          {LEGAL_DOCS.map((doc) => (
            <button key={doc.id} type="button" aria-pressed={doc.id === id} onClick={() => setId(doc.id)}>{doc.id === "terms" ? "Bedingungen" : doc.title}</button>
          ))}
        </div>
        <LegalBody id={id} />
      </div>
    </div>
  );
}
