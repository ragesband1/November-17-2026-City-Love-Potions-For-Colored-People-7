import React from 'react';
import { RotateCcw, Trophy, AlertTriangle, Home } from 'lucide-react';
import { PotionCounts, SavedProgress } from '../types/game';
import { SENSE_POTIONS } from '../engine/levelConfig';
import { sumPotions } from '../utils/storage';

interface EndGameModalProps {
  mode: 'GAME_OVER' | 'VICTORY';
  playerName: string;
  reason: string;
  score: number;
  levelReached: number;
  friendsMade: number;
  potionsCollected: PotionCounts;
  saved: SavedProgress;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  mode,
  playerName,
  reason,
  score,
  levelReached,
  friendsMade,
  potionsCollected,
  saved,
  onPlayAgain,
  onBackToMenu,
}) => {
  const totalPotions = sumPotions(potionsCollected);
  const isVictory = mode === 'VICTORY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D10]/88 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#181B20] border border-white/12 rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 sm:p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            {isVictory ? (
              <Trophy className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isVictory ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isVictory ? 'All 100 Levels Complete' : 'Game Over'}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            {isVictory
              ? `Congratulations, ${playerName}!`
              : `Run Ended — ${playerName}`}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{reason}</p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#121519] border border-white/8 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Final Score</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular text-amber-400">
                {score.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#121519] border border-white/8 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Level Reached</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular text-[#F4F1EA]">
                {levelReached}/100
              </div>
            </div>
            <div className="bg-[#121519] border border-white/8 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Friends Made</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular text-emerald-400">
                {friendsMade}
              </div>
            </div>
            <div className="bg-[#121519] border border-white/8 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Potions Found</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular text-[#F4F1EA]">
                {totalPotions}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono-tabular">
            <span>All-Time High Score: {saved.highScore.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>Best Level: {saved.bestLevel}/100</span>
            <span aria-hidden="true">·</span>
            <span>Saved Runs: {saved.history.length}</span>
          </div>
        </div>

        <div className="p-6 bg-[#13161A] border-b border-white/10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Potions Collected This Run
          </div>
          <div className="grid grid-cols-5 gap-2">
            {SENSE_POTIONS.map((pot) => (
              <div
                key={pot.id}
                className="bg-[#181B20] border border-white/8 rounded-lg p-2.5 text-center"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5"
                  style={{ backgroundColor: pot.color }}
                />
                <div className="text-[11px] text-slate-300">{pot.label}</div>
                <div className="text-sm font-bold font-mono-tabular text-[#F4F1EA]">
                  {potionsCollected[pot.id]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#20242B] hover:bg-[#2A2F38] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Title &amp; High Scores</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-[#121417] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
