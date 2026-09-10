// Procedural WebAudio SFX + music. No external audio files required —
// everything is synthesized so the game is self-contained and lightweight.

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let currentMusicNodes: { stop: () => void } | null = null;
let muted = false;
const BASE_MUSIC = 0.52;
const BASE_SFX = 1.0;
let musicVol = 0.8;
let sfxVol = 1.0;
let lifecycleBound = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    musicGain = ctx.createGain();
    musicGain.gain.value = BASE_MUSIC * musicVol;
    musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = BASE_SFX * sfxVol;
    sfxGain.connect(ctx.destination);
  }
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();
}

// Pause all audio when the app is minimized/backgrounded, resume on return.
export function initAudioLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;
  const onVis = () => {
    if (!ctx) return;
    if (document.hidden) {
      void ctx.suspend();
    } else if (!muted) {
      void ctx.resume();
    }
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("blur", () => {
    if (ctx) void ctx.suspend();
  });
  window.addEventListener("focus", () => {
    if (ctx && !muted && !document.hidden) void ctx.resume();
  });
}

export function setMuted(v: boolean) {
  muted = v;
  if (musicGain) musicGain.gain.value = v ? 0 : BASE_MUSIC * musicVol;
  if (sfxGain) sfxGain.gain.value = v ? 0 : BASE_SFX * sfxVol;
}

export function setMusicVolume(v: number) {
  musicVol = Math.max(0, Math.min(1, v));
  if (musicGain && !muted) musicGain.gain.value = BASE_MUSIC * musicVol;
}

export function setSfxVolume(v: number) {
  sfxVol = Math.max(0, Math.min(1, v));
  if (sfxGain && !muted) sfxGain.gain.value = BASE_SFX * sfxVol;
}

export function isMuted() {
  return muted;
}

function envGain(c: AudioContext, dest: AudioNode, attack: number, decay: number, peak = 1) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(peak, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + attack + decay);
  g.connect(dest);
  return g;
}

function tone(freq: number, dur: number, type: OscillatorType, attack = 0.005, peak = 0.6) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  const g = envGain(c, sfxGain!, attack, dur, peak);
  osc.connect(g);
  osc.start();
  osc.stop(c.currentTime + attack + dur + 0.05);
}

function sweep(f0: number, f1: number, dur: number, type: OscillatorType, peak = 0.5) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), c.currentTime + dur);
  const g = envGain(c, sfxGain!, 0.005, dur, peak);
  osc.connect(g);
  osc.start();
  osc.stop(c.currentTime + dur + 0.05);
}

function noiseBurst(dur: number, peak = 0.4, filterFreq = 2000) {
  if (muted) return;
  const c = getCtx();
  const bufferSize = c.sampleRate * dur;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = envGain(c, sfxGain!, 0.001, dur, peak);
  src.connect(filter);
  filter.connect(g);
  src.start();
}

export const sfx = {
  jump: () => sweep(320, 620, 0.14, "square", 0.35),
  land: () => noiseBurst(0.08, 0.25, 900),
  doubleTap: () => tone(880, 0.05, "sine", 0.001, 0.2),
  shard: () => {
    tone(1046, 0.09, "sine", 0.001, 0.3);
    setTimeout(() => tone(1568, 0.12, "sine", 0.001, 0.28), 60);
  },
  death: () => {
    sweep(500, 60, 0.35, "sawtooth", 0.4);
    noiseBurst(0.3, 0.3, 500);
  },
  // Unique premium death stingers per lethal obstacle family.
  deathSpike: () => {
    // sharp glassy shatter — bright high transient then quick decay
    tone(2200, 0.05, "square", 0.001, 0.32);
    noiseBurst(0.16, 0.35, 3200);
    sweep(900, 140, 0.22, "sawtooth", 0.32);
  },
  deathLaser: () => {
    // stuttering digital glitch dissolve
    [1800, 900, 1500, 500].forEach((f, i) => setTimeout(() => tone(f, 0.045, "square", 0.001, 0.24), i * 45));
    noiseBurst(0.2, 0.22, 4000);
  },
  deathElectric: () => {
    // crackling zap + low boom
    noiseBurst(0.14, 0.45, 5200);
    sweep(2400, 90, 0.18, "sawtooth", 0.38);
    setTimeout(() => {
      noiseBurst(0.22, 0.4, 300);
      sweep(160, 40, 0.28, "sawtooth", 0.3);
    }, 70);
  },
  deathMimic: () => {
    // dark implosion then burst
    sweep(220, 40, 0.18, "sine", 0.3);
    setTimeout(() => {
      sweep(60, 500, 0.25, "sawtooth", 0.35);
      noiseBurst(0.25, 0.3, 700);
    }, 140);
  },
  checkpoint: () => {
    tone(660, 0.1, "triangle", 0.001, 0.3);
    setTimeout(() => tone(990, 0.14, "triangle", 0.001, 0.3), 90);
  },
  win: () => {
    [660, 880, 1108, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.18, "square", 0.001, 0.3), i * 90));
  },
  portal: () => sweep(200, 1400, 0.22, "sine", 0.3),
  laserZap: () => sweep(1600, 200, 0.12, "sawtooth", 0.35),
  electricGate: () => {
    noiseBurst(0.1, 0.3, 4500);
    sweep(2600, 300, 0.1, "sawtooth", 0.28);
  },
  crusherClunk: () => {
    noiseBurst(0.12, 0.35, 260);
    tone(90, 0.14, "square", 0.001, 0.3);
  },
  platformCollapse: () => {
    sweep(220, 50, 0.3, "sawtooth", 0.32);
    noiseBurst(0.28, 0.4, 900);
  },
  fakeCrumble: () => {
    noiseBurst(0.14, 0.22, 1600);
    sweep(700, 200, 0.14, "square", 0.2);
  },
  explode: () => {
    noiseBurst(0.25, 0.5, 1800);
    sweep(180, 40, 0.25, "sawtooth", 0.3);
  },
  trapReveal: () => sweep(200, 900, 0.3, "triangle", 0.25),
  button: () => tone(500, 0.05, "square", 0.001, 0.2),
  fakeOut: () => sweep(300, 120, 0.2, "square", 0.3),
  // World 5 — Dark Reactor: steam vent telegraph + burst
  steamHiss: () => noiseBurst(0.3, 0.18, 6000),
  steamBurst: () => {
    noiseBurst(0.22, 0.4, 5000);
    sweep(3000, 900, 0.2, "sine", 0.25);
  },
  deathSteam: () => {
    noiseBurst(0.28, 0.42, 5500);
    sweep(2600, 300, 0.3, "sine", 0.3);
  },
  // World 6 — Cyber Core: firewall sweep telegraph + traveling wall
  firewallCharge: () => tone(220, 0.12, "square", 0.001, 0.22),
  firewallSweepStart: () => sweep(180, 1200, 0.28, "sawtooth", 0.32),
  deathFirewall: () => {
    [1200, 1800, 900, 2200].forEach((f, i) => setTimeout(() => tone(f, 0.05, "square", 0.001, 0.26), i * 40));
    noiseBurst(0.22, 0.35, 3800);
  },
  // World 7 — Chaos Rift: safe zone effect toggle (gravity/reverse randomized per attempt)
  chaosWarp: () => sweep(500, 100, 0.3, "sine", 0.28),
};

// --- Looping ambient hums (started/stopped on state transitions, not per-frame) ---
// Used sparingly: gravity zones (dwell inside) and powered laser/electric gates
// (while "on"), since these are natural fits for a continuous ambient layer.
// Other obstacle families use one-shot activation/idle stingers above instead of
// a persistent drone, to keep the WebAudio node count bounded on lower-end devices.
const gateHums = new Map<string, { stop: () => void }>();
let gravityHum: { stop: () => void } | null = null;

function startHum(freq: number, gain: number, type: OscillatorType = "sawtooth"): { stop: () => void } {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = freq * 2.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(muted ? 0 : gain, c.currentTime + 0.06);
  osc.connect(filter);
  filter.connect(g);
  g.connect(sfxGain!);
  osc.start();
  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      const c2 = getCtx();
      g.gain.cancelScheduledValues(c2.currentTime);
      g.gain.setValueAtTime(g.gain.value, c2.currentTime);
      g.gain.linearRampToValueAtTime(0, c2.currentTime + 0.08);
      setTimeout(() => {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }, 100);
    },
  };
}

export function gateHumStart(id: string, electric: boolean) {
  if (muted || gateHums.has(id)) return;
  gateHums.set(id, startHum(electric ? 3800 : 2600, 0.03, electric ? "square" : "sawtooth"));
}

export function gateHumStop(id: string) {
  gateHums.get(id)?.stop();
  gateHums.delete(id);
}

export function gravityHumStart() {
  if (muted || gravityHum) return;
  gravityHum = startHum(70, 0.05, "sine");
}

export function gravityHumStop() {
  gravityHum?.stop();
  gravityHum = null;
}

// Procedural background music: a simple layered arpeggio + bass drone per world,
// generated with oscillators so no audio assets are needed.
const SCALES: Record<number, number[]> = {
  1: [220, 261.6, 293.7, 329.6, 392, 440], // A minor-ish, cool neon
  2: [246.9, 293.7, 329.6, 370, 415.3, 493.9], // brighter, city
  3: [196, 233.1, 261.6, 311.1, 349.2, 392], // dark, undergate
  4: [261.6, 311.1, 349.2, 392, 466.2, 523.3], // tense finale
  5: [174.6, 207.7, 233.1, 277.2, 311.1, 349.2], // Dark Reactor — low, ominous, distorted
  6: [261.6, 293.7, 349.2, 392, 440, 523.3], // Cyber Core — bright, arpeggiated, digital
  7: [207.7, 246.9, 261.6, 311.1, 370, 415.3], // Chaos Rift — unstable, glitchy intervals
};

// Per-world synthwave mood: warm pad chords + soft filtered plucks + deep bass.
const WORLD_MOOD: Record<number, { padType: OscillatorType; pluckType: OscillatorType; bassType: OscillatorType; stepDur: number; filterHz: number; padGain: number }> = {
  1: { padType: "sine", pluckType: "triangle", bassType: "sine", stepDur: 0.3, filterHz: 1600, padGain: 0.05 },
  2: { padType: "sine", pluckType: "triangle", bassType: "triangle", stepDur: 0.26, filterHz: 2200, padGain: 0.05 },
  3: { padType: "sine", pluckType: "sine", bassType: "sine", stepDur: 0.34, filterHz: 1100, padGain: 0.055 },
  4: { padType: "triangle", pluckType: "triangle", bassType: "sine", stepDur: 0.24, filterHz: 1800, padGain: 0.05 },
  5: { padType: "triangle", pluckType: "sine", bassType: "sine", stepDur: 0.36, filterHz: 900, padGain: 0.06 },
  6: { padType: "sine", pluckType: "square", bassType: "triangle", stepDur: 0.2, filterHz: 2400, padGain: 0.045 },
  7: { padType: "triangle", pluckType: "triangle", bassType: "sine", stepDur: 0.26, filterHz: 1400, padGain: 0.05 },
};

// Melody contour per level variant — same world mood, different feel per level.
const MELODY_PATTERNS = [
  [0, 1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1, 0],
  [0, 2, 4, 5, 4, 2],
  [0, 3, 1, 4, 2, 5],
  [2, 0, 3, 5, 3, 1],
  [4, 2, 5, 3, 1, 0],
];

const CHORD_ROOTS = [0, 3, 4, 2];

export function startMusic(world: number, variant = 0) {
  stopMusic();
  if (muted) return;
  const c = getCtx();
  const scale = SCALES[world] ?? SCALES[1];
  const mood = WORLD_MOOD[world] ?? WORLD_MOOD[1];
  const v = Math.abs(Math.floor(variant));
  let stopped = false;
  let stepIndex = 0;

  // Per-level variation: tempo, octave, melody contour, chord rotation.
  const stepDur = mood.stepDur * (0.86 + (v % 5) * 0.07);
  const melodyMul = v % 3 === 1 ? 2 : 1;
  const pattern = MELODY_PATTERNS[v % MELODY_PATTERNS.length];
  const chordSeq = CHORD_ROOTS.map((_, i) => CHORD_ROOTS[(i + v) % CHORD_ROOTS.length]);

  function playPad(degree: number) {
    const c2 = getCtx();
    const g = c2.createGain();
    g.gain.setValueAtTime(0, c2.currentTime);
    g.gain.linearRampToValueAtTime(mood.padGain, c2.currentTime + 1.1);
    const f = c2.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = mood.filterHz;
    g.connect(f);
    f.connect(musicGain!);
    const oscs = [0, 2, 4].map((k, i) => {
      const o = c2.createOscillator();
      o.type = mood.padType;
      o.frequency.value = scale[(degree + k) % scale.length];
      o.detune.value = (i - 1) * (world === 7 ? 14 : 6);
      o.connect(g);
      o.start();
      return o;
    });
    return () => {
      const t = getCtx().currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.9);
      window.setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } }), 1100);
    };
  }

  function playBass(freq: number) {
    const c2 = getCtx();
    const o = c2.createOscillator();
    o.type = mood.bassType;
    o.frequency.value = freq / 2;
    const g = c2.createGain();
    const dur = Math.min(stepDur * 8, 2.4);
    g.gain.setValueAtTime(0, c2.currentTime);
    g.gain.linearRampToValueAtTime(0.22, c2.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + dur);
    o.connect(g);
    g.connect(musicGain!);
    o.start();
    o.stop(c2.currentTime + dur + 0.1);
  }

  function playPluck(freq: number) {
    const c2 = getCtx();
    const o = c2.createOscillator();
    o.type = mood.pluckType;
    o.frequency.value = freq;
    const f = c2.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = mood.filterHz;
    const g = c2.createGain();
    const dur = stepDur * 2.4;
    g.gain.setValueAtTime(0, c2.currentTime);
    g.gain.linearRampToValueAtTime(0.14, c2.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + dur);
    o.connect(f);
    f.connect(g);
    g.connect(musicGain!);
    o.start();
    o.stop(c2.currentTime + dur + 0.05);
  }

  function playHat() {
    const c2 = getCtx();
    const dur = 0.03;
    const buf = c2.createBuffer(1, Math.ceil(c2.sampleRate * dur), c2.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c2.createBufferSource();
    src.buffer = buf;
    const f = c2.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = c2.createGain();
    g.gain.setValueAtTime(0.05, c2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(musicGain!);
    src.start();
  }

  let releasePad: (() => void) | null = null;
  let chordIdx = -1;
  let timer: number;

  function step() {
    if (stopped) return;
    if (stepIndex % 8 === 0) {
      chordIdx = (chordIdx + 1) % chordSeq.length;
      releasePad?.();
      releasePad = playPad(chordSeq[chordIdx]);
      playBass(scale[chordSeq[chordIdx] % scale.length]);
    }
    // World 7 (Chaos Rift) occasionally jitters a step for an unstable feel.
    const glitchSkip = world === 7 && Math.random() < 0.12;
    if (!glitchSkip && (stepIndex + v) % 8 !== 7) {
      playPluck(scale[pattern[stepIndex % pattern.length] % scale.length] * melodyMul);
    }
    if (stepIndex % 2 === 1) playHat();
    stepIndex++;
    timer = window.setTimeout(step, stepDur * 1000);
  }
  step();

  currentMusicNodes = {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      releasePad?.();
    },
  };
}

export function stopMusic() {
  currentMusicNodes?.stop();
  currentMusicNodes = null;
}
