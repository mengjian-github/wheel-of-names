#!/usr/bin/env node
// Writes the platform stylesheet, the site's recipe and the motion script as
// cached files, and lib/static-assets.json listing them by the hash of their
// exact text (lib/static-assets.ts reads it while the pages render).
//
// Why: PageRenderer inlined all three, and Next serialized each a second and a
// third time into the page's React data (the page tree and the 404 boundary).
// Beat Maker's home page was 824 KB of HTML, 666 KB of it these three texts,
// re-sent with every page instead of fetched once (claude-seo audit,
// 2026-11-18).
//
// Runs as the site's prebuild and predev step. Fail-open per file: a source
// this script cannot read exactly (no string literal, a template literal with
// substitutions, a sheet with a relative url() that would resolve against the
// file's folder instead of the page) is left out of the list, and the page
// inlines it as before. Files are rewritten only when their bytes change, so
// a rebuild of the same tree touches nothing.
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

export const STATIC_DIR = join("public", "__shipsite", "static");
export const STATIC_URL = "/__shipsite/static";
export const MANIFEST_PATH = join("lib", "static-assets.json");

/** Two FNV-1a passes over the UTF-16 code units; must equal staticAssetHash in lib/static-assets.ts. */
export function shipsiteAssetHash(text) {
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x5bd1e995) >>> 0;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

const TEMPLATE_ESCAPES = { n: "\n", t: "\t", r: "\r", "\\": "\\", "`": "`", $: "$", '"': '"', "'": "'", "\n": "" };

/**
 * The value of `export const <name> = <string literal>;` in a module's source,
 * or null when the value is anything else. Reads a JSON string (what the
 * engine writes) or a template literal without substitutions (what an
 * engineer may write); never evaluates code.
 */
export function exportedStringLiteral(source, name) {
  const head = new RegExp(`export\\s+const\\s+${name}\\s*(?::\\s*string\\s*)?=\\s*`).exec(String(source ?? ""));
  if (!head) return null;
  const rest = source.slice(head.index + head[0].length);
  let value = null;
  let end = -1;
  if (rest.startsWith('"')) {
    let index = 1;
    while (index < rest.length && rest[index] !== '"') {
      if (rest[index] === "\n") return null;
      index += rest[index] === "\\" ? 2 : 1;
    }
    if (index >= rest.length) return null;
    try {
      value = JSON.parse(rest.slice(0, index + 1));
    } catch {
      return null;
    }
    end = index + 1;
  } else if (rest.startsWith("`")) {
    let out = "";
    let index = 1;
    while (index < rest.length && rest[index] !== "`") {
      const char = rest[index];
      if (char === "$" && rest[index + 1] === "{") return null;
      if (char === "\\") {
        const escaped = TEMPLATE_ESCAPES[rest[index + 1]];
        if (escaped === undefined) return null;
        out += escaped;
        index += 2;
        continue;
      }
      out += char === "\r" ? "" : char;
      index += 1;
    }
    if (index >= rest.length) return null;
    value = out;
    end = index + 1;
  } else {
    return null;
  }
  // `"a" + b` or `"a".trim()` is not a literal value.
  if (!/^\s*(?:;|$|\r?\n)/.test(rest.slice(end))) return null;
  return typeof value === "string" ? value : null;
}

/** True when a sheet has a url() that would resolve against its file's folder instead of the page. */
export function hasRelativeCssUrl(css) {
  const withoutDataUris = String(css ?? "")
    .replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/gi, "")
    .replace(/url\(\s*data:[^)]*\)/gi, "");
  return /url\(\s*["']?(?![\s"')]|\/|#|%23|data:|https?:|about:|blob:)/i.test(withoutDataUris);
}

async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/** The texts to serve as files: [name, extension, text]. */
export async function collectStaticAssets(root = ".") {
  const assets = [];
  const siteStyles = exportedStringLiteral(await readText(join(root, "lib", "site-styles.ts")), "siteStyles");
  if (siteStyles && !hasRelativeCssUrl(siteStyles)) assets.push(["site", "css", siteStyles]);
  const recipeStyles = exportedStringLiteral(await readText(join(root, "components", "native", "recipe-styles.ts")), "recipeStyles");
  if (recipeStyles && !hasRelativeCssUrl(recipeStyles)) assets.push(["recipe", "css", recipeStyles]);
  try {
    const config = JSON.parse((await readText(join(root, "lib", "site-config.json"))) ?? "null");
    const motion = config && typeof config.motionRuntimeScript === "string" ? config.motionRuntimeScript : "";
    if (motion && !/<\/script/i.test(motion)) assets.push(["motion", "js", motion]);
  } catch {
    // No readable config: the motion script stays inline.
  }
  return assets;
}

export async function emitStaticAssets(root = ".") {
  const dir = join(root, STATIC_DIR);
  const manifest = {};
  const keep = new Set();
  for (const [name, extension, text] of await collectStaticAssets(root)) {
    const hash = shipsiteAssetHash(text);
    const file = `${name}.${hash}.${extension}`;
    keep.add(file);
    manifest[hash] = `${STATIC_URL}/${file}`;
    await mkdir(dir, { recursive: true });
    if ((await readText(join(dir, file))) !== text) await writeFile(join(dir, file), text);
  }
  // Files of an earlier build of this tree are never linked again.
  try {
    for (const entry of await readdir(dir)) {
      if (!keep.has(entry)) await rm(join(dir, entry), { force: true, recursive: true });
    }
  } catch {
    // No folder yet: nothing to prune.
  }
  const body = `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right, "en"))), null, 2)}\n`;
  if ((await readText(join(root, MANIFEST_PATH))) !== body) {
    await mkdir(join(root, "lib"), { recursive: true });
    await writeFile(join(root, MANIFEST_PATH), body);
  }
  return manifest;
}

if (process.argv[1] && /emit-static-assets\.mjs$/.test(process.argv[1])) {
  try {
    const manifest = await emitStaticAssets(process.argv[2] ?? ".");
    const files = Object.values(manifest);
    console.log(`emit-static-assets: ${files.length} cached file${files.length === 1 ? "" : "s"}${files.length ? ` (${files.join(", ")})` : ""}`);
  } catch (error) {
    // Never block a build: the pages inline what has no file.
    console.warn(`emit-static-assets: skipped (${error?.message ?? error})`);
  }
}
