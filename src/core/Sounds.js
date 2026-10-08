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
  // the way down grinds open: stone dragged over stone, settling with a boom
  stairOpen: [0.55, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [520 * p, 140], q: 1.4, gain: 0.38, attack: 0.1, dur: 1.25 });
    for (let i = 0; i < 10; i++) s.noise(o, t + i * 0.11 + Math.random() * 0.05, { type: 'bandpass', f: [300, 200], q: 5, gain: 0.13, dur: 0.07 });
    s.drum(o, t + 1.2, 70, 34, 0.6, 0.45, 0);
  }],
  // --- Beatrix the Wandering ---
  heartbeat: [0.15, (s, o, t) => {
    s.drum(o, t, 62, 38, 0.14, 0.55, 0.05); // lub
    s.drum(o, t + 0.2, 56, 34, 0.12, 0.4, 0.05); // dub
  }],
  whisper: [0.85, (s, o, t, p) => {
    // breath shaped into a voice that isn't saying anything you want to hear
    s.noise(o, t, { type: 'bandpass', f: [2200 * p, 900 * p], q: 5, gain: 0.07, attack: 0.18, dur: 0.9 });
    s.noise(o, t + 0.25, { type: 'bandpass', f: [1400 * p, 2600 * p], q: 6, gain: 0.05, attack: 0.15, dur: 0.7 });
    s.noise(o, t + 0.1, { type: 'highpass', f: [5000, 4000], q: 0.7, gain: 0.03, attack: 0.1, dur: 0.6 });
  }],
  sting: [0.7, (s, o, t, p) => {
    // a scrape of strings, two notes rubbing against each other
    s.sweep(o, t, 'sawtooth', 1120 * p, 1060 * p, 0.7, 0.07, 2600, 0.01);
    s.sweep(o, t, 'sawtooth', 1187 * p, 1130 * p, 0.7, 0.06, 2600, 0.01);
    s.sweep(o, t, 'sawtooth', 280 * p, 140 * p, 0.6, 0.06, 900, 0.005);
    s.noise(o, t, { type: 'highpass', f: [4000, 2500], q: 0.8, gain: 0.08, dur: 0.25 });
  }],
  creak: [0.6, (s, o, t, p) => {
    // a door, somewhere close, opening slowly
    s.sweep(o, t, 'square', 70 * p, 120 * p, 0.6, 0.035, 500, 0.05);
    s.sweep(o, t + 0.35, 'square', 110 * p, 80 * p, 0.5, 0.03, 500, 0.05);
    for (let i = 0; i < 9; i++) s.noise(o, t + i * 0.09, { type: 'bandpass', f: [900, 700], q: 8, gain: 0.05, dur: 0.03 });
  }],
  beatrixHum: [0.9, (s, o, t, p) => {
    // a woman humming, out of tune, from very far away
    s.choir(o, t, [220 * p, 233 * p], 2.2, 0.045, 0.6);
    s.choir(o, t + 1.1, [196 * p, 208 * p], 1.8, 0.035, 0.5);
  }],
  // --- found weapons ---
  castFire: [0.35, (s, o, t, p) => {
    s.noise(o, t, { type: 'lowpass', f: [3200 * p, 500], q: 0.8, gain: 0.3, dur: 0.18 }); // a whoomph of flame
    s.sweep(o, t, 'sawtooth', 600 * p, 180 * p, 0.14, 0.06, 1800);
    s.drum(o, t, 140 * p, 60, 0.1, 0.25, 0.3);
  }],
  castWater: [0.45, (s, o, t, p) => {
    s.sweep(o, t, 'sine', 300 * p, 900 * p, 0.08, 0.14); // a bloop
    s.sweep(o, t + 0.06, 'sine', 700 * p, 260 * p, 0.12, 0.08);
    s.noise(o, t + 0.04, { type: 'bandpass', f: [1200, 400], q: 2, gain: 0.12, dur: 0.12 });
  }],
  castFrost: [0.5, (s, o, t, p) => {
    s.bell(o, t, 2637 * p, 0.4, 0.06); // ice chimes
    s.bell(o, t + 0.03, 3520 * p, 0.3, 0.04);
    s.noise(o, t, { type: 'highpass', f: [6000, 4000], gain: 0.1, dur: 0.12 });
  }],
  castStorm: [0.35, (s, o, t, p) => {
    for (let i = 0; i < 6; i++) s.noise(o, t + i * 0.012, { type: 'highpass', f: [4000 + i * 600, 3000], gain: 0.16, dur: 0.012 }); // a crackle
    s.sweep(o, t, 'square', 1800 * p, 200 * p, 0.1, 0.05, 3000);
  }],
  bow: [0.25, (s, o, t, p) => {
    s.pluck(o, t, 140 * p, 0.3, 0.45, 0.9, 0.985); // the string thrums
    s.noise(o, t + 0.01, { type: 'bandpass', f: [2600, 900], q: 1.6, gain: 0.2, dur: 0.12 }); // the arrow hisses away
  }],
  axe: [0.3, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [200 * p, 1400 * p], q: 1.4, gain: 0.8, attack: 0.07, dur: 0.18 }); // a heavy whoosh
    s.drum(o, t + 0.06, 70 * p, 40, 0.15, 0.25, 0);
  }],
  hammer: [0.35, (s, o, t, p) => {
    s.noise(o, t, { type: 'bandpass', f: [180 * p, 900 * p], q: 1.2, gain: 0.7, attack: 0.08, dur: 0.18 });
    s.drum(o, t + 0.1, 90 * p, 34, 0.3, 0.6, 0.6); // the floor booms
    s.metal(o, t + 0.1, 420 * p, 0.6, 0.16);
  }],
  // --- menus ---
  menuMove: [0.2, (s, o, t, p) => {
    s.drum(o, t, 900 * p, 600, 0.03, 0.12, 0.3); // a dry wooden tick
    s.pluck(o, t, 440 * p, 0.2, 0.04, 0.6, 0.99);
  }],
  menuChoose: [0.45, (s, o, t, p) => {
    s.metal(o, t, 1400 * p, 0.35, 0.12); // a blade drawn
    s.noise(o, t, { type: 'bandpass', f: [1800, 5200], q: 2, gain: 0.12, attack: 0.02, dur: 0.12 });
    s.drum(o, t, 120, 50, 0.15, 0.25, 0.3);
  }],
  menuBack: [0.3, (s, o, t, p) => {
    s.drum(o, t, 500 * p, 260, 0.05, 0.15, 0.3);
    s.pluck(o, t, 330 * p, 0.3, 0.04, 0.5, 0.99);
  }],
  // --- Wren ---
  wand: [0.35, (s, o, t, p) => {
    // a spell cracks loose: a zap that falls, a thump of force, sparks of glass
    s.sweep(o, t, 'sawtooth', 2400 * p, 380 * p, 0.11, 0.09, 3200);
    s.sweep(o, t, 'sine', 900 * p, 2600 * p, 0.06, 0.06);
    s.drum(o, t, 190 * p, 70, 0.09, 0.28, 0.2);
    s.noise(o, t, { type: 'bandpass', f: [4200 * p, 1500], q: 1.8, gain: 0.16, dur: 0.1 });
    s.bell(o, t + 0.015, 2640 * p, 0.22, 0.035);
  }],
  crit: [0.4, (s, o, t, p) => {
    // a critical hit: a heavy smack and a high ring that hangs in the air
    s.drum(o, t, 220 * p, 45, 0.2, 0.6, 0.7);
    s.noise(o, t, { type: 'lowpass', f: [5000, 600], gain: 0.3, dur: 0.08 });
    s.metal(o, t + 0.01, 1500 * p, 0.5, 0.2);
    s.bell(o, t + 0.02, 1760 * p, 0.7, 0.06);
  }],
  wizBlink: [0.5, (s, o, t, p) => {
    // Wren folds space: air rushes in, a pop, a glassy shimmer where he lands
    s.sweep(o, t, 'sine', 220 * p, 1800 * p, 0.12, 0.12, 0, 0.04);
    s.noise(o, t, { type: 'bandpass', f: [600, 5000], q: 2, gain: 0.18, attack: 0.08, dur: 0.12 });
    s.drum(o, t + 0.11, 260 * p, 90, 0.08, 0.3, 0.4);
    s.bell(o, t + 0.12, 1975 * p, 0.6, 0.06);
    s.bell(o, t + 0.16, 2637 * p, 0.5, 0.04);
  }],
  reload: [0.15, (s, o, t, p) => {
    // the windlass cranks, the latch catches
    for (let i = 0; i < 3; i++) s.noise(o, t + 0.05 + i * 0.045, { type: 'bandpass', f: [2200 * p, 1900], q: 6, gain: 0.35, dur: 0.02 });
    s.drum(o, t + 0.2, 600 * p, 300, 0.05, 0.25, 0.5);
    s.noise(o, t + 0.2, { type: 'highpass', f: [4000, 3000], gain: 0.15, dur: 0.015 });
  }],
  steady: [0.4, (s, o, t, p) => {
    // the aim settles: a held breath, a faint glint
    s.bell(o, t, 2093 * p, 0.6, 0.05);
    s.pluck(o, t, 196 * p, 0.3, 0.06, 0.8, 0.99); // the string creaks taut
  }],
  aimedShot: [0.4, (s, o, t, p) => {
    // a perfect shot: an extra crack on top of the crossbow
    s.noise(o, t, { type: 'highpass', f: [7000, 5000], gain: 0.25, dur: 0.03 });
    s.sweep(o, t, 'square', 1200 * p, 300 * p, 0.12, 0.05, 2500);
  }],
  shieldCharge: [0.25, (s, o, t, p) => {
    // armour lurches into a run: iron rattles, boots pound, a war-grunt
    s.drum(o, t, 90 * p, 40, 0.2, 0.45, 0.6);
    clicks(s, o, t, 8, 0.2, 3200, 0.12);
    s.noise(o, t, { type: 'lowpass', f: [400, 1400], q: 1, gain: 0.25, attack: 0.05, dur: 0.22 });
    s.growl(o, t + 0.01, 150 * p, 110 * p, 0.18, 0.1, [500, 800]);
  }],
  shieldBash: [0.35, (s, o, t, p) => {
    // the shield meets a body: a great booming clang
    s.drum(o, t, 120 * p, 36, 0.3, 0.8, 0.8);
    s.metal(o, t, 330 * p, 0.6, 0.25);
    s.noise(o, t, { type: 'lowpass', f: [2400, 300], gain: 0.4, dur: 0.12 });
  }],
  roll: [0.15, (s, o, t, p) => {
    // cloth and leather whipping round, then boots hitting stone
    s.noise(o, t, { type: 'bandpass', f: [500 * p, 1700 * p], q: 1.1, gain: 0.3, attack: 0.04, dur: 0.2 });
    s.noise(o, t + 0.05, { type: 'lowpass', f: [700, 250], gain: 0.2, attack: 0.03, dur: 0.18 });
    s.drum(o, t + 0.24, 120 * p, 55, 0.12, 0.34, 0.5);
    clicks(s, o, t + 0.25, 4, 0.06, 2600, 0.12); // grit underfoot
  }],
  xbow: [0.3, (s, o, t, p) => {
    // the latch clacks, the string slams forward, the stock kicks, the bolt hisses away
    s.noise(o, t, { type: 'highpass', f: [5000, 4000], q: 1, gain: 0.25, dur: 0.015 });
    s.pluck(o, t, 82 * p, 0.35, 0.5, 1, 0.975);
    s.drum(o, t, 140 * p, 42, 0.18, 0.4, 0.6);
    s.drum(o, t + 0.005, 700 * p, 380, 0.04, 0.2, 0.3); // wood knock
    s.noise(o, t + 0.02, { type: 'bandpass', f: [3800, 900], q: 2.2, gain: 0.22, dur: 0.16 });
  }],
  sword: [0.3, (s, o, t, p) => {
    // a heavy blade cuts the air: the whoosh rises and falls; the edge sings
    s.noise(o, t, { type: 'bandpass', f: [300 * p, 2200 * p], q: 1.6, gain: 0.85, attack: 0.05, dur: 0.12 });
    s.drum(o, t + 0.04, 90 * p, 50, 0.12, 0.18, 0); // weight behind it
    s.noise(o, t + 0.1, { type: 'bandpass', f: [2200 * p, 600 * p], q: 1.6, gain: 0.6, dur: 0.12 });
    s.sweep(o, t, 'sine', 3200 * p, 2700 * p, 0.25, 0.025);
  }],
  slash: [0.3, (s, o, t, p) => {
    // the blow lands: a meaty crunch, a deep thud, iron ringing
    s.drum(o, t, 150 * p, 40, 0.22, 0.7, 0.8);
    s.noise(o, t, { type: 'lowpass', f: [3000, 400], q: 1.2, gain: 0.35, dur: 0.1 });
    s.metal(o, t + 0.005, 520 * p, 0.35, 0.16);
  }],
  parry: [0.45, (s, o, t, p) => {
    // steel turns a shot aside: a bright ring and a spray of sparks
    s.metal(o, t, 1700 * p, 0.6, 0.3);
    s.bell(o, t, 2400 * p, 0.5, 0.05);
    crackle(s, o, t, 0.1, 6, 0.2);
  }],
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
  heart: [0.4, (s, o, t, p) => {
    // a healing draught: the cork, three gulps, warmth
    s.drum(o, t, 900 * p, 420, 0.035, 0.22, 0.7);
    s.noise(o, t, { type: 'bandpass', f: [2400, 1600], q: 3, gain: 0.12, dur: 0.04 });
    for (let i = 0; i < 3; i++) s.sweep(o, t + 0.12 + i * 0.13, 'sine', 260 * p, 150 * p, 0.09, 0.14);
    s.choir(o, t + 0.3, [D.D3, D.A3, D.F4], 0.9, 0.05, 0.2);
  }],
  bombPickup: [0.25, (s, o, t, p) => {
    s.drum(o, t, 190 * p, 120, 0.15, 0.35, 0.3);
    s.noise(o, t, { type: 'bandpass', f: [700, 500], q: 4, gain: 0.3, dur: 0.06 });
  }],
  key: [0.35, (s, o, t, p) => {
    s.metal(o, t, 1900 * p, 0.3, 0.18);
    s.metal(o, t + 0.08, 2500 * p, 0.35, 0.16);
  }],
  buy: [0.35, (s, o, t) => {
    // coins counted onto the table, and the trader's nod
    SOUNDS.coins[1](s, o, t, 1);
    s.drum(o, t + 0.16, 140, 100, 0.08, 0.3, 0.5);
    s.metal(o, t + 0.2, 880, 0.5, 0.12);
  }],
  deny: [0.2, (s, o, t) => {
    // a dull double knock: no
    s.drum(o, t, 130, 100, 0.1, 0.35, 0.3);
    s.drum(o, t + 0.11, 115, 90, 0.12, 0.35, 0.3);
  }],
  relic: [0.6, (s, o, t) => {
    // a reliquary unsealed: a deep chapel bell, a low minor chord rising out of the dark, dust glittering
    s.drum(o, t, 70, 44, 0.6, 0.28, 0);
    s.bell(o, t, D.D3 * 2, 2.8, 0.28);
    s.bell(o, t + 0.02, D.A3, 2.6, 0.14);
    s.choir(o, t + 0.08, [D.D3, D.F3, D.A3, D.D4], 2.2, 0.13, 0.5);
    s.sweep(o, t + 0.1, 'sine', D.D3, D.D4, 1.4, 0.05, 0, 0.6);
    s.noise(o, t + 0.2, { type: 'highpass', f: [6000, 9000], gain: 0.045, attack: 0.4, dur: 1.4 });
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
    // a hidden way: stone grinding on stone, then a low bell somewhere far below
    s.noise(o, t, { type: 'lowpass', f: [420, 110], q: 1.2, gain: 0.32, attack: 0.08, dur: 0.95 });
    for (let i = 0; i < 7; i++) s.noise(o, t + i * 0.12 + Math.random() * 0.04, { type: 'bandpass', f: [260, 180], q: 5, gain: 0.12, dur: 0.06 });
    s.bell(o, t + 0.75, D.D3 * 2, 3.2, 0.22);
    s.choir(o, t + 0.8, [D.D3, D.A3], 1.6, 0.05, 0.6);
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
