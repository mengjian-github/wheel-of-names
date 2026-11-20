import rawManifest from "./static-assets.json";

// The platform stylesheet (lib/site-styles.ts), the site's recipe
// (components/native/recipe-styles.ts) and the motion script, served as
// cached files instead of inline text. scripts/emit-static-assets.mjs writes
// each one before `next build` to public/__shipsite/static/<name>.<hash>.<ext>
// and lists it here by the hash of its exact text. Inlined, the three rode
// every page three times (in <head>, then twice in the React data: the page's
// tree and the 404 boundary's): 666 KB of Beat Maker's 824 KB home page
// (claude-seo audit, 2026-11-18).
//
// A file is linked only when the text being rendered hashes to a listed file,
// so a stale or missing list (a dev server after an edit, a tree whose
// prebuild never ran) inlines the text exactly as before and never links to
// other bytes. The checked-in default is empty for the same reason.
const manifest = rawManifest as Record<string, string>;

/** Two FNV-1a passes over the UTF-16 code units; must equal shipsiteAssetHash in scripts/emit-static-assets.mjs. */
export function staticAssetHash(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x5bd1e995) >>> 0;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

/** The cached file holding exactly `text`, or null when there is none (inline it). */
export function staticAssetHref(text: string | null | undefined): string | null {
  if (!text) return null;
  const href = manifest[staticAssetHash(text)];
  return typeof href === "string" && href.startsWith("/__shipsite/static/") ? href : null;
}
