import * as THREE from 'three';

// Telegraph colours for the pixel overlay (linear space; values above 1 glow through the bloom).
// Every attack shows one of these before it lands, so the player can read it and react.

export const TELE = {
  danger: new THREE.Color(1.8, 0.12, 0.06), // red: an attack is coming here
  dangerHot: new THREE.Color(3.2, 0.5, 0.25), // flashes just before it lands
  fire: new THREE.Color(2.4, 0.8, 0.15), // where a fireball will land (and burning pitch on the floor)
  poison: new THREE.Color(0.5, 1.8, 0.3), // a poison or spore cloud on the floor
  chainDark: new THREE.Color('#5d606c'),
  chainLight: new THREE.Color('#9a9eab'),
};

/** Pulsing alpha for telegraphs: grows over `t` (0..1), flickers near the end. */
export function telegraphAlpha(t, time) {
  const base = 0.25 + 0.6 * Math.min(1, t);
  return t > 0.75 ? base * (0.6 + 0.4 * Math.sin(time * 40)) : base;
}
