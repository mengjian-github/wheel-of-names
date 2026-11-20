# Site memory

<!-- site-memory/1 -->

What this site's agents (the engineer, its repairs, the designer and the maker) decided and learned, so a mistake fixed once stays fixed.
Every build, repair and design run reads it first. It is your file: edit, add or delete any line, and add sections of your own.
One line per entry: `- date · what — why: reason (from where)`.

## Owner decisions
_(none yet)_

## Never do
- 2026-11-20 · Never drop the Event Pass column or fill Pro with Plus values in the pricing comparison table: it is five cells per row (Free, Plus, Pro, Event Pass) taken from pricing.md §3, and the Billing row says Plus and Pro renew  — why: QA run 65cee78a-052: the table rendered five headers with four cells, no Event Pass values, and "Charged once, does not renew" under both Plus and Pro while the page's own FAQ says they are subscriptions. (from run_65cee78a-052-infra-qa)
- 2026-11-20 · Do not shorten the frozen copy's h1 or lede to make the first screen fit: the home h1 is "Wheel of Names: paste a list, spin, get one winner" and its three-sentence lede ships verbatim — shrink the type and the spacing a — why: Two judge runs read a shortened h1/lede as "the approved copy is not what ships", and the copy stage sets it verbatim anyway. (from run_707109e4-9ff-design)

## Product decisions
- 2026-11-20 · Maker chose build: Fix every page-level blocking finding of run_65cee78a-052 on the preview, demonstrable in fresh screenshots, without changing the approved offer or shortening f — why: The block is 32 page-level defects in the built pages against a plan that already decides them: the PRD requires localStorage auto-save and restore on all tool pages (prd.md 112/128), /vs/pickerwheel/ numbers with a source URL and 20 Nov 20 (from run_65cee78a-052-infra-qa)
- 2026-11-20 · The pasted list is saved on the device and restored next visit on every tool page — the plan requires localStorage auto-save/restore on all tool pages (PRD) and the strategy makes "the list stays on your device, there to — why: QA run 65cee78a-052: 30 names → reload → 0 names on /, and /classroom-name-picker/ loses its roster too; the identity and strategy both promise the list is kept for tomorrow. (from run_65cee78a-052-infra-qa)
- 2026-11-20 · A tool home's side picture must be something a photo library can actually shoot (a teacher at a laptop), never a scene only a drawing could show (this product's wheel with names on it) — those are drawn in code, not plan — why: The how-to-use figure for "hands typing on laptop keyboard" resolved to a pale fabric crop and was read as filler that proved nothing. (from run_707109e4-9ff-design)

## Open issues
- 2026-11-20 · Paid checkout and Google sign-in stay blocked on owner setup — Stripe test prices plus the webhook and the Google sign-in credentials in the studio — not on page code; the production database binding pointing at the prev — why: QA run 65cee78a-052: checkout returns api_key_missing, the site status is pending with keys not bound, and check_backend reports the top-level database binding is the preview resource. (from run_65cee78a-052-infra-qa)
- 2026-11-20 · content/pricing.json's comparison table "Billing" row wrongly says Plus and Pro are "Charged once, does not renew"; both are monthly/annual subscriptions until cancelled (only the Event Pass is one-time). Handed off to t — why: QA's facts check fails a domain fact: prd.md line 65 prices Plus $6/mo-or-$60/yr and Pro $12/mo-or-$120/yr as recurring, and the page's own FAQ says so. (from run_65cee78a-052)

## Lessons
- 2026-11-20 · A fact already carried by the hero or a step is not restated at the top of a section; it is said once, where the visitor acts on it. — why: QA sent it back on /contact/, /pricing/, /about/ (from copy agent)
- 2026-11-20 · One control owns a price: the plan card with its billing toggle states the annual figure, and the card description never repeats it. — why: QA sent it back on /contact/, /pricing/, /about/ (from copy agent)
- 2026-11-20 · A limits section names only what is really absent — if the wheel imports .json and .txt lists, the page must not say file imports are refused. — why: QA sent it back on /contact/, /pricing/, /about/ (from copy agent)
- 2026-11-20 · The design review's carried "alignment" notes (".wn-tool starts at x=84 / x=81, 13–16px right of x=68") are stale: on a fresh build .wn-tool, .wn-page-head and .wn-bench all measure x=68 at 1440 on /, /picker-wheel/, /fa — why: Turn 6 removed the offset; later reviews repeated the older measurement, and chasing it again would have added a real regression to a page that was already aligned. (from run_65cee78a-052)
- 2026-11-20 · Draw every control state the tool can reach (rest, hover, focus, pressed, disabled, and the in-use cell such as "Pause spin") in the first control-sheet render; a missing in-use or disabled cell costs a whole judge run a — why: On Wheel of Names the not-ready Spin and the empty in-use column were measured as blocking on three successive renders. (from run_707109e4-9ff-design)
