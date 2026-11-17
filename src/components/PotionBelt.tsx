import React from 'react';
import { DoorClosed, DoorOpen, Zap } from 'lucide-react';
import { HudSnapshot, SenseType } from '../types/game';
import { SENSE_POTIONS } from '../engine/levelConfig';

interface PotionBeltProps {
  hud: HudSnapshot;
  onSelectSense: (sense: SenseType) => void;
  onToggleRoomSeal: () => void;
}

export const PotionBelt: React.FC<PotionBeltProps> = ({
  hud,
  onSelectSense,
  onToggleRoomSeal,
}) => {
  return (
    <footer className="w-full bg-[#16191E] border-t border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
      {/* 5 Sense Love Potions */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {SENSE_POTIONS.map((pot) => {
          const count = hud.potions[pot.id];
          const isSelected = hud.selectedSense === pot.id;
          return (
            <button
              key={pot.id}
              type="button"
              onClick={() => onSelectSense(pot.id)}
              title={`${pot.label} Potion (Key ${pot.hotkey}) — ${pot.description}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#262B34] border-amber-400 text-[#F4F1EA]'
                  : 'bg-[#1B1F25] border-white/10 text-slate-300 hover:bg-[#232830]'
              } ${count === 0 ? 'opacity-55' : ''}`}
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{
                  backgroundColor: pot.color,
                  boxShadow: isSelected ? `0 0 8px ${pot.color}` : undefined,
                }}
              />
              <span className="text-xs font-medium">{pot.label}</span>
              <span className="text-xs font-mono-tabular font-semibold text-amber-300">
                ×{count}
              </span>
              <span className="text-[10px] font-mono-tabular text-slate-500">
                [{pot.hotkey}]
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Privacy / Companion / Detective Alert & Room Control */}
      <div className="flex items-center gap-3 ml-auto">
        {hud.detectiveWarningActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/80 border border-rose-500/60 rounded-lg text-xs font-semibold text-rose-200 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>SPARK DETECTED! HOLD SHIFT TO SPRINT</span>
          </div>
        )}

        {hud.followingFriendName && (
          <div className="text-xs text-emerald-300 whitespace-nowrap">
            Companion: <strong>{hud.followingFriendName}</strong>
          </div>
        )}

        <div className="text-xs text-slate-300 whitespace-nowrap hidden md:block">
          {hud.currentRoom ? (
            <span>
              {hud.currentRoom.label} ·{' '}
              <strong
                className={
                  hud.currentRoom.sealed ? 'text-emerald-400' : 'text-amber-400'
                }
              >
                {hud.currentRoom.sealed
                  ? hud.currentRoom.occupantCount > 1
                    ? 'Private · Another Person Inside!'
                    : 'Private · Doors & Windows Closed'
                  : 'Open · Press E to Seal'}
              </strong>
            </span>
          ) : (
            <span className="text-slate-400">
              Public Street · Invite an eligible single into a building
            </span>
          )}
        </div>

        {hud.currentRoom && (
          <button
            type="button"
            onClick={onToggleRoomSeal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hud.currentRoom.sealed
                ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-200 hover:bg-emerald-800/60'
                : 'bg-amber-500 border-amber-400 text-[#121417] hover:bg-amber-400'
            }`}
          >
            {hud.currentRoom.sealed ? (
              <>
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Open Room [E]</span>
              </>
            ) : (
              <>
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Seal Room [E]</span>
              </>
            )}
          </button>
        )}
      </div>
    </footer>
  );
};
