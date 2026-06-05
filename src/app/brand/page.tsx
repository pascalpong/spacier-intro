import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrbMark } from "@/components/OrbMark";
import styles from "./brand.module.css";

export const metadata: Metadata = {
  title: "Spacier — Brand System",
  description: "The Spacier identity: the orb mark, wordmark lockups, color, type, and favicon.",
};

function Wordmark() {
  return (
    <span className={styles.wm}>
      SPACIE<span className={styles.r}>R</span>
    </span>
  );
}

export default function BrandPage() {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.wordmark} href="/">
          SPACIE<span className={styles.r}>R</span>
        </Link>
        <nav>
          <a href="#mark">Mark</a>
          <a href="#logo">Logo</a>
          <a href="#color">Color</a>
          <a href="#type">Type</a>
          <a href="#icon">Favicon</a>
        </nav>
      </header>

      <main className={styles.wrap}>
        {/* HERO */}
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Brand system · v1</span>
            <h1 className={styles.disp} style={{ marginTop: 20 }}>
              One orb.
              <br />
              One <em>signal.</em>
            </h1>
            <p>
              Spacier is a solo web studio. The identity is built from a single idea — a living,
              glossy orb on a cinematic black field, cut with one acid-lime signal. Restraint
              everywhere, so the craft does the talking.
            </p>
          </div>
          <div className={styles.orbwrap}>
            <OrbMark size={340} uid="hero" />
          </div>
        </section>

        {/* MARK */}
        <section className={styles.block} id="mark">
          <div className={styles.sechead}>
            <h2>The mark</h2>
            <span className={styles.no}>01 / Mark</span>
          </div>
          <p className={styles.lead}>
            The orb is the brand. A dark iridescent sphere with a single specular highlight and a lime
            rim — the same form that anchors the site. Use it as the standalone symbol wherever the
            wordmark won&apos;t fit.
          </p>
          <div className={`${styles.grid} ${styles.g3}`} style={{ marginTop: 32 }}>
            <div>
              <div className={`${styles.showcard} ${styles.panelDark}`}>
                <OrbMark size={120} uid="mk1" />
              </div>
              <div className={styles.cap}>On black — primary</div>
            </div>
            <div>
              <div className={styles.showcard} style={{ background: "var(--surface)" }}>
                <OrbMark size={120} uid="mk2" />
              </div>
              <div className={styles.cap}>On surface</div>
            </div>
            <div>
              <div className={`${styles.showcard} ${styles.panelAcc}`}>
                <div
                  style={{
                    width: 156,
                    height: 156,
                    borderRadius: "24%",
                    background: "#0a0908",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 12px 30px rgba(0,0,0,.35)",
                  }}
                >
                  <OrbMark size={120} uid="mk3" />
                </div>
              </div>
              <div className={styles.cap}>On lime — tile lockup</div>
            </div>
          </div>
        </section>

        {/* LOGO */}
        <section className={styles.block} id="logo">
          <div className={styles.sechead}>
            <h2>Logo &amp; lockups</h2>
            <span className={styles.no}>02 / Logo</span>
          </div>
          <p className={styles.lead}>
            The wordmark is set in a clean grotesque (Helvetica Now Display / Neue Haas / Inter),
            all-caps, with <b>0.3em</b> tracking and the terminal{" "}
            <span style={{ color: "var(--lime)" }}>R</span> carrying the accent. Pair it with the mark
            for the full lockup; the wordmark stands alone in tight spaces.
          </p>

          <div className={`${styles.grid} ${styles.g2}`} style={{ marginTop: 32 }}>
            <div>
              <div className={`${styles.showcard} ${styles.panelDark}`}>
                <div className={styles.lockup}>
                  <OrbMark size={56} uid="lk1" />
                  <Wordmark />
                </div>
              </div>
              <div className={styles.cap}>Horizontal lockup — primary</div>
            </div>
            <div>
              <div className={`${styles.showcard} ${styles.panelDark}`}>
                <div className={`${styles.lockup} ${styles.stack}`}>
                  <OrbMark size={64} uid="lk2" />
                  <Wordmark />
                </div>
              </div>
              <div className={styles.cap}>Stacked lockup</div>
            </div>
            <div>
              <div className={`${styles.showcard} ${styles.panelLight}`}>
                <Wordmark />
              </div>
              <div className={styles.cap}>Wordmark on light</div>
            </div>
            <div>
              <div className={`${styles.showcard} ${styles.panelAcc}`}>
                <Wordmark />
              </div>
              <div className={styles.cap}>Wordmark on accent</div>
            </div>
          </div>

          <div style={{ marginTop: 34 }}>
            <span className={styles.eyebrow}>Clearspace &amp; minimum size</span>
            <div className={`${styles.grid} ${styles.g2}`} style={{ marginTop: 18 }}>
              <div className={styles.clear}>
                <div className={styles.box}>
                  <div className={styles.lockup}>
                    <OrbMark size={48} uid="lk3" />
                    <Wordmark />
                  </div>
                </div>
              </div>
              <div
                className={styles.card}
                style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}
              >
                <p className={styles.lead}>
                  Keep clear space equal to the height of the orb mark on every side. Never crowd the
                  lockup with other elements.
                </p>
                <p className={styles.lead}>
                  <b>Minimum:</b> mark 20px · wordmark 96px wide on screen. Below that, use the mark
                  alone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COLOR */}
        <section className={styles.block} id="color">
          <div className={styles.sechead}>
            <h2>Color</h2>
            <span className={styles.no}>03 / Color</span>
          </div>
          <p className={styles.lead}>
            A cinematic monochrome base carries the work; one acid accent does the pointing. Lime
            leads (CTAs, the orb&apos;s glow, active states); orange is a rare secondary. Disciplined,
            never decorative.
          </p>
          <div className={styles.swatches} style={{ marginTop: 30 }}>
            {(
              [
                ["Black", "#0A0908"],
                ["Ink — base", "#111010"],
                ["Surface", "#1C1B1A"],
                ["Paper", "#F5F3EE"],
                ["Lime — primary", "#CCFF00"],
                ["Orange — secondary", "#FF901B"],
                ["Neutral 500", "#444444"],
                ["Neutral 300", "#8A8784"],
              ] as [string, string][]
            ).map(([nm, hex]) => (
              <div className={styles.sw} key={hex}>
                <div className={styles.chip} style={{ background: hex }} />
                <div className={styles.meta}>
                  <span className={styles.nm}>{nm}</span>
                  <span className={styles.hex}>{hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TYPE */}
        <section className={styles.block} id="type">
          <div className={styles.sechead}>
            <h2>Typography</h2>
            <span className={styles.no}>04 / Type</span>
          </div>
          <p className={styles.lead}>
            One grotesque family, worked hard. Huge fluid display with tight negative tracking for
            impact; mono for labels and system text. That contrast — humanist mass against machine
            detail — is the whole voice.
          </p>
          <div style={{ marginTop: 26 }}>
            <div className={styles.typerow}>
              <span className={styles.tDisp}>Build the next</span>
              <span className={styles.spec}>Display · 700 · -3% track</span>
            </div>
            <div className={styles.typerow}>
              <span className={styles.tH1}>Storefronts &amp; web apps</span>
              <span className={styles.spec}>H1 · clamp(40–72) · 700</span>
            </div>
            <div className={styles.typerow}>
              <span className={styles.tH2}>Scope, design, build, launch</span>
              <span className={styles.spec}>H2 · clamp(32–56) · 700</span>
            </div>
            <div className={styles.typerow}>
              <span className={styles.tBody}>
                Body copy is set at 16–18px, weight 500, line-height 1.5 — quiet and legible under the
                display.
              </span>
              <span className={styles.spec}>Body · 500 · 1.5</span>
            </div>
            <div className={styles.typerow}>
              <span className={styles.tLabel}>Eyebrow · Label · Mono</span>
              <span className={styles.spec}>Mono · 13 · 700 · .22em</span>
            </div>
          </div>
        </section>

        {/* FAVICON */}
        <section className={styles.block} id="icon">
          <div className={styles.sechead}>
            <h2>Favicon &amp; app icon</h2>
            <span className={styles.no}>05 / Icon</span>
          </div>
          <p className={styles.lead}>
            The orb on a black rounded tile — bold enough to read at 16px in a browser tab, glossy at
            512px on a home screen.
          </p>
          <div className={styles.favDemos} style={{ marginTop: 30 }}>
            <div className={styles.browser}>
              <div className={styles.bar}>
                <div className={styles.lights}>
                  <i />
                  <i />
                  <i />
                </div>
                <div className={styles.tab}>
                  <Image src="/brand/favicon-32.png" alt="favicon" width={16} height={16} /> Spacier —
                  Solo Web Studio
                </div>
              </div>
              <div className={styles.screen}>
                <Image src="/brand/icon-512.png" alt="Spacier app icon" width={74} height={74} />
              </div>
            </div>
            <div className={styles.appicons}>
              <Image src="/brand/icon-512.png" width={96} height={96} alt="" />
              <Image src="/brand/icon-512.png" width={60} height={60} alt="" />
              <Image src="/brand/favicon-32.png" width={32} height={32} alt="" />
            </div>
          </div>
        </section>

        {/* USAGE */}
        <section className={styles.block}>
          <div className={styles.sechead}>
            <h2>Usage</h2>
            <span className={styles.no}>06 / Rules</span>
          </div>
          <div className={styles.dd}>
            <div className={`${styles.item} ${styles.ok}`}>
              <div className={styles.hd}>
                <span className={styles.mk}>✓</span> Do
              </div>
              <p>
                Let the orb breathe on deep black. Keep the accent for one job per view. Track the
                display tight; keep body quiet.
              </p>
            </div>
            <div className={`${styles.item} ${styles.no}`}>
              <div className={styles.hd}>
                <span className={styles.mk}>✕</span> Don&apos;t
              </div>
              <p>
                Don&apos;t add a second accent, round the sharp corners, recolor the orb, or stretch /
                outline the wordmark.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${styles.wrap} ${styles.footer}`}>
        <span>Spacier — Solo web studio · Taipei · Worldwide</span>
        <span>
          <Link href="/">← Back to the site</Link> &nbsp;·&nbsp;{" "}
          <a href="mailto:hello@spacier.studio">hello@spacier.studio</a>
        </span>
      </footer>
    </div>
  );
}
