/* ============================================================
   SPACIER — scene model + deterministic keyword intent routing
   Free text → one of the fixed routes (no AI call). Ported from
   the design bundle (project/app.js) and broadened so whole
   sentences route well, plus a light small-talk layer so the
   avatar feels human when you just say hi.
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

/* Keywords are matched as whole words / phrases against a normalized
   prompt (lowercased, punctuation stripped). Multi-word entries let
   natural sentences — "can you build a shopify store?" — route. */
export const INTENTS: Record<Scene, Intent> = {
  work: {
    say: "Here's selected work — storefronts, web apps, the lot. Drag in.",
    kw: [
      "work", "works", "worked", "project", "projects", "portfolio", "case", "cases",
      "study", "studies", "show", "show me", "see", "look", "view", "browse", "examples",
      "example", "sample", "samples", "built", "build before", "made", "make", "recent",
      "latest", "stuff", "things", "clients", "client work", "demo", "demos", "previous",
      "past work", "showcase", "gallery", "what have you done", "what have you built",
      "your work", "some work", "live sites", "references",
    ],
  },
  services: {
    say: "This is what I build. Three lanes — pick one.",
    kw: [
      "service", "services", "offer", "offering", "offerings", "do you", "what do you",
      "can you", "could you", "do you do", "what can you", "what can you do", "build",
      "building", "make me", "create", "shopify", "store", "stores", "storefront",
      "ecommerce", "e commerce", "commerce", "cms", "headless", "line", "line oa", "app",
      "apps", "web app", "webapp", "web application", "laravel", "php", "next", "nextjs",
      "next js", "react", "website", "websites", "web site", "site", "sites", "landing",
      "landing page", "develop", "developer", "development", "code", "coding", "wordpress",
      "redesign", "rebuild", "custom", "platform", "dashboard", "saas", "integration",
      "api", "do you build", "can you make", "what do you build", "what services",
    ],
  },
  process: {
    say: "Scope → design → build → launch. Here's how I work.",
    kw: [
      "process", "how", "how do you", "how does", "how it works", "how you work",
      "steps", "step", "stages", "stage", "timeline", "timeframe", "how long",
      "work with", "working with", "workflow", "scope", "phases", "phase", "approach",
      "method", "methodology", "what happens", "what to expect", "deliver", "delivery",
      "handoff", "milestones", "way of working", "how do we start",
    ],
  },
  about: {
    say: "I'm Pascal — dev out of Taipei. Good to meet you.",
    kw: [
      "about", "about you", "who", "who are you", "who is", "your", "pascal", "yourself",
      "bio", "background", "story", "taiwan", "taipei", "tech", "stack", "your stack",
      "student", "person", "people", "behind", "behind this", "team", "experience",
      "skills", "where are you", "tell me about", "introduce", "introduction",
    ],
  },
  contact: {
    say: "Let's build it. Tell me what you've got.",
    kw: [
      "contact", "hire", "hire you", "email", "talk", "lets talk", "let us talk", "reach",
      "reach out", "quote", "price", "pricing", "cost", "costs", "how much", "rate",
      "rates", "budget", "estimate", "start", "started", "get started", "begin", "brief",
      "book", "booking", "call", "schedule", "meeting", "message", "dm", "get in touch",
      "in touch", "collab", "collaborate", "work together", "lets work", "i need",
      "i want", "i have a project", "looking for", "available", "availability", "free",
      "interested", "enquire", "inquiry", "enquiry",
    ],
  },
  home: {
    say: "Back to center.",
    kw: ["home", "back", "start over", "avatar", "center", "centre", "main", "top", "reset"],
  },
};

/* ---------- small talk: humane replies, no navigation ----------
   Single-word triggers only fire on short messages so they don't
   hijack real queries ("hey, can you build a store?"); multi-word
   phrases match within slightly longer messages. */
interface SmallTalk {
  kw: string[];
  replies: string[];
}

export const SMALL_TALK: SmallTalk[] = [
  {
    // greetings
    kw: [
      "hi", "hii", "hiya", "hello", "helo", "hey", "heya", "hey there", "yo", "sup",
      "howdy", "hola", "good morning", "good afternoon", "good evening", "greetings",
      "morning", "evening",
    ],
    replies: [
      "Hey — good to have you. Ask for my work, what I build, or how I work.",
      "Hi there. Want to see the work, the services, or how a project runs?",
      "Hello. I'm Spacier's avatar — say what you're after and I'll take you there.",
    ],
  },
  {
    // how are you
    kw: [
      "how are you", "how are u", "how r u", "hows it going", "how is it going",
      "how are things", "how do you do", "you good", "you ok", "you alright",
      "whats up", "what is up", "wassup",
    ],
    replies: [
      "Running smooth, thanks for asking. What can I show you — work, services, or process?",
      "All good here. What brings you in — a project, or just looking around?",
    ],
  },
  {
    // who / what are you
    kw: [
      "what are you", "are you a bot", "are you ai", "are you real", "are you human",
      "your name", "whats your name", "what is your name", "who made you",
    ],
    replies: [
      "I'm Spacier's avatar — Pascal's studio guide. Ask me about the work or what I build.",
      "Just the friendly front desk for Spacier. Type what you need and I'll route you.",
    ],
  },
  {
    // thanks
    kw: ["thanks", "thank you", "thank u", "thx", "ty", "cheers", "appreciate it", "much appreciated"],
    replies: [
      "Anytime. Want to see the work, or talk about a project?",
      "You're welcome. I'm here if you want to dig into anything.",
    ],
  },
  {
    // goodbye
    kw: ["bye", "goodbye", "good bye", "see you", "see ya", "cya", "later", "im out", "gtg"],
    replies: [
      "Catch you later. hello@spacier.studio if anything comes up.",
      "Take care. The door's open whenever you want to start something.",
    ],
  },
  {
    // compliments
    kw: [
      "nice", "cool", "awesome", "amazing", "beautiful", "love it", "love this", "slick",
      "dope", "sick", "wow", "impressive", "gorgeous", "clean", "this is great",
    ],
    replies: [
      "Appreciate it — built to feel exactly like that. Want to see what I make for clients?",
      "Thanks. That's the idea. Take a look at the work, or tell me what you're building.",
    ],
  },
  {
    // affirmations
    kw: ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "sounds good", "go on"],
    replies: [
      "Cool — what would you like to see? Work, services, or process?",
      "Great. Point me anywhere — try \"show me your work\" or \"how do you work?\"",
    ],
  },
  {
    // help / confused
    kw: [
      "help", "what can i do", "what is this", "what do i do", "how does this work",
      "options", "menu", "im lost", "confused", "what now", "guide me",
    ],
    replies: [
      "Type what you're after — like \"show me your work\" or \"can you build a store?\" Or use the arrows.",
      "Just talk to me. Ask about work, services, process, or pricing — I'll take you there.",
    ],
  },
];

/* Rotating recommendation pool — the strip cycles through these. */
export const SUGGEST: { p: string; r: Scene }[] = [
  { p: "Show me your work", r: "work" },
  { p: "What can you build?", r: "services" },
  { p: "How do you work?", r: "process" },
  { p: "Start a project", r: "contact" },
  { p: "Can you build a Shopify store?", r: "services" },
  { p: "Who's behind this?", r: "about" },
  { p: "How much does a site cost?", r: "contact" },
  { p: "Show me recent projects", r: "work" },
  { p: "Do you build web apps?", r: "services" },
  { p: "What's your process?", r: "process" },
  { p: "I have a project in mind", r: "contact" },
  { p: "Tell me about Pascal", r: "about" },
];

/* Normalize to a padded, lowercased, punctuation-free string so
   whole-word and phrase matching is reliable. */
function normalize(raw: string): string {
  return " " + raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ") + " ";
}

function pickReply(replies: string[]): string {
  return replies[Math.floor(Math.random() * replies.length)];
}

/* Returns a friendly reply for greetings / casual chat, or null.
   Single-word triggers only fire on short messages so real queries
   that happen to start with "hi" or "hey" still route. */
export function matchSmallTalk(raw: string): string | null {
  const t = normalize(raw);
  const wordCount = t.trim() ? t.trim().split(" ").length : 0;
  for (const group of SMALL_TALK) {
    for (const k of group.kw) {
      const phrase = k.includes(" ");
      const cap = phrase ? 6 : 2;
      if (wordCount <= cap && t.includes(" " + k + " ")) {
        return pickReply(group.replies);
      }
    }
  }
  return null;
}

export function matchIntent(raw: string): Scene | null {
  const t = normalize(raw);
  let best: Scene | null = null;
  let bestScore = 0;
  for (const route of Object.keys(INTENTS) as Scene[]) {
    let score = 0;
    for (const k of INTENTS[route].kw) {
      if (t.includes(" " + k + " ")) {
        // longer / multi-word matches are stronger signals
        score += k.includes(" ") ? 3 : k.length > 4 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = route;
    }
  }
  return bestScore > 0 ? best : null;
}
