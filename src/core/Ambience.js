import { midi } from './Synth.js';

// Generated medieval music: a breathing drone under sparse lute / harp in the old church modes,
// frame drums and horns for the bosses. Nothing is a recording - every note is chosen as it plays,
// so it never repeats exactly. Used for any moment that has no music file (see data/music.js).

const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
};

// a frame drum pattern for the boss fights, in 16 steps: B = boom (low), t = tak (rim), . = rest
const BOSS_DRUMS = 'B..tB.t.B..tB.tt';
const FINAL_DRUMS = 'B.tBB.t.B.tBBttt';
// lute riffs (scale degrees, 0 = root; null = rest), one note per step
const BOSS_RIFF = [0, null, 0, 1, 0, null, 4, 5, 4, null, 1, 0, null, 0, 1, null];
const FINAL_RIFF = [0, 0, 1, 0, 4, 0, 5, 4, 0, 0, 1, 0, 6, 5, 4, 1];

export const MOMENTS = {
  title: { root: 50, mode: 'dorian', bpm: 64, sub: 1, drone: [38, 45], harp: 0.55, low: 0, high: 14 },
  cells: { root: 50, mode: 'aeolian', bpm: 52, sub: 1, drone: [38, 45], lute: 0.3, low: -7, high: 7 },
  catacombs: { root: 52, mode: 'phrygian', bpm: 46, sub: 1, drone: [40, 47], lute: 0.2, bellEvery: 12, low: -7, high: 7 },
  hollow: { root: 57, mode: 'dorian', bpm: 56, sub: 1, drone: [45, 52], harp: 0.35, low: -3, high: 12 },
  halls: { root: 50, mode: 'harmonic', bpm: 60, sub: 2, drone: [38, 45], lute: 0.18, heartbeat: true, low: -7, high: 7 },
  vault: { root: 52, mode: 'phrygian', bpm: 40, sub: 1, drone: [40, 47], bellEvery: 6, harp: 0.15, low: 0, high: 10 },
  throne: { root: 50, mode: 'harmonic', bpm: 54, sub: 1, drone: [38, 45], tollEvery: 8, choirEvery: 16, lute: 0.15, low: -7, high: 5 },
  boss: { root: 50, mode: 'phrygian', bpm: 138, sub: 2, drone: [38, 45], drums: BOSS_DRUMS, riff: BOSS_RIFF },
  finalBoss: { root: 50, mode: 'harmonic', bpm: 150, sub: 2, drone: [38, 45, 50], drums: FINAL_DRUMS, riff: FINAL_RIFF, hornEvery: 32, choirEvery: 32 },
  victory: { root: 50, mode: 'ionian', bpm: 76, sub: 2, drone: [38, 45], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] },
  death: { root: 38, mode: 'aeolian', bpm: 60, sub: 1, drone: null, tollEvery: 6 },
};

export class Ambience {
  constructor(synth, out) {
    this.s = synth;
    this.ctx = synth.ctx;
    this.out = out;
    this.moment = null;
    this.m = null;
    this.drone = null;
    this.step = 0;
    this.next = 0;
  }

  /** Change the music to a moment from MOMENTS (or null for silence). */
  set(name) {
    if (name === this.moment) return;
    this.moment = name;
    this.m = MOMENTS[name] || null;
    this._stopDrone();
    if (!this.m) return;
    if (this.m.drone) this._startDrone(this.m.drone);
    this.step = 0;
    this.next = this.ctx.currentTime + 0.3;
  }

  /** Called every frame: schedules the notes of the next fraction of a second. */
  update() {
    const m = this.m;
    if (!m) return;
    const now = this.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05; // (the tab was in the background)
    const stepDur = 60 / m.bpm / m.sub;
    while (this.next < now + 0.25) {
      this._play(m, this.step, this.next, stepDur);
      this.step++;
      this.next += stepDur;
    }
  }

  _note(m, degree) {
    const sc = MODES[m.mode];
    const oct = Math.floor(degree / sc.length);
    const d = ((degree % sc.length) + sc.length) % sc.length;
    return midi(m.root + sc[d] + 12 * oct);
  }

  _play(m, i, t, stepDur) {
    const s = this.s;
    const o = this.out;
    const beat = m.sub > 1 ? i % m.sub === 0 : true;
    // wandering melody: small steps up and down the mode, resting often
    const wander = (chance, bright, gain, dur) => {
      if (!beat || Math.random() > chance) return;
      this.deg = Math.max(m.low, Math.min(m.high, (this.deg ?? 0) + [-2, -1, -1, 1, 1, 2, 3, -3][Math.floor(Math.random() * 8)]));
      s.pluck(o, t, this._note(m, this.deg), dur, gain, bright, 0.998);
      // sometimes a second note, a third above, like a lute strummed
      if (Math.random() < 0.25) s.pluck(o, t + 0.03, this._note(m, this.deg + 2), dur, gain * 0.6, bright, 0.998);
    };
    if (m.lute) wander(m.lute, 0.4, 0.16, 2.2);
    if (m.harp) {
      // harp: little rising figures of 3-4 notes
      if (beat && Math.random() < m.harp * 0.4) {
        const base = Math.floor(Math.random() * 5);
        const n = 3 + Math.floor(Math.random() * 2);
        for (let k = 0; k < n; k++) s.pluck(o, t + k * stepDur * 0.33, this._note(m, base + k * 2), 2.5, 0.12, 0.3, 0.998);
      }
    }
    if (m.bellEvery && i % m.bellEvery === 0 && i > 0) s.bell(o, t, this._note(m, 7 + (Math.random() < 0.5 ? 0 : 4)), 4, 0.12);
    if (m.tollEvery && i % m.tollEvery === 0) s.bell(o, t, midi(m.root - 12 + (m.root < 45 ? 12 : 0)), 5, 0.22);
    if (m.choirEvery && i % m.choirEvery === 0) s.choir(o, t, [this._note(m, 0) / 2, this._note(m, 2) / 2, this._note(m, 4) / 2], stepDur * m.choirEvery * 0.9, 0.05, 1.5);
    if (m.heartbeat && i % 4 === 0) {
      s.drum(o, t, 70, 45, 0.4, 0.22, 0.15);
      s.drum(o, t + stepDur * 0.5, 62, 42, 0.35, 0.16, 0.1);
    }
    if (m.drums) {
      const c = m.drums[i % m.drums.length];
      if (c === 'B') s.drum(o, t, 78, 46, 0.35, 0.3, 0.25);
      else if (c === 't') s.noise(o, t, { type: 'bandpass', f: [1900, 1500], q: 3, gain: 0.14, dur: 0.05 });
    }
    if (m.riff) {
      const d = m.riff[i % m.riff.length];
      if (d !== null) s.pluck(o, t, this._note(m, d - 7), stepDur * 3, 0.17, 0.7, 0.99);
    }
    if (m.hornEvery && i % m.hornEvery === 0) {
      s.horn(o, t, this._note(m, -7), stepDur * 6, 0.08);
      s.horn(o, t, this._note(m, -3), stepDur * 6, 0.05);
    }
    if (m.chords && i % 8 === 0) {
      const ch = m.chords[Math.floor(i / 8) % m.chords.length];
      const f = ch.map((st) => midi(m.root + st));
      s.choir(o, t, f, stepDur * 8, 0.04, 0.5);
      f.concat(f.map((x) => x * 2)).forEach((x, k) => s.pluck(o, t + k * stepDur * 0.5, x, 2, 0.1, 0.35, 0.998));
    }
  }

  _startDrone(notes) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 3);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    f.Q.value = 1.5;
    // the drone breathes: its filter opens and closes very slowly
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 160;
    lfo.connect(lfoAmt).connect(f.frequency);
    f.connect(g).connect(this.out);
    const oscs = [lfo];
    for (const n of notes) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = det;
        o.connect(f);
        oscs.push(o);
      }
    }
    for (const o of oscs) o.start(t);
    this.drone = { g, oscs };
  }

  _stopDrone() {
    const d = this.drone;
    if (!d) return;
    const t = this.ctx.currentTime;
    d.g.gain.cancelScheduledValues(t);
    d.g.gain.setValueAtTime(d.g.gain.value, t);
    d.g.gain.linearRampToValueAtTime(0.0001, t + 2);
    for (const o of d.oscs) o.stop(t + 2.1);
    this.drone = null;
  }
}
