// The Daily Descent leaderboard (a Vercel serverless function).
//   GET  /api/daily            today's seed, hero and top 20
//   POST /api/daily            { date, seed, name, depth, seconds, won } - post a run
// Scores live in Redis (Upstash, through the Vercel Marketplace). Set either pair of env vars:
//   KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
// Without them the board answers { online: false } and the game keeps scores on the player's device.

import { todayUTC, dailySeed, dailyHero, dailyScore, cleanName } from '../src/data/dailySeed.js';

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEEP_DAYS = 14;

async function redis(commands) {
  const r = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

async function board(date) {
  const [ranked, info] = await redis([
    ['ZREVRANGE', `daily:${date}`, '0', '19', 'WITHSCORES'],
    ['HGETALL', `daily:${date}:runs`],
  ]);
  const details = {};
  for (let i = 0; i < (info || []).length; i += 2) {
    try {
      details[info[i]] = JSON.parse(info[i + 1]);
    } catch {
      // skip a damaged entry
    }
  }
  const top = [];
  for (let i = 0; i < (ranked || []).length; i += 2) {
    const name = ranked[i];
    top.push({ name, score: Number(ranked[i + 1]), ...(details[name] || {}) });
  }
  return top;
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 2000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const date = todayUTC();
  const base = { date, seed: dailySeed(date), hero: dailyHero(date) };
  if (!URL || !TOKEN) return res.status(200).json({ ...base, online: false, top: [] });

  try {
    if (req.method === 'POST') {
      const b = await readBody(req);
      // only today's (or, just past midnight, yesterday's) run, played on that day's seed
      const yesterday = todayUTC(new Date(Date.now() - 864e5));
      const day = b.date === date || b.date === yesterday ? b.date : null;
      const name = cleanName(b.name);
      const depth = Math.floor(Number(b.depth));
      const seconds = Math.floor(Number(b.seconds));
      if (!day || b.seed !== dailySeed(day) || !name || !(depth >= 0 && depth <= 10) || !(seconds >= 20 && seconds <= 50000)) {
        return res.status(400).json({ error: 'That run does not look right.' });
      }
      const won = !!b.won && depth === 10;
      const score = dailyScore(depth, seconds);
      // a name keeps its best run of the day (GT: only replace with a higher score)
      const [, prev] = await redis([['ZADD', `daily:${day}`, 'GT', String(score), name], ['ZSCORE', `daily:${day}`, name]]);
      if (Number(prev) === score) await redis([['HSET', `daily:${day}:runs`, name, JSON.stringify({ depth, seconds, won, hero: dailyHero(day) })]]);
      await redis([
        ['EXPIRE', `daily:${day}`, String(KEEP_DAYS * 86400)],
        ['EXPIRE', `daily:${day}:runs`, String(KEEP_DAYS * 86400)],
      ]);
      const [rank] = await redis([['ZREVRANK', `daily:${day}`, name]]);
      return res.status(200).json({ ...base, online: true, rank: rank === null ? null : rank + 1, top: await board(day) });
    }
    return res.status(200).json({ ...base, online: true, top: await board(date) });
  } catch (err) {
    return res.status(200).json({ ...base, online: false, top: [], error: String(err.message || err) });
  }
}
