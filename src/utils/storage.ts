import {
  ActiveRunSnapshot,
  PotionCounts,
  RunHistoryEntry,
  SavedProgress,
} from '../types/game';

const STORAGE_KEY = 'city_love_potions_permanent_save_v1';

export const EMPTY_POTIONS: PotionCounts = {
  touch: 0,
  smell: 0,
  taste: 0,
  sight: 0,
  hearing: 0,
};

const DEFAULT_SAVE: SavedProgress = {
  playerName: 'Player One',
  highScore: 0,
  bestLevel: 1,
  totalPotionsEver: 0,
  totalFriendsEver: 0,
  history: [],
  activeRun: null,
};

export function loadSavedProgress(): SavedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, history: [] };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      playerName:
        typeof parsed.playerName === 'string' && parsed.playerName.trim()
          ? parsed.playerName
          : DEFAULT_SAVE.playerName,
      highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
      bestLevel: typeof parsed.bestLevel === 'number' ? parsed.bestLevel : 1,
      totalPotionsEver:
        typeof parsed.totalPotionsEver === 'number' ? parsed.totalPotionsEver : 0,
      totalFriendsEver:
        typeof parsed.totalFriendsEver === 'number' ? parsed.totalFriendsEver : 0,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      activeRun: parsed.activeRun ?? null,
    };
  } catch {
    return { ...DEFAULT_SAVE, history: [] };
  }
}

export function writeSavedProgress(progress: SavedProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota issues safely
  }
}

export function updatePlayerName(name: string): SavedProgress {
  const current = loadSavedProgress();
  const cleanName = name.trim() || 'Player One';
  const next: SavedProgress = {
    ...current,
    playerName: cleanName,
    activeRun: current.activeRun
      ? { ...current.activeRun, playerName: cleanName }
      : null,
  };
  writeSavedProgress(next);
  return next;
}

export function saveActiveRunSnapshot(
  snapshot: ActiveRunSnapshot,
  potionsDelta = 0,
  friendsDelta = 0
): SavedProgress {
  const current = loadSavedProgress();
  const next: SavedProgress = {
    ...current,
    playerName: snapshot.playerName,
    highScore: Math.max(current.highScore, snapshot.score),
    bestLevel: Math.max(current.bestLevel, snapshot.level),
    totalPotionsEver: current.totalPotionsEver + potionsDelta,
    totalFriendsEver: current.totalFriendsEver + friendsDelta,
    activeRun: snapshot,
  };
  writeSavedProgress(next);
  return next;
}

export function recordRunCompletion(entry: RunHistoryEntry): SavedProgress {
  const current = loadSavedProgress();
  const next: SavedProgress = {
    ...current,
    playerName: entry.playerName,
    highScore: Math.max(current.highScore, entry.score),
    bestLevel: Math.max(current.bestLevel, entry.levelReached),
    // Never delete history; prepend newest entry permanently
    history: [entry, ...current.history],
    // Clear active run only after permanently logging it into history
    activeRun: null,
  };
  writeSavedProgress(next);
  return next;
}

export function sumPotions(counts: PotionCounts): number {
  return (
    counts.touch +
    counts.smell +
    counts.taste +
    counts.sight +
    counts.hearing
  );
}
