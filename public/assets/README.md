# Art overrides

Every sprite in the game is generated in code. To replace one with hand-drawn art:

1. Find its name (the "key") in `src/data/assetManifest.js`, e.g. `wren`, `barrel`, `cells_floor`.
2. Draw a PNG sprite sheet with the same layout: frames of `frameW x frameH` pixels,
   `cols` frames across, `rows` rows down (rows = animations / facing directions).
3. Save it here as `<key>.png`. Optionally add a normal map as `<key>_n.png`.
4. List it in `overrides.json`:

```json
{
  "wren": { "normal": true },
  "barrel": {}
}
```

Reload the page. If a file is missing or broken, the game falls back to the generated art
and prints a warning in the console.
