export const GRAVITY = 2200; // px/s^2
export const MOVE_ACCEL = 4600; // px/s^2 — snappier on-ground pickup
export const MOVE_DECEL = 5400; // px/s^2 — faster release feel, no ice on plain ground
export const MAX_RUN_SPEED = 360; // px/s (was 340) — mildly higher top speed for reachability
export const AIR_CONTROL = 0.92; // was 0.85 — mid-air pivots feel less floaty
export const JUMP_VELOCITY = 780; // px/s — full-height jump when held
export const MIN_JUMP_VELOCITY = 340; // px/s — clipped floor when jump is tapped and released early
export const JUMP_CUT_MULT = 0.42; // multiplier applied to upward vy when jump is released mid-ascent
export const MAX_FALL_SPEED = 1400; // px/s
export const COYOTE_TIME = 0.14; // was 0.11 — a touch more forgiving on touch controls
export const JUMP_BUFFER_TIME = 0.16; // was 0.12 — soaks up phone touch latency
export const RESTART_DELAY_MS = 380; // instant restart target

// Terrain / mechanic tuning
export const ICE_FRICTION_MULT = 0.14; // on-ice deceleration relative to normal ground
export const BOUNCE_PAD_VELOCITY = 1180; // px/s upward launch — clearly stronger than a normal jump
export const SPEED_PAD_VELOCITY = 720; // px/s horizontal boost (both directions)

export const WORLD_THEME = [
  { id: 1, name: "Neon Foundry", from: "#0b1026", to: "#1b1440", accent: "#4bf3ff" },
  { id: 2, name: "Voltgrid City", from: "#150826", to: "#2a0d3f", accent: "#ff3df0" },
  { id: 3, name: "The Undergate", from: "#020814", to: "#08152e", accent: "#7dff5c" },
  { id: 4, name: "Singularity Core", from: "#1a0410", to: "#360c1f", accent: "#ffb23d" },
  { id: 5, name: "Dark Reactor", from: "#1a0605", to: "#3d0a08", accent: "#ff4d2e" },
  { id: 6, name: "Cyber Core", from: "#020c0a", to: "#04241c", accent: "#39ffb0" },
  { id: 7, name: "Chaos Rift", from: "#0d0018", to: "#22003d", accent: "#e23dff" },
] as const;
