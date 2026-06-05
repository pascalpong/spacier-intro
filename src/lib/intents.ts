/* ============================================================
   SPACIER — scene model + deterministic keyword intent routing
   Free text → one of the fixed routes (no AI call). Ported from
   the design bundle (project/app.js).
   ============================================================ */

export type Scene = "home" | "work" | "services" | "process" | "about" | "contact";

export const ORDER: Scene[] = ["home", "work", "services", "process", "about", "contact"];

export const LABELS: Record<Scene, string> = {
  home: "Home",
  work: "Work",
  services: "Services",
  process: "Process",
  about: "About",
  contact: "Contact",
};

interface Intent {
  say: string;
  kw: string[];
}

export const INTENTS: Record<Scene, Intent> = {
  work: {
    say: "Here's selected work — storefronts, web apps, the lot. Drag in.",
    kw: [
      "work", "works", "project", "projects", "portfolio", "case", "cases", "study",
      "studies", "show", "see", "examples", "example", "built", "made", "recent",
      "stuff", "clients",
    ],
  },
  services: {
    say: "This is what I build. Three lanes — pick one.",
    kw: [
      "service", "services", "offer", "offering", "do you", "what do you", "can you",
      "build", "shopify", "store", "stores", "ecommerce", "e-commerce", "commerce",
      "cms", "headless", "line", "app", "apps", "web app", "webapp", "laravel", "php",
      "next", "nextjs", "website", "site", "sites", "develop", "development", "code",
    ],
  },
  process: {
    say: "Scope → design → build → launch. Here's how I work.",
    kw: [
      "process", "how", "steps", "step", "timeline", "work with", "workflow", "scope",
      "phases", "approach", "method",
    ],
  },
  about: {
    say: "I'm Pascal — dev out of Taipei. Good to meet you.",
    kw: [
      "about", "who", "you", "your", "pascal", "yourself", "bio", "taiwan", "taipei",
      "tech", "student", "person", "behind", "team",
    ],
  },
  contact: {
    say: "Let's build it. Tell me what you've got.",
    kw: [
      "contact", "hire", "email", "talk", "reach", "quote", "price", "pricing", "cost",
      "how much", "budget", "start", "begin", "project", "brief", "book", "call",
      "message", "dm", "get in touch", "collab",
    ],
  },
  home: {
    say: "Back to center.",
    kw: ["home", "back", "start over", "avatar", "center", "main", "top"],
  },
};

export const SUGGEST: { p: string; r: Scene }[] = [
  { p: "Show me your work", r: "work" },
  { p: "What can you build?", r: "services" },
  { p: "How do you work?", r: "process" },
  { p: "Start a project", r: "contact" },
];

export function matchIntent(raw: string): Scene | null {
  const t = " " + raw.toLowerCase().trim() + " ";
  let best: Scene | null = null;
  let bestScore = 0;
  for (const route of Object.keys(INTENTS) as Scene[]) {
    let score = 0;
    for (const k of INTENTS[route].kw) {
      if (t.includes(" " + k) || t.includes(k + " ") || t.includes(k)) {
        score += k.length > 4 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = route;
    }
  }
  return bestScore > 0 ? best : null;
}
