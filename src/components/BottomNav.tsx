/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pickaxe, Flame, Award, Users, Wallet } from 'lucide-react';

export type NavTab = 'mine' | 'boost' | 'quests' | 'squad' | 'wallet';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unclaimedQuestsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unclaimedQuestsCount,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'boost', label: 'Boost', icon: <Flame className="w-5 h-5" /> },
    { id: 'quests', label: 'Quests', icon: <Award className="w-5 h-5" />, badge: unclaimedQuestsCount },
    { id: 'mine', label: 'Carbs', icon: <Pickaxe className="w-6 h-6" /> },
    { id: 'squad', label: 'Squad', icon: <Users className="w-5 h-5" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d091b]/95 backdrop-blur-lg border-t border-purple-900/40 px-3 py-1 max-w-lg mx-auto sm:max-w-xl">
      <div className="grid grid-cols-5 items-center h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCarbs = tab.id === 'mine';

          if (isCarbs) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center relative -top-3 group touch-none cursor-pointer"
                title="Mine $CARB Core"
              >
                {/* Outer glowing halo ring for Carbs */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-purple-600 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110 ring-2 ring-amber-300'
                    : 'bg-gradient-to-tr from-purple-900 via-indigo-900 to-purple-800 border border-purple-500/50 hover:scale-105 shadow-md shadow-purple-950/50'
                }`}>
                  <div className={`text-slate-950 flex items-center justify-center ${isActive ? 'text-slate-950' : 'text-amber-300'}`}>
                    <Pickaxe className="w-7 h-7 stroke-[2.2]" />
                  </div>
                </div>

                <span
                  className={`text-xs mt-1 font-black tracking-tight transition-colors ${
                    isActive ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]' : 'text-purple-200'
                  }`}
                >
                  Carbs
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] relative rounded-xl transition-all ${
                isActive
                  ? 'text-purple-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active ambient glow pill */}
              {isActive && (
                <div className="absolute inset-x-2 inset-y-1 bg-purple-600/20 rounded-xl -z-10 border border-purple-500/30" />
              )}

              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center font-mono animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
