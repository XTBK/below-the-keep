// Player settings (the Settings menu), kept in the save. Each is applied by applySettings().

export const SETTINGS_DEFAULTS = {
  music: 8, // 0..10
  sound: 8, // 0..10
  shake: 10, // 0..10: how hard the screen shakes
  slowmo: true, // a split second of slow motion on critical hits
  numbers: true, // damage numbers over struck foes
  fullscreen: false,
  story: true, // the little story scenes (the intro, and a vignette at each new place)
};

/** The player's settings, with defaults for anything missing. */
export function settingsOf(save) {
  return { ...SETTINGS_DEFAULTS, ...(save.data.settings.options || {}) };
}

export function setSetting(save, key, value) {
  save.data.settings.options = { ...settingsOf(save), [key]: value };
  save.write();
}

/** Push the settings into the game: volumes, shake, combat feedback. */
export function applySettings(game, save) {
  const s = settingsOf(save);
  game.audio.setVolumes(s.music / 10, s.sound / 10);
  game.feel.shakeScale = s.shake / 10;
  game.slowmoOnCrits = s.slowmo;
  game.damageNumbersOn = s.numbers;
}
