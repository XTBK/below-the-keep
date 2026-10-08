import * as THREE from 'three';
import { ASSETS } from '../data/assetManifest.js';
import { buildSheet } from './Painter.js';
import { RENDER } from '../data/config.js';
import { wrenFrame } from './art/wrenArt.js';

// Loads every sheet in the manifest: a PNG override if one is listed in
// /public/assets/overrides.json, otherwise the procedural generator.
//
// Each loaded sheet:  { key, def, colorCanvas, normalCanvas, emissiveCanvas, map, normalMap, emissiveMap }
// (emissive = the glow layer; null for sheets where nothing glows. Override with <key>_e.png.)
// Canvases are kept so the room builder can compose tiles into a single background image.

const sheets = new Map();

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

function imageToCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  return c;
}

function flatNormalCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, w, h);
  return c;
}

export function makeTexture(canvas, isColor) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/**
 * A texture that SHARES an already-made sheet's image on the GPU (with its own frame offset).
 * Never use `clone().needsUpdate = true` for this: that re-uploads the whole image to the graphics
 * card every time a sprite is made - a stutter each time an enemy spawns. Bumping only the texture's
 * own version makes three.js set it up while reusing the uploaded image.
 */
export function shareTexture(tex) {
  const t = tex.clone();
  t.version++;
  return t;
}

/** Upload every sheet to the GPU now (behind the title), so nothing uploads mid-fight. */
export function preloadTextures(renderer) {
  for (const s of sheets.values()) {
    for (const t of [s.map, s.normalMap, s.emissiveMap]) if (t) renderer.initTexture(t);
  }
}

export async function loadAssets(onProgress = null) {
  let overrides = {};
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}assets/overrides.json`);
    if (res.ok) overrides = await res.json();
  } catch {
    // no overrides file: everything is generated
  }

  const entries = Object.entries(ASSETS);
  let done = 0;
  for (const [key, def] of entries) {
    // every few sheets, report progress and let the page repaint (so the loading bar moves)
    if (onProgress && done++ % 12 === 0) {
      onProgress(done / entries.length);
      await new Promise((r) => setTimeout(r, 0));
    }
    let colorCanvas;
    let normalCanvas;
    let emissiveCanvas = null;
    const ov = overrides[key];
    if (ov) {
      try {
        const base = `${import.meta.env.BASE_URL}assets/${key}`;
        colorCanvas = imageToCanvas(await loadImage(`${base}.png`));
        normalCanvas = ov.normal ? imageToCanvas(await loadImage(`${base}_n.png`)) : flatNormalCanvas(colorCanvas.width, colorCanvas.height);
        if (ov.emissive) emissiveCanvas = imageToCanvas(await loadImage(`${base}_e.png`));
      } catch (err) {
        console.warn(`Override for "${key}" failed, using generated art instead.`, err);
        colorCanvas = null;
      }
    }
    if (!colorCanvas) {
      const built = buildSheet(def.frameW, def.frameH, def.cols, def.rows, def.generate, {
        normalStrength: RENDER.normalStrength,
        clampEdges: !!def.tile,
      });
      colorCanvas = built.color;
      normalCanvas = built.normal;
      emissiveCanvas = built.emissive;
    }
    if (def.selfLight && emissiveCanvas) emissiveCanvas = bakeSelfLight(colorCanvas, emissiveCanvas, def.selfLight);
    sheets.set(key, {
      key,
      def,
      colorCanvas,
      normalCanvas,
      map: makeTexture(colorCanvas, true),
      normalMap: makeTexture(normalCanvas, false),
      emissiveCanvas,
      emissiveMap: emissiveCanvas ? makeTexture(emissiveCanvas, true) : null,
    });
  }
}

/** Rebuild Wren's sheet with relic accessories (and a character's colours) drawn on. Returns canvases. */
export function buildWrenSheet(looks, recolor = null) {
  const def = ASSETS.wren;
  return buildSheet(def.frameW, def.frameH, def.cols, def.rows, (c, r) => wrenFrame(c, r, looks, recolor), {
    normalStrength: RENDER.normalStrength,
  });
}

/**
 * A creature with glowing parts AND the soft self-light every enemy gets (so it reads in the dark):
 * both go into one glow layer - each pixel glows at max(its colour x selfLight, its own glow).
 */
function bakeSelfLight(colorCanvas, glowCanvas, k) {
  const w = colorCanvas.width;
  const h = colorCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const c = colorCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const g = glowCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const o = img.data;
  for (let i = 0; i < o.length; i += 4) {
    o[i] = Math.max(c[i] * k, g[i]);
    o[i + 1] = Math.max(c[i + 1] * k, g[i + 1]);
    o[i + 2] = Math.max(c[i + 2] * k, g[i + 2]);
    o[i + 3] = c[i + 3];
  }
  octx.putImageData(img, 0, 0);
  return out;
}

export function getSheet(key) {
  const s = sheets.get(key);
  if (!s) throw new Error(`Unknown asset "${key}" - add it to src/data/assetManifest.js`);
  return s;
}
