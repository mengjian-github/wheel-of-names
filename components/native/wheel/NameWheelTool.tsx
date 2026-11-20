"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PALETTE,
  PALETTES,
  type Entry,
  type Palette,
  clock as _clock,
  labelBudget,
  parseNames,
  pct,
  randomInt,
  timeNow,
  toSlices,
  type Slice,
} from "@/lib/wheel";

const SAMPLE = ["Ava Chen", "Noah Bello", "Mia Torres", "Liam Okafor", "Zoe Park", "Ethan Rossi", "Ines Duarte", "Kai Mensah"];
const STORE = "won.options.v1";

type Options = { duration: 4 | 6 | 8; sound: boolean; volume: number; palette: string; projector: boolean };

const DEFAULT_OPTIONS: Options = { duration: 6, sound: true, volume: 55, palette: DEFAULT_PALETTE.id, projector: false };

function readOptions(): Options {
  const base = { ...DEFAULT_OPTIONS };
  try {
    const saved = localStorage.getItem(STORE);
    if (saved) Object.assign(base, JSON.parse(saved) as Partial<Options>);
    if (!localStorage.getItem(STORE + ".sound")) {
      base.sound = !window.matchMedia("(max-width: 760px)").matches;
    }
  } catch {
    base.sound = !window.matchMedia("(max-width: 760px)").matches;
  }
  return base;
}

function drawWheel(canvas: HTMLCanvasElement, slices: Slice[], palette: Palette, highlight: number) {
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
  const n = slices.length;

  // rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1b2340";
  ctx.fill();

  if (n === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(238,241,248,.22)";
    ctx.setLineDash([7, 9]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  const step = (Math.PI * 2) / n;
  const budget = labelBudget(n, r);
  for (let i = 0; i < n; i += 1) {
    const start = i * step - Math.PI / 2;
    const end = start + step;
    const isWinner = highlight === i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = isWinner ? "#f9a3c0" : palette.fills[i % palette.fills.length];
    ctx.fill();
    ctx.strokeStyle = "#1a2039";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // labels
  for (let i = 0; i < n; i += 1) {
    if (n > 64 && i % 2 === 1) continue;
    const start = i * step - Math.PI / 2;
    const mid = start + step / 2;
    const isWinner = highlight === i;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isWinner ? "#141a2e" : palette.ink;
    const size2 = Math.max(9, Math.min(budget.size, (r * step) / 1.5));
    ctx.font = `${n > 40 ? 500 : 600} ${size2}px "Albert Sans", system-ui, sans-serif`;
    // fit to the ring by measured width, so no label runs under the hub
    const room = Math.max(24, r * 0.74);
    let label = slices[i].name;
    if (ctx.measureText(label).width > room) {
      let cut = Array.from(label);
      while (cut.length > 1 && ctx.measureText(cut.join("") + "…").width > room) cut.pop();
      label = cut.length > 1 ? cut.join("").trimEnd() + "…" : Array.from(label)[0];
    }
    ctx.fillText(label, r - 10, 0);
    ctx.restore();
  }
}

function beep(ctx: AudioContext, freq: number, gainValue: number, ms: number, type: OscillatorType = "triangle") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + ms / 1000 + 0.02);
}

function encodeList(names: string[]): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(names)))).replace(/=+$/, "");
  } catch {
    return "";
  }
}

function decodeList(hash: string): string[] | null {
  const match = hash.match(/[#&]l=([^&]+)/);
  if (!match) return null;
  try {
    const padded = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    const parsed = JSON.parse(decodeURIComponent(escape(atob(pad)))) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
    return null;
  } catch {
    return null;
  }
}

function rawFromEntries(entries: Entry[]): string {
  const lines: string[] = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.count; i += 1) lines.push(entry.name);
  }
  return lines.join("\n");
}

export default function NameWheelTool({ embedded = false }: { embedded?: boolean }) {
  const [raw, setRaw] = useState("");
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [spinning, setSpinning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<{ name: string; chance: number; count: number; slice: number; no: number; when: string } | null>(null);
  const [draws, setDraws] = useState<{ no: number; name: string; chance: number; when: string }[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [toast, setToast] = useState("");
  const [undoRaw, setUndoRaw] = useState<string | null>(null);
  const [freshWinner, setFreshWinner] = useState(false);
  const [triedEmpty, setTriedEmpty] = useState(false);
  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reduced, setReduced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pending = useRef(0);
  const rotation = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settled = useRef(false);
  const drawNo = useRef(0);
  const barRef = useRef<HTMLDivElement | null>(null);
  const barTrack = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLDetailsElement | null>(null);

  const entries = useMemo(() => parseNames(raw), [raw]);
  const slices = useMemo(() => toSlices(entries), [entries]);
  const palette = PALETTES.find((p) => p.id === options.palette) ?? DEFAULT_PALETTE;
  const n = slices.length;
  const state: "error" | "success" | "working" | "winner" = spinning
    ? "working"
    : n < 2
      ? "error"
      : result
        ? freshWinner
          ? "winner"
          : "success"
        : "success";

  useEffect(() => {
    setOptions(readOptions());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener?.("change", onMq);
    const fromHash = decodeList(window.location.hash);
    if (fromHash && fromHash.length) setRaw(fromHash.join("\n"));
    else inputRef.current?.focus();
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (embedded) return;
    const fromHash = decodeList(window.location.hash);
    if (!fromHash || !fromHash.length) return;
    setRaw(fromHash.join("\n"));
  }, [embedded]);

  // draw on data change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWheel(canvas, slices, palette, highlight);
  }, [slices, palette, highlight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => drawWheel(canvas, slices, palette, highlight);
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [slices, palette, highlight]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const audioCtx = useCallback((): AudioContext | null => {
    if (!audio.current) {
      try {
        audio.current = new AudioContext();
      } catch {
        return null;
      }
    }
    if (audio.current.state === "suspended") void audio.current.resume();
    return audio.current;
  }, []);

  const finish = useCallback(
    (sliceIndex: number) => {
      if (settled.current) return;
      settled.current = true;
      if (spinTimer.current) {
        clearTimeout(spinTimer.current);
        spinTimer.current = null;
      }
      const slice = slices[sliceIndex];
      if (!slice) return;
      const chance = 1 / slices.length;
      drawNo.current += 1;
      const no = drawNo.current;
      setHighlight(sliceIndex);
      setResult({ name: slice.name, chance, count: slice.count, slice: sliceIndex, no, when: timeNow() });
      setDraws((prev) => [...prev, { no, name: slice.name, chance, when: timeNow() }]);
      setSpinning(false);
      setProgress(1);
      setLeft(0);
      setFreshWinner(true);
      if (freshTimer.current) clearTimeout(freshTimer.current);
      freshTimer.current = setTimeout(() => setFreshWinner(false), 700);
      if (options.sound) {
        const ctx = audioCtx();
        if (ctx) {
          const gain = Math.max(0.02, options.volume / 400);
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            setTimeout(() => beep(ctx, f, gain, 180, "sine"), i * 90);
          });
        }
      }
    },
    [audioCtx, draws.length, options.sound, options.volume, slices],
  );

  const land = useCallback(
    (index: number) => {
      if (spinTimer.current) {
        clearTimeout(spinTimer.current);
        spinTimer.current = null;
      }
      const step = 360 / n;
      const centre = index * step + step / 2;
      const angle = ((360 - centre) % 360 + 360) % 360;
      rotation.current = angle;
      if (canvasRef.current) canvasRef.current.style.transform = `rotate(${angle}deg)`;
      setProgress(1);
      finish(index);
    },
    [finish, n],
  );

  const spin = useCallback(() => {
    if (spinning || n < 2) return;
    const sliceIndex = randomInt(n);
    pending.current = sliceIndex;
    settled.current = false;
    setResult(null);
    setHighlight(-1);
    setFreshWinner(false);
    setSpinning(true);
    setProgress(0);
    const duration = reduced ? 260 : options.duration * 1000;
    setLeft(Math.ceil(duration / 1000));
    const ctxSound = options.sound ? audioCtx() : null;
    if (ctxSound) void ctxSound.resume();

    const step = 360 / n;
    const center = sliceIndex * step + step / 2;
    const jitter = (Math.random() - 0.5) * step * 0.55;
    const current = rotation.current;
    const targetMod = ((360 - center - jitter) % 360 + 360) % 360;
    const currentMod = ((current % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const turns = reduced ? 0 : 3 + Math.floor(options.duration / 2);
    const target = current + turns * 360 + delta;
    const start = performance.now();
    let lastSlice = Math.floor((((currentMod + jitter) % 360) / 360) * n);
    let lastSecond = Math.ceil(duration / 1000);

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const angle = current + (target - current) * eased;
      rotation.current = angle;
      if (canvasRef.current) canvasRef.current.style.transform = `rotate(${angle}deg)`;
      // The bar follows the frame itself: re-rendering the whole tool 60 times a
      // second made slow browsers fall behind the clock and never reach the result.
      if (barRef.current) barRef.current.style.width = `${(t * 100).toFixed(1)}%`;
      if (barTrack.current) barTrack.current.setAttribute("aria-valuenow", String(Math.round(t * 100)));
      const second = Math.max(0, Math.ceil((duration * (1 - t)) / 1000));
      if (second !== lastSecond) {
        lastSecond = second;
        setLeft(second);
      }
      const sliceNow = Math.floor((((angle % 360) + 360) % 360) / 360 * n);
      if (sliceNow !== lastSlice) {
        lastSlice = sliceNow;
        if (ctxSound && options.volume > 0) beep(ctxSound, 1180, Math.max(0.008, options.volume / 1400), 26, "square");
      }
      if (t < 1) {
        raf.current = requestAnimationFrame(frame);
      } else {
        if (canvasRef.current) canvasRef.current.style.transform = `rotate(${target % 360}deg)`;
        rotation.current = target % 360;
        land(sliceIndex);
      }
    };
    raf.current = requestAnimationFrame(frame);
    // A throttled or background tab must still get its winner: the clock settles
    // the draw even if no frame ever reaches the end.
    spinTimer.current = setTimeout(() => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      land(sliceIndex);
    }, duration + 150);
  }, [audioCtx, finish, land, n, options.duration, options.sound, options.volume, reduced, spinning]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (spinTimer.current) clearTimeout(spinTimer.current);
    if (freshTimer.current) clearTimeout(freshTimer.current);
  }, []);

  // The draw is settled before the wheel turns, so stopping only ends the show:
  // the slice already chosen is the one that lands.
  const stopSpin = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    land(pending.current);
  }, [land]);

  const clearResult = useCallback(() => {
    setResult(null);
    setHighlight(-1);
    setProgress(0);
  }, []);

  const removeWinner = useCallback(
    () => {
      if (!result) return;
      const snapshot = raw;
      const next = entries
        .map((e) => (e.name === result.name ? { ...e, count: e.count - 1 } : e))
        .filter((e) => e.count > 0);
      const nextRaw = rawFromEntries(next);
      setRaw(nextRaw);
      setUndoRaw(snapshot);
      clearResult();
      showToast(`${result.name} removed · ${next.reduce((sum, e) => sum + e.count, 0)} left`);
    },
    [clearResult, entries, raw, result],
  );

  // keep a stable handle for "remove and spin again"
  const spinRef = useRef(spin);
  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  const undo = () => {
    if (undoRaw === null) return;
    setRaw(undoRaw);
    setUndoRaw(null);
    showToast("Winner put back on the wheel");
  };

  const clearDraws = () => {
    drawNo.current = 0;
    setDraws([]);
    clearResult();
    showToast("Draw list cleared");
  };

  const copyDraws = async () => {
    if (!draws.length) {
      showToast("No draws to copy yet");
      return;
    }
    const text = draws.map((d) => `${d.no}. ${d.name} — ${pct(d.chance)} — ${d.when}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Draw list copied as plain text");
    } catch {
      showToast("Could not reach the clipboard");
    }
  };

  const downloadDraws = () => {
    if (!draws.length) {
      showToast("No draws to download yet");
      return;
    }
    const text = draws.map((d) => `${d.no}. ${d.name} — ${pct(d.chance)} — ${d.when}`).join("\n");
    const blob = new Blob([`${text}\n`], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wheel-results.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    showToast("wheel-results.txt downloaded");
  };

  const shareList = async () => {
    const names = entries.flatMap((e) => Array.from({ length: e.count }, () => e.name));
    if (!names.length) {
      showToast("Add names first, then share the list");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#l=${encodeList(names)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied — the list travels inside it");
    } catch {
      showToast("Could not reach the clipboard");
    }
    try {
      window.history.replaceState(null, "", `#l=${encodeList(names)}`);
    } catch {
      /* hash is a nicety */
    }
  };

  const downloadJson = () => {
    const names = entries.flatMap((e) => Array.from({ length: e.count }, () => e.name));
    if (!names.length) {
      showToast("Add names first, then download the list");
      return;
    }
    const blob = new Blob([JSON.stringify({ names }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "wheel-names.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    showToast("wheel-names.json downloaded");
  };

  const importList = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        const parsed = JSON.parse(text) as unknown;
        const names = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === "object" && Array.isArray((parsed as { names?: unknown }).names)
            ? (parsed as { names: unknown[] }).names
            : null;
        if (names) {
          setRaw(names.filter((x): x is string => typeof x === "string").join("\n"));
          showToast("List imported");
          return;
        }
      } catch {
        /* plain text falls through */
      }
      setRaw(text.split(/\r?\n/).filter((line) => line.trim()).join("\n"));
      showToast("List imported");
    };
    reader.readAsText(file);
  };

  const embedCode = useMemo(() => {
    const names = entries.flatMap((e) => Array.from({ length: e.count }, () => e.name));
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const src = `${origin}/?embed=1${names.length ? `#l=${encodeList(names)}` : ""}`;
    return `<iframe src="${src}" title="Wheel of Names" width="720" height="620" style="border:0;max-width:100%" loading="lazy"></iframe>`;
  }, [entries]);

  // keyboard: Space / Ctrl+Enter spin, Esc closes the winner, Enter draws again
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable);
      if (event.key === "Escape" && result) {
        clearResult();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        spinRef.current();
        return;
      }
      if (typing) return;
      if (event.code === "Space") {
        event.preventDefault();
        spinRef.current();
        return;
      }
      if (event.key === "Enter" && result) {
        event.preventDefault();
        spinRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearResult, result]);

  const setOption = <K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
        localStorage.setItem(STORE + ".sound", "1");
      } catch {
        /* storage may be blocked */
      }
      return next;
    });
  };

  const chanceEach = slices.length ? 1 / slices.length : 0;
  const dupes = entries.filter((e) => e.count > 1);

  return (
    <div className={`wn-tool${options.projector ? " is-projector" : ""}`} data-capability="name-wheel" data-operation="spin" data-state={state}>
      <div className="wn-bench" data-tool-output data-state={state}>
        {/* ---------- list editor ---------- */}
        <section className={`wn-editor-col${triedEmpty && n < 2 ? " is-nudged" : ""}`} aria-labelledby="wn-list-title">
          <div className="wn-panel-head">
            <h2 className="wn-list-title" id="wn-list-title">Names</h2>
            <span className="wn-count" data-name-count>{entries.length} {entries.length === 1 ? "name" : "names"}</span>
          </div>
          <textarea
            id="wn-names"
            ref={inputRef}
            className="wn-input"
            data-tool-input="names"
            data-primary-input
            aria-labelledby="wn-list-title"
            placeholder="One name per line"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            spellCheck={false}
            aria-describedby="wn-list-hint"
          />
          <p className="wn-hint" id="wn-list-hint">
            One name per line. Commas, pasted numbers and Excel columns are split for you.
          </p>
          {dupes.length > 0 ? (
            <div className="wn-dup" aria-label="Names that appear more than once">
              {dupes.map((entry) => (
                <span className="wn-dup-chip" key={entry.key}>
                  {entry.name} x{entry.count} · {pct(n ? entry.count / n : 0)}
                </span>
              ))}
            </div>
          ) : null}
          <div className="wn-editor-actions">
            <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => setRaw(SAMPLE.join("\n"))}>
              Try a sample
            </button>
            <button
              type="button"
              className="wn-btn wn-btn-ghost wn-btn-sm"
              onClick={() => { setRaw(""); setDraws([]); clearResult(); setUndoRaw(null); }}
            >
              Clear
            </button>
          </div>
        </section>

        {/* ---------- the one action ---------- */}
        <div className="wn-action">
          <button
            type="button"
            className="wn-btn wn-btn-primary wn-spin-btn"
            data-primary
            data-jtbd-action="run"
            data-tool-action="spin"
            onClick={() => {
              if (spinning) return stopSpin();
              if (n < 2) {
                setTriedEmpty(true);
                inputRef.current?.focus();
                return;
              }
              spin();
            }}
            data-ready={!spinning && n < 2 ? "false" : "true"}
          >
            {spinning ? "Stop spin" : "Spin my list"}
          </button>
          <div
            className="wn-progress"
            ref={barTrack}
            role={spinning ? "progressbar" : undefined}
            aria-label={spinning ? "Spin progress" : undefined}
            aria-valuemin={spinning ? 0 : undefined}
            aria-valuemax={spinning ? 100 : undefined}
            aria-valuenow={spinning ? Math.round(progress * 100) : undefined}
          >
            <div className="wn-progress-track">
              <div className="wn-progress-bar" ref={barRef} style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="wn-progress-line">
              <strong {...(!spinning && n < 2 && triedEmpty ? { role: "alert", "data-tool-error": "" } : {})}>
                {spinning
                  ? "Spinning…"
                  : result
                    ? "Winner drawn"
                    : n < 2
                      ? triedEmpty
                        ? "Add at least two names to spin"
                        : "Paste at least two names"
                      : "Ready to spin"}
              </strong>
              <span>{spinning ? `${left}s left` : n >= 2 ? `${n} slices · ${pct(chanceEach)} each` : "0 names"}</span>
            </div>
          </div>
        </div>

        {/* ---------- winner slip ---------- */}
        <div className="wn-slip-col">
          <div className={`wn-slip${result ? " is-answered" : ""}${!result && state !== "working" ? " is-empty" : ""}`} data-state={state}>
            <div>
              <div className="wn-slip-top">
                <span>{spinning ? "Drawing" : result ? `Drawn No. ${result.no}` : "Winner slip"}</span>
                <span>{spinning ? `${left}s left` : result ? result.when : "—"}</span>
              </div>
              {result ? (
                <div className="wn-slip-name" data-winner>{result.name}</div>
              ) : spinning ? (
                <div className="wn-slip-name is-empty">Spinning…</div>
              ) : (
                <div className="wn-slip-name is-empty">Your winner lands here</div>
              )}
              {result ? (
                <div className="wn-slip-facts">
                  <span><strong>1 in {n}</strong> · {pct(result.chance)} chance</span>
                  <span>{Math.max(0, n - 1)} of {n} entries left</span>
                  {result.count > 1 ? <span>{result.name} x{result.count} · {pct(result.count / n)} total chance</span> : null}
                </div>
              ) : (
                <div className="wn-slip-slot" aria-hidden="true">
                  <div className="wn-slot-line" />
                  <div className="wn-slot-line short" />
                  <div className="wn-slot-line" style={{ width: "72%" }} />
                </div>
              )}
            </div>
            <div className="wn-slip-actions">
              {result ? (
                <>
                  <button type="button" className="wn-btn wn-btn-remove" onClick={() => removeWinner()}>
                    Remove winner
                  </button>
                  <div className="wn-slip-row">
                    <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => { void copyDraws(); }}>
                      Copy results
                    </button>
                    <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={downloadDraws}>
                      Download .txt
                    </button>
                  </div>
                </>
              ) : (
                <p className="wn-slip-note">
                  The draw is decided before the wheel turns, so how fast it looks is only the show.
                </p>
              )}
              {undoRaw !== null ? (
                <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={undo}>
                  Undo removal
                </button>
              ) : null}
            </div>
          </div>
          <details className="wn-more">
            <summary>Results &amp; sharing <span className="wn-badge" data-draw-count>{draws.length}</span></summary>
          <section className="wn-draws" aria-labelledby="wn-draws-title">
            <div className="wn-draws-head">
              <h2 id="wn-draws-title">
                Draw list
              </h2>
              <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={clearDraws} disabled={!draws.length}>
                Clear
              </button>
            </div>
            {draws.length ? (
              <ol className="wn-draw-list" data-results>
                {draws.slice().reverse().map((item) => (
                  <li key={item.no}>
                    <span className="n">{item.no}</span>
                    <span className="who">{item.name}</span>
                    <span className="odds">{pct(item.chance)}</span>
                    <span className="when">{item.when}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="wn-draws-empty">Every name the wheel picks is listed here, in order, with its time.</p>
            )}
            <div className="wn-draws-foot">
              <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => void shareList()}>
                Share link
              </button>
              <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={downloadJson}>
                Save .json
              </button>
              <button type="button" className="wn-btn wn-btn-ghost wn-btn-sm" onClick={() => fileRef.current?.click()}>
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,.txt,application/json,text/plain"
                className="wn-file-hidden"
                aria-label="Import a name list"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importList(file);
                  event.target.value = "";
                }}
              />
              <a className="wn-btn wn-btn-ghost wn-btn-sm" href="/api/pay/checkout?plan=plus" data-shipsite-checkout data-product="plus">
                CSV export (Plus)
              </a>
            </div>
            <details className="wn-embed-box">
              <summary>Embed code</summary>
              <p className="wn-hint">Put this iframe where the wheel should appear. The list rides inside the link, so no new page is added.</p>
              <textarea className="wn-embed" readOnly rows={3} aria-label="Embed code" value={embedCode} />
            </details>
          </section>
          </details>
        </div>

        {/* ---------- wheel ---------- */}
        <div className="wn-wheel-col">
          <div className={`wn-stage${result ? " is-answered" : ""}`}>
            <div className="wn-wheel-wrap">
              <div className="wn-pointer" aria-hidden="true" />
              <canvas ref={canvasRef} className="wn-wheel-canvas" aria-hidden="true" width={400} height={400} />
              <div className="wn-hub" aria-hidden="true">
                <span>{n}</span>
                <em>{n === 1 ? "name" : "names"}</em>
              </div>
            </div>
            {n === 0 ? (
              <p className="wn-empty-wheel">The wheel is empty. Paste your list above and each name gets its own slice.</p>
            ) : n === 1 ? (
              <p className="wn-empty-wheel">Add at least two names to spin.</p>
            ) : null}
          </div>
        </div>

        {/* ---------- settings, inside the panel beside the wheel ---------- */}
        <details className="wn-options" ref={optionsRef}>
          <summary>Wheel options</summary>
          <div className="wn-options-body">
            <div className="wn-opt" role="group" aria-label="Spin length">
              <span className="wn-opt-label" aria-hidden="true">Spin length</span>
              <div className="wn-seg">
                {([4, 6, 8] as const).map((seconds) => (
                  <label key={seconds}>
                    <input
                      type="radio"
                      name="wn-duration"
                      value={seconds}
                      checked={options.duration === seconds}
                      onChange={() => setOption("duration", seconds)}
                    />
                    <span>{seconds} s</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="wn-opt">
              <span className="wn-opt-label">Sound</span>
              <label className="wn-switch">
                <input type="checkbox" checked={options.sound} onChange={(event) => setOption("sound", event.target.checked)} />
                <span className="track" aria-hidden="true" />
                <span className="wn-plain">{options.sound ? "On" : "Off"}</span>
              </label>
            </div>
            <div className="wn-opt">
              <label className="wn-opt-label" htmlFor="wn-volume">Volume</label>
              <div className="wn-range">
                <input
                  id="wn-volume"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={options.volume}
                  onChange={(event) => setOption("volume", Number(event.target.value))}
                />
                <output htmlFor="wn-volume">{options.volume}</output>
              </div>
            </div>
            <div className="wn-opt wn-opt-block" role="radiogroup" aria-label="Palette">
              <span className="wn-opt-label" aria-hidden="true">Palette</span>
              <div className="wn-swatches">
                {PALETTES.map((item) => (
                  <label className="wn-swatch" key={item.id} title={item.name}>
                    <input
                      type="radio"
                      name="wn-palette"
                      value={item.id}
                      checked={options.palette === item.id}
                      onChange={() => setOption("palette", item.id)}
                      aria-label={item.name}
                    />
                    <span style={{ background: `conic-gradient(${item.fills[0]} 0 25%, ${item.fills[1]} 25% 50%, ${item.fills[2]} 50% 75%, ${item.fills[3]} 75% 100%)` }} />
                  </label>
                ))}
              </div>
            </div>
            <div className="wn-opt">
              <span className="wn-opt-label">Projector</span>
              <label className="wn-switch">
                <input type="checkbox" checked={options.projector} onChange={(event) => setOption("projector", event.target.checked)} />
                <span className="track" aria-hidden="true" />
                <span className="wn-plain">{options.projector ? "On" : "Off"}</span>
              </label>
            </div>
          </div>
        </details>
      </div>

      <div className={`wn-toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
