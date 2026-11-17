import React from 'react';
import { X } from 'lucide-react';
import { TIER_CONFIGS } from '../engine/levelConfig';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#181B20] border border-white/12 rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#F4F1EA]">
            Rules, Signals &amp; Controls
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-300 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#121519] border border-white/8 rounded-lg p-3">
                <span className="font-semibold text-[#F4F1EA]">Arrow Keys</span>{' '}
                — Walk through streets, parks, houses, hotels, motels, and apartments.
              </div>
              <div className="bg-[#121519] border border-white/8 rounded-lg p-3">
                <span className="font-semibold text-[#F4F1EA]">Shift (Hold)</span>{' '}
                — Sprint away quickly when a disguised detective sparks (2-second fuse).
              </div>
              <div className="bg-[#121519] border border-white/8 rounded-lg p-3">
                <span className="font-semibold text-[#F4F1EA]">Mouse Click</span>{' '}
                — Click glowing potions to collect, invite an eligible single, or interact.
              </div>
              <div className="bg-[#121519] border border-white/8 rounded-lg p-3">
                <span className="font-semibold text-[#F4F1EA]">E Key / Seal Button</span>{' '}
                — Close or open doors, windows, and ceiling inside any private room.
              </div>
              <div className="bg-[#121519] border border-white/8 rounded-lg p-3 sm:col-span-2">
                <span className="font-semibold text-[#F4F1EA]">Keys 1–5</span>{' '}
                — Select Touch, Smell, Taste, Sight, or Hearing Love Potion.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Character Signals &amp; Privacy
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li>
                <strong className="text-emerald-400">Eligible Polyamorous Singles:</strong>{' '}
                Marked <span className="font-mono-tabular">POLY · SINGLE</span> with no wedding ring. Click them outside to invite them to follow you one at a time, walk into any House, Hotel, Motel, or Apartment, press <strong className="text-[#F4F1EA]">E</strong> to close doors, windows, and ceilings, then click them with a potion selected.
              </li>
              <li>
                <strong className="text-amber-300">Glowing Dating-App Phone (+Bonus):</strong>{' '}
                Polyamorous singles holding a glowing phone give extra bonus points (+250 pts total) when befriended privately.
              </li>
              <li>
                <strong className="text-rose-400">Monogamous &amp; Marriage-Seeking:</strong>{' '}
                Marked <span className="font-mono-tabular">MONO</span> or wearing a diamond ring (<span className="font-mono-tabular">MARRIAGE</span>). Leave them alone—using a potion causes a relationship conflict (-25 HP, -100 pts).
              </li>
              <li>
                <strong className="text-rose-400">911 Witness Exposure:</strong>{' '}
                Never interact in public or with doors/windows open or another character in the room. If anyone witnesses an interaction, they call 911 and your run ends in Game Over.
              </li>
              <li>
                <strong className="text-orange-400">Disguised Detectives (Lv 26+):</strong>{' '}
                They emit a visible 2-second spark before detonating an invisible bomb. Hold <strong className="text-[#F4F1EA]">Shift</strong> to sprint out of the blast ring!
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Levels 1–100 Milestones
            </h3>
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121519] text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Levels</th>
                    <th className="px-3 py-2 font-medium">Objective</th>
                    <th className="px-3 py-2 font-medium">Timer</th>
                    <th className="px-3 py-2 font-medium">Challenge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {TIER_CONFIGS.map((t) => (
                    <tr key={t.tier}>
                      <td className="px-3 py-2 font-mono-tabular text-[#F4F1EA]">
                        {t.minLevel}–{t.maxLevel}
                      </td>
                      <td className="px-3 py-2 font-mono-tabular">
                        {t.tierGoal} friendships
                      </td>
                      <td className="px-3 py-2 font-mono-tabular">
                        {Math.round(t.timerSeconds / 60)} min
                      </td>
                      <td className="px-3 py-2 text-slate-400">{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-[#121417] rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
