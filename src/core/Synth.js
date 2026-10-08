import { fxRng } from './Rng.js';

// The instruments every sound and the music are built from. All synthesised with the Web Audio
// API - no sound files. Each builder schedules one "note" at time t into the node `out`.
//
//   noise     filtered noise burst (whooshes, fire, crunches, footsteps)
//   pluck     a plucked string (lute / harp): Karplus-Strong string model
//   bell      a cast bell: inharmonic partials that ring and fade at different speeds
//   metal     a short clang (armour, keys, chains, swords)
//   drum      a skin drum / heavy thump: a falling sine plus a soft noise slap
//   horn      a war horn: buzzing reed, filter opening, a little vibrato
//   choir     voices singing "ah": detuned saws through vowel formant filters
//   growl     a beast's throat: noise + low buzz through moving formants, with a rasp
//   drone     a held, slowly breathing chord (for the music)

export function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/** An envelope: silent -> peak over `attack`, then a curve down to silence by `dur`. */
function env(ctx, out, t, peak, attack, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.002, attack));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  return g;
}

export class Synth {
  constructor(ctx) {
    this.ctx = ctx;
    const sr = ctx.sampleRate;
    // two seconds of white noise, reused by every noisy sound
    this.noiseBuf = ctx.createBuffer(1, sr * 2, sr);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.strings = new Map(); // cached plucked-string recordings
  }

  /** opts: { type, f: [from, to], q, gain, attack, dur } */
  noise(out, t, o) {
    const ctx = this.ctx;
    const dur = o.dur;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'lowpass';
    const [f0, f1] = o.f || [1200, 400];
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    f.Q.value = o.q ?? 1;
    src.connect(f).connect(env(ctx, out, t, o.gain ?? 0.3, o.attack ?? 0.004, dur));
    src.start(t, fxRng.float(0, 1.5), dur + 0.05);
  }

  /** A plucked string. bright 0..1 (how sharp the pluck), decay 0.9..0.999 (how long it rings). */
  pluck(out, t, freq, dur, gain, bright = 0.5, decay = 0.996) {
    const ctx = this.ctx;
    const key = `${Math.round(freq * 10)}|${dur}|${bright}|${decay}`;
    let buf = this.strings.get(key);
    if (!buf) {
      // Karplus-Strong: a burst of noise circulating in a delay line one period long,
      // averaged a little each pass, becomes a vibrating string
      const sr = ctx.sampleRate;
      const n = Math.max(2, Math.round(sr / freq));
      const len = Math.floor(sr * dur);
      buf = ctx.createBuffer(1, len, sr);
      const y = buf.getChannelData(0);
      let lp = 0;
      for (let i = 0; i < n && i < len; i++) {
        const r = Math.random() * 2 - 1;
        lp += (r - lp) * (0.2 + bright * 0.8); // duller pluck = softer noise
        y[i] = lp;
      }
      for (let i = n; i < len; i++) y[i] = decay * 0.5 * (y[i - n] + y[i - n - 1 < 0 ? 0 : i - n - 1]);
      if (this.strings.size > 400) this.strings.clear();
      this.strings.set(key, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.setValueAtTime(gain, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    // a gentle body resonance, so it sounds like wood rather than wire
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 280;
    body.Q.value = 1.2;
    body.gain.value = 5;
    src.connect(body).connect(g).connect(out);
    src.start(t);
  }

  /** A cast bell. Partials ring at inharmonic ratios; high ones fade first. */
  bell(out, t, freq, dur, gain) {
    const ctx = this.ctx;
    const parts = [
      [0.5, 0.35], // the hum, an octave below
      [1, 1],
      [1.19, 0.45], // the minor third that makes a bell sound like a bell
      [1.5, 0.35],
      [2, 0.5],
      [2.74, 0.25],
      [3.76, 0.15],
    ];
    for (const [r, a] of parts) {
      const o = ctx.createOscillator();
      o.frequency.value = freq * r * fxRng.float(0.998, 1.002);
      const d = dur / (0.6 + r * 0.6);
      o.connect(env(ctx, out, t, gain * a * 0.4, 0.003, d));
      o.start(t);
      o.stop(t + d + 0.05);
    }
  }

  /** A short metallic clang: tightly packed inharmonic partials and a click. */
  metal(out, t, freq, dur, gain) {
    const ctx = this.ctx;
    for (const [r, a] of [[1, 1], [1.48, 0.7], [2.09, 0.6], [2.71, 0.45], [3.34, 0.3], [4.6, 0.2]]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * r * fxRng.float(0.99, 1.01);
      const d = dur / (0.5 + r * 0.4);
      o.connect(env(ctx, out, t, gain * a * 0.3, 0.001, d));
      o.start(t);
      o.stop(t + d + 0.05);
    }
    this.noise(out, t, { type: 'highpass', f: [3000, 2000], q: 0.7, gain: gain * 0.5, dur: 0.02 });
  }

  /** A drum or heavy thump: a sine that drops in pitch, plus a slap of noise. */
  drum(out, t, f0, f1, dur, gain, slap = 0.4) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    o.connect(env(ctx, out, t, gain, 0.003, dur));
    o.start(t);
    o.stop(t + dur + 0.05);
    if (slap > 0) this.noise(out, t, { type: 'lowpass', f: [f0 * 12, f0 * 3], q: 0.8, gain: gain * slap, dur: Math.min(0.08, dur) });
  }

  /** A war horn: two reeds a hair apart, the filter opening as the breath comes in. */
  horn(out, t, freq, dur, gain) {
    const ctx = this.ctx;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 2;
    f.frequency.setValueAtTime(freq * 1.5, t);
    f.frequency.linearRampToValueAtTime(freq * 6, t + 0.15);
    f.frequency.linearRampToValueAtTime(freq * 3.5, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.09);
    g.gain.setValueAtTime(gain, t + dur * 0.75);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(out);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vibAmt = ctx.createGain();
    vibAmt.gain.value = freq * 0.006;
    vib.connect(vibAmt);
    for (const det of [-4, 5]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = det;
      vibAmt.connect(o.frequency);
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    vib.start(t);
    vib.stop(t + dur + 0.05);
  }

  /** Voices singing "ah" on each note of `freqs`. Slow to swell, slow to fade. */
  choir(out, t, freqs, dur, gain, attack = 0.35) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - 0.6));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(out);
    // the "ah" vowel: two formant resonances
    const mix = ctx.createGain();
    mix.gain.value = 0.5;
    for (const [fr, q] of [[730, 7], [1090, 8], [2440, 10]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fr;
      bp.Q.value = q;
      mix.connect(bp).connect(g);
    }
    for (const f of freqs) {
      for (const det of [-9, 0, 8]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det + fxRng.float(-3, 3);
        o.connect(mix);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
  }

  /** A beast's throat: a low buzz and breath through moving vowel formants, with a rasp. */
  growl(out, t, f0, f1, dur, gain, formant = [400, 700]) {
    const ctx = this.ctx;
    const g = env(ctx, out, t, gain, 0.06, dur);
    // the rasp: the amplitude shudders quickly
    const rasp = ctx.createGain();
    rasp.gain.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = fxRng.float(24, 34);
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 0.4;
    lfo.connect(lfoAmt).connect(rasp.gain);
    rasp.connect(g);
    const fA = ctx.createBiquadFilter();
    fA.type = 'bandpass';
    fA.Q.value = 3;
    fA.frequency.setValueAtTime(formant[0], t);
    fA.frequency.linearRampToValueAtTime(formant[1], t + dur * 0.4);
    fA.frequency.linearRampToValueAtTime(formant[0] * 0.8, t + dur);
    fA.connect(rasp);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(fA);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const ng = ctx.createGain();
    ng.gain.value = 0.9;
    src.connect(ng).connect(fA);
    for (const n of [o, lfo]) {
      n.start(t);
      n.stop(t + dur + 0.05);
    }
    src.start(t, fxRng.float(0, 1), dur + 0.05);
  }

  /** Stone-room reverb: a generated impulse response (decaying, darkening noise). */
  makeReverb(seconds = 2.4) {
    const ctx = this.ctx;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        const r = Math.random() * 2 - 1;
        lp += (r - lp) * (0.9 - k * 0.75); // later reflections are darker
        d[i] = lp * Math.pow(1 - k, 2.6);
      }
      // a few strong early reflections off the near walls
      for (const ms of [11, 23, 37, 53]) d[Math.floor((ms / 1000) * sr) + ch * 17] += 0.5 * (ch ? -1 : 1);
    }
    const c = ctx.createConvolver();
    c.buffer = ir;
    return c;
  }
}
