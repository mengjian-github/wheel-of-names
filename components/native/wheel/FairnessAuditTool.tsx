"use client";

import { useState } from "react";
import { parseNames, pct, randomInt } from "@/lib/wheel";
import { useStoredList } from "@/lib/persist";

type Row = { name: string; count: number; share: number };

export default function FairnessAuditTool() {
  const [text, setText] = useStoredList("won.fairness.v1");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [runs, setRuns] = useState(10000);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const entryCount = parseNames(text).length;
  const state = busy ? "working" : error || entryCount < 2 ? "error" : "success";

  const audit = () => {
    const entries = parseNames(text);
    if (!entries.length) {
      setRows(null);
      setError("Paste the list you want to test — one name per line.");
      return;
    }
    setError("");
    setBusy(true);
    // one tick so the running state paints before the loop takes over
    setTimeout(() => {
      const pool = entries.flatMap((entry) => Array.from({ length: entry.count }, () => entry.name));
      const counts = new Map<string, number>();
      for (let i = 0; i < runs; i += 1) {
        const name = pool[randomInt(pool.length)];
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      const expected = 1 / entries.length;
      setRows(
        entries.map((entry) => ({
          name: entry.name,
          count: counts.get(entry.name) ?? 0,
          share: (counts.get(entry.name) ?? 0) / runs,
        })),
      );
      setBusy(false);
    }, 40);
  };

  const expected = rows && rows.length ? 1 / rows.length : 0;
  const maxDeviation = rows && rows.length
    ? rows.reduce((best, row) => (Math.abs(row.share - expected) > Math.abs(best.share - expected) ? row : best), rows[0])
    : null;

  return (
    <div className="wn-tool" data-capability="fairness-audit" data-operation="audit" data-state={state}>
      <div className="wn-bench wn-bench-audit" data-tool-output data-state={state}>
        <section className="wn-panel">
          <div className="wn-panel-head">
            <h2 className="wn-label">List to test</h2>
            <span className="wn-count">{parseNames(text).length} names</span>
          </div>
          <textarea
            className="wn-input"
            data-tool-input="entries"
            placeholder="One name per line"
            value={text}
            onChange={(event) => { setText(event.target.value); if (error) setError(""); }}
            spellCheck={false}
            aria-label="Names to test, one per line"
          />
          <div className="wn-editor-actions">
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => setText(["Ada", "Bo", "Chen", "Dara"].join("\n"))}>
              Try a sample
            </button>
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => { setText(""); setRows(null); setError(""); }}>
              Clear
            </button>
          </div>
          <fieldset className="wn-fieldset" style={{ marginTop: 12 }}>
            <legend>Draws to run</legend>
            <div className="wn-seg">
              {[1000, 10000].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="wn-runs"
                    value={value}
                    checked={runs === value}
                    onChange={() => setRuns(value)}
                  />
                  <span>{value.toLocaleString("en-US")}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="wn-btn wn-btn-primary wn-spin-btn"
            data-primary
            data-jtbd-action="run"
            onClick={audit}
            disabled={busy}
            data-ready={busy || parseNames(text).length === 0 ? "false" : "true"}
          >
            {busy ? "Drawing…" : `Run ${runs.toLocaleString("en-US")} draws`}
          </button>
          {error ? (
            <p role="alert" style={{ color: "#ffd0e0", fontSize: 13.5, marginTop: 10 }}>{error}</p>
          ) : parseNames(text).length === 0 ? (
            <p role="status" className="wn-refuse">
              Paste the list you want to test — one name per line.
            </p>
          ) : null}
        </section>

        <div className="wn-wheel-col" style={{ gridColumn: "span 2" }}>
          <div className="wn-panel" style={{ width: "100%" }} data-audit data-state={rows ? "done" : busy ? "working" : "idle"}>
            <div className="wn-panel-head">
              <h2 className="wn-label">Observed share against the 1-in-N expectation</h2>
              <span className="wn-count">{rows ? `${runs.toLocaleString("en-US")} draws` : "No run yet"}</span>
            </div>
            {rows ? (
              <>
                <div data-audit-summary className="wn-audit-summary" style={{ marginBottom: 12 }}>
                  <strong style={{ fontFamily: "var(--wn-display)", fontSize: 26, fontWeight: 400, display: "block" }}>
                    {maxDeviation ? `Largest gap ${Math.abs(maxDeviation.share - expected) * 100 < 0.01 ? "<0.01" : (Math.abs(maxDeviation.share - expected) * 100).toFixed(2)} points` : "—"}
                  </strong>
                  <span style={{ color: "#93a0c6", fontSize: 13.5 }}>
                    {rows.length} names · expected {pct(expected)} each ({Math.round(runs / rows.length).toLocaleString("en-US")} of {runs.toLocaleString("en-US")} draws)
                  </span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {rows.map((row) => {
                    const width = Math.max(0, Math.min(100, (row.share / Math.max(expected * 2, 0.0001)) * 50));
                    return (
                      <div
                        key={row.name}
                        data-audit-row
                        style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) 62px 74px 74px 74px", gap: 10, alignItems: "center", padding: "6px 4px" }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{row.name}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: "#c6cfe6", fontSize: 13.5 }}>{row.count.toLocaleString("en-US")}</span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pct(row.share)}</span>
                        <span style={{ color: "#93a0c6", fontSize: 13.5, fontVariantNumeric: "tabular-nums" }}>{pct(expected)}</span>
                        <span style={{ position: "relative", height: 8, background: "rgba(238,241,248,.1)", borderRadius: 4, overflow: "hidden" }}>
                          <span
                            aria-hidden="true"
                            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${width}%`, background: "#f9a3c0", borderRadius: 4 }}
                          />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="wn-hint" style={{ marginTop: 10 }}>
                  Draws, observed count, observed share, expected share and the bar scaled to twice the expected share.
                </p>
              </>
            ) : (
              <p className="wn-draws-empty">
                Run the audit and each name’s observed share appears here beside the {runs.toLocaleString("en-US")}-draw
                expectation. Nothing is stored or sent.
              </p>
            )}
          </div>
          <details className="wn-options" data-devtools>
            <summary>Check it yourself in DevTools</summary>
            <div className="wn-devtools-body">
              <ol>
                <li>Open this page’s developer tools (F12, or ⌥⌘I on a Mac) and choose the Console tab.</li>
                <li>Paste this with six names in the list, press Enter: it draws 10,000 winners the way this wheel does, dropping the tail of the random range so no name gets a second chance.</li>
              </ol>
              <pre className="wn-code"><code>{`const n = ["Ada","Bo","Chen","Dara","Eve","Finn"], c = n.map(() => 0);
for (let i = 0; i < 10000; i++) {
  const b = new Uint32Array(1); let v;
  do { crypto.getRandomValues(b); v = b[0]; }
  while (v >= 4294967296 - (4294967296 % n.length));
  c[v % n.length]++;
}
console.table(n.map((name, i) => ({ name, draws: c[i] })));`}</code></pre>
              <p className="wn-hint">
                Each count lands near 1,667 of 10,000 — the same 1-in-6 promise this page reports, on your
                own machine.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
