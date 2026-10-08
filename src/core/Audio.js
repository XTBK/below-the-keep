import { fxRng } from './Rng.js';
import { MUSIC } from '../data/music.js';
import { Synth } from './Synth.js';
import { SOUNDS } from './Sounds.js';
import { Ambience } from './Ambience.js';

// Sound for the whole game, synthesised with the Web Audio API (no sound files needed):
//   - sound effects: recipes in core/Sounds.js, built from the instruments in core/Synth.js
//     (plucked strings, bells, clanging metal, drums, horns, a choir, growls, filtered noise)
//   - everything plays into a stone-dungeon reverb, then a gentle compressor
//   - music: music(moment) plays the file data/music.js names for that moment; moments without a
//     file get generated medieval music (core/Ambience.js), unless MUSIC.generated is false
// Browsers only allow audio after the first key press / click, so everything starts on demand.

export class Audio {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.musicVolume = 1; // the player's settings (0..1)
    this.soundVolume = 1;
    this.musicName = null;
    this.lastPlayed = new Map(); // sound name -> time (the same sound can't restart within 35 ms)
    this.recent = []; // start times of recent sounds (at most ~22 new sounds in any 0.1 s)
    // phones only allow audio to start when a finger LIFTS (touchend / pointerup), so listen for those too
    const unlock = () => this._ensure();
    for (const ev of ['keydown', 'pointerdown', 'pointerup', 'touchend', 'click']) window.addEventListener(ev, unlock);
  }

  _ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return false;
    }
    const ctx = this.ctx;
    this.synth = new Synth(ctx);
    // master: a soft compressor so loud moments don't clip, then the speakers
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    comp.connect(this.master).connect(ctx.destination);
    // dry sounds, and the reverb (the dungeon itself)
    this.dry = ctx.createGain();
    this.dry.connect(comp);
    this.reverb = this.synth.makeReverb(2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(comp);
    // sound effects have their own volume (Settings)
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.soundVolume;
    this.sfxBus.connect(this.dry);
    this.sfxSend = ctx.createGain();
    this.sfxSend.gain.value = this.soundVolume;
    this.sfxSend.connect(this.reverb);
    // the music bus: quieter, a little reverb too
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = MUSIC.generatedVolume * this.musicVolume;
    this.musicBus.connect(this.dry);
    const musicSend = ctx.createGain();
    musicSend.gain.value = 0.35;
    this.musicBus.connect(musicSend).connect(this.reverb);
    this.ambience = new Ambience(this.synth, this.musicBus);
    if (this.musicName) this._applyMusic(this.musicName);
    return true;
  }

  /** Settings: music and sound-effect volume, 0..1. */
  setVolumes(music, sound) {
    this.musicVolume = music;
    this.soundVolume = sound;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(MUSIC.generatedVolume * music, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(sound, t, 0.05);
    this.sfxSend.gain.setTargetAtTime(sound, t, 0.05);
    if (this.musicEl) this.musicEl.volume = MUSIC.volume * music;
  }

  /** Play a sound effect by name (see core/Sounds.js). volume scales it (1 = normal). */
  play(name, volume = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = SOUNDS[name];
    if (!s) return;
    // a flood of the same sound (twenty stones landing at once) is one sound, not twenty
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed.get(name) ?? -1) < 0.035) return;
    while (this.recent.length && now - this.recent[0] > 0.1) this.recent.shift();
    if (this.recent.length >= 22) return;
    this.lastPlayed.set(name, now);
    this.recent.push(now);
    const [wet, recipe] = s;
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(this.sfxBus);
    if (wet > 0) {
      const send = ctx.createGain();
      send.gain.value = wet;
      out.connect(send).connect(this.sfxSend);
    }
    recipe(this.synth, out, ctx.currentTime + 0.005, fxRng.float(0.94, 1.06));
  }

  /**
   * Music for a moment of the game ('title', 'cells', 'boss', 'victory'... see data/music.js).
   * Called every frame; only acts when the moment changes (and keeps generated music going).
   */
  music(name) {
    if (name !== this.musicName) {
      this.musicName = name;
      this._applyMusic(name);
    }
    if (this.ambience && this.ctx.state === 'running') this.ambience.update();
  }

  _applyMusic(name) {
    const url = MUSIC.tracks[name] || null;
    // a real music file for this moment: stream it, cross-fading from whatever played before
    if (url !== this.musicUrl) {
      const old = this.musicEl;
      if (old) this._fade(old, 0, MUSIC.fadeTime, () => old.pause());
      this.musicEl = null;
      this.musicUrl = url;
      if (url) {
        const el = new window.Audio(import.meta.env.BASE_URL + url);
        el.loop = true;
        el.volume = 0;
        this.musicEl = el;
        const start = () => {
          el.play()
            .then(() => this._fade(el, MUSIC.volume * this.musicVolume, MUSIC.fadeTime))
            .catch(() => window.addEventListener('pointerdown', start, { once: true })); // waits for a first tap/click
        };
        start();
      }
    }
    // otherwise, generated music
    if (this.ambience) this.ambience.set(!url && MUSIC.generated ? name : null);
  }

  _fade(el, to, time, done) {
    const from = el.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (time * 1000));
      el.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    step();
  }
}
