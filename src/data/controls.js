// Key and gamepad bindings. Keyboard uses KeyboardEvent.code values.
// Gamepad buttons use the "standard" mapping (Xbox layout names in comments).

export const KEYS = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  shootUp: ['ArrowUp'],
  shootDown: ['ArrowDown'],
  shootLeft: ['ArrowLeft'],
  shootRight: ['ArrowRight'],
  active: ['Space'],
  consumable: ['KeyQ'],
  bomb: ['KeyE'],
  pause: ['Escape'],
  confirm: ['Enter', 'NumpadEnter'], // title screen
  seed: ['KeyF'], // title screen: type a seed
  collection: ['KeyC'], // title screen: the collection page
  tab: ['Tab', 'KeyQ'], // collection page: next page
  quitTitle: ['KeyT'], // only while paused
  newRun: ['KeyR'], // only while paused
  debug: ['F3'],
  debugLights: ['F4'],
  debugMap: ['F5'], // reveal the whole minimap
  debugSecrets: ['F6'], // open secret walls in this room (bombs arrive in Phase 4)
  debugFloor: ['F7'], // generate the next floor
};

// On-screen touch controls (phones/tablets). Sizes are in CSS pixels.
// Left half of the screen = movement stick, right half = shooting stick (snaps to 4 directions).
export const TOUCH = {
  stickRadius: 56, // how far you drag for full speed
  deadzone: 0.15,
  shootThreshold: 0.35,
};

export const PAD = {
  deadzone: 0.25,
  shootThreshold: 0.5,
  active: [5, 7], // RB, RT
  consumable: [4], // LB
  bomb: [6, 0], // LT, A
  pause: [9], // Start
  confirm: [0, 9], // A / Start on the title and death screens
  newRun: [3], // Y (only while paused)
  collection: [2], // X on the title screen
  tab: [5], // RB on the collection page
  up: [12], // d-pad (menus)
  down: [13],
  left: [14],
  right: [15],
};
