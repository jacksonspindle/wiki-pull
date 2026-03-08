// Procedural sound engine using Web Audio API
// All sounds are generated programmatically — no external files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// --- Utility functions ---

function createNoise(ctx: AudioContext, duration: number, volume = 0.3): { source: AudioBufferSourceNode; gain: GainNode } {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  source.connect(gain);
  return { source, gain };
}

function createOscTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  duration: number,
  volume = 0.2,
): { osc: OscillatorNode; gain: GainNode } {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  osc.connect(gain);
  return { osc, gain };
}

// --- Sound effects ---

/** Subtle foil crinkle when hovering/touching the pack */
export function playPackCrinkle() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const { source, gain } = createNoise(ctx, 0.12, 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 2;

  gain.connect(filter);
  filter.connect(ctx.destination);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  source.start(now);
  source.stop(now + 0.12);
}

/** Continuous tearing sound — call repeatedly while dragging */
export function playTearProgress() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const { source, gain } = createNoise(ctx, 0.08, 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1500 + Math.random() * 1000;
  filter.Q.value = 1;

  gain.connect(filter);
  filter.connect(ctx.destination);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  source.start(now);
  source.stop(now + 0.08);
}

/** Satisfying rip when tear completes */
export function playTearComplete() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Rip noise burst
  const { source: noise, gain: noiseGain } = createNoise(ctx, 0.3, 0.5);
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.value = 800;
  noiseGain.connect(hpFilter);
  hpFilter.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  noise.start(now);
  noise.stop(now + 0.3);

  // Whoosh sweep
  const { osc, gain: oscGain } = createOscTone(ctx, 400, 'sine', 0.4, 0.1);
  oscGain.connect(ctx.destination);
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.start(now);
  osc.stop(now + 0.4);
}

/** Pack opening burst — energy release when pack fully opens */
export function playPackOpen() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Low boom
  const { osc: boom, gain: boomGain } = createOscTone(ctx, 80, 'sine', 0.5, 0.3);
  boomGain.connect(ctx.destination);
  boom.frequency.setValueAtTime(80, now);
  boom.frequency.exponentialRampToValueAtTime(30, now + 0.5);
  boomGain.gain.setValueAtTime(0.3, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  boom.start(now);
  boom.stop(now + 0.5);

  // Shimmer
  const { source: shimmer, gain: shimmerGain } = createNoise(ctx, 0.6, 0.15);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 5000;
  bp.Q.value = 3;
  shimmerGain.connect(bp);
  bp.connect(ctx.destination);
  shimmerGain.gain.setValueAtTime(0.15, now + 0.05);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  shimmer.start(now + 0.05);
  shimmer.stop(now + 0.6);

  // Rising chime
  [600, 800, 1000].forEach((freq, i) => {
    const { osc, gain } = createOscTone(ctx, freq, 'triangle', 0.4, 0.06);
    gain.connect(ctx.destination);
    const t = now + 0.1 + i * 0.08;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/** Crisp card flip sound */
export function playCardFlip() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Click
  const { osc, gain } = createOscTone(ctx, 1200, 'square', 0.04, 0.08);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.start(now);
  osc.stop(now + 0.04);

  // Brief whoosh
  const { source, gain: nGain } = createNoise(ctx, 0.1, 0.06);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 4000;
  f.Q.value = 1;
  nGain.connect(f);
  f.connect(ctx.destination);
  nGain.gain.setValueAtTime(0.06, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  source.start(now);
  source.stop(now + 0.1);
}

/** Card reveal — intensity scales with rarity tier (0-6) */
export function playCardReveal(rarityTier: number) {
  const ctx = getCtx();
  const now = ctx.currentTime;

  if (rarityTier <= 1) {
    // C / UC — simple soft chime
    const { osc, gain } = createOscTone(ctx, 800, 'triangle', 0.2, 0.05);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
    return;
  }

  if (rarityTier <= 2) {
    // R — brighter two-tone chime
    [700, 1050].forEach((freq, i) => {
      const { osc, gain } = createOscTone(ctx, freq, 'triangle', 0.3, 0.06);
      gain.connect(ctx.destination);
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
    return;
  }

  if (rarityTier <= 3) {
    // SR — three-tone ascending chime + subtle impact
    const { osc: impact, gain: impactGain } = createOscTone(ctx, 100, 'sine', 0.2, 0.12);
    impactGain.connect(ctx.destination);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    impact.start(now);
    impact.stop(now + 0.2);

    [600, 900, 1200].forEach((freq, i) => {
      const { osc, gain } = createOscTone(ctx, freq, 'triangle', 0.4, 0.07);
      gain.connect(ctx.destination);
      const t = now + 0.05 + i * 0.07;
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    return;
  }

  if (rarityTier <= 4) {
    // SSR — dramatic impact + shimmering ascending tones
    const { osc: boom, gain: boomGain } = createOscTone(ctx, 60, 'sine', 0.4, 0.2);
    boomGain.connect(ctx.destination);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    boom.start(now);
    boom.stop(now + 0.4);

    const { source, gain: shimGain } = createNoise(ctx, 0.8, 0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 5;
    shimGain.connect(bp);
    bp.connect(ctx.destination);
    shimGain.gain.setValueAtTime(0.08, now + 0.1);
    shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    source.start(now + 0.1);
    source.stop(now + 0.8);

    [500, 750, 1000, 1250, 1500].forEach((freq, i) => {
      const { osc, gain } = createOscTone(ctx, freq, 'triangle', 0.5, 0.05);
      gain.connect(ctx.destination);
      const t = now + 0.08 + i * 0.06;
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
    return;
  }

  // UR / LR — epic cinematic reveal
  // Deep sub-bass hit
  const { osc: sub, gain: subGain } = createOscTone(ctx, 40, 'sine', 0.7, 0.3);
  subGain.connect(ctx.destination);
  sub.frequency.setValueAtTime(40, now);
  sub.frequency.exponentialRampToValueAtTime(20, now + 0.7);
  subGain.gain.setValueAtTime(0.3, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  sub.start(now);
  sub.stop(now + 0.7);

  // Impact crack
  const { source: crack, gain: crackGain } = createNoise(ctx, 0.15, 0.4);
  const crackFilter = ctx.createBiquadFilter();
  crackFilter.type = 'highpass';
  crackFilter.frequency.value = 2000;
  crackGain.connect(crackFilter);
  crackFilter.connect(ctx.destination);
  crackGain.gain.setValueAtTime(0.4, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  crack.start(now);
  crack.stop(now + 0.15);

  // Extended shimmer
  const { source: shimmer, gain: shimGain } = createNoise(ctx, 1.5, 0.1);
  const shimBp = ctx.createBiquadFilter();
  shimBp.type = 'bandpass';
  shimBp.frequency.value = 8000;
  shimBp.Q.value = 4;
  shimGain.connect(shimBp);
  shimBp.connect(ctx.destination);
  shimGain.gain.setValueAtTime(0, now);
  shimGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
  shimGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  shimmer.start(now);
  shimmer.stop(now + 1.5);

  // Ascending celestial chord
  const chord = rarityTier >= 6
    ? [400, 500, 600, 800, 1000, 1200, 1600, 2000] // LR: full ethereal chord
    : [400, 600, 800, 1000, 1300, 1600]; // UR

  chord.forEach((freq, i) => {
    const { osc, gain } = createOscTone(ctx, freq, 'sine', 0.8, 0.04);
    gain.connect(ctx.destination);
    const t = now + 0.1 + i * 0.05;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    osc.stop(t + 0.8);
  });

  // LR gets extra reverse cymbal swell
  if (rarityTier >= 6) {
    const { source: swell, gain: swellGain } = createNoise(ctx, 1.0, 0.2);
    const swellBp = ctx.createBiquadFilter();
    swellBp.type = 'bandpass';
    swellBp.frequency.value = 4000;
    swellBp.Q.value = 1;
    swellGain.connect(swellBp);
    swellBp.connect(ctx.destination);
    swellGain.gain.setValueAtTime(0.001, now + 0.2);
    swellGain.gain.exponentialRampToValueAtTime(0.15, now + 0.8);
    swellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    swell.start(now + 0.2);
    swell.stop(now + 1.2);
  }
}

/** UI click sound */
export function playClick() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const { osc, gain } = createOscTone(ctx, 600, 'square', 0.03, 0.04);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  osc.start(now);
  osc.stop(now + 0.03);
}
