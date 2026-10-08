import { Save } from './Save.js';
import { todayUTC, dailySeed, dailyHero, dailyScore, cleanName } from '../data/dailySeed.js';

// on the website (or a local dev server) the board is next door; anywhere else (itch.io) it's the website's
const HOME = 'https://below-the-keep.vercel.app';
const API = /vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) ? '/api/daily' : HOME + '/api/daily';

// The Daily Descent, game side: today's seed and hero, the leaderboard (api/daily.js), and posting
// a finished run. Only the FIRST run of the day is posted; replays that day are practice.
// If the board can't be reached (no server, offline, local dev) the best run is kept on this device.

export const daily = {
  board: null, // { online, top: [...] } once fetched
  loading: false,
  lastPost: null, // { rank } after posting

  get date() {
    return todayUTC();
  },
  get seed() {
    return dailySeed(this.date);
  },
  get hero() {
    return dailyHero(this.date);
  },
  /** Has today's scored attempt been used? */
  get played() {
    return Save.data.daily.played === this.date;
  },
  get name() {
    return Save.data.daily.name || '';
  },
  set name(v) {
    Save.data.daily.name = cleanName(v);
    Save.write();
  },
  /** This device's best today, if any. */
  get localBest() {
    const b = Save.data.daily.best;
    return b && b.date === this.date ? b : null;
  },

  async fetchBoard() {
    if (this.loading) return;
    this.loading = true;
    try {
      const r = await fetchWithTimeout(API, {}, 5000);
      this.board = r.ok ? await r.json() : { online: false, top: [] };
    } catch {
      this.board = { online: false, top: [] };
    }
    this.loading = false;
  },
};

function fetchWithTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return fetch(url, { ...opts, signal: ctl.signal }).finally(() => clearTimeout(t));
}

/** How deep a run got: floors finished, or 10 for a win. */
export function runDepth(game, won) {
  return won ? 10 : Math.max(0, game.floorNumber - 1);
}

/** Called when a Daily Descent run ends. */
export async function submitDaily(game, won) {
  const date = game.daily.date;
  const depth = runDepth(game, won);
  const seconds = Math.max(20, Math.floor(game.runTime || 0));
  const score = dailyScore(depth, seconds);
  const best = Save.data.daily.best;
  if (!best || best.date !== date || best.score < score) Save.data.daily.best = { date, depth, seconds, won, score };
  const first = Save.data.daily.played !== date;
  Save.data.daily.played = date;
  Save.write();
  daily.lastPost = { pending: first, rank: null, practice: !first };
  if (!first || !daily.name) return;
  try {
    const r = await fetchWithTimeout(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, seed: dailySeed(date), name: daily.name, depth, seconds, won }) }, 6000);
    const j = r.ok ? await r.json() : null;
    if (j && j.online) {
      daily.board = j;
      daily.lastPost = { rank: j.rank };
    } else daily.lastPost = { offline: true };
  } catch {
    daily.lastPost = { offline: true };
  }
}
