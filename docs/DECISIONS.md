# Decisions log

Short record of non-obvious implementation choices, for future-me and any client handoff.

## 2026-06-04 — Initial build from the Claude Design handoff

**Source.** Built from a Claude Design bundle (`spacier-site/`) containing an HTML/CSS/JS
prototype plus the design chat transcript. The README in that bundle directs the coding
agent to recreate the design pixel-perfectly in whatever tech fits — here, Next.js.

**Styling: ported CSS, not Tailwind.** Project default is Tailwind, but the prototype is a
bespoke, token-driven cinematic CSS system (~600 lines, custom shaders-adjacent gradients,
keyframes, complex stateful selectors). Reproducing it pixel-perfectly is far lower-risk by
porting the CSS verbatim into `globals.css` (tokens kept as CSS custom properties) than by
re-expressing it as utilities. Tokens are still centralized and reusable across projects,
matching the branding.json → CSS-vars pattern the brief called for.

**Three.js directly, not React Three Fiber.** The brief mentioned R3F/drei, but the
prototype ships a hand-tuned raw-Three.js GLSL orb. Porting it as a framework-agnostic
engine (`lib/orb.ts`) driven from a `useEffect` preserves the exact look and the imperative
rAF/uniform tuning, and avoids an R3F reconciliation layer over what is essentially one
mesh + one bloom pass. Imports use the `three` npm ESM postprocessing modules instead of
the prototype's `examples/js` globals.

**Behavior in React.** DOM-level UI (active scene, console dock, reply strip, sound/XR
labels, expandable service rows) is React state; the orb, custom cursor, and audio run as
imperative singletons in refs. This keeps the declarative markup readable while honoring the
inherently imperative pieces (WebGL loops, Web Audio).

**`overflow`/`cursor` scoping.** The prototype was one HTML file, so it locked
`overflow:hidden` and `cursor:none` on `<body>` globally. In this multi-route app those are
scoped to `body.experience-active` (added only by the home experience) so the scrollable
`/brand` page keeps native scroll + cursor.

**Dropped `tweaks.js`.** That panel was the design tool's authoring/host-protocol overlay
(localStorage + `postMessage` to the editor), not part of the real site. The site ships
with its finalized defaults: home layout A (centered), lime accent, orb energy 1.0.

**Brand page isolation.** `/brand` uses a CSS Module so its generic class names
(`.card`, `.eyebrow`, …) can't collide with the global site stylesheet.

## 2026-06-05 — Real portfolio content

Replaced the placeholder Work cards with real, named client work. Made the grid
data-driven (`src/lib/projects.ts`) + a generated screenshot pipeline
(`scripts/capture-work.mjs`, `npm run shots`, output to `public/work/`).

**These are the employer's client projects.** Per the user's call, the portfolio uses
the **"named, public sites only"** treatment:

- Captured screenshots of the **public** marketing sites only (Adriatique, Serap Yavuz,
  Soluna Zürich, 20 Minuten Advertising). Cards link out to the live public URLs.
- `rse.group` returns **HTTP 401** (fully behind login) → **not captured, not linked**.
  Shown as a "Private — on request" tile.
- No logged-in CRM/admin screens were captured — that was explicitly out of scope until
  the user clears it.
- Copy is factual (stack: Next.js + headless TYPO3); **no invented metrics**.

> ⚠️ Attribution with the employer must be confirmed before this goes live. Flagged to
> the user; this is the user's call, not the agent's. Not legal advice.

Tooling: added `puppeteer-core` (devDep) to drive the installed Chrome — Chrome 148
removed the old one-shot `--screenshot` headless mode, so `puppeteer-core` is the
reliable path. Screenshots are downscaled to 1600px JPEGs to keep the repo lean.

**PIN gate (client-side, by request).** Only Soluna is public; the other four are
`pin: true` and revealed when the visitor enters `WORK_PIN` (`src/lib/projects.ts`).
I first built a server-validated version (route handler + `server-only` data + images
out of `/public`), but per the user's request simplified to a plain client-side check —
data and images stay in the bundle/`public`, the PIN is compared in the browser. It's a
*soft* gate (hides work from normal visitors, shareable via PIN), explicitly **not**
real access control. Flagged to the user; repo should stay private.

## Open items

- Contact form is client-only (confirmation, no send). Needs a Route Handler + email
  provider before launch.
- Work cards and the About portrait use labeled placeholders pending real assets.
