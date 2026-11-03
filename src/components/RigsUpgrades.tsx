/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu, Zap, ArrowUpRight, Lock, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MinerRig, UserStats } from '../types';
import { sound } from '../utils/sound';

interface RigsUpgradesProps {
  rigs: MinerRig[];
  stats: UserStats;
  onUpgradeRig: (rigId: string) => void;
}

export const RigsUpgrades: React.FC<RigsUpgradesProps> = ({ rigs, stats, onUpgradeRig }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'hardware' | 'quantum' | 'orbital'>('all');

  const filteredRigs = rigs.filter((rig) => {
    if (filterCategory === 'all') return true;
    return rig.category === filterCategory;
  });

  const calculateCost = (rig: MinerRig) => {
    return Math.floor(rig.baseCost * Math.pow(rig.costMultiplier, rig.level));
  };

  const calculateCurrentHash = (rig: MinerRig) => {
    if (rig.level === 0) return 0;
    return rig.baseHashrate + (rig.level - 1) * rig.hashratePerLevel;
  };

  const calculateNextHash = (rig: MinerRig) => {
    return rig.baseHashrate + rig.level * rig.hashratePerLevel;
  };

  // Estimate 24h earnings
  const dailyProjected = Math.floor(stats.hashrate * 86400);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Overview Telemetry Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Rig Command Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Quantum Fullerene Rig Arrays
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Upgrade particle accelerators and orbital harvesters to automate token yield while you are offline.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-purple-950/70 border border-purple-800/40 px-4 py-3 rounded-xl shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Combined Hashrate</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-purple-300 tabular-nums">
                {stats.hashrate.toFixed(1)} <span className="text-xs text-slate-400 font-sans">MH/s</span>
              </span>
            </div>
            <div className="h-8 w-px bg-purple-800/40" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Est. 24h Output</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-amber-300 tabular-nums">
                ~{dailyProjected.toLocaleString()} <span className="text-xs text-slate-400 font-sans">$CARB</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1.5 p-1 bg-purple-950/50 border border-purple-900/30 rounded-xl overflow-x-auto">
        {(['all', 'hardware', 'quantum', 'orbital'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
              filterCategory === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {cat === 'all' ? 'All Mining Hardware' : `${cat} tier`}
          </button>
        ))}
      </div>

      {/* Rigs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRigs.map((rig) => {
          const cost = calculateCost(rig);
          const canAfford = stats.carbBalance >= cost;
          const isLocked = rig.unlockedAtTotalMined && stats.totalMinedLifetime < rig.unlockedAtTotalMined;
          const currentHash = calculateCurrentHash(rig);
          const nextHash = calculateNextHash(rig);

          return (
            <div
              key={rig.id}
              className={`glass-panel rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                isLocked
                  ? 'border-slate-800/60 opacity-70 bg-slate-950/40'
                  : 'border-purple-800/30 hover:border-purple-600/50 hover:bg-purple-950/30'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-900/80 to-indigo-950 border border-purple-700/50 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-slate-500" />
                      ) : (
                        <Cpu className="w-5 h-5 text-amber-300" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                          {rig.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-purple-400/90 font-medium capitalize">
                        {rig.category} Rig · Level {rig.level}
                      </span>
                    </div>
                  </div>

                  {/* Level Pill */}
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-700/40 text-purple-200 shrink-0">
                    Lv. {rig.level}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {rig.description}
                </p>

                {/* Hashrate Metrics Bar */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-purple-900/30 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Current Power</span>
                    <span className="font-mono font-bold text-slate-200 tabular-nums">
                      {currentHash > 0 ? `+${currentHash.toFixed(1)} MH/s` : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Next Upgrade</span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums flex items-center gap-1">
                      <span>+{nextHash.toFixed(1)} MH/s</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isLocked ? (
                <div className="w-full py-2.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlocks at {rig.unlockedAtTotalMined?.toLocaleString()} $CARB mined</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (canAfford) {
                      sound.playUpgrade();
                      confetti({
                        particleCount: 25,
                        spread: 45,
                        origin: { y: 0.6 },
                        colors: ['#a855f7', '#fbbf24'],
                      });
                      onUpgradeRig(rig.id);
                    }
                  }}
                  disabled={!canAfford}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30 active:scale-[0.98]'
                      : 'bg-slate-900/70 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{rig.level === 0 ? 'Deploy Rig' : 'Upgrade Rig'}</span>
                  </span>

                  <span className="font-mono tabular-nums text-amber-300">
                    {cost.toLocaleString()} $CARB
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
