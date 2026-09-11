// Local persistence for progress, best times, stars, shards, achievements, skins.
// This is a single-player local game so localStorage is the source of truth.

export interface LevelProgress {
  bestTimeMs?: number;
  stars: number; // 0-3
  shardsCollected: number;
  completed: boolean;
}

export interface GameSettings {
  reducedShake: boolean;
  colorblindMode: boolean;
  touchSensitivity: number; // 0.6 - 1.6, multiplier on control responsiveness
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number; // 0 - 1
  sfxVolume: number; // 0 - 1
  touchScale: number; // 0.8 - 1.4, on-screen button size
  touchOpacity: number; // 0.3 - 1, on-screen button opacity
}

export interface DailyStreak {
  count: number;
  lastLoginDate: string; // local YYYY-M-D
}

export interface SaveData {
  version: number;
  levelProgress: Record<string, LevelProgress>;
  totalShards: number;
  unlockedSkins: string[];
  equippedSkin: string;
  endlessBest: number;
  dailyBest: Record<string, number>; // dateKey -> best score
  dailyStreak: DailyStreak;
  settings: GameSettings;
}

const KEY = "trapshift.save.v1";

function defaultSettings(): GameSettings {
  return {
    reducedShake: false,
    colorblindMode: false,
    touchSensitivity: 1,
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.8,
    sfxVolume: 1,
    touchScale: 1,
    touchOpacity: 0.85,
  };
}

function defaultSave(): SaveData {
  return {
    version: 1,
    levelProgress: {},
    totalShards: 0,
    unlockedSkins: ["default"],
    equippedSkin: "default",
    endlessBest: 0,
    dailyBest: {},
    dailyStreak: { count: 0, lastLoginDate: "" },
    settings: defaultSettings(),
  };
}

let cache: SaveData | null = null;

export function loadSave(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = { ...defaultSave(), ...JSON.parse(raw) };
      return cache!;
    }
  } catch {
    // fall through to default
  }
  cache = defaultSave();
  return cache;
}

export function saveSave(data: SaveData) {
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable, ignore
  }
}

export function recordLevelResult(
  levelId: string,
  timeMs: number,
  shardsCollected: number,
  shardsTotal: number,
  stars: number,
) {
  const data = loadSave();
  const prev = data.levelProgress[levelId];
  const bestTimeMs =
    prev?.bestTimeMs !== undefined ? Math.min(prev.bestTimeMs, timeMs) : timeMs;
  const bestShards = Math.max(prev?.shardsCollected ?? 0, shardsCollected);
  const bestStars = Math.max(prev?.stars ?? 0, stars);

  const shardDelta = bestShards - (prev?.shardsCollected ?? 0);
  data.levelProgress[levelId] = {
    bestTimeMs,
    stars: bestStars,
    shardsCollected: bestShards,
    completed: true,
  };
  data.totalShards += Math.max(0, shardDelta);
  saveSave(data);
  return data.levelProgress[levelId];
}

// Credits bonus shards earned from an optional rewarded ad. Purely additive
// economy tuning — never gates or unlocks anything by itself.
export function addBonusShards(amount: number) {
  const data = loadSave();
  data.totalShards += Math.max(0, amount);
  saveSave(data);
  return data.totalShards;
}

export function isLevelUnlocked(levelId: string, allLevelIds: string[]): boolean {
  const idx = allLevelIds.indexOf(levelId);
  if (idx <= 0) return true;
  const data = loadSave();
  const prevId = allLevelIds[idx - 1];
  return !!data.levelProgress[prevId]?.completed;
}

export function setEndlessBest(score: number) {
  const data = loadSave();
  if (score > data.endlessBest) {
    data.endlessBest = score;
    saveSave(data);
  }
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export function setDailyBest(score: number) {
  const data = loadSave();
  const key = todayKey();
  const prev = data.dailyBest[key] ?? 0;
  if (score > prev) {
    data.dailyBest[key] = score;
    saveSave(data);
  }
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Daily login streak: consecutive local days. Missing a day resets to 1.
export function recordDailyLogin(): { count: number; isNewDay: boolean } {
  const data = loadSave();
  const today = localDateKey(new Date());
  if (data.dailyStreak.lastLoginDate === today) {
    return { count: data.dailyStreak.count, isNewDay: false };
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = data.dailyStreak.lastLoginDate === localDateKey(yesterday);
  data.dailyStreak = {
    count: continued ? data.dailyStreak.count + 1 : 1,
    lastLoginDate: today,
  };
  saveSave(data);
  return { count: data.dailyStreak.count, isNewDay: true };
}

export const SKINS = [
  { id: "default", name: "Voltrunner", primary: "#4bf3ff", secondary: "#0b1026" },
  { id: "magenta", name: "Pulsefox", primary: "#ff3df0", secondary: "#22062b", cost: 40 },
  { id: "verdant", name: "Glitchmoth", primary: "#7dff5c", secondary: "#04140a", cost: 60 },
  { id: "amber", name: "Corehound", primary: "#ffb23d", secondary: "#2a0e02", cost: 80 },
  { id: "prism", name: "Prism Ghost", primary: "#ffffff", secondary: "#3a2b57", cost: 120 },
];

export function unlockSkin(id: string, cost: number): boolean {
  const data = loadSave();
  if (data.unlockedSkins.includes(id)) return true;
  if (data.totalShards < cost) return false;
  data.totalShards -= cost;
  data.unlockedSkins.push(id);
  saveSave(data);
  return true;
}

export function getSettings(): GameSettings {
  return { ...defaultSettings(), ...loadSave().settings };
}

export function updateSettings(partial: Partial<GameSettings>) {
  const data = loadSave();
  data.settings = { ...data.settings, ...partial };
  saveSave(data);
  return data.settings;
}

export function equipSkin(id: string) {
  const data = loadSave();
  if (data.unlockedSkins.includes(id)) {
    data.equippedSkin = id;
    saveSave(data);
  }
}
