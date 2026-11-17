import React from 'react';
import {
  BookOpen,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HudSnapshot, SavedProgress } from '../types/game';
import { formatTimer } from '../engine/levelConfig';
import { HistoryDropdown } from './HistoryDropdown';

interface HudTopBarProps {
  hud: HudSnapshot;
  playerName: string;
  saved: SavedProgress;
  paused: boolean;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenRules: () => void;
}

export const HudTopBar: React.FC<HudTopBarProps> = ({
  hud,
  playerName,
  saved,
  paused,
  muted,
  onTogglePause,
  onToggleMute,
  onOpenRules,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const consentPct = Math.max(
    0,
    Math.min(100, (hud.friendsThisLevel / hud.friendsNeededThisLevel) * 100)
  );
  const lowTime = hud.tierTimeRemaining <= 60;

  return (
    <header className="w-full bg-[#16191E] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Zone 1: Brand & Level Identity */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <span className="font-display text-base font-bold text-[#F4F1EA] whitespace-nowrap">
          City Love Potions
        </span>
        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="text-xs text-slate-300 whitespace-nowrap hidden sm:inline truncate max-w-[140px]">
          {playerName}
        </span>
        <span className="text-slate-600 hidden md:inline" aria-hidden="true">
          ·
        </span>
        <span className="text-xs font-semibold font-mono-tabular text-amber-400 whitespace-nowrap">
          Lv {hud.level}/100 (T{hud.tier.tier})
        </span>
      </div>

      {/* Zone 2: Core Game Meters */}
      <div className="flex items-center gap-4 lg:gap-6 overflow-x-auto">
        {/* Life Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
            HP
          </span>
          <div className="w-20 sm:w-24 h-2 bg-[#0E1013] rounded-sm overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-150 ${
                hpPct > 50
                  ? 'bg-emerald-500'
                  : hpPct > 25
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold font-mono-tabular text-[#F4F1EA] whitespace-nowrap">
            {hud.hp}/{hud.maxHp}
          </span>
        </div>

        {/* Consent Meter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
            Consent
          </span>
          <div className="w-20 sm:w-28 h-2 bg-[#0E1013] rounded-sm overflow-hidden border border-white/10">
            <div
              className="h-full bg-amber-400 transition-all duration-150"
              style={{ width: `${consentPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold font-mono-tabular text-amber-300 whitespace-nowrap">
            {hud.friendsThisLevel}/{hud.friendsNeededThisLevel}
          </span>
        </div>

        {/* Tier Timer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400">Timer</span>
          <span
            className={`text-xs font-semibold font-mono-tabular whitespace-nowrap ${
              lowTime ? 'text-rose-400' : 'text-[#F4F1EA]'
            }`}
          >
            {formatTimer(hud.tierTimeRemaining)}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400">Score</span>
          <span className="text-xs font-semibold font-mono-tabular text-emerald-400 whitespace-nowrap">
            {hud.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Zone 3: Utility Controls & Permanent History */}
      <div className="flex items-center gap-2 shrink-0">
        <HistoryDropdown saved={saved} />

        <button
          type="button"
          onClick={onOpenRules}
          className="p-1.5 text-slate-300 hover:text-white bg-[#1E2229] hover:bg-[#272C35] border border-white/10 rounded-lg transition-colors cursor-pointer"
          title="Rules & Controls"
          aria-label="Rules and Controls"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          className="p-1.5 text-slate-300 hover:text-white bg-[#1E2229] hover:bg-[#272C35] border border-white/10 rounded-lg transition-colors cursor-pointer"
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-slate-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F4F1EA] bg-[#1E2229] hover:bg-[#272C35] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {paused ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-slate-300" />
              <span>Pause</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
