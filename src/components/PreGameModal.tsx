import React, { useState } from 'react';
import { Play, RotateCcw, BookOpen, Trophy } from 'lucide-react';
import { SavedProgress } from '../types/game';
import { SENSE_POTIONS, TIER_CONFIGS } from '../engine/levelConfig';

interface PreGameModalProps {
  saved: SavedProgress;
  onStartNew: (playerName: string) => void;
  onResumeSaved: (playerName: string) => void;
  onOpenRules: () => void;
}

export const PreGameModal: React.FC<PreGameModalProps> = ({
  saved,
  onStartNew,
  onResumeSaved,
  onOpenRules,
}) => {
  const [nameInput, setNameInput] = useState(saved.playerName || 'Player One');

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    onStartNew(nameInput.trim() || 'Player One');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0D0F12]/88 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#181B20] border border-white/12 rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 sm:p-8 border-b border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <div className="text-xs font-medium text-amber-400 tracking-wide mb-1.5">
                2D City Stealth &amp; Social Friendship · Levels 1–100
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1EA] leading-tight text-balance">
                City Love Potions for Colored People
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Explore a lively city of houses, hotels, motels, and apartments.
                Collect the five sense-based Love Potions, invite willing
                polyamorous singles into sealed private rooms, avoid monogamous
                commitments, and outrun disguised detective traps.
              </p>
            </div>

            <div className="bg-[#121519] border border-white/10 rounded-xl px-4 py-3 min-w-[180px]">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Local High Score</span>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono-tabular text-amber-400">
                {saved.highScore.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-400 font-mono-tabular">
                Best Lv {saved.bestLevel}/100 · {saved.totalFriendsEver} friends
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitNew} className="mt-6">
            <label
              htmlFor="player-name-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Player Name (saved locally in real time)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                id="player-name-input"
                type="text"
                maxLength={28}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                className="flex-1 bg-[#111317] border border-white/15 focus:border-amber-400 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA]"
              />

              {saved.activeRun && (
                <button
                  type="button"
                  onClick={() =>
                    onResumeSaved(nameInput.trim() || 'Player One')
                  }
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    Resume Lv {saved.activeRun.level} (
                    {saved.activeRun.score.toLocaleString()} pts)
                  </span>
                </button>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-[#121417] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {saved.activeRun ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Start New Run</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Game</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#14171B]">
          <div>
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Five Sense Love Potions
            </h2>
            <div className="space-y-2">
              {SENSE_POTIONS.map((pot) => (
                <div
                  key={pot.id}
                  className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-white/6 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: pot.color }}
                    />
                    <span className="font-semibold text-[#F4F1EA]">
                      {pot.label}
                    </span>
                  </div>
                  <span className="text-slate-400 text-right truncate">
                    +15 HP · Key {pot.hotkey}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                4 Chapters · 100 Levels
              </h2>
              <button
                type="button"
                onClick={onOpenRules}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Full Rules &amp; Controls</span>
              </button>
            </div>
            <div className="space-y-2">
              {TIER_CONFIGS.map((t) => (
                <div
                  key={t.tier}
                  className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-white/6 last:border-b-0"
                >
                  <span className="font-medium text-[#F4F1EA]">
                    Lv {t.minLevel}–{t.maxLevel} · {t.name}
                  </span>
                  <span className="text-slate-400 font-mono-tabular whitespace-nowrap">
                    {t.tierGoal} friends · {Math.round(t.timerSeconds / 60)}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
