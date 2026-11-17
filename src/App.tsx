/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { Play, Home, RotateCcw } from 'lucide-react';
import {
  ActiveRunSnapshot,
  GameState,
  HudSnapshot,
  PotionCounts,
  SavedProgress,
  SenseType,
} from './types/game';
import {
  EMPTY_POTIONS,
  loadSavedProgress,
  recordRunCompletion,
  saveActiveRunSnapshot,
  sumPotions,
  updatePlayerName,
} from './utils/storage';
import { getTierForLevel } from './engine/levelConfig';
import { soundEngine } from './utils/audio';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { HudTopBar } from './components/HudTopBar';
import { PotionBelt } from './components/PotionBelt';
import { PreGameModal } from './components/PreGameModal';
import { RulesModal } from './components/RulesModal';
import { EndGameModal } from './components/EndGameModal';

const INITIAL_HUD: HudSnapshot = {
  level: 1,
  tier: getTierForLevel(1),
  score: 0,
  hp: 100,
  maxHp: 100,
  potions: { touch: 1, smell: 1, taste: 1, sight: 1, hearing: 1 },
  potionsCollectedTotal: { ...EMPTY_POTIONS },
  selectedSense: 'touch',
  friendsThisLevel: 0,
  friendsNeededThisLevel: 10,
  friendsThisTier: 0,
  totalFriendsRun: 0,
  tierTimeRemaining: 15 * 60,
  isSprinting: false,
  currentRoom: null,
  followingFriendName: null,
  activeInteraction: null,
  detectiveWarningActive: false,
  privacyWarning: null,
};

export default function App() {
  const [saved, setSaved] = useState<SavedProgress>(() => loadSavedProgress());
  const [playerName, setPlayerName] = useState<string>(
    () => loadSavedProgress().playerName
  );
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [runId, setRunId] = useState<number>(1);
  const [initialRun, setInitialRun] = useState<ActiveRunSnapshot | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [endResult, setEndResult] = useState<{
    mode: 'GAME_OVER' | 'VICTORY';
    reason: string;
    score: number;
    levelReached: number;
    friendsMade: number;
    potionsCollected: PotionCounts;
  } | null>(null);

  const canvasRef = useRef<GameCanvasHandle | null>(null);

  const handleStartNew = useCallback((name: string) => {
    const clean = name.trim() || 'Player One';
    const nextSaved = updatePlayerName(clean);
    setSaved(nextSaved);
    setPlayerName(clean);
    setInitialRun(null);
    setEndResult(null);
    setRunId((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleResumeSaved = useCallback((name: string) => {
    const clean = name.trim() || 'Player One';
    const nextSaved = updatePlayerName(clean);
    setSaved(nextSaved);
    setPlayerName(clean);
    setInitialRun(nextSaved.activeRun);
    setEndResult(null);
    setRunId((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleSaveProgress = useCallback(
    (snapshot: ActiveRunSnapshot, potionsDelta = 0, friendsDelta = 0) => {
      const next = saveActiveRunSnapshot(snapshot, potionsDelta, friendsDelta);
      setSaved(next);
    },
    []
  );

  const handleGameOver = useCallback(
    (payload: {
      reason: string;
      score: number;
      levelReached: number;
      friendsMade: number;
      potionsCollected: PotionCounts;
    }) => {
      const updated = recordRunCompletion({
        id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        playerName,
        timestamp: Date.now(),
        score: payload.score,
        levelReached: payload.levelReached,
        friendsMade: payload.friendsMade,
        potionsCollected: sumPotions(payload.potionsCollected),
        outcome: 'GAME_OVER',
        reason: payload.reason,
      });
      setSaved(updated);
      setEndResult({ mode: 'GAME_OVER', ...payload });
      setGameState('GAME_OVER');
    },
    [playerName]
  );

  const handleVictory = useCallback(
    (payload: {
      score: number;
      levelReached: number;
      friendsMade: number;
      potionsCollected: PotionCounts;
    }) => {
      const reason =
        'Completed all 100 levels and the King Solomon 1,000-character challenge!';
      const updated = recordRunCompletion({
        id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        playerName,
        timestamp: Date.now(),
        score: payload.score,
        levelReached: payload.levelReached,
        friendsMade: payload.friendsMade,
        potionsCollected: sumPotions(payload.potionsCollected),
        outcome: 'VICTORY',
        reason,
      });
      setSaved(updated);
      setEndResult({ mode: 'VICTORY', reason, ...payload });
      setGameState('VICTORY');
    },
    [playerName]
  );

  const handleTogglePause = () => {
    setGameState((prev) =>
      prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev
    );
  };

  const handleToggleMute = () => {
    soundEngine.muted = !muted;
    setMuted(!muted);
  };

  const handleSelectSense = (sense: SenseType) => {
    canvasRef.current?.selectSense(sense);
  };

  const handleToggleRoomSeal = () => {
    canvasRef.current?.toggleRoomSeal();
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#121417] text-[#F4F1EA]">
      <HudTopBar
        hud={hud}
        playerName={playerName}
        saved={saved}
        paused={gameState === 'PAUSED'}
        muted={muted}
        onTogglePause={handleTogglePause}
        onToggleMute={handleToggleMute}
        onOpenRules={() => setRulesOpen(true)}
      />

      <main className="relative flex-1 min-h-0 flex flex-col">
        <GameCanvas
          ref={canvasRef}
          runId={runId}
          playerName={playerName}
          gameState={gameState}
          initialRun={initialRun}
          onHudUpdate={setHud}
          onSaveProgress={handleSaveProgress}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
        />

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-[#181B20] border border-white/12 rounded-2xl p-6 text-center shadow-2xl">
              <h2 className="font-display text-2xl font-bold text-[#F4F1EA]">
                Game Paused
              </h2>
              <p className="mt-1.5 text-xs text-slate-400">
                Level {hud.level}/100 · Score {hud.score.toLocaleString()} ·
                Saved locally in real time
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setGameState('PLAYING')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#121417] rounded-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Play</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartNew(playerName)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-[#22262E] hover:bg-[#2B303A] border border-white/10 text-[#F4F1EA] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart from Level 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameState('TITLE_MENU')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-[#1C2027] hover:bg-[#252A33] border border-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Title &amp; High Scores</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PotionBelt
        hud={hud}
        onSelectSense={handleSelectSense}
        onToggleRoomSeal={handleToggleRoomSeal}
      />

      {gameState === 'TITLE_MENU' && (
        <PreGameModal
          saved={saved}
          onStartNew={handleStartNew}
          onResumeSaved={handleResumeSaved}
          onOpenRules={() => setRulesOpen(true)}
        />
      )}

      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && endResult && (
        <EndGameModal
          mode={endResult.mode}
          playerName={playerName}
          reason={endResult.reason}
          score={endResult.score}
          levelReached={endResult.levelReached}
          friendsMade={endResult.friendsMade}
          potionsCollected={endResult.potionsCollected}
          saved={saved}
          onPlayAgain={() => handleStartNew(playerName)}
          onBackToMenu={() => setGameState('TITLE_MENU')}
        />
      )}

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
