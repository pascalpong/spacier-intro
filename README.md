# Spacier — Solo Web Studio site

The studio site for **Spacier** (Pascal — Taipei). A single, cinematic, interactive
experience: a Three.js iridescent "AI avatar" orb the visitor talks to, which routes
them between full-screen scenes (Work, Services, Process, About, Contact). Built from a
Claude Design handoff bundle and reimplemented in Next.js.

The site itself is the portfolio — motion-rich, mono-cinematic, one acid-lime accent.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Three.js** for the procedural orb (custom GLSL shader + Unreal bloom)
- **Web Audio API** for synthesized ambient sound
- Bespoke, token-driven CSS (see [docs/DECISIONS.md](docs/DECISIONS.md) for why not Tailwind here)

## Features

- **Avatar orb** — simplex-noise vertex morph, fresnel iridescence tinted to the accent,
  bloom. Tracks the cursor, brightens while you type, pulses on interaction, and glides
  to the right (panning out) when you enter a scene. Falls back to a CSS blob with no WebGL.
- **Prompt-to-navigate** — type intent ("show me your work", "can you build a Shopify
  store?", "how much?") and deterministic keyword routing takes you to the right scene,
  with a graceful fallback. A persistent recommendations strip suggests what to type.
- **Docking command console** — centered on home, docks to a bottom pill (prev/next, scene
  label, sound) on every other scene.
- **Side nav** as the always-available safety net; full keyboard navigation (←/→/Esc).
- **Custom cursor**, synthesized **ambient audio** (muted by default), **WebXR** button
  with capability detection and a graceful "not supported" state.
- **Accessibility/fallbacks** — `prefers-reduced-motion` honored, no-WebGL fallback,
  semantic content reachable without the 3D, no-JS message.
- **/brand** — the brand-system page (mark, lockups, color, type, favicon, usage rules).

## Project structure

```
public/brand/            favicon + app icons + orb SVG mark
src/
  app/
    layout.tsx           root layout, metadata + favicons
    page.tsx             home — renders the experience
    globals.css          design tokens + all site styles (ported from the bundle)
    brand/
      page.tsx           brand-system page
      brand.module.css   scoped styles for the brand page
  components/
    SpacierExperience.tsx  the interactive site (scenes, console, cursor, audio, XR)
    OrbMark.tsx            inline SVG orb mark (used on the brand page)
  lib/
    orb.ts               Three.js orb engine (framework-agnostic)
    intents.ts           scene model + keyword intent routing
    audio.ts             synthesized ambient audio
    projects.ts          the Work grid content (edit this to manage work)
scripts/
  capture-work.mjs       puppeteer: screenshots the public sites → public/work/
public/work/             work-card screenshots (generated)
```

## Getting started

Requirements: **Node 18.18+** (Node 20+ recommended) and npm.

```bash
npm install
cp .env.example .env.local   # then edit values
npm run dev                  # http://localhost:3000
```

### Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the dev server (Turbopack)      |
| `npm run build`   | Production build                      |
| `npm start`       | Serve the production build            |
| `npm run lint`    | ESLint (next/core-web-vitals)         |
| `npm run typecheck` | TypeScript check, no emit           |
| `npm run shots`   | Re-screenshot the public work sites   |

## Environment variables

Copy `.env.example` to `.env.local`. All are optional for local dev.

| Variable               | Required | Purpose                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | no       | Canonical/OG base URL for metadata. Defaults to localhost.     |
| `CONTACT_TO_EMAIL`     | no       | Destination for leads once a real contact handler is wired up. |
| `RESEND_API_KEY`       | no       | If you send the contact form via Resend.                       |

> The contact form is currently client-only (it shows a confirmation but does not send).
> Wire a Route Handler / email provider before launch — see "Next steps".

## Managing the Work grid

The Work scene renders from `src/lib/projects.ts` — edit that array to add, remove,
or reorder projects (each has a name, tag, one-line blurb, optional live `url`,
optional `image`, and a `pin` flag). A CTA card ("Start your own") is appended
automatically.

**PIN gate.** Projects marked `pin: true` are hidden until the visitor enters the PIN
(`WORK_PIN` in the same file — currently `1212312123`). Only Soluna is public; the rest
are gated. This is a **client-side soft gate**: it hides the work from normal visitors
and lets you share it with a PIN, but the gated names/screenshots are still present in
the built site for anyone who inspects the source. It is not real access control — keep
this repo private and confirm attribution with your employer before going live.

Card screenshots live in `public/work/<id>.jpg`. Regenerate them with:

```bash
npm run shots   # or: CHROME_PATH="/path/to/chrome" npm run shots
```

`scripts/capture-work.mjs` only lists **public, non-logged-in** pages. Never point it
at anything behind a login.

> **Attribution caveat (important).** The current cards feature client work built at
> Pascal's employer (Adriatique, Serap Yavuz, Soluna, 20 Minuten). They're named with
> screenshots of the **public** sites only — nothing behind a login. **Confirm with your
> employer that this attribution is OK before the site goes live.** `rse.group`
> (Rockstar Entertainment) is access-gated, so it's shown as a "Private — on request"
> tile with no screenshot or link.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel — it auto-detects Next.js (no config needed).
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL in Vercel → Project → Settings → Environment Variables.
4. Deploy. Vercel handles build (`next build`) and serving.

Any Node host works too: `npm run build` then `npm start` (defaults to port 3000).

## Next steps before client launch

- Wire the contact form to a real handler (Route Handler + Resend/Formspree).
- Drop real project imagery into the Work cards (currently labeled placeholders).
- Add a real portrait on the About scene.
- Optional: add Open Graph image, analytics, and a sitemap/robots.

## Credits

Design + identity from a Claude Design handoff; implementation in Next.js. The orb shader,
scene model, and styling are ported from the prototype with behavior preserved.
