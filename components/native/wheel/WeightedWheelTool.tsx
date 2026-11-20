"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PALETTE, PALETTES, WEIGHT_ERROR, parseWeighted, pct, randomWeighted, timeNow } from "@/lib/wheel";

type Row = { name: string; weight: number };

const SAMPLE = [
  "Ada, 5",
  "Bo, 3",
  "Chen, 2",
].join("\n");

function validRows(rows: Row[]): string {
  if (rows.some((row) => !Number.isInteger(row.weight) || row.weight < 1 || row.weight > 10)) return WEIGHT_ERROR;
  if (rows.length < 2) return "Add at least two entries to spin";
  return "";
}

function drawWeightedWheel(canvas: HTMLCanvasElement, rows: Row[], fills: string[], ink: string, highlight: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const box = canvas.getBoundingClientRect();
  const size = Math.max(180, Math.round(box.width || 360));
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1b2340";
  ctx.fill();
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  if (!rows.length || total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(238,241,248,.22)";
    ctx.setLineDash([7, 9]);
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  let angle = -Math.PI / 2;
  rows.forEach((row, i) => {
    const span = (row.weight / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + span);
    ctx.closePath();
    ctx.fillStyle = highlight === i ? "#f9a3c0" : fills[i % fills.length];
    ctx.fill();
    ctx.strokeStyle = "#1a2039";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + span / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = highlight === i ? "#141a2e" : ink;
    const labelSize = rows.length <= 6 ? 16 : rows.length <= 12 ? 13 : 11;
    ctx.font = `600 ${labelSize}px "Albert Sans", system-ui, sans-serif`;
    const label = `${row.name.length > 16 ? row.name.slice(0, 15) + "…" : row.name} ${pct(row.weight / total)}`;
    ctx.fillText(label, r - 12, 0);
    ctx.restore();
    angle += span;
  });
}

export default function WeightedWheelTool() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ index: number; name: string; weight: number; unit: number; total: number; when: string } | null>(null);
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE.id);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotation = useRef(0);
  const raf = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? DEFAULT_PALETTE;
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  const state = spinning ? "spinning" : error ? "error" : winner ? "winner" : "ready";

  const syncFromText = useCallback((value: string) => {
    setText(value);
    const parsed = parseWeighted(value);
    setRows(parsed.entries);
    setError(parsed.ok ? "" : parsed.error);
    setWinner(null);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawWeightedWheel(canvas, rows, palette.fills, palette.ink, winner?.index ?? -1);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [rows, palette, winner]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const setWeight = (index: number, weight: number) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, weight } : row)));
    setWinner(null);
    setError(validRows(rows.map((row, i) => (i === index ? { ...row, weight } : row))));
  };

  const spin = () => {
    if (spinning) return;
    const problem = validRows(rows);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const index = randomWeighted(rows.map((row) => row.weight));
    const chosen = rows[index];
    const step = (chosen.weight / total) * 360;
    let before = 0;
    for (let i = 0; i < index; i += 1) before += (rows[i].weight / total) * 360;
    const center = before + step / 2;
    const jitter = (Math.random() - 0.5) * step * 0.5;
    const current = rotation.current;
    const currentMod = ((current % 360) + 360) % 360;
    let delta = ((360 - center - jitter) % 360 + 360) % 360 - currentMod;
    if (delta < 0) delta += 360;
    const target = current + 5 * 360 + delta;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 240 : 4200;
    const start = performance.now();
    setSpinning(true);
    setWinner(null);
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const angle = current + (target - current) * eased;
      rotation.current = angle;
      if (canvasRef.current) canvasRef.current.style.transform = `rotate(${angle}deg)`;
      if (t < 1) raf.current = requestAnimationFrame(frame);
      else {
        rotation.current = target % 360;
        setSpinning(false);
        setWinner({ index, name: chosen.name, weight: chosen.weight, unit: randomIntUnit(chosen.weight), total, when: timeNow() });
      }
    };
    raf.current = requestAnimationFrame(frame);
  };

  function randomIntUnit(weight: number): number {
    // the winning unit inside the chosen entry, for an honest "x of 10" line
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] % weight) + 1;
  }

  const winnerShare = winner ? winner.weight / winner.total : 0;

  return (
    <div className="wn-tool" data-capability="weighted-picker-wheel" data-operation="spin">
      <div className="wn-bench wn-bench-weighted" data-tool-output data-state={state}>
        <section className="wn-panel">
          <div className="wn-panel-head">
            <h2 className="wn-label">Entries and weights</h2>
            <span className="wn-count">{rows.length} {rows.length === 1 ? "entry" : "entries"}</span>
          </div>
          <textarea
            ref={inputRef}
            className="wn-input"
            data-tool-input="entries"
            placeholder={"One entry per line, weight 1–10\nAda, 5\nBo, 3\nChen, 2"}
            value={text}
            onChange={(event) => syncFromText(event.target.value)}
            spellCheck={false}
          />
          <div className="wn-editor-actions">
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => syncFromText(SAMPLE)}>
              Try a sample
            </button>
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => syncFromText("")}>
              Clear
            </button>
          </div>
          <p className="wn-hint">
            A line without a number counts as weight 1. Weights are whole numbers from 1 to 10; a weight of 5 is five
            tickets in the drum.
          </p>
          {error ? (
            <p role="alert" className="wn-error" style={{ color: "#ffd0e0", fontSize: 13.5, marginTop: 8 }}>{error}</p>
          ) : null}
        </section>

        <div className="wn-wheel-col">
          <div className="wn-stage">
            <div className="wn-wheel-wrap">
              <div className="wn-pointer" aria-hidden="true" />
              <canvas ref={canvasRef} className="wn-wheel-canvas" aria-hidden="true" width={400} height={400} />
              <button
                type="button"
                className="wn-hub"
                onClick={spin}
                disabled={spinning}
                aria-label={spinning ? "Spinning" : "Spin the weighted wheel"}
              >
                {spinning ? "…" : "Spin"}
              </button>
            </div>
            <div className="wn-progress-line" style={{ width: "100%", marginTop: 8 }}>
              <strong>{spinning ? "Spinning…" : winner ? "Winner drawn" : "Ready"}</strong>
              <span>{total} weight units</span>
            </div>
            <button
              type="button"
              className="wn-btn wn-btn-primary wn-spin-btn"
              data-primary
              data-jtbd-action="run"
              data-tool-action="spin"
              onClick={spin}
              disabled={spinning || rows.length < 2}
            >
              {spinning ? "Spinning…" : rows.length < 2 ? "Add 2+ entries to spin" : "Spin the weighted wheel"}
            </button>
          </div>
        </div>

        <div className="wn-slip-col">
          <div className="wn-slip">
            <div>
              <div className="wn-slip-top">
                <span>Winner slip</span>
                <span>{winner ? winner.when : "—"}</span>
              </div>
              {winner ? (
                <>
                  <div className="wn-slip-name" data-winner>{winner.name}</div>
                  <div className="wn-slip-facts">
                    <span><strong>{pct(winnerShare)}</strong> chance before the spin</span>
                    <span>{winner.unit} of {winner.weight} units of this entry</span>
                    <span>{winner.weight} of {winner.total} units on the wheel</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="wn-slip-name is-empty">Your winner lands here</div>
                  <div className="wn-slip-slot" aria-hidden="true">
                    <div className="wn-slot-line" />
                    <div className="wn-slot-line short" />
                  </div>
                </>
              )}
            </div>
            {winner ? (
              <div className="wn-slip-actions">
                <button type="button" className="wn-btn" onClick={spin}>Spin again</button>
                <button
                  type="button"
                  className="wn-btn wn-btn-ghost"
                  onClick={() => {
                    setRows((prev) => prev.filter((_, i) => i !== winner.index));
                    setText((prev) => prev.split(/\r?\n/).filter((_, i) => i !== winner.index).join("\n"));
                    setWinner(null);
                  }}
                >
                  Remove this entry
                </button>
              </div>
            ) : (
              <p className="wn-slip-note">Every slice is as wide as its weight, so the picture is the odds.</p>
            )}
          </div>
        </div>
      </div>

      <section className="wn-draws" aria-labelledby="wn-odds-title">
        <div className="wn-draws-head">
          <h2 id="wn-odds-title">Chance for each entry</h2>
          <fieldset className="wn-fieldset" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <legend className="wn-label" style={{ marginBottom: 0 }}>Palette</legend>
            <div className="wn-swatches">
              {PALETTES.map((item) => (
                <label className="wn-swatch" key={item.id} title={item.name}>
                  <input
                    type="radio"
                    name="wn-weighted-palette"
                    value={item.id}
                    checked={paletteId === item.id}
                    onChange={() => setPaletteId(item.id)}
                    aria-label={item.name}
                  />
                  <span style={{ background: `conic-gradient(${item.fills[0]} 0 25%, ${item.fills[1]} 25% 50%, ${item.fills[2]} 50% 75%, ${item.fills[3]} 75% 100%)` }} />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {rows.length ? (
          <ul className="wn-odds-list" style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {rows.map((row, i) => (
              <li
                key={`${row.name}-${i}`}
                data-entry
                style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 96px 84px", gap: 12, alignItems: "center", padding: "8px 4px", borderRadius: 6, background: i % 2 ? "rgba(238,241,248,.04)" : "transparent" }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{row.name}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#93a0c6" }}>
                  <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Weight for {row.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={row.weight}
                    onChange={(event) => setWeight(i, Number(event.target.value))}
                    className="wn-weight-input"
                    style={{ width: 64, minHeight: 40, background: "#1b2340", color: "#eef1f8", border: "1px solid rgba(238,241,248,.14)", borderRadius: 8, padding: "6px 8px", font: "inherit", fontSize: 14 }}
                  />
                </label>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#c6cfe6" }}>{total ? pct(row.weight / total) : "—"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wn-draws-empty">Paste one entry per line and its weight will show here as a percentage.</p>
        )}
      </section>

      <div className="wn-toolbar">
        <a className="wn-plus" href="/pricing/" data-shipsite-checkout data-product="plus">
          Save weights &amp; export · Plus
        </a>
      </div>
    </div>
  );
}
