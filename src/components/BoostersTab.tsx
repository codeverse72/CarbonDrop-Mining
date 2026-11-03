/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Zap, Flame, Bot, BatteryCharging, Sparkles, CheckCircle2, Clock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats, MiningPlan } from '../types';
import { MINING_PLANS } from '../data/mockData';
import { sound } from '../utils/sound';

interface BoostersTabProps {
  stats: UserStats;
  onRefillEnergy: () => void;
  onActivateTurbo: () => void;
  onBuyBatteryUpgrade: () => void;
  onActivateAutoBot: () => void;
  onActivatePlan: (plan: MiningPlan) => void;
  energyRechargesRemaining: number;
  turboUsesRemaining: number;
}

export const BoostersTab: React.FC<BoostersTabProps> = ({
  stats,
  onRefillEnergy,
  onActivateTurbo,
  onBuyBatteryUpgrade,
  onActivateAutoBot,
  onActivatePlan,
  energyRechargesRemaining,
  turboUsesRemaining,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isTurboActive = stats.turboActiveUntil !== null && stats.turboActiveUntil > Date.now();
  const isAutoBotActive = stats.autoBotActiveUntil !== null && stats.autoBotActiveUntil > Date.now();

  const autoBotHoursLeft = isAutoBotActive
    ? ((stats.autoBotActiveUntil! - Date.now()) / (3600 * 1000)).toFixed(1)
    : 0;

  const handleConfirmPurchase = () => {
    if (!selectedPlan) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      sound.playUpgrade();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#a855f7'],
      });
      onActivatePlan(selectedPlan);
      setIsProcessingPayment(false);
      setIsCheckoutOpen(false);
      setSelectedPlan(null);
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Boosters Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-800/40">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Overclock & Energy Laboratory</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Mining Boosters & 30-Day Plans
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xl">
          Supercharge your mining velocity. Upgrade to dedicated 30-day plans ($2–$9), engage daily refills, and overclock processors for maximum yield.
        </p>
      </div>

      {/* 30-Day Premium Hardware Plans ($2 to $9) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Upgrade 30-Day Mining Plans</h3>
            <span className="text-xs text-slate-400">
              Multiply your daily token drops with 30-day dedicated hardware plans ($2 – $9)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            30-DAY PLANS
          </span>
        </div>

        {/* 4 Plans Grid ($2 to $9) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MINING_PLANS.map((plan) => {
            const isCurrent = stats.activePlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`glass-panel rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-amber-500/70 bg-purple-950/40 shadow-lg shadow-amber-500/10'
                    : 'border-purple-800/30 hover:border-purple-600/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{plan.name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-amber-300">
                      {plan.badge}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-mono text-2xl font-black text-white">${plan.priceUsd}</span>
                    <span className="text-xs text-slate-400 font-mono">({plan.priceTon} TON)</span>
                    <span className="text-[11px] text-purple-300 font-medium">/ 30 Days</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-purple-900/30 mb-3">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Daily Token Yield</span>
                    <span className="font-mono text-base font-bold text-amber-300 tabular-nums">
                      +{plan.dailyTokens.toLocaleString()} $CARB / day
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                      Total: {plan.totalMonthlyTokens.toLocaleString()} $CARB over 30 days
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 mb-4">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Plan Currently Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950/40 active:scale-95 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Upgrade to {plan.name}</span>
                    <span className="font-mono text-amber-300">${plan.priceUsd} USD</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Daily Boosters Section */}
      <div>
        <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-2 font-mono">
          Free Daily Boosters (Resets every 24h)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Energy Refill */}
          <div className="glass-panel rounded-xl p-4 border border-purple-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5 fill-amber-400/40" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Full Energy Refill</h4>
                    <span className="text-[11px] text-slate-400 font-mono">Instant 100% Recharge</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/50 text-amber-300">
                  {energyRechargesRemaining}/3 left
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Instantly replenish your kinetic mining energy tank back to {stats.maxEnergy} kJ without waiting.
              </p>
            </div>

            <button
              onClick={() => {
                if (energyRechargesRemaining > 0 && stats.energy < stats.maxEnergy) {
                  sound.playBooster();
                  confetti({
                    particleCount: 30,
                    spread: 60,
                    colors: ['#fbbf24', '#f59e0b'],
                  });
                  onRefillEnergy();
                }
              }}
              disabled={energyRechargesRemaining <= 0 || stats.energy >= stats.maxEnergy}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                energyRechargesRemaining > 0 && stats.energy < stats.maxEnergy
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{stats.energy >= stats.maxEnergy ? 'Tank Already Full' : 'Claim Free Refill'}</span>
            </button>
          </div>

          {/* Turbo Overdrive */}
          <div className="glass-panel rounded-xl p-4 border border-purple-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">5X Quantum Overclock</h4>
                    <span className="text-[11px] text-slate-400 font-mono">25 Seconds Mega Surge</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-fuchsia-950/70 border border-fuchsia-700/50 text-fuchsia-300">
                  {turboUsesRemaining}/3 left
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Multiplies both tap mining rewards and passive rig hashrate by 500% for 25 high-intensity seconds.
              </p>
            </div>

            <button
              onClick={() => {
                if (turboUsesRemaining > 0 && !isTurboActive) {
                  sound.playBooster();
                  confetti({
                    particleCount: 40,
                    spread: 70,
                    colors: ['#d946ef', '#a855f7'],
                  });
                  onActivateTurbo();
                }
              }}
              disabled={turboUsesRemaining <= 0 || isTurboActive}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                turboUsesRemaining > 0 && !isTurboActive
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-md shadow-fuchsia-600/25 active:scale-95 animate-pulse cursor-pointer'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isTurboActive ? 'Overclock Running...' : 'Engage 5X Surge'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upgrades & Automated Mining Bots */}
      <div>
        <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-2 font-mono">
          Quantum Infrastructure Enhancements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Auto Miner Bot */}
          <div className="glass-panel rounded-xl p-4 border border-purple-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Autonomous Mining AI Bot</h4>
                    <span className="text-[11px] text-slate-400 font-mono">24h Continuous Auto-Claim</span>
                  </div>
                </div>
                {isAutoBotActive && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                The bot mines and automatically drains your quantum tank directly into your balance even when Telegram is closed.
              </p>
            </div>

            <button
              onClick={() => {
                sound.playUpgrade();
                onActivateAutoBot();
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/50 text-white transition-all active:scale-95 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-300" />
                <span>{isAutoBotActive ? `Extend (+24h) [${autoBotHoursLeft}h active]` : 'Activate 24h Auto-Bot'}</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">1,500 $CARB</span>
            </button>
          </div>

          {/* Battery Expansion */}
          <div className="glass-panel rounded-xl p-4 border border-purple-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Superconductor Cell</h4>
                    <span className="text-[11px] text-slate-400 font-mono">+500 Max Energy Capacity</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/50 text-cyan-300">
                  {stats.maxEnergy} kJ
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Permanently increases your maximum energy capacity by +500 kJ, allowing longer uninterrupted tap sessions.
              </p>
            </div>

            <button
              onClick={() => {
                const cost = 800;
                if (stats.carbBalance >= cost) {
                  sound.playUpgrade();
                  onBuyBatteryUpgrade();
                }
              }}
              disabled={stats.carbBalance < 800}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                stats.carbBalance >= 800
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Expand Battery (+500 kJ)</span>
              <span className="font-mono text-amber-300">800 $CARB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Checkout Modal */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-purple-600/50 shadow-2xl text-center">
            <h3 className="font-black text-lg text-white mb-1">
              Activate {selectedPlan.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Unlock +{selectedPlan.dailyTokens.toLocaleString()} $CARB every single day for 30 days.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/50 border border-purple-800/40 mb-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plan Duration:</span>
                <span className="font-mono font-bold text-white">30 Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Tokens:</span>
                <span className="font-mono font-bold text-amber-300">{selectedPlan.totalMonthlyTokens.toLocaleString()} $CARB</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-purple-900/40">
                <span className="text-slate-300 font-bold">Total Price:</span>
                <span className="font-mono font-black text-base text-white">
                  ${selectedPlan.priceUsd}.00 USD <span className="text-xs text-slate-400 font-normal">({selectedPlan.priceTon} TON)</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessingPayment}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Processing TON Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Pay ${selectedPlan.priceUsd} & Activate Plan</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setSelectedPlan(null);
                }}
                disabled={isProcessingPayment}
                className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
