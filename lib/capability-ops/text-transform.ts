import {
  paramList,
  paramString,
  type CapabilityResult,
  type CapabilityRunContext,
  type CapabilityValue,
} from "../capability-runtime";

// Runs the visitor's text through the fixed pipeline the contract declared.
// Each step is a vetted pure function, so a site can compose a formatter, a
// slug generator or an encoder without any new code reaching the platform.

type Step = (input: string) => string;

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function filenameDraft(value: string): string {
  let source = value.trim();
  if (!source) return "";
  try {
    const url = new URL(source);
    source = url.pathname.split("/").filter(Boolean).at(-1) ?? url.hostname;
  } catch {
    source = source.split(/[?#]/, 1)[0].split(/[\\/]/).filter(Boolean).at(-1) ?? source;
  }
  try { source = decodeURIComponent(source); } catch { /* keep the original text */ }
  return source
    .replace(/\.[a-z0-9]{2,6}$/i, "")
    .replace(/(?:^|[-_\s])(?:img|image|dsc|pxl)[-_\s]*\d+/gi, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

function filenameAltCsv(value: string): string {
  const rows = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return [
    "source,draft_alt_text",
    ...rows.map((source) => `${csvCell(source)},${csvCell(filenameDraft(source))}`),
  ].join("\n");
}

const STEPS: Record<string, Step> = {
  trim: (value) => value.trim(),
  "collapse-whitespace": (value) => value.replace(/\s+/g, " ").trim(),
  lowercase: (value) => value.toLowerCase(),
  uppercase: (value) => value.toUpperCase(),
  "title-case": (value) => value.replace(/\b\p{L}[\p{L}']*/gu, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()),
  slugify: (value) => value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  "json-format": (value) => JSON.stringify(JSON.parse(value), null, 2),
  "json-minify": (value) => JSON.stringify(JSON.parse(value)),
  "base64-encode": (value) => btoa(String.fromCharCode(...new TextEncoder().encode(value))),
  "base64-decode": (value) => new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0))),
  "url-encode": (value) => encodeURIComponent(value),
  "url-decode": (value) => decodeURIComponent(value),
  "strip-html": (value) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim(),
  "sort-lines": (value) => value.split("\n").sort((a, b) => a.localeCompare(b)).join("\n"),
  "dedupe-lines": (value) => [...new Set(value.split("\n"))].join("\n"),
  "filename-alt-csv": filenameAltCsv,
  count: (value) => value,
};

function measure(value: string): { label: string; value: string }[] {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return [
    { label: "Characters", value: String(value.length) },
    { label: "Words", value: String(words) },
    { label: "Lines", value: String(value ? value.split("\n").length : 0) },
  ];
}

export async function run(
  values: Record<string, CapabilityValue>,
  context: CapabilityRunContext,
): Promise<CapabilityResult> {
  const sourceId = paramString(context.params, "sourceInput");
  const raw = sourceId
    ? values[sourceId]
    : Object.values(values).find((value) => typeof value === "string" && value.trim());
  const input = typeof raw === "string" ? raw : "";
  if (!input.trim()) return { status: "empty", message: "Paste some text to transform." };

  const pipeline = paramList(context.params, "pipeline");
  let output = input;
  for (const name of pipeline) {
    const step = STEPS[name];
    if (!step) continue;
    try {
      output = step(output);
    } catch (error) {
      // A failed step is almost always malformed input, and naming the step is
      // what makes the message actionable.
      return {
        status: "error",
        message: `The “${name}” step could not run on this input.`,
        detail: error instanceof Error ? error.message.slice(0, 200) : undefined,
      };
    }
  }

  const csvDownload = pipeline.includes("filename-alt-csv")
    ? (() => {
        const mimeType = "text/csv;charset=utf-8";
        const blob = new Blob([output], { type: mimeType });
        return { url: URL.createObjectURL(blob), name: "alt-text-drafts.csv", bytes: blob.size, mimeType };
      })()
    : undefined;
  return {
    status: "success",
    text: output,
    file: csvDownload,
    diagnostics: [...measure(output), { label: "Steps", value: pipeline.join(" → ") || "none" }],
  };
}
