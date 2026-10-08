// Persistent save data (unlocks + lifetime stats) in localStorage.
// Every read/write is wrapped in try/catch: private browsing or blocked storage must never crash the game.

const KEY = 'belowTheKeep.save';
const VERSION = 1;

function defaults() {
  return {
    version: VERSION,
    stats: {
      runsStarted: 0,
      stonesThrown: 0,
      barrelsBroken: 0,
      playSeconds: 0,
      deaths: 0,
      bossesBeaten: 0,
      victories: 0,
      secretsFound: 0,
      sealsFound: 0,
    },
    unlocks: {
      characters: ['wren'],
      itemsSeen: [],
      pages: [], // journal pages read (indices into PAGES)
      bossesSeen: [],
    },
    settings: {},
    oaths: [], // the oaths sworn for the next run
    heatRecord: {}, // best heat won, per hero
    daily: {}, // Daily Descent: { date, played, best } and the leaderboard name
  };
}

export const Save = {
  data: defaults(),

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // merge onto defaults so new fields added in later versions always exist
        const d = defaults();
        this.data = {
          ...d,
          ...parsed,
          stats: { ...d.stats, ...parsed.stats },
          unlocks: { ...d.unlocks, ...parsed.unlocks },
          settings: { ...d.settings, ...parsed.settings },
          heatRecord: { ...d.heatRecord, ...parsed.heatRecord },
          daily: { ...d.daily, ...parsed.daily },
          version: VERSION,
        };
      }
    } catch (err) {
      console.warn('Save data could not be read, starting fresh.', err);
      this.data = defaults();
    }
    return this.data;
  },

  write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // storage unavailable (private mode / quota) - the game still runs, it just won't remember
    }
  },
};
