// Wheel engine: list parsing, uniform and weighted draws, palettes.
// Every draw uses crypto.getRandomValues with rejection sampling, so each
// slice (or weight unit) has exactly the same chance and no modulo bias.

export type Entry = {
  /** A stable key for the entry (its exact text). */
  key: string;
  /** The name as the visitor typed it. */
  name: string;
  /** How many times the name occurs in the list. */
  count: number;
};

export type Slice = {
  key: string;
  name: string;
  count: number;
  /** Index in the unique entry list. */
  entry: number;
};

const NUMBERING = /^\s*(?:\d{1,4}[.)]|\d{1,4}\s+|[•*\-–])\s+/;
const SPLITTER = /\s*[,;\t]\s*/;

/**
 * One entry per line; commas, semicolons and tabs split a line; a leading
 * list number ("1. Ada", "2) Ada") or bullet is dropped. Repeated names are
 * kept as one entry with a count, so the wheel can show its extra slices.
 */
export function parseNames(raw: string): Entry[] {
  const out: Entry[] = [];
  const index = new Map<string, Entry>();
  for (const line of raw.split(/\r?\n/)) {
    const cleaned = line.replace(NUMBERING, "").trim();
    if (!cleaned) continue;
    for (const piece of cleaned.split(SPLITTER)) {
      const name = piece.trim();
      if (!name) continue;
      const found = index.get(name);
      if (found) {
        found.count += 1;
      } else {
        const entry: Entry = { key: name, name, count: 1 };
        index.set(name, entry);
        out.push(entry);
      }
    }
  }
  return out;
}

/** Flattens entries to one slice per occurrence, in list order. */
export function toSlices(entries: Entry[]): Slice[] {
  const slices: Slice[] = [];
  entries.forEach((entry, i) => {
    for (let c = 0; c < entry.count; c += 1) {
      slices.push({ key: `${i}:${c}`, name: entry.name, count: entry.count, entry: i });
    }
  });
  return slices;
}

/** Uniform integer in [0, n) from crypto.getRandomValues, rejection-sampled. */
export function randomInt(n: number): number {
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("randomInt needs a positive count");
  if (n > 0xffffffff) throw new Error("List too long for a single draw");
  const span = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value < span) return value % n;
  }
}

export const usd = (value: number): string => `$${value}`;

/** 0.3333 → "33.3%". */
export function pct(chance: number): string {
  return `${(chance * 100).toFixed(1)}%`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export type Weighted = { name: string; weight: number };

export type WeightedParse =
  | { ok: true; entries: Weighted[] }
  | { ok: false; entries: Weighted[]; error: string };

export const WEIGHT_ERROR = "Weights are whole numbers from 1 to 10";

/**
 * Parses "name, weight" lines (also "name 4", tabs, semicolons). A line with
 * no weight starts at 1. Weights must be integers from 1 to 10.
 */
export function parseWeighted(raw: string): WeightedParse {
  const entries: Weighted[] = [];
  let error = "";
  for (const line of raw.split(/\r?\n/)) {
    const cleaned = line.replace(NUMBERING, "").trim();
    if (!cleaned) continue;
    let name = cleaned;
    let weight = 1;
    const byComma = cleaned.split(/\s*[,;\t]\s*/);
    if (byComma.length > 1 && /^\d+$/.test(byComma[byComma.length - 1])) {
      weight = Number(byComma.pop());
      name = byComma.join(", ").trim();
    } else {
      const bySpace = cleaned.match(/^(.*\S)\s+(\d+)$/);
      if (bySpace) {
        name = bySpace[1].trim();
        weight = Number(bySpace[2]);
      }
    }
    if (!name) continue;
    if (!Number.isInteger(weight) || weight < 1 || weight > 10) {
      error = WEIGHT_ERROR;
      weight = Math.min(10, Math.max(1, Math.round(weight) || 1));
    }
    entries.push({ name, weight });
  }
  if (!error && entries.length < 2) {
    error = "Add at least two entries to spin";
  }
  return error ? { ok: false, entries, error } : { ok: true, entries };
}

/** Weighted draw; returns the chosen index. */
export function randomWeighted(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let ticket = randomInt(total);
  for (let i = 0; i < weights.length; i += 1) {
    ticket -= weights[i];
    if (ticket < 0) return i;
  }
  return weights.length - 1;
}

export type Palette = {
  id: string;
  name: string;
  fills: string[];
  ink: string;
};

/** Six named palettes; every fill sits on the site's navy ground. */
export const PALETTES: Palette[] = [
  { id: "rose", name: "Rose & slate", fills: ["#3b4776", "#2a3459", "#46558c", "#33406a"], ink: "#eef1f8" },
  { id: "harbour", name: "Harbour blue", fills: ["#254a6b", "#1e3c58", "#2e5c80", "#22445f"], ink: "#eaf1f6" },
  { id: "orchard", name: "Orchard green", fills: ["#2c5047", "#23413a", "#376054", "#294a41"], ink: "#e9f2ec" },
  { id: "carnival", name: "Carnival", fills: ["#6b3a3f", "#563034", "#7c474c", "#5f353a"], ink: "#f6ecea" },
  { id: "coastal", name: "Coastal teal", fills: ["#265456", "#1f4547", "#2f6466", "#284c4e"], ink: "#e8f2f1" },
  { id: "stone", name: "Stone", fills: ["#3a4055", "#2e3447", "#454c63", "#363c50"], ink: "#eef1f8" },
];

export const DEFAULT_PALETTE = PALETTES[0];

/** Truncates a label to fit a slice, with an ellipsis when it does not. */
export function fitLabel(label: string, max: number): string {
  const clean = label.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  if (max <= 1) return "…";
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Sizes for a slice's label: fewer slices get a larger label. */
export function labelBudget(n: number, radius: number): { chars: number; size: number } {
  const size = n <= 6 ? 22 : n <= 12 ? 19 : n <= 24 ? 16 : n <= 40 ? 13 : n <= 70 ? 11 : 9;
  const room = Math.max(14, radius * 0.72);
  const chars = Math.max(3, Math.floor(room / (size * 0.56)));
  return { chars, size };
}

/** mm:ss from milliseconds. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeNow(): string {
  try {
    return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return new Date().toISOString().slice(11, 19);
  }
}
