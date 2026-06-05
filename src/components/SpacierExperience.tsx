"use client";

/* ============================================================
   SPACIER — the interactive studio experience
   Cinematic full-screen scenes the avatar-orb moves you between,
   a docking command console, custom cursor, synthesized ambient
   audio, keyword intent routing, and WebXR detection.

   Markup mirrors the design bundle's Spacier.html; the behavior
   ports app.js into idiomatic React (state for DOM-level UI,
   imperative refs for the Three.js orb / audio / cursor loops).
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createOrb, type OrbApi } from "@/lib/orb";
import { createAmbientAudio, type AmbientAudio } from "@/lib/audio";
import {
  INTENTS,
  LABELS,
  ORDER,
  SUGGEST,
  matchIntent,
  matchSmallTalk,
  type Scene,
} from "@/lib/intents";
import {
  PUBLIC_PROJECTS,
  PIN_PROJECTS,
  WORK_PIN,
  prettyHost,
  type Project,
} from "@/lib/projects";

interface XrState {
  mode: "ar" | "vr" | null;
  label: string;
  disabled: boolean;
  title?: string;
}

export default function SpacierExperience() {
  const [scene, setScene] = useState<Scene>("home");
  const [reply, setReply] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [openService, setOpenService] = useState(-1);
  const [formDone, setFormDone] = useState(false);
  const [xr, setXr] = useState<XrState>({ mode: null, label: "AR / VR", disabled: false });
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [suggestOffset, setSuggestOffset] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const orbRef = useRef<OrbApi | null>(null);
  const audioRef = useRef<AmbientAudio | null>(null);
  const sceneRef = useRef<Scene>(scene);
  const reducedRef = useRef(false);
  const revertRef = useRef<number | undefined>(undefined);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suggestPausedRef = useRef(false);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  /* ---------- console reply + persistent recommendations ---------- */
  const revertSoon = useCallback((ms: number) => {
    if (revertRef.current) clearTimeout(revertRef.current);
    revertRef.current = window.setTimeout(() => setReply(null), ms);
  }, []);

  const avatarSay = useCallback((text: string | null) => {
    if (revertRef.current) clearTimeout(revertRef.current);
    setReply(text);
  }, []);

  /* rotate the recommendations strip every 3s (paused on hover) */
  const SUGGEST_VISIBLE = 4;
  useEffect(() => {
    const id = window.setInterval(() => {
      if (suggestPausedRef.current) return;
      setSuggestOffset((o) => (o + SUGGEST_VISIBLE) % SUGGEST.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  const visibleSuggest = useMemo(
    () =>
      Array.from(
        { length: Math.min(SUGGEST_VISIBLE, SUGGEST.length) },
        (_, i) => SUGGEST[(suggestOffset + i) % SUGGEST.length],
      ),
    [suggestOffset],
  );

  /* ---------- scene system ---------- */
  const activate = useCallback((name: Scene, viaUser = true) => {
    if (name === sceneRef.current) return;
    setScene(name);
    if (viaUser) audioRef.current?.tick();
  }, []);

  const step = useCallback(
    (dir: number) => {
      const i = ORDER.indexOf(sceneRef.current);
      const n = (i + dir + ORDER.length) % ORDER.length;
      activate(ORDER[n], true);
    },
    [activate],
  );

  const go = useCallback(
    (route: Scene) => {
      orbRef.current?.pulse();
      activate(route, true);
      if (route === "home") {
        avatarSay(null);
        return;
      }
      avatarSay(INTENTS[route].say);
      revertSoon(5000);
    },
    [activate, avatarSay, revertSoon],
  );

  const submitPrompt = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      orbRef.current?.pulse();
      // greetings / casual chat first — reply warmly, don't navigate
      const chat = matchSmallTalk(text);
      if (chat) {
        avatarSay(chat);
        revertSoon(6000);
        return;
      }
      const route = matchIntent(text);
      if (route) {
        avatarSay(INTENTS[route].say);
        window.setTimeout(() => activate(route, true), reducedRef.current ? 0 : 480);
        revertSoon(5200);
      } else {
        avatarSay("Hmm, didn't quite catch that — pick one below or rephrase.");
        revertSoon(6000);
      }
    },
    [activate, avatarSay, revertSoon],
  );

  /* side effects on scene change: scroll reset, orb dock, deep-link hash */
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`.scene[data-scene="${scene}"]`);
    if (el) el.scrollTop = 0;
    orbRef.current?.focusScene(scene !== "home");
    const hash = "#" + scene;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }, [scene]);

  /* expandable service rows — animate max-height to measured content */
  useEffect(() => {
    bodyRefs.current.forEach((el, idx) => {
      if (!el) return;
      el.style.maxHeight = idx === openService ? el.scrollHeight + "px" : "0px";
    });
  }, [openService]);

  /* ---------- orb boot ---------- */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;
    document.body.classList.add("experience-active");

    let orb: OrbApi | null = null;
    if (canvasRef.current) orb = createOrb(canvasRef.current);
    if (!orb) document.body.classList.add("no-webgl");
    else if (reduced) orb.setReduced(true);
    orbRef.current = orb;

    return () => {
      orb?.destroy();
      orbRef.current = null;
      document.body.classList.remove("experience-active", "no-webgl");
    };
  }, []);

  /* ---------- ambient audio manager (context built lazily on toggle) ---------- */
  useEffect(() => {
    audioRef.current = createAmbientAudio();
    return () => {
      audioRef.current = null;
    };
  }, []);

  /* ---------- custom cursor ---------- */
  useEffect(() => {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      rx = mx,
      ry = my,
      raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      orbRef.current?.setMouse((mx / window.innerWidth) * 2 - 1, -((my / window.innerHeight) * 2 - 1));
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    const hov = "a,button,input,textarea,.card,.svc-row .top,[data-hover]";
    const over = (e: Event) => {
      if ((e.target as Element).closest?.(hov)) document.body.classList.add("cursor-hover");
    };
    const out = (e: Event) => {
      if ((e.target as Element).closest?.(hov)) document.body.classList.remove("cursor-hover");
    };
    const down = () => document.body.classList.add("cursor-down");
    const up = () => document.body.classList.remove("cursor-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
    };
  }, []);

  /* ---------- WebXR detection ---------- */
  useEffect(() => {
    let cancelled = false;
    const xrnav = (
      navigator as unknown as { xr?: { isSessionSupported(m: string): Promise<boolean> } }
    ).xr;
    (async () => {
      let mode: "ar" | "vr" | null = null;
      if (xrnav) {
        try {
          if (await xrnav.isSessionSupported("immersive-ar")) mode = "ar";
        } catch {
          /* unsupported */
        }
        if (!mode) {
          try {
            if (await xrnav.isSessionSupported("immersive-vr")) mode = "vr";
          } catch {
            /* unsupported */
          }
        }
      }
      if (cancelled) return;
      if (mode === "ar") setXr({ mode, label: "View in AR", disabled: false });
      else if (mode === "vr") setXr({ mode, label: "Enter VR", disabled: false });
      else
        setXr({
          mode: null,
          label: "AR / VR",
          disabled: true,
          title: "Immersive mode needs a WebXR-capable device",
        });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- deep link ---------- */
  useEffect(() => {
    const h = (location.hash || "").replace("#", "");
    if ((ORDER as string[]).includes(h) && h !== "home") setScene(h as Scene);
  }, []);

  /* ---------- keyboard nav ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && t.matches?.("input,textarea")) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") go("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go]);

  /* ---------- handlers ---------- */
  const onPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputRef.current?.value ?? "";
    submitPrompt(v);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSuggest = (phrase: string) => {
    if (inputRef.current) inputRef.current.value = phrase;
    submitPrompt(phrase);
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleSound = () => {
    const on = audioRef.current?.toggle() ?? false;
    setSoundOn(on);
  };

  const onXr = () => {
    if (!xr.mode) {
      avatarSay("Your device doesn't support immersive AR/VR — everything else still works.");
      revertSoon(5000);
      return;
    }
    avatarSay(`${xr.mode.toUpperCase()} session would launch here on a supported build.`);
    revertSoon(4500);
  };

  const toggleService = (i: number) => {
    setOpenService((p) => (p === i ? -1 : i));
    audioRef.current?.tick();
  };

  const cardPulse = () => {
    orbRef.current?.pulse();
    audioRef.current?.tick();
  };

  const onGatedCard = () => {
    cardPulse();
    avatarSay("That one's access-gated — happy to walk you through it on a call.");
    revertSoon(5000);
  };

  const onContact = (e: React.FormEvent) => {
    e.preventDefault();
    setFormDone(true);
    avatarSay("Got it — I’ll be in touch. Let’s build the next.");
    revertSoon(6000);
    orbRef.current?.pulse();
    audioRef.current?.tick();
  };

  const onUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const value = (pinRef.current?.value ?? "").trim();
    if (!value) return;
    cardPulse();
    if (value === WORK_PIN) {
      setUnlocked(true);
      setPinError("");
      avatarSay("Unlocked — here's the rest of the work.");
      revertSoon(4000);
    } else {
      setPinError("That PIN didn't work. Try again.");
    }
    if (pinRef.current) pinRef.current.value = "";
  };

  const renderProjectCard = (p: Project, num: string) => {
    const isPrivate = !p.url; // no public URL → "private / on request" tile
    const body = (
      <>
        <div className="frame">
          {p.image ? (
            <Image
              src={p.image}
              alt={`${p.name} — website`}
              fill
              sizes="(max-width:880px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="ph">
              <div className="glyph">
                <span>{isPrivate ? "Private" : "Project shot"}</span>
              </div>
            </div>
          )}
          <div className="cap">{isPrivate ? "Private — on request" : `${prettyHost(p.url)} ↗`}</div>
        </div>
        <div className="row">
          <span className="name">{p.name}</span>
          <span className="tag">{p.tag}</span>
        </div>
        <p className="res">{p.blurb}</p>
        <span className="num">{num}</span>
      </>
    );
    const cls = `card${p.size ? " " + p.size : ""}`;
    if (isPrivate) {
      return (
        <article className={cls} key={p.id} onClick={onGatedCard}>
          {body}
        </article>
      );
    }
    return (
      <a
        className={cls}
        key={p.id}
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={cardPulse}
      >
        {body}
      </a>
    );
  };

  const consoleClass = scene === "home" ? "home" : "docked";

  return (
    <>
      {/* custom cursor */}
      <div id="cursor-dot" />
      <div id="cursor-ring" />

      {/* WebGL avatar + fallback */}
      <canvas id="orb-canvas" ref={canvasRef} />
      <div id="orb-fallback">
        <div className="blob" />
      </div>
      <div id="grain" />
      <div className="vignette" />

      {/* top bar */}
      <header id="topbar">
        <a
          className="wordmark"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          SPACIE<span className="reg">R</span>
        </a>
        <div className="top-right">
          <button
            className={`chip${soundOn ? " on" : ""}`}
            aria-pressed={soundOn}
            onClick={toggleSound}
          >
            <span className="dot" />
            Sound <span className="lbl">{soundOn ? "On" : "Off"}</span>
          </button>
          <button className="chip" id="xr-btn" disabled={xr.disabled} title={xr.title} onClick={onXr}>
            <span className="ic">◉</span> <span className="lbl">{xr.label}</span>
          </button>
        </div>
      </header>

      {/* side nav */}
      <nav id="sidenav" aria-label="Sections">
        <ol>
          {(
            [
              ["work", "01", "Work"],
              ["services", "02", "Services"],
              ["process", "03", "Process"],
              ["about", "04", "About"],
              ["contact", "05", "Contact"],
            ] as [Scene, string, string][]
          ).map(([route, idx, label]) => (
            <li key={route}>
              <button
                className={scene === route ? "active" : undefined}
                onClick={() => go(route)}
              >
                <span className="idx">{idx}</span> {label} <span className="bar" />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* scenes */}
      <main id="scenes">
        {/* HOME */}
        <section
          className={`scene${scene === "home" ? " active" : ""}`}
          data-scene="home"
          data-screen-label="Home"
        >
          <div
            className="home-copy active-pass"
            style={{ padding: "clamp(92px,12vh,150px) clamp(18px,5vw,64px) 0" }}
          >
            <span className="eyebrow">Spacier · Solo web studio · Taipei</span>
            <h1 className="h1" id="home-headline">
              I build the next
              <br />
              <em>storefronts &amp; web apps.</em>
            </h1>
            <p className="sub">
              Talk to the studio — ask for work, what I build, or just say hi. Or take the nav.
            </p>
          </div>
        </section>

        {/* WORK */}
        <section
          className={`scene${scene === "work" ? " active" : ""}`}
          data-scene="work"
          data-screen-label="Work"
        >
          <div className="work-head">
            <span className="eyebrow reveal">Selected work · 01</span>
            <div className="marquee reveal">
              <div className="track">
                <span className="display">
                  Storefronts — Web apps — <em>Commerce</em> — Headless —{" "}
                </span>
                <span className="display">
                  Storefronts — Web apps — <em>Commerce</em> — Headless —{" "}
                </span>
              </div>
            </div>
            <div className="work-meta reveal">
              <p>
                Selected work — brand sites, storefronts and web apps, built on Next.js with a
                headless TYPO3 CMS. Click any card to view it live.
              </p>
            </div>
          </div>

          <div className="work-grid">
            {PUBLIC_PROJECTS.map((p, i) =>
              renderProjectCard(p, String(i + 1).padStart(2, "0")),
            )}

            {unlocked ? (
              PIN_PROJECTS.map((p, i) =>
                renderProjectCard(p, String(PUBLIC_PROJECTS.length + i + 1).padStart(2, "0")),
              )
            ) : (
              /* PIN gate — the rest of the work is hidden until unlocked */
              <form className="card locked sm" onSubmit={onUnlock}>
                <div className="frame">
                  <div className="ph">
                    <div className="glyph">
                      <span>◆ Protected</span>
                    </div>
                  </div>
                  <div className="cap">{PIN_PROJECTS.length} more · PIN required</div>
                </div>
                <div className="row">
                  <span className="name">Private work</span>
                  <span className="tag">Locked</span>
                </div>
                <div className="pin-row">
                  <input
                    ref={pinRef}
                    className="pin-input"
                    type="password"
                    inputMode="numeric"
                    placeholder="Enter PIN"
                    aria-label="PIN to view private work"
                    autoComplete="off"
                  />
                  <button className="pin-btn" type="submit">
                    Unlock
                  </button>
                </div>
                <p className="res">
                  {pinError || "More client work is private. Enter the PIN to view it."}
                </p>
              </form>
            )}

            {/* CTA card — fills the grid and starts a project */}
            <button className="card cta" type="button" onClick={() => go("contact")}>
              <div className="frame">
                <div className="ph">
                  <div className="glyph">
                    <span>+ Your project</span>
                  </div>
                </div>
                <div className="cap">let&apos;s build →</div>
              </div>
              <div className="row">
                <span className="name">Start your own</span>
                <span className="tag">Contact</span>
              </div>
              <p className="res">
                Storefront, brand site or web app — tell me what you&apos;re making.
              </p>
              <span className="num">→</span>
            </button>
          </div>
        </section>

        {/* SERVICES */}
        <section
          className={`scene${scene === "services" ? " active" : ""}`}
          data-scene="services"
          data-screen-label="Services"
        >
          <div className="svc-head">
            <span className="eyebrow reveal">What I build · 02</span>
            <h2 className="h2 reveal" style={{ marginTop: 16, maxWidth: "16ch" }}>
              Three lanes. Built end&#8209;to&#8209;end.
            </h2>
          </div>
          <div className="svc-list reveal">
            {(
              [
                {
                  no: "01",
                  ttl: "Content Commerce",
                  flag: "Flagship",
                  p: "Storefronts where editorial and shopping are the same surface — story pages, lookbooks and product woven together on a headless CMS so the team ships content without a developer.",
                  stk: ["Next.js · App Router", "Headless CMS", "Shopify / custom checkout", "Edge-fast, SEO-clean"],
                },
                {
                  no: "02",
                  ttl: "Gamified Commerce",
                  flag: "",
                  p: "Points, streaks, tiers and rewards that turn one-off buyers into regulars — playful mechanics layered onto a real store, measured against repeat-purchase and session metrics.",
                  stk: ["Loyalty & rewards engine", "Laravel / PHP backend", "Realtime state", "A/B-ready"],
                },
                {
                  no: "03",
                  ttl: "LINE Official Store",
                  flag: "",
                  p: "For the Taiwan & Asia market — a LINE-native shopping and messaging funnel: rich menus, in-chat catalog and a storefront that meets customers where they already are.",
                  stk: ["LINE Official Account", "LIFF storefront", "Messaging funnel", "Localized UX"],
                },
              ] as { no: string; ttl: string; flag: string; p: string; stk: string[] }[]
            ).map((row, i) => (
              <div className={`svc-row${openService === i ? " open" : ""}`} key={row.no}>
                <div className="top" onClick={() => toggleService(i)}>
                  <span className="no">{row.no}</span>
                  <span className="ttl">{row.ttl}</span>
                  <span className="flag">{row.flag}</span>
                  <span className="pm" />
                </div>
                <div
                  className="body"
                  ref={(el) => {
                    bodyRefs.current[i] = el;
                  }}
                >
                  <div className="inner">
                    <p>{row.p}</p>
                    <div className="stk">
                      {row.stk.map((s, j) => (
                        <span key={j}>
                          {s}
                          {j < row.stk.length - 1 ? <br /> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section
          className={`scene${scene === "process" ? " active" : ""}`}
          data-scene="process"
          data-screen-label="Process"
        >
          <span className="eyebrow reveal">How I work · 03</span>
          <h2 className="h2 reveal" style={{ marginTop: 16, maxWidth: "18ch" }}>
            Scope, design, build, hand off. No drama.
          </h2>
          <div className="proc-grid">
            {(
              [
                ["01", "Scope", "One call to map the goal, the stack and the edge cases. Fixed shape before a line of code."],
                ["02", "Design", "Direction, motion and the key screens — wired to your brand, not a template."],
                ["03", "Build", "Modern, fast, typed. Next.js or Laravel, headless content, shipped in the open."],
                ["04", "Launch", "Launch, measure, hand off clean. Docs and a codebase your team can run."],
              ] as [string, string, string][]
            ).map(([pnum, pt, p]) => (
              <div className="proc-step reveal" key={pnum}>
                <div className="pnum">{pnum}</div>
                <div className="pt">{pt}</div>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section
          className={`scene${scene === "about" ? " active" : ""}`}
          data-scene="about"
          data-screen-label="About"
        >
          <div className="about-wrap">
            <div className="about-portrait reveal">
              <div className="ph" />
              <div className="cap">Portrait — Pascal</div>
            </div>
            <div className="about-copy reveal">
              <span className="eyebrow">About · 04</span>
              <h2 className="h2">Hi, I&apos;m Pascal.</h2>
              <p>
                A web-app developer and master&apos;s student at Taipei Tech, Taiwan. Spacier is my
                solo studio — a sharp one-person shop for brands that want a site that actually
                performs.
              </p>
              <p>
                I build in public, sweat the motion, and care about the boring parts: speed,
                accessibility, a codebase your team can live with. Globally capable, with a real Asia
                edge.
              </p>
              <div className="about-tags">
                <span>Next.js</span>
                <span>Laravel / PHP</span>
                <span>Headless CMS</span>
                <span>Three.js</span>
                <span>Taipei Tech · M.S.</span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section
          className={`scene${scene === "contact" ? " active" : ""}`}
          data-scene="contact"
          data-screen-label="Contact"
        >
          <div className="contact-wrap">
            <div className="contact-left reveal">
              <h2 className="display">
                Let&apos;s build
                <br />
                <em>the next.</em>
              </h2>
              <p>
                Tell me what you&apos;re making. Storefront, web app, or something stranger — I read
                everything.
              </p>
              <div className="contact-foot">
                <a href="mailto:hello@spacier.studio" data-hover>
                  hello@spacier.studio
                </a>
                <Link href="/brand" data-hover>
                  Brand system →
                </Link>
                <span>Taipei · Worldwide</span>
              </div>
            </div>
            <form className="contact-right reveal" noValidate onSubmit={onContact}>
              <div className="field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" type="text" placeholder="Your name" autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="c-email">Email</label>
                <input id="c-email" type="email" placeholder="you@company.com" autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="c-brief">What are you building?</label>
                <textarea id="c-brief" rows={3} placeholder="A few lines about the project…" />
              </div>
              <button className="btn-primary" type="submit">
                Send it <span className="arr">→</span>
              </button>
              <div className={`form-done${formDone ? " show" : ""}`}>
                Sent. Pascal will be in touch shortly.
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* console / command bar (docks) */}
      <div id="console" className={consoleClass}>
        <div id="avatar-reply" className="show">
          {reply ? <div className="reply-line">{reply}</div> : null}
          <div
            className="suggest-row"
            onMouseEnter={() => (suggestPausedRef.current = true)}
            onMouseLeave={() => (suggestPausedRef.current = false)}
          >
            <span className="suggest-lead">{reply ? "Or try" : "Try asking"}</span>
            {visibleSuggest.map((s) => (
              <button key={s.p} className="sugg" onClick={() => onSuggest(s.p)}>
                {s.p}
              </button>
            ))}
          </div>
        </div>
        <form id="prompt-form" autoComplete="off" onSubmit={onPromptSubmit}>
          <button
            id="console-avatar"
            type="button"
            aria-label="Avatar — back to home"
            onClick={() => {
              if (sceneRef.current !== "home") go("home");
              else orbRef.current?.pulse();
            }}
          />
          <input
            id="prompt-input"
            ref={inputRef}
            type="text"
            placeholder="Ask Spacier anything…"
            aria-label="Ask Spacier anything"
            onFocus={() => orbRef.current?.setAttention(1)}
            onBlur={() => orbRef.current?.setAttention(0)}
            onInput={() => orbRef.current?.nudge()}
          />
          <div id="console-controls">
            <button className="cc-btn" id="cc-prev" type="button" aria-label="Previous scene" onClick={() => step(-1)}>
              ‹
            </button>
            <span id="scene-label" className="lbl-wrap">
              <b>{LABELS[scene]}</b>
            </span>
            <button className="cc-btn" id="cc-next" type="button" aria-label="Next scene" onClick={() => step(1)}>
              ›
            </button>
            <button
              className={`cc-btn${soundOn ? " on" : ""}`}
              type="button"
              aria-label="Toggle sound"
              onClick={toggleSound}
            >
              <span className="ic">♪</span>
            </button>
          </div>
          <button id="prompt-send" type="submit" aria-label="Send">
            ↵
          </button>
        </form>
      </div>

      <noscript>
        <div className="noscript-fallback">
          Spacier — a solo web studio in Taipei. Enable JavaScript for the full experience, or email
          hello@spacier.studio.
        </div>
      </noscript>
    </>
  );
}
