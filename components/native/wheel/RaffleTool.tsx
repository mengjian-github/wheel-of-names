"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PALETTES, fitLabel, parseNames, pct, randomInt, timeNow } from "@/lib/wheel";
import { useStoredList } from "@/lib/persist";
import { DEFAULT_PALETTE } from "@/lib/wheel";

type Winner = { order: number; name: string; odds: number; when: string };

function drawRaffleWheel(canvas: HTMLCanvasElement, names: string[], highlighted: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const box = canvas.getBoundingClientRect();
  const size = Math.max(160, Math.round(box.width || 340));
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1b2340";
  ctx.fill();
  const n = names.length;
  if (!n) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(238,241,248,.22)";
    ctx.setLineDash([7, 9]);
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i += 1) {
    const start = i * step - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + step);
    ctx.closePath();
    ctx.fillStyle = i === highlighted ? "#f9a3c0" : PALETTES[0].fills[i % 4];
    ctx.fill();
    ctx.strokeStyle = "#1a2039";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (n <= 30) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + step / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = i === highlighted ? "#141a2e" : "#eef1f8";
      ctx.font = `600 ${n > 14 ? 11 : 15}px "Albert Sans", system-ui, sans-serif`;
      ctx.fillText(fitLabel(names[i], n > 14 ? 10 : 14), r - 12, 0);
      ctx.restore();
    }
  }
}

export default function RaffleTool() {
  const [text, setText] = useStoredList("won.raffle.v1");
  const [winnersWanted, setWinnersWanted] = useState(1);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");
  const [prompted, setPrompted] = useState(false);
  const [claimed, setClaimed] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  const entries = useMemo(() => parseNames(text).flatMap((e) => Array.from({ length: e.count }, () => e.name)), [text]);
  const state = drawing ? "working" : error ? "error" : "success";
  const resultState = drawing ? "working" : winners.length ? "done" : "idle";

  useEffect(() => {
    canvasRef.current && drawRaffleWheel(canvasRef.current, entries, -1);
  }, [entries]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawRaffleWheel(canvas, entries, -1);
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [entries]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const draw = () => {
    if (drawing) return;
    if (entries.length < 2) {
      setError("");
      setPrompted(true);
      areaRef.current?.focus();
      return;
    }
    if (winnersWanted < 1) {
      setError("Draw at least one winner.");
      return;
    }
    if (winnersWanted > entries.length) {
      setError(`Winners cannot be longer than the list: ${entries.length} entries, ${winnersWanted} winners asked.`);
      return;
    }
    setError("");
    setWinners([]);
    setClaimed([]);
    setDrawing(true);
    const pool = entries.slice();
    const picked: Winner[] = [];
    let index = 0;
    const tick = () => {
      if (index >= winnersWanted || !pool.length) {
        setDrawing(false);
        return;
      }
      const pick = randomInt(pool.length);
      const name = pool.splice(pick, 1)[0];
      picked.push({ order: picked.length + 1, name, odds: 1 / entries.length, when: timeNow() });
      setWinners(picked.slice());
      if (canvasRef.current) drawRaffleWheel(canvasRef.current, pool, -1);
      index += 1;
      timer.current = setTimeout(tick, 520);
    };
    tick();
  };

  const clear = () => {
    setWinners([]);
    setError("");
  };

  const copy = async () => {
    if (!winners.length) return;
    const body = winners.map((w) => `${w.order}. ${w.name} — ${w.when}`).join("\n");
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const removedNote = claimed.length ? `${claimed.length} removed from the pool` : "";

  return (
    <div className="wn-tool" data-capability="raffle-draw" data-operation="draw" data-state={state}>
      <div className="wn-bench wn-bench-raffle" data-tool-output data-state={state}>
        <section className="wn-panel wn-editor-col">
          <div className="wn-panel-head">
            <h2 className="wn-label">Raffle entries</h2>
            <span className="wn-count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
          </div>
          <textarea
            className="wn-input"
            data-tool-input="entries"
            placeholder="One entry per line — ticket numbers or names"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            aria-label="Entries, one per line"
            ref={areaRef}
          />
          <div className="wn-editor-actions">
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => setText(["004", "017", "026", "031", "048"].join("\n"))}>
              Try a sample
            </button>
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => { setText(""); clear(); }}>
              Clear
            </button>
          </div>
          <div className="wn-raffle-controls" style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label className="wn-label" htmlFor="wn-winners">
              How many winners
            </label>
            <input
              id="wn-winners"
              type="number"
              className="wn-number"
              data-tool-input="winners"
              min={1}
              max={50}
              value={winnersWanted}
              onChange={(event) => setWinnersWanted(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
            />
            <button
              type="button"
              className="wn-btn wn-btn-primary wn-spin-btn"
              style={{ marginTop: 4 }}
              data-primary
              data-jtbd-action="run"
              onClick={draw}
              disabled={drawing}
              data-ready={entries.length < 2 ? "false" : "true"}
            >
              {drawing ? "Drawing…" : entries.length < 2 ? "Add entries to draw" : `Draw ${winnersWanted} ${winnersWanted === 1 ? "winner" : "winners"}`}
            </button>
          </div>
          {error ? <p role="alert" className="wn-error-line">{error}</p> : null}
          {!error && entries.length < 2 ? (
            <p role="status" className="wn-refuse">
              {prompted
                ? "Paste the entries you want to draw — at least two of them."
                : "Add at least two entries, one per line, then draw."}
            </p>
          ) : null}
          <p className="wn-hint">Winners are drawn one at a time without replacement, so nobody wins twice in one raffle.</p>
        </section>

        <div className="wn-wheel-col">
          <div className="wn-stage">
            <div className="wn-wheel-wrap" style={{ maxWidth: 320 }}>
              <div className="wn-pointer" aria-hidden="true" />
              <canvas ref={canvasRef} className="wn-wheel-canvas" aria-hidden="true" width={340} height={340} />
            </div>
            <div className="wn-progress-line" style={{ width: "100%", marginTop: 8 }}>
              <strong>{drawing
                ? "Drawing winners…"
                : error
                  ? "Could not draw"
                  : entries.length < 2
                    ? "Add entries to draw"
                    : winners.length
                      ? `${winners.length} drawn`
                      : "Ready"}</strong>
              <span>{entries.length - winners.length} left in the pool</span>
            </div>
          </div>
        </div>

        <div className="wn-slip-col" style={{ minWidth: 0 }}>
          <div className="wn-panel" style={{ width: "100%" }}>
            <div className="wn-panel-head">
              <h2 className="wn-label">Winners in order</h2>
              <span className="wn-count" data-draw-count>{winners.length} {winners.length === 1 ? "winner" : "winners"}</span>
            </div>
            <div data-results data-state={resultState}>
              {winners.length ? (
                <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                  {winners.map((winner, index) => (
                    <li
                      key={`${winner.order}-${winner.name}`}
                      data-draw-row
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px minmax(0,1fr) 62px 56px",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 6px",
                        borderRadius: 6,
                        background: index === 0 ? "rgba(249,163,192,.14)" : "rgba(238,241,248,.04)",
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: "#93a0c6", fontVariantNumeric: "tabular-nums" }}>{winner.order}</span>
                      <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{winner.name}</span>
                      <span data-draw-time style={{ fontSize: 12.5, color: "#93a0c6", fontVariantNumeric: "tabular-nums" }}>{winner.when}</span>
                      <button
                        type="button"
                        className="wn-btn wn-btn-ghost wn-btn-sm"
                        style={{ minHeight: 30, padding: "0 8px" }}
                        onClick={() => { setClaimed((prev) => [...prev, winner.name]); }}
                        aria-label={`Mark ${winner.name} as claimed`}
                      >
                        Claim
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="wn-draws-empty">The draw list appears here — first winner first, with the time each was drawn.</p>
              )}
            </div>
            <p className="wn-hint" data-draw-summary>
              {winners.length ? `${winners.length} of ${entries.length} entries drawn` : "No draw yet"}
            </p>
            {removedNote ? <p className="wn-hint">{removedNote}</p> : null}
            {winners.length ? (
              <div className="wn-editor-actions">
                <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => void copy()}>Copy winners</button>
                <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={clear}>Clear</button>
              </div>
            ) : null}
          </div>
          <a className="wn-plus" href="/api/pay/checkout?plan=plus" data-shipsite-checkout data-product="plus">
            Save the draw record · Plus
          </a>
        </div>
      </div>
    </div>
  );
}
