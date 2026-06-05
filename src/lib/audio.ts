/* ============================================================
   SPACIER — synthesized ambient audio
   A soft low drone (four detuned oscillators through a lowpass)
   plus short UI ticks on interaction. Muted by default; built
   lazily on first toggle so it respects the browser autoplay
   policy. Ported from the design bundle (project/app.js).
   ============================================================ */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export interface AmbientAudio {
  toggle(): boolean;
  tick(): void;
  isOn(): boolean;
}

export function createAmbientAudio(): AmbientAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let on = false;
  const nodes: OscillatorNode[] = [];

  function build() {
    const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 540;
    lp.Q.value = 0.7;
    lp.connect(master);
    const freqs = [55, 82.4, 110, 164.8];
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f * (1 + (i - 1.5) * 0.004);
      const g = ctx!.createGain();
      g.gain.value = 0.16 / (i + 1);
      const lfo = ctx!.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx!.createGain();
      lg.gain.value = 0.05;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(lp);
      o.start();
      lfo.start();
      nodes.push(o, lfo);
    });
  }

  function toggle(): boolean {
    if (!ctx) build();
    if (ctx!.state === "suspended") ctx!.resume();
    on = !on;
    master!.gain.cancelScheduledValues(ctx!.currentTime);
    master!.gain.linearRampToValueAtTime(on ? 0.5 : 0.0001, ctx!.currentTime + 0.8);
    return on;
  }

  function tick() {
    if (!ctx || !on || !master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(master);
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.08, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.start(t);
    o.stop(t + 0.14);
  }

  return { toggle, tick, isOn: () => on };
}
