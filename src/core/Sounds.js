// Every sound effect, as a small recipe built from the instruments in Synth.js.
// Each entry: [reverb amount 0..1, (synth, out, time, pitch) => { ... }]
// `pitch` wobbles a little every play (0.94..1.06) so repeated sounds never feel robotic.
// Notes for jingles use the old church modes (D dorian mostly) for a medieval colour.

const D = { D3: 146.8, E3: 164.8, F3: 174.6, G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, A5: 880, D6: 1174.7 };

function clicks(s, out, t, n, span, f, gain) {
  for (let i = 0; i < n; i++) s.noise(out, t + Math.random() * span, { type: 'bandpass', f: [f * (0.8 + Math.random() * 0.4), f], q: 6, gain, dur: 0.02 });
}
function crackle(s, out, t, span, n, gain) {
  for (let i = 0; i < n; i++) s.noise(out, t + Math.random() * span, { type: 'highpass', f: [3000 + Math.random() * 3000, 2500], q: 0.8, gain: gain * (0.4 + Math.random()), dur: 0.012 });
}
function arpeggio(s, out, t, notes, step, gain, dur = 1.4, bright = 0.45) {
  notes.forEach((f, i) => s.pluck(out, t + i * step, f, dur, gain, bright, 0.997));
}

export const SOUNDS = {
  // --- Wren ---
  wand: [0.35, (s, o, t, p) => {
    // a bright, airy spell: a rising shimmer and a soft whoosh
    s.bell(o, t, 1320 * p, 0.35, 0.12);
    s.bell(o, t + 0.03, 1980 * p, 0.25, 0.06);
    s.noise(o, t, { type: 'bandpass', f: [900 * p, 3600 * p], q: 2.5, gain: 0.16, attack: 0.02, dur: 0.14 });
  }],
  crit: [0.4, (s, o, t, p) => {
    s.metal(o, t, 1500 * p, 0.35, 0.22);
    s.drum(o, t, 200 * p, 90, 0.12, 0.35, 0.5);
  }],
  roll: [0.15, (s, o, t, p) => s.noise(o, t, { type: 'lowpass', f: [900 * p, 300], gain: 0.22, attack: 0.03, dur: 0.22 })],
  xbow: [0.3, (s, o, t, p) => {
    s.pluck(o, t, 92 * p, 0.4, 0.7, 0.95, 0.982); // the string snaps
    s.drum(o, t, 160 * p, 80, 0.1, 0.35, 0.5); // the stock thumps your shoulder
    s.noise(o, t, { type: 'bandpass', f: [3000, 1200], q: 1.6, gain: 0.25, dur: 0.1 });
  }],
  sword: [0.3, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [500 * p, 2600 * p], q: 1.3, gain: 0.4, attack: 0.04, dur: 0.2 }); // the whoosh
    s.metal(o, t + 0.02, 2400 * p, 0.12, 0.05);
  }],
  slash: [0.3, (s, o, t, p) => {
    s.drum(o, t, 180 * p, 70, 0.14, 0.5, 0.6); // the blow lands
    s.metal(o, t, 760 * p, 0.3, 0.2);
  }],
  parry: [0.4, (s, o, t, p) => s.metal(o, t, 1800 * p, 0.45, 0.25)],
  spellHit: [0.4, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [3000 * p, 1200], q: 2, gain: 0.18, dur: 0.08 });
    s.bell(o, t, 880 * p, 0.25, 0.08);
  }],
  sling: [0.15, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [700 * p, 2600 * p], q: 1.4, gain: 0.32, attack: 0.02, dur: 0.13 });
    s.noise(o, t + 0.1, { type: 'highpass', f: [3500, 3000], gain: 0.08, dur: 0.02 }); // the leather snaps
  }],
  impact: [0.25, (s, o, t, p) => {
    s.drum(o, t, 420 * p, 220 * p, 0.07, 0.3, 0.6); // stone on stone: a hard knock
    s.noise(o, t, { type: 'bandpass', f: [2600 * p, 1200], q: 1.5, gain: 0.12, dur: 0.05 });
  }],
  land: [0.1, (s, o, t, p) => s.noise(o, t, { type: 'lowpass', f: [800 * p, 300], gain: 0.25, dur: 0.06 })],
  woodHit: [0.25, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [950 * p, 700 * p], q: 5, gain: 0.5, dur: 0.09 });
    s.drum(o, t, 210 * p, 150 * p, 0.12, 0.3, 0.2);
  }],
  woodBreak: [0.3, (s, o, t, p) => {
    for (let i = 0; i < 4; i++) s.noise(o, t + i * 0.035, { type: 'bandpass', f: [2200 * p - i * 300, 600], q: 1.5, gain: 0.35, dur: 0.12 });
    s.drum(o, t, 160 * p, 70, 0.25, 0.35, 0.3);
    crackle(s, o, t, 0.3, 10, 0.15);
  }],
  hurt: [0.2, (s, o, t, p) => {
    s.drum(o, t, 160 * p, 60, 0.2, 0.5, 0.5); // the blow
    s.growl(o, t + 0.01, 190 * p, 130 * p, 0.2, 0.18, [650, 900]); // and a grunt
  }],
  // --- doors ---
  doorSlam: [0.55, (s, o, t, p) => {
    s.drum(o, t, 80 * p, 38, 0.6, 0.6, 0.6);
    s.metal(o, t, 96 * p, 1.0, 0.45);
    s.noise(o, t, { type: 'lowpass', f: [1500, 100], gain: 0.25, dur: 0.4 });
  }],
  doorOpen: [0.45, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [260 * p, 700 * p], q: 7, gain: 0.35, attack: 0.08, dur: 0.6 }); // a grinding chain
    clicks(s, o, t, 10, 0.55, 2400, 0.15);
    s.metal(o, t + 0.55, 180 * p, 0.6, 0.2);
  }],
  unlock: [0.35, (s, o, t, p) => {
    s.metal(o, t, 1300 * p, 0.25, 0.25);
    clicks(s, o, t + 0.04, 3, 0.1, 3000, 0.25);
    s.drum(o, t + 0.14, 320 * p, 200, 0.12, 0.35, 0.5); // the bolt shoots back: clunk
  }],
  // --- enemies ---
  enemyHit: [0.2, (s, o, t, p) => {
    s.drum(o, t, 240 * p, 110, 0.09, 0.4, 0.6);
    s.noise(o, t, { type: 'lowpass', f: [1800, 400], gain: 0.15, dur: 0.06 });
  }],
  ratSqueak: [0.2, (s, o, t, p) => s.growl(o, t, 2100 * p, 2700 * p, 0.12, 0.4, [2400, 3000])],
  ratBite: [0.15, (s, o, t) => clicks(s, o, t, 3, 0.06, 3200, 0.55)],
  ratDie: [0.25, (s, o, t, p) => s.growl(o, t, 2600 * p, 1400 * p, 0.2, 0.35, [2600, 2000])],
  keyJangle: [0.3, (s, o, t, p) => {
    for (let i = 0; i < 5; i++) s.metal(o, t + Math.random() * 0.22, (2600 + Math.random() * 1800) * p, 0.25, 0.12);
  }],
  swing: [0.2, (s, o, t, p) => s.noise(o, t, { type: 'bandpass', f: [400 * p, 2200 * p], q: 1.6, gain: 0.3, attack: 0.06, dur: 0.22 })],
  thud: [0.45, (s, o, t, p) => {
    s.drum(o, t, 95 * p, 34, 0.45, 0.65, 0.5);
    s.noise(o, t, { type: 'lowpass', f: [600, 80], gain: 0.25, dur: 0.3 });
  }],
  chainRattle: [0.3, (s, o, t, p) => {
    for (let i = 0; i < 7; i++) s.metal(o, t + Math.random() * 0.3, (1700 + Math.random() * 1500) * p, 0.12, 0.1);
  }],
  chainYank: [0.3, (s, o, t, p) => {
    s.metal(o, t, 520 * p, 0.35, 0.3);
    s.noise(o, t, { type: 'bandpass', f: [1800, 900], q: 2, gain: 0.2, dur: 0.1 });
  }],
  fireCharge: [0.3, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [250 * p, 1600 * p], q: 1.2, gain: 0.3, attack: 0.3, dur: 0.55 });
    crackle(s, o, t, 0.5, 12, 0.12);
  }],
  fireThrow: [0.25, (s, o, t, p) => s.noise(o, t, { type: 'bandpass', f: [1600 * p, 400], q: 1, gain: 0.3, attack: 0.02, dur: 0.25 })],
  fireLand: [0.4, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [1400 * p, 150], gain: 0.45, dur: 0.6 });
    s.drum(o, t, 90 * p, 40, 0.35, 0.4, 0.3);
    crackle(s, o, t + 0.05, 0.6, 16, 0.15);
  }],
  sizzle: [0.2, (s, o, t, p) => {
    s.noise(o, t, { type: 'highpass', f: [3500 * p, 5000], q: 0.6, gain: 0.16, attack: 0.02, dur: 0.45 });
    crackle(s, o, t, 0.45, 12, 0.1);
  }],
  ghoulGroan: [0.5, (s, o, t, p) => s.growl(o, t, 105 * p, 80 * p, 0.6, 0.65, [420, 620])],
  splat: [0.3, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [1200 * p, 200], q: 2.5, gain: 0.45, dur: 0.25 });
    s.drum(o, t, 140 * p, 60, 0.18, 0.3, 0);
  }],
  crossbowClick: [0.2, (s, o, t, p) => s.noise(o, t, { type: 'bandpass', f: [2800 * p, 2600], q: 8, gain: 0.5, dur: 0.03 })],
  crossbowFire: [0.25, (s, o, t, p) => {
    s.pluck(o, t, 98 * p, 0.35, 0.6, 0.9, 0.985); // the bowstring twangs
    s.noise(o, t, { type: 'bandpass', f: [2600, 900], q: 1.4, gain: 0.25, dur: 0.12 });
  }],
  crank: [0.2, (s, o, t) => { for (let i = 0; i < 9; i++) s.noise(o, t + i * 0.034, { type: 'bandpass', f: [1900, 1700], q: 6, gain: 0.7, dur: 0.02 }); }],
  clatter: [0.35, (s, o, t, p) => {
    for (let i = 0; i < 9; i++) {
      const tt = t + Math.random() * 0.4;
      if (Math.random() < 0.5) s.metal(o, tt, (500 + Math.random() * 900) * p, 0.2, 0.12);
      else s.noise(o, tt, { type: 'bandpass', f: [1200 + Math.random() * 1500, 800], q: 4, gain: 0.3, dur: 0.05 });
    }
  }],
  mimicCreak: [0.35, (s, o, t, p) => {
    // old wood under strain: a narrow, stuttering buzz
    for (let i = 0; i < 5; i++) s.noise(o, t + i * 0.09, { type: 'bandpass', f: [(380 + i * 60) * p, (420 + i * 60) * p], q: 18, gain: 1.4, dur: 0.08 });
  }],
  hop: [0.25, (s, o, t, p) => s.drum(o, t, 170 * p, 90, 0.12, 0.35, 0.4)],
  mimicChomp: [0.3, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [900 * p, 600], q: 4, gain: 0.5, dur: 0.07 });
    s.noise(o, t + 0.07, { type: 'bandpass', f: [800 * p, 500], q: 4, gain: 0.5, dur: 0.08 });
    s.drum(o, t, 150 * p, 70, 0.15, 0.35, 0.3);
  }],
  // --- pickups & items ---
  coin: [0.3, (s, o, t, p) => {
    s.metal(o, t, 2300 * p, 0.35, 0.2); // a silver penny rings on stone
    s.metal(o, t + 0.07, 2450 * p, 0.25, 0.1);
  }],
  coins: [0.3, (s, o, t, p) => { for (let i = 0; i < 4; i++) s.metal(o, t + i * 0.045 + Math.random() * 0.02, (2100 + Math.random() * 600) * p, 0.3, 0.15); }],
  heart: [0.4, (s, o, t) => arpeggio(s, o, t, [D.D4, D.F4, D.A4, D.D5], 0.07, 0.35, 1.2, 0.35)],
  bombPickup: [0.25, (s, o, t, p) => {
    s.drum(o, t, 190 * p, 120, 0.15, 0.35, 0.3);
    s.noise(o, t, { type: 'bandpass', f: [700, 500], q: 4, gain: 0.3, dur: 0.06 });
  }],
  key: [0.35, (s, o, t, p) => {
    s.metal(o, t, 1900 * p, 0.3, 0.18);
    s.metal(o, t + 0.08, 2500 * p, 0.35, 0.16);
  }],
  buy: [0.35, (s, o, t) => {
    SOUNDS.coins[1](s, o, t, 1);
    arpeggio(s, o, t + 0.05, [D.A4, D.D5], 0.08, 0.3, 0.9);
  }],
  deny: [0.2, (s, o, t) => {
    // a dull double knock: no
    s.drum(o, t, 130, 100, 0.1, 0.35, 0.3);
    s.drum(o, t + 0.11, 115, 90, 0.12, 0.35, 0.3);
  }],
  relic: [0.6, (s, o, t) => {
    // a harp glissando up the dorian scale, voices swelling under it, a bell on top
    arpeggio(s, o, t, [D.D4, D.E4, D.F4, D.G4, D.A4, D.B4, D.C5, D.D5], 0.045, 0.3, 1.8, 0.4);
    s.choir(o, t + 0.05, [D.D3, D.A3, D.D4, D.F4], 1.8, 0.12, 0.3);
    s.bell(o, t + 0.36, D.D5, 2.2, 0.35);
  }],
  charged: [0.5, (s, o, t) => {
    s.bell(o, t, D.A5, 1.4, 0.25);
    s.bell(o, t + 0.09, D.D6, 1.2, 0.18);
  }],
  horn: [0.7, (s, o, t, p) => {
    s.horn(o, t, 98 * p, 1.4, 0.24); // the ram's horn: a long, low call
    s.horn(o, t + 0.05, 147 * p, 1.3, 0.14);
  }],
  holy: [0.7, (s, o, t) => {
    s.choir(o, t, [D.D4, D.A4, D.D5], 1.3, 0.16, 0.12);
    for (let i = 0; i < 5; i++) s.bell(o, t + i * 0.07, [D.D5, D.A5, D.F5, D.D6, D.A5][i], 1.0, 0.12);
    s.noise(o, t, { type: 'highpass', f: [4000, 7000], gain: 0.08, attack: 0.1, dur: 0.8 });
  }],
  fuse: [0.1, (s, o, t) => {
    s.noise(o, t, { type: 'highpass', f: [4500, 6000], q: 0.6, gain: 0.07, attack: 0.05, dur: 1.4 });
    crackle(s, o, t, 1.4, 30, 0.08);
  }],
  explosion: [0.6, (s, o, t, p) => {
    s.drum(o, t, 75 * p, 26, 1.2, 0.55, 0);
    s.noise(o, t, { type: 'lowpass', f: [3000 * p, 70], gain: 0.45, dur: 1.1 });
    s.noise(o, t + 0.05, { type: 'lowpass', f: [400, 60], gain: 0.4, attack: 0.1, dur: 1.4 }); // the rumble after
    crackle(s, o, t + 0.1, 0.9, 20, 0.15);
  }],
  pop: [0.3, (s, o, t, p) => {
    s.drum(o, t, 190 * p, 70, 0.15, 0.35, 0.5);
    s.noise(o, t, { type: 'lowpass', f: [1600, 300], gain: 0.2, dur: 0.12 });
  }],
  zap: [0.35, (s, o, t, p) => {
    for (let i = 0; i < 6; i++) s.noise(o, t + i * 0.022, { type: 'bandpass', f: [5000 * p, 2500], q: 3, gain: 0.25, dur: 0.03 });
    s.metal(o, t, 900 * p, 0.2, 0.1);
  }],
  secret: [0.65, (s, o, t) => {
    // a little discovery: harp and a distant bell
    arpeggio(s, o, t, [D.A3, D.D4, D.E4, D.A4, D.D5], 0.09, 0.32, 1.8, 0.35);
    s.bell(o, t + 0.45, D.A4, 2.6, 0.3);
  }],
  // --- bosses & the run ---
  roar: [0.6, (s, o, t, p) => {
    s.growl(o, t, 75 * p, 48 * p, 1.2, 0.55, [320, 650]);
    s.growl(o, t + 0.04, 150 * p, 95 * p, 1.0, 0.25, [700, 1100]);
    s.drum(o, t, 60, 30, 0.8, 0.35, 0);
  }],
  descend: [0.7, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [1500 * p, 90], gain: 0.35, dur: 1.1 });
    s.bell(o, t + 0.2, D.D3, 3.0, 0.4);
  }],
  death: [0.8, (s, o, t) => {
    s.bell(o, t, 73.4, 5.0, 0.6); // a low funeral toll
    arpeggio(s, o, t + 0.5, [D.A3, D.F3, D.E3, D.D3], 0.35, 0.3, 2.2, 0.3);
  }],
  victory: [0.75, (s, o, t) => {
    // a fanfare of horns, then voices and bells
    const H = [[D.D3, 0, 0.35], [D.A3, 0.35, 0.35], [D.D4, 0.7, 1.6]];
    for (const [f, dt, d] of H) {
      s.horn(o, t + dt, f, d, 0.22);
      s.horn(o, t + dt, f * 1.5, d, 0.1);
    }
    s.choir(o, t + 0.7, [D.D3, D.A3, D.D4, D.F4 * 1.059, D.A4], 2.6, 0.13, 0.4); // a major chord at last
    s.bell(o, t + 0.7, D.D5, 3, 0.3);
    s.bell(o, t + 1.0, D.A5, 2.5, 0.2);
  }],
  echo: [0.95, (s, o, t, p) => {
    // a drip, far off, ringing in a hollow beyond the wall
    s.pluck(o, t, 1400 * p, 0.4, 0.2, 0.2, 0.99);
    s.bell(o, t + 0.02, 880 * p, 1.5, 0.08);
  }],
  snuff: [0.2, (s, o, t, p) => s.noise(o, t, { type: 'lowpass', f: [1400 * p, 200], gain: 0.2, attack: 0.02, dur: 0.25 })],
  clang: [0.45, (s, o, t, p) => s.metal(o, t, 640 * p, 0.6, 0.45)],
  wail: [0.85, (s, o, t, p) => {
    s.choir(o, t, [520 * p], 0.9, 0.28, 0.25);
    s.noise(o, t, { type: 'bandpass', f: [900 * p, 600 * p], q: 6, gain: 0.3, attack: 0.2, dur: 0.9 });
  }],
  howl: [0.7, (s, o, t, p) => s.growl(o, t, 330 * p, 520 * p, 1.0, 0.6, [900, 1300])],
  caw: [0.35, (s, o, t, p) => {
    s.growl(o, t, 640 * p, 520 * p, 0.15, 0.6, [1300, 1500]);
    s.growl(o, t + 0.2, 600 * p, 480 * p, 0.15, 0.5, [1300, 1500]);
  }],
  cast: [0.6, (s, o, t, p) => {
    for (let i = 0; i < 4; i++) s.bell(o, t + i * 0.06, (1200 + i * 330) * p, 0.6, 0.08);
    s.noise(o, t, { type: 'bandpass', f: [700 * p, 3500 * p], q: 4, gain: 0.18, attack: 0.15, dur: 0.45 });
  }],
  blink: [0.5, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [3000 * p, 600], q: 3, gain: 0.2, attack: 0.1, dur: 0.2 });
    s.bell(o, t + 0.15, 1760 * p, 0.5, 0.08);
  }],
  breath: [0.4, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [500 * p, 2600 * p], q: 1, gain: 0.45, attack: 0.1, dur: 0.95 });
    crackle(s, o, t, 0.9, 25, 0.15);
  }],
  inhale: [0.3, (s, o, t, p) => s.noise(o, t, { type: 'bandpass', f: [300 * p, 1300 * p], q: 2.5, gain: 0.5, attack: 0.7, dur: 0.85 })],
  steal: [0.3, (s, o, t, p) => {
    for (let i = 0; i < 3; i++) s.metal(o, t + i * 0.06, (2600 - i * 300) * p, 0.25, 0.15);
    s.growl(o, t + 0.12, 700 * p, 900 * p, 0.18, 0.1, [1200, 1600]); // a nasty little snicker
  }],
  spit: [0.25, (s, o, t, p) => s.noise(o, t, { type: 'bandpass', f: [1700 * p, 700], q: 2.2, gain: 0.35, dur: 0.12 })],
  gong: [0.85, (s, o, t, p) => {
    s.bell(o, t, 82 * p, 4.5, 0.6);
    s.noise(o, t, { type: 'lowpass', f: [600, 80], gain: 0.2, dur: 0.3 });
  }],
};
