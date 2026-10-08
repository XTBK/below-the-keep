// The Daily Descent: one seed and one hero for everyone, each day (UTC). Shared by the game and the
// leaderboard server (api/daily.js), so both agree on what today's run is. No imports on purpose.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789';
export const DAILY_HEROES = ['wren', 'ranger', 'ironknight'];

/** Today's date in UTC, as YYYY-MM-DD. */
export function todayUTC(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function hash(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

/** The seed for a day, e.g. "KQ7M-3XPA". */
export function dailySeed(date) {
  let s = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) s += '-';
    s += ALPHABET[hash(date, i * 7919 + 13) % ALPHABET.length];
  }
  return s;
}

/** Which hero everyone plays that day. */
export function dailyHero(date) {
  return DAILY_HEROES[hash(date, 4242) % DAILY_HEROES.length];
}

/** A run's score: how deep (a win counts as 10 floors), then how fast. Higher is better. */
export function dailyScore(depth, seconds) {
  return depth * 100000 + Math.max(0, 99999 - Math.floor(seconds));
}

/** Leaderboard names: capitals, digits and spaces, 1-12 long. */
export function cleanName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .slice(0, 12);
}
