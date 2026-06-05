/* ============================================================
   SPACIER — selected work
   The Work grid renders from this file. One project is shown
   publicly (Soluna); the rest are marked `pin: true` and stay
   hidden until the visitor enters the PIN.

   NOTE — this is a *soft* gate: the check happens in the browser,
   so the gated names/screenshots are technically present in the
   built site for someone who digs through the source. It keeps
   the work off the visible portfolio for normal visitors and
   lets you share it with a PIN — it is NOT real access control.
   Confirm attribution with your employer before going live.
   ============================================================ */

export interface Project {
  id: string;
  name: string;
  /** short category, shown as the accent mono tag */
  tag: string;
  /** one factual line about what it is */
  blurb: string;
  /** grid emphasis within the 12-col layout */
  size: "lg" | "sm" | "";
  /** live public URL — omitted renders a "private" tile (no link) */
  url?: string;
  /** /work/<id>.jpg screenshot; omit → placeholder tile */
  image?: string;
  /** hidden until the PIN is entered */
  pin?: boolean;
}

/** Visitor-facing PIN that reveals the gated work (soft gate). */
export const WORK_PIN = "1212312123";

export const PROJECTS: Project[] = [
  {
    id: "soluna",
    name: "Soluna Zürich",
    tag: "Culture · Events",
    blurb:
      "Minimal, date-led site for a Zürich exhibition & event space. Next.js + headless TYPO3.",
    size: "lg",
    url: "https://www.soluna-zurich.ch/",
    image: "/work/soluna.jpg",
  },
  {
    id: "sony",
    name: "Sony Slider",
    tag: "Interaction · UI",
    blurb:
      "A swipeable, full-screen content slider — mixed-media cards (image, video, news) with motion.",
    size: "sm",
    url: "https://sony-slider.vercel.app/",
    image: "/work/sony.jpg",
  },
  {
    id: "adriatique",
    name: "Adriatique",
    tag: "Artist · Events",
    blurb:
      "Official site for the Swiss electronic duo — tour dates, releases and shop on a headless CMS.",
    size: "lg",
    url: "https://www.adriatique.ch/",
    image: "/work/adriatique.jpg",
    pin: true,
  },
  {
    id: "serapyavuz",
    name: "Serap Yavuz",
    tag: "Personal Brand",
    blurb: "Personal brand site for a moderator & health coach — services, content and booking.",
    size: "sm",
    url: "https://www.serapyavuz.com/",
    image: "/work/serapyavuz.jpg",
    pin: true,
  },
  {
    id: "20min",
    name: "20 Minuten Advertising",
    tag: "Media · Sales",
    blurb:
      "Advertising portal for Switzerland's largest news outlet — Next.js front end on a TYPO3 backend.",
    size: "lg",
    url: "https://advertising.20min.ch/",
    image: "/work/20min.jpg",
    pin: true,
  },
  {
    id: "rockstar",
    name: "Rockstar Entertainment",
    tag: "Nightlife · Group",
    blurb:
      "Cinematic, full-screen brand experience for the entertainment group. Access-gated — shown on request.",
    size: "",
    pin: true,
  },
];

export const PUBLIC_PROJECTS = PROJECTS.filter((p) => !p.pin);
export const PIN_PROJECTS = PROJECTS.filter((p) => p.pin);

/** Pretty host for a card caption, e.g. "soluna-zurich.ch ↗". */
export function prettyHost(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}
