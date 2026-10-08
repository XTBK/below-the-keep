// Music. The game calls audio.music('<moment>') at each of these moments.
//
// By default every moment plays GENERATED medieval music (a drone, lute and harp in the old
// church modes, frame drums and horns for bosses - see core/Ambience.js). To use your own music
// instead, give a moment a file (relative to the public/ folder, e.g. 'assets/music/cells.ogg'):
// it will play, looping, with a gentle cross-fade.

export const MUSIC = {
  generated: true, // false = moments without a file are silent
  generatedVolume: 0.55, // loudness of the generated music, next to the sound effects
  volume: 0.45, // loudness of music files
  fadeTime: 1.2, // seconds
  tracks: {
    title: null,
    cells: null,
    catacombs: null,
    hollow: null,
    halls: null,
    vault: null,
    throne: null,
    boss: null,
    finalBoss: null, // the Mad King and the Hollow Crown
    victory: null,
    death: null,
  },
};
