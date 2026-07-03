import { world1 } from "./world1";
import { world2 } from "./world2";
import { world3 } from "./world3";
import { world4 } from "./world4";
import { world5 } from "./world5";
import { world6 } from "./world6";
import { world7 } from "./world7";
import type { LevelDef, WorldDef } from "../types";
import { WORLD_THEME } from "../constants";

export const WORLDS: WorldDef[] = [
  { id: 1, name: WORLD_THEME[0].name, colorFrom: WORLD_THEME[0].from, colorTo: WORLD_THEME[0].to, accent: WORLD_THEME[0].accent, levels: world1 },
  { id: 2, name: WORLD_THEME[1].name, colorFrom: WORLD_THEME[1].from, colorTo: WORLD_THEME[1].to, accent: WORLD_THEME[1].accent, levels: world2 },
  { id: 3, name: WORLD_THEME[2].name, colorFrom: WORLD_THEME[2].from, colorTo: WORLD_THEME[2].to, accent: WORLD_THEME[2].accent, levels: world3 },
  { id: 4, name: WORLD_THEME[3].name, colorFrom: WORLD_THEME[3].from, colorTo: WORLD_THEME[3].to, accent: WORLD_THEME[3].accent, levels: world4 },
  { id: 5, name: WORLD_THEME[4].name, colorFrom: WORLD_THEME[4].from, colorTo: WORLD_THEME[4].to, accent: WORLD_THEME[4].accent, levels: world5 },
  { id: 6, name: WORLD_THEME[5].name, colorFrom: WORLD_THEME[5].from, colorTo: WORLD_THEME[5].to, accent: WORLD_THEME[5].accent, levels: world6 },
  { id: 7, name: WORLD_THEME[6].name, colorFrom: WORLD_THEME[6].from, colorTo: WORLD_THEME[6].to, accent: WORLD_THEME[6].accent, levels: world7 },
];

export const ALL_LEVELS: LevelDef[] = WORLDS.flatMap((w) => w.levels);
export const ALL_LEVEL_IDS = ALL_LEVELS.map((l) => l.id);

export function getLevelById(id: string): LevelDef | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}

export function getNextLevelId(id: string): string | null {
  const idx = ALL_LEVEL_IDS.indexOf(id);
  if (idx === -1 || idx === ALL_LEVEL_IDS.length - 1) return null;
  return ALL_LEVEL_IDS[idx + 1];
}

export function getWorldOfLevel(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.levels.some((l) => l.id === id));
}
