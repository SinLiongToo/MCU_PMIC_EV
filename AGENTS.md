# MCU Notes — rules for AI coding agents

This file is the single source of truth for every AI tool working in this repo.
Claude Code reads it through `CLAUDE.md`; Google Antigravity reads `AGENTS.md` directly.
Do not duplicate these rules elsewhere — edit this file.

## What the project is
A static, bilingual (Traditional Chinese at `/`, English at `/en/`) knowledge site about
automotive MCUs, using the **Infineon PSoC™ 4 HVPA-144K** as the reference device.
Plain HTML/CSS/JS, no build framework, deployed with GitHub Pages from `main`.

## Before you start
1. Read `docs/PROJECT_MEMORY.md` — verified datasheet facts, decisions and open items.
2. For any number about the chip, use the fact table there. If a value is not in it,
   check the datasheet (002-28660 Rev. *K) before writing it. Never invent specs.

## Hard rules
- **Bilingual parity.** Every change to a page goes into both `X.html` and `en/X.html`
  in the same commit, with identical `h2`/`h3` ids in the same order.
- **Interactive pages are generated from one source.** `assets/lab.js`, `assets/designer.js`
  and `assets/quiz.js` hold both languages via `t(zh, en)`; do not hard-code text in
  `lab.html` / `en/lab.html`.
- **Glossary** is generated: edit `TERMS` in `tools/build_glossary.py`, then run it.
- **Facts.** Mark datasheet values with “DS” or a spec ID (e.g. SID17A.3). Label teaching
  concepts as concepts. Illustrative case studies must say they are representative.
- **SVG figures**: theme colours via CSS variables (`var(--ink)`, `var(--analog)` …),
  numeric attributes only (no `x1="355,123"`), `role="img"` + `aria-label`, wrapped in
  `<div class="fig">` with a `<figcaption>`.
- **Math**: KaTeX with `\( … \)` / `\[ … \]`. `tools/` scripts add KaTeX only to pages
  that contain math.

## After every change
```bash
python tools/build_glossary.py   # if glossary terms changed
python tools/build_index.py      # if any h2/h3 changed
python tools/check_site.py       # must print OK before committing
```
For visual changes, also check light + dark theme at 1366 px and 390 px widths
(the global `static-site-audit` skill has a Playwright script).

## Memory
When you learn something durable (a verified fact, a decision, a gotcha), append it to
`docs/PROJECT_MEMORY.md` under the right heading with the date and your tool name.
Keep entries short; update or delete entries that become wrong.

## Git
Work on a branch, commit in logical chunks, never force-push `main`.
