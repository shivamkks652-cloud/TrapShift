export const GRAVITY = 2200; // px/s^2
export const MOVE_ACCEL = 3800; // px/s^2
export const MOVE_DECEL = 4600; // px/s^2
export const MAX_RUN_SPEED = 340; // px/s
export const AIR_CONTROL = 0.85;
export const JUMP_VELOCITY = 780; // px/s
export const MAX_FALL_SPEED = 1400; // px/s
export const COYOTE_TIME = 0.11; // seconds player can still jump after leaving ground
export const JUMP_BUFFER_TIME = 0.12; // seconds a jump press is remembered before landing
export const RESTART_DELAY_MS = 380; // instant restart target

export const WORLD_THEME = [
  { id: 1, name: "Neon Foundry", from: "#0b1026", to: "#1b1440", accent: "#4bf3ff" },
  { id: 2, name: "Voltgrid City", from: "#150826", to: "#2a0d3f", accent: "#ff3df0" },
  { id: 3, name: "The Undergate", from: "#020814", to: "#08152e", accent: "#7dff5c" },
  { id: 4, name: "Singularity Core", from: "#1a0410", to: "#360c1f", accent: "#ffb23d" },
  { id: 5, name: "Dark Reactor", from: "#1a0605", to: "#3d0a08", accent: "#ff4d2e" },
  { id: 6, name: "Cyber Core", from: "#020c0a", to: "#04241c", accent: "#39ffb0" },
  { id: 7, name: "Chaos Rift", from: "#0d0018", to: "#22003d", accent: "#e23dff" },
] as const;
