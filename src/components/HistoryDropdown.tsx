import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, History, Trophy, AlertTriangle } from 'lucide-react';
import { SavedProgress } from '../types/game';

interface HistoryDropdownProps {
  saved: SavedProgress;
}

export const HistoryDropdown: React.FC<HistoryDropdownProps> = ({ saved }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#F4F1EA] bg-[#1E2229] hover:bg-[#272C35] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        aria-expanded={open}
      >
        <History className="w-3.5 h-3.5 text-amber-400" />
        <span>History ({saved.history.length})</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-[#181B20] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F4F1EA]">
                Permanent Local History
              </h3>
              <p className="text-xs text-slate-400">
                All scores and Game Over records are permanently saved.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">All-Time Best</div>
              <div className="text-sm font-semibold font-mono-tabular text-amber-400">
                {saved.highScore.toLocaleString()} pts
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-[#13161A] border-b border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono-tabular">
            <span>Best Level: {saved.bestLevel}/100</span>
            <span aria-hidden="true">·</span>
            <span>Potions: {saved.totalPotionsEver}</span>
            <span aria-hidden="true">·</span>
            <span>Friends: {saved.totalFriendsEver}</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-white/8">
            {saved.history.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                No completed or Game Over runs recorded yet. Play a round to
                start your permanent ledger.
              </div>
            ) : (
              saved.history.map((entry) => (
                <div
                  key={entry.id}
                  className="px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {entry.outcome === 'VICTORY' ? (
                        <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-[#F4F1EA] truncate">
                        {entry.playerName}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          entry.outcome === 'VICTORY'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {entry.outcome === 'VICTORY' ? 'Victory' : 'Game Over'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold font-mono-tabular text-amber-300 shrink-0">
                      {entry.score.toLocaleString()} pts
                    </span>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-300">
                    {entry.reason}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono-tabular">
                    <span>Lv {entry.levelReached}</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.friendsMade} friends</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.potionsCollected} potions</span>
                    <span aria-hidden="true">·</span>
                    <span className="ml-auto">{formatDate(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
