// Entry point: generate/load every sprite (with a loading bar), then start the game. If something
// goes badly wrong - the start-up fails, or errors keep coming - a plain screen offers a reload
// instead of a frozen picture.
import { loadAssets, getSheet } from './render/Assets.js';
import { Game } from './core/Game.js';
import { RELICS } from './data/items.js';
import { useConsumable } from './items/Curios.js';
import { Save } from './core/Save.js';

const $ = (id) => document.getElementById(id);

/** Show the trouble screen (once). (Also window.showTrouble, for the game to call.) */
function showTrouble(message) {
  const t = $('trouble');
  if (!t || !t.hidden) return;
  if (message) $('trouble-text').textContent = message;
  try {
    Save.write();
  } catch {
    // (the save is best-effort here)
  }
  t.hidden = false;
  $('trouble-reload').onclick = () => location.reload();
  $('trouble-reload').focus();
}

window.showTrouble = showTrouble;

// one error can be shrugged off (the next frame carries on); a stream of them means the game is stuck
let recent = [];
function onError(err) {
  console.error(err);
  const now = performance.now();
  recent = recent.filter((t) => now - t < 3000);
  recent.push(now);
  if (recent.length >= 20) showTrouble();
}
window.addEventListener('error', (e) => onError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => onError(e.reason));

async function boot() {
  try {
    await loadAssets((f) => {
      $('loading-fill').style.width = Math.round(f * 100) + '%';
    });
    const game = new Game();
    game.start();
    $('loading').remove();
    // handy for poking at things from the browser console: window.game, window.debug
    window.game = game;
    window.debug = { getSheet, RELICS, useConsumable, Save }; // e.g. debug.getSheet('wren').colorCanvas
  } catch (err) {
    console.error(err);
    $('loading').remove();
    showTrouble('The Keep could not be opened in this browser. Try reloading, or a different browser.');
  }
}

boot();
