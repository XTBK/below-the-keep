// Entry point: generate/load every sprite, then start the game.
import { loadAssets, getSheet } from './render/Assets.js';
import { Game } from './core/Game.js';
import { RELICS } from './data/items.js';
import { useConsumable } from './items/Curios.js';
import { Save } from './core/Save.js';

async function boot() {
  await loadAssets();
  const game = new Game();
  game.start();
  // handy for poking at things from the browser console: window.game, window.debug
  window.game = game;
  window.debug = { getSheet, RELICS, useConsumable, Save }; // e.g. debug.getSheet('wren').colorCanvas
}

boot();
