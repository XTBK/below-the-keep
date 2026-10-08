import { midi } from './Synth.js';

// Generated medieval music. Every moment of the game (the title, each chapter, bosses, victory...)
// has a SONG: a mode, a tempo, a chord progression, and a set of parts -
//   pad      choir or drone holding each chord
//   bass     low plucked strings (or horns) on a rhythm pattern
//   arp      harp / lute picking through the chord
//   melody   a tune made of a short motif that repeats and varies (phrase A A' B A'')
//   drums    frame drum ('B' boom, 'b' soft boom, 't' tak, 's' shaker), one character per 16th
//   bell     a toll every few bars
// Songs alternate quiet and full sections, so they breathe. Nothing is recorded: notes are chosen
// as they play, from the song's rules and a little chance, so it never repeats exactly.
// Used for every moment that has no music file (see data/music.js).

const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
};

// melody rhythms for one bar (8 eighth notes): 1 = a note starts, 2 = a long note starts
const RHYTHMS = {
  slow: ['2.......', '2...2...', '2.....1.', '1...2...'],
  walk: ['1.1.2...', '2...1.1.', '1.1.1.1.', '2.1.1...', '1...1.1.'],
  dance: ['1.11.1..', '1..11.1.', '11.1.1..', '1.1.11..'],
  fierce: ['1111.1.1', '1.111.1.', '11.111..', '1.1.1111'],
};

export const MOMENTS = {
  // the title: a slow funeral march - low choir, a heartbeat drum, a bell, a horn calling in the dark
  title: {
    bpm: 58, root: 38, mode: 'aeolian', progression: [0, 5, 3, 4], barsPerChord: 2,
    pad: 'choir', padGain: 0.05, bass: 'R.......R.......', bassInst: 'pluck', bassGain: 0.2,
    arp: '..0...2...1...2.', arpInst: 'harp', arpGain: 0.07, arpOct: 2,
    melody: { inst: 'horn', rhythm: 'slow', octave: 1, gain: 0.07, fullOnly: true },
    drums: 'B.......b.......', drumGain: 0.18, bellEvery: 4, bellGain: 0.12,
  },
  // the Cells: grim and plodding - lute, a dripping tak, a low drone
  cells: {
    bpm: 72, root: 38, mode: 'aeolian', progression: [0, 0, 5, 4], barsPerChord: 1,
    pad: 'drone', bass: 'R.....R.R.......', bassInst: 'pluck', bassGain: 0.17,
    arp: '0.2.1.2.0.2.1.2.', arpInst: 'lute', arpGain: 0.07, arpOct: 1,
    melody: { inst: 'lute', rhythm: 'walk', octave: 2, gain: 0.11 },
    drums: 'b.....t.......t.', drumGain: 0.12,
  },
  // the Catacombs: phrygian dread - choir, bells for a melody, a slow bone-drum
  catacombs: {
    bpm: 60, root: 40, mode: 'phrygian', progression: [0, 1, 0, 6], barsPerChord: 2,
    pad: 'choir', padGain: 0.05, bass: 'R.......F.......', bassInst: 'pluck', bassGain: 0.16,
    arp: '0...1...2...1...', arpInst: 'harp', arpGain: 0.06, arpOct: 2,
    melody: { inst: 'bell', rhythm: 'slow', octave: 2, gain: 0.07 },
    drums: 'B...........t...', drumGain: 0.14, bellEvery: 8, bellGain: 0.08,
  },
  // the Hollow: an old forest dance gone strange - a wooden pipe over a rippling harp
  hollow: {
    bpm: 92, root: 45, mode: 'dorian', progression: [0, 3, 0, 6], barsPerChord: 1,
    pad: 'drone', bass: 'R.....F.R.....F.', bassInst: 'pluck', bassGain: 0.15,
    arp: '0120120120120121', arpInst: 'harp', arpGain: 0.055, arpOct: 2,
    melody: { inst: 'pipe', rhythm: 'dance', octave: 2, gain: 0.08 },
    drums: 'b..t..s.b..t..s.', drumGain: 0.11,
  },
  // the Burning Halls: a war march - horns, choir, drums
  halls: {
    bpm: 96, root: 38, mode: 'harmonic', progression: [0, 5, 4, 4], barsPerChord: 1,
    pad: 'choir', padGain: 0.045, bass: 'R.R.....R.R...F.', bassInst: 'horn', bassGain: 0.06,
    arp: '0.1.2.1.0.1.2.1.', arpInst: 'lute', arpGain: 0.05, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'walk', octave: 1, gain: 0.07 },
    drums: 'B..tB.t.B..tB.tt', drumGain: 0.15,
  },
  vault: {
    bpm: 50, root: 40, mode: 'phrygian', progression: [0, 1, 6, 0], barsPerChord: 2,
    pad: 'choir', padGain: 0.05, bass: 'R...............', bassInst: 'pluck', bassGain: 0.15,
    arp: '0.......2.......', arpInst: 'harp', arpGain: 0.06, arpOct: 2,
    melody: { inst: 'bell', rhythm: 'slow', octave: 2, gain: 0.08 },
    drums: '................', bellEvery: 2, bellGain: 0.09,
  },
  // the Deep
  // the Rootdeep: warm and slow, plucked like something growing
  rootdeep: {
    bpm: 66, root: 40, mode: 'dorian', progression: [0, 4, 5, 3], barsPerChord: 2,
    pad: 'choir', padGain: 0.04, bass: 'R.....R.R.......', bassInst: 'pluck', bassGain: 0.14,
    arp: '0.2.4.2.0.2.4.2.', arpInst: 'harp', arpGain: 0.05, arpOct: 1,
    melody: { inst: 'pipe', rhythm: 'slow', octave: 1, gain: 0.05 },
    drums: 'b.......b.......', drumGain: 0.1,
  },
  // the Frozen Deep: glassy bells over a cold drone
  frozen: {
    bpm: 58, root: 45, mode: 'aeolian', progression: [0, 5, 3, 6], barsPerChord: 2,
    pad: 'drone', bass: 'R...............', bassInst: 'pluck', bassGain: 0.1,
    arp: '0...4...2...4...', arpInst: 'bell', arpGain: 0.05, arpOct: 2,
    melody: { inst: 'bell', rhythm: 'slow', octave: 2, gain: 0.05 },
    drums: '................', drumGain: 0, bellEvery: 8, bellGain: 0.06,
  },
  // the Sunken Kingdom: a drowned court's stately march
  sunken: {
    bpm: 76, root: 38, mode: 'harmonic', progression: [0, 3, 4, 0], barsPerChord: 2,
    pad: 'choir', padGain: 0.05, bass: 'R...R...R...R.R.', bassInst: 'pluck', bassGain: 0.13,
    arp: '0.1.2.1.0.1.2.1.', arpInst: 'harp', arpGain: 0.045, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'walk', octave: 1, gain: 0.055 },
    drums: 'B.......t.......', drumGain: 0.12,
  },
  // the Amethyst Caverns: shimmering, strange intervals
  amethyst: {
    bpm: 84, root: 42, mode: 'phrygian', progression: [0, 1, 0, 6], barsPerChord: 1,
    pad: 'choir', padGain: 0.045, bass: 'R.R.....R.R.....', bassInst: 'pluck', bassGain: 0.12,
    arp: '0.2.4.6.4.2.0.2.', arpInst: 'bell', arpGain: 0.04, arpOct: 2,
    melody: { inst: 'pipe', rhythm: 'walk', octave: 2, gain: 0.045 },
    drums: 'b...t...b...t.t.', drumGain: 0.11,
  },
  // the Hollow Heart: a heartbeat for a drum, and the choir that never stopped
  heart: {
    bpm: 64, root: 36, mode: 'phrygian', progression: [0, 1, 6, 0], barsPerChord: 2,
    pad: 'choir', padGain: 0.07, bass: 'R.R.............', bassInst: 'pluck', bassGain: 0.16,
    arp: '0.......1.......', arpInst: 'bell', arpGain: 0.04, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'slow', octave: 1, gain: 0.05 },
    drums: 'B.B.............', drumGain: 0.16,
  },
  // the Gatehouse: home - a slow lute by the fire
  gatehouse: {
    bpm: 72, root: 43, mode: 'ionian', progression: [0, 5, 3, 4], barsPerChord: 2,
    pad: 'choir', padGain: 0.03, bass: 'R.......R.......', bassInst: 'pluck', bassGain: 0.1,
    arp: '0.2.1.2.0.2.1.2.', arpInst: 'lute', arpGain: 0.06, arpOct: 1,
    melody: { inst: 'harp', rhythm: 'slow', octave: 2, gain: 0.05 },
    drums: '................', drumGain: 0,
  },
  // the secret realms
  // the Drowned Cistern: slow drips of harp over a low choir, a bell for a melody
  cistern: {
    bpm: 62, root: 38, mode: 'dorian', progression: [0, 3, 5, 4], barsPerChord: 2,
    pad: 'choir', padGain: 0.045, bass: 'R.......R.......', bassInst: 'pluck', bassGain: 0.14,
    arp: '0...2...1...2.1.', arpInst: 'harp', arpGain: 0.065, arpOct: 2,
    melody: { inst: 'bell', rhythm: 'slow', octave: 2, gain: 0.07 },
    drums: '........b.......', drumGain: 0.1, bellEvery: 8, bellGain: 0.07,
  },
  // the Starless Chapel: a heavy choir like an organ, a horn in the dark
  chapel: {
    bpm: 52, root: 36, mode: 'phrygian', progression: [0, 1, 5, 0], barsPerChord: 2,
    pad: 'choir', padGain: 0.07, bass: 'R...............', bassInst: 'horn', bassGain: 0.05,
    arp: '..0.....2.......', arpInst: 'harp', arpGain: 0.05, arpOct: 2,
    melody: { inst: 'horn', rhythm: 'slow', octave: 1, gain: 0.06 },
    drums: 'B...............', drumGain: 0.12, bellEvery: 4, bellGain: 0.1,
  },
  // the First King's Forge: anvils ringing in time, war horns
  forge: {
    bpm: 108, root: 38, mode: 'harmonic', progression: [0, 4, 5, 4], barsPerChord: 1,
    pad: 'drone', bass: 'R.RR..R.R.RR..F.', bassInst: 'pluck', bassGain: 0.16,
    arp: '0.1.2.1.0.1.2.1.', arpInst: 'lute', arpGain: 0.045, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'walk', octave: 1, gain: 0.07 },
    drums: 'B.t.t.B.B.t.t.tt', drumGain: 0.16,
  },
  // the throne: a dark coronation - choir, horns, the bell of the keep
  throne: {
    bpm: 66, root: 38, mode: 'harmonic', progression: [0, 5, 3, 4], barsPerChord: 2,
    pad: 'choir', padGain: 0.06, bass: 'R.......R...F...', bassInst: 'horn', bassGain: 0.06,
    arp: '0...1...2...1...', arpInst: 'harp', arpGain: 0.06, arpOct: 2,
    melody: { inst: 'horn', rhythm: 'slow', octave: 1, gain: 0.07 },
    drums: 'B.......B...b...', drumGain: 0.16, bellEvery: 4, bellGain: 0.12,
  },
  boss: {
    bpm: 140, root: 38, mode: 'phrygian', progression: [0, 1, 0, 6], barsPerChord: 1,
    pad: 'drone', bass: 'R.RR.R.RR.RR.R.F', bassInst: 'pluck', bassGain: 0.17,
    arp: '0.1.2.1.0.1.2.1.', arpInst: 'lute', arpGain: 0.05, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'fierce', octave: 1, gain: 0.06, fullOnly: true },
    drums: 'B..tB.t.B..tB.tt', drumGain: 0.2,
  },
  finalBoss: {
    bpm: 150, root: 38, mode: 'harmonic', progression: [0, 5, 1, 4], barsPerChord: 1,
    pad: 'choir', padGain: 0.06, bass: 'RRR.RR.RRR.RR.FF', bassInst: 'pluck', bassGain: 0.17,
    arp: '0121012101210121', arpInst: 'lute', arpGain: 0.045, arpOct: 1,
    melody: { inst: 'horn', rhythm: 'fierce', octave: 1, gain: 0.07 },
    drums: 'B.tBB.t.B.tBBttt', drumGain: 0.2, bellEvery: 4, bellGain: 0.1,
  },
  // victory: at last, a major key - harp, pipe, choir
  victory: {
    bpm: 84, root: 50, mode: 'ionian', progression: [0, 4, 5, 3], barsPerChord: 1,
    pad: 'choir', padGain: 0.05, bass: 'R.....F.R.......', bassInst: 'pluck', bassGain: 0.15,
    arp: '0120120120120121', arpInst: 'harp', arpGain: 0.06, arpOct: 1,
    melody: { inst: 'pipe', rhythm: 'walk', octave: 1, gain: 0.09 },
    drums: 'b.......b...t...', drumGain: 0.1, bellEvery: 4, bellGain: 0.1,
  },
  death: {
    bpm: 50, root: 38, mode: 'aeolian', progression: [0, 5, 3, 0], barsPerChord: 2,
    pad: 'choir', padGain: 0.04, bass: '................', arp: '................',
    drums: '................', bellEvery: 2, bellGain: 0.16,
  },
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
    this.step = 0;
    this.next = this.ctx.currentTime + 0.4;
    this.phrase = null;
    this.lastDeg = 4;
  }

  /** Called every frame: schedules the notes of the next fraction of a second. */
  update() {
    const m = this.m;
    if (!m) return;
    const now = this.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05; // (the tab was in the background)
    const sixteenth = 60 / m.bpm / 4;
    while (this.next < now + 0.3) {
      this._step(m, this.step, this.next, sixteenth);
      this.step++;
      this.next += sixteenth;
    }
  }

  // --- music theory helpers ------------------------------------------------------------------

  /** Frequency of a scale degree (0 = root; 7 = an octave up) in the song's mode. */
  _deg(m, degree, octave = 0) {
    const sc = MODES[m.mode];
    const oct = Math.floor(degree / sc.length);
    const d = ((degree % sc.length) + sc.length) % sc.length;
    return midi(m.root + 12 * (oct + octave) + sc[d]);
  }

  /** The chord (as scale degrees: root, third, fifth) for a bar. */
  _chord(m, bar) {
    const root = m.progression[Math.floor(bar / (m.barsPerChord || 1)) % m.progression.length];
    return [root, root + 2, root + 4];
  }

  /** A melodic phrase for 2 bars: notes leaning on chord tones, moving by step between them. */
  _makePhrase(m, bar) {
    const mel = m.melody;
    const notes = [];
    for (let b = 0; b < 2; b++) {
      const chord = this._chord(m, bar + b);
      const rhythm = RHYTHMS[mel.rhythm][Math.floor(Math.random() * RHYTHMS[mel.rhythm].length)];
      for (let i = 0; i < 8; i++) {
        const c = rhythm[i];
        if (c === '.') continue;
        let len = 1;
        while (i + len < 8 && rhythm[i + len] === '.') len++;
        let deg;
        if (i % 4 === 0) {
          // strong beat: the chord tone closest to where the tune already is
          const opts = chord.flatMap((d) => [d, d + 7, d - 7]);
          deg = opts.reduce((a, d) => (Math.abs(d - this.lastDeg) < Math.abs(a - this.lastDeg) ? d : a), opts[0]);
        } else {
          deg = this.lastDeg + (Math.random() < 0.5 ? 1 : -1) * (Math.random() < 0.8 ? 1 : 2);
        }
        deg = Math.max(-2, Math.min(9, deg));
        this.lastDeg = deg;
        notes.push({ at: b * 16 + i * 2, deg, len: len * 2, long: c === '2' });
      }
    }
    return notes;
  }

  // --- one 16th note -------------------------------------------------------------------------

  _step(m, i, t, sx) {
    const s = this.s;
    const o = this.out;
    const pos = i % 16;
    const bar = Math.floor(i / 16);
    const chord = this._chord(m, bar);
    // sections: 4 bars quiet, 8 bars full (the first 4 bars always quiet)
    const section = Math.floor(bar / 4) % 3;
    const full = bar >= 4 && section !== 0;

    // the pad: a choir chord per chord change, or a drone that follows the root
    if (pos === 0 && bar % (m.barsPerChord || 1) === 0) {
      const dur = sx * 16 * (m.barsPerChord || 1);
      if (m.pad === 'choir') s.choir(o, t, [this._deg(m, chord[0], -1), this._deg(m, chord[1], -1), this._deg(m, chord[2], -1)], dur + 0.4, m.padGain || 0.05, Math.min(1.2, dur * 0.3));
      else if (m.pad === 'drone') this._droneTo(this._deg(m, chord[0], -1));
    }
    // the bass
    const bc = m.bass && m.bass[pos];
    if (bc && bc !== '.') {
      const deg = bc === 'F' ? chord[0] + 4 : bc === 'O' ? chord[0] + 7 : chord[0];
      const f = this._deg(m, deg, -1);
      if (m.bassInst === 'horn') s.horn(o, t, f, sx * 3, m.bassGain);
      else s.pluck(o, t, f, sx * 6, m.bassGain, 0.55, 0.993);
    }
    // the arpeggio
    const ac = m.arp && m.arp[pos];
    if (ac && ac !== '.' && (full || pos % 4 === 0)) {
      const f = this._deg(m, chord[+ac % 3], m.arpOct || 1);
      s.pluck(o, t, f, sx * 8, m.arpGain, m.arpInst === 'lute' ? 0.5 : 0.3, 0.997);
    }
    // the melody: a motif that repeats and varies
    if (m.melody && (full || !m.melody.fullOnly) && (full || bar % 2 === 0)) {
      if (pos === 0 && bar % 2 === 0) {
        const phraseNo = Math.floor(bar / 2) % 4;
        if (!this.phrase || phraseNo === 0 || phraseNo === 2) this.phrase = this._makePhrase(m, bar); // A ... B
        else if (Math.random() < 0.5) {
          // A' / A'': the same tune, one note changed
          const k = Math.floor(Math.random() * this.phrase.length);
          if (this.phrase[k]) this.phrase[k] = { ...this.phrase[k], deg: this.phrase[k].deg + (Math.random() < 0.5 ? 1 : -1) };
        }
        this.phraseBar = bar;
      }
      const local = (bar - (this.phraseBar || 0)) * 16 + pos;
      for (const n of this.phrase || []) {
        if (n.at !== local) continue;
        const f = this._deg(m, n.deg, m.melody.octave);
        const dur = sx * n.len * (n.long ? 1.1 : 0.95);
        const g = m.melody.gain;
        switch (m.melody.inst) {
          case 'horn':
            s.horn(o, t, f, Math.max(0.2, dur), g);
            break;
          case 'pipe':
            s.pipe(o, t, f, Math.max(0.12, dur), g);
            break;
          case 'bell':
            s.bell(o, t, f, 2.5, g);
            break;
          default:
            s.pluck(o, t, f, Math.max(0.6, dur * 2), g, 0.45, 0.997);
        }
      }
    }
    // drums
    const dc = m.drums && m.drums[pos];
    if (dc && dc !== '.' && (full || dc === 'B' || dc === 'b')) {
      const g = m.drumGain || 0.15;
      if (dc === 'B') s.drum(o, t, 80, 44, 0.45, g, 0.25);
      else if (dc === 'b') s.drum(o, t, 70, 44, 0.35, g * 0.6, 0.15);
      else if (dc === 't') s.noise(o, t, { type: 'bandpass', f: [1900, 1500], q: 3, gain: g * 0.5, dur: 0.05 });
      else if (dc === 's') s.noise(o, t, { type: 'highpass', f: [6000, 5000], gain: g * 0.25, attack: 0.01, dur: 0.06 });
    }
    // the bell
    if (m.bellEvery && pos === 0 && bar % m.bellEvery === 0) s.bell(o, t, this._deg(m, chord[0], -1), 5, m.bellGain || 0.1);
  }

  /** The drone glides to a new root. */
  _droneTo(freq) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    if (!this.drone) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 3);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 360;
      f.Q.value = 1.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 150;
      lfo.connect(lfoAmt).connect(f.frequency);
      f.connect(g).connect(this.out);
      const oscs = [];
      for (const [mul, det] of [[1, -6], [1, 6], [1.5, 0], [0.5, 0]]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = det;
        o.connect(f);
        oscs.push({ o, mul });
      }
      lfo.start(t);
      for (const { o } of oscs) o.start(t);
      this.drone = { g, oscs, lfo };
    }
    for (const { o, mul } of this.drone.oscs) o.frequency.setTargetAtTime(freq * mul, t, 0.4);
  }

  _stopDrone() {
    const d = this.drone;
    if (!d) return;
    const t = this.ctx.currentTime;
    d.g.gain.cancelScheduledValues(t);
    d.g.gain.setValueAtTime(d.g.gain.value, t);
    d.g.gain.linearRampToValueAtTime(0.0001, t + 2);
    for (const { o } of d.oscs) o.stop(t + 2.1);
    d.lfo.stop(t + 2.1);
    this.drone = null;
  }
}
