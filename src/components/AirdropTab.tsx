/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wallet, Sparkles, CheckCircle2, Clock, AlertCircle, ArrowUpRight, PieChart } from 'lucide-react';
import { UserStats } from '../types';

interface AirdropTabProps {
  stats: UserStats;
  onOpenWallet: () => void;
}

export const AirdropTab: React.FC<AirdropTabProps> = ({ stats, onOpenWallet }) => {
  // Mock TGE countdown (target date: 18 days away)
  const [timeLeft, setTimeLeft] = useState({ days: 18, hours: 14, minutes: 28, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate airdrop eligibility points
  const hasWallet = !!stats.walletAddress;
  const miningPoints = Math.min(40, Math.floor((stats.totalMinedLifetime / 10000) * 40));
  const hashratePoints = Math.min(25, Math.floor(stats.hashrate * 2.5));
  const squadPoints = Math.min(20, stats.squadCount * 5);
  const walletPoints = hasWallet ? 15 : 0;
  const totalScore = Math.min(100, miningPoints + hashratePoints + squadPoints + walletPoints);

  const estimatedAirdropCarb = Math.floor(stats.totalMinedLifetime * 1.5 + stats.squadCount * 2500 + (hasWallet ? 5000 : 0));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* TGE Countdown Banner */}
      <div className="glass-panel-elevated rounded-2xl p-4 sm:p-6 border border-purple-700/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black/40 pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-600/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Season 1 Token Generation Event</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            $CARB Official Airdrop Listing
          </h2>
          <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
            The community mining snapshot will be taken on the TON blockchain. Connect your TON wallet and maintain active hashrate to qualify.
          </p>

          {/* Countdown timer blocks */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto mb-4">
            {[
              { label: 'Days', val: timeLeft.days },
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Mins', val: timeLeft.minutes },
              { label: 'Secs', val: timeLeft.seconds },
            ].map((unit, i) => (
              <div key={i} className="p-2 sm:p-3 rounded-xl bg-black/60 border border-purple-800/40">
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 block tabular-nums">
                  {String(unit.val).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Wallet Bind Callout */}
          {!hasWallet ? (
            <button
              onClick={onOpenWallet}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 active:scale-95"
            >
              <Wallet className="w-4 h-4 text-amber-300" />
              <span>Bind TON Wallet for Airdrop</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Wallet Linked: {stats.walletAddress?.slice(0, 6)}...{stats.walletAddress?.slice(-4)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Airdrop Eligibility Scorecard & Estimated Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scorecard */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-800/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Eligibility Scorecard</h3>
              <span className="text-xs text-slate-400">Calculated across 4 ecosystem pillars</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-purple-300 tabular-nums">
                {totalScore}
                <span className="text-xs text-slate-400 font-sans">/100</span>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${totalScore}%` }}
            />
          </div>

          {/* Criteria Checklist */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-purple-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Tokens Mined ({stats.totalMinedLifetime.toLocaleString()})</span>
              </div>
              <span className="font-mono text-purple-300 font-semibold">{miningPoints}/40 pts</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-purple-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Rig Hashrate ({stats.hashrate.toFixed(1)} MH/s)</span>
              </div>
              <span className="font-mono text-purple-300 font-semibold">{hashratePoints}/25 pts</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-purple-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Squad Referrals ({stats.squadCount} miners)</span>
              </div>
              <span className="font-mono text-purple-300 font-semibold">{squadPoints}/20 pts</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                {hasWallet ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-slate-300">TON Wallet Linked</span>
              </div>
              <span className="font-mono text-purple-300 font-semibold">{walletPoints}/15 pts</span>
            </div>
          </div>
        </div>

        {/* Estimated Allocation */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-800/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm sm:text-base text-white">Projected Drop Allocation</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/40 text-emerald-300">
                FAIR LAUNCH
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Based on your current mining volume and referral multipliers. Final snapshot locks on TGE day.
            </p>

            <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30 text-center my-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
                Estimated Claimable Tokens
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tabular-nums">
                ~{estimatedAirdropCarb.toLocaleString()}
                <span className="text-base text-purple-300 font-sans font-bold ml-1.5">$CARB</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                0% Lockup · 100% Unlocked at TGE
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Network: The Open Network (TON)</span>
            <span className="font-mono text-slate-300">Ticker: $CARB</span>
          </div>
        </div>
      </div>

      {/* Tokenomics Structure */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-800/30">
        <h3 className="font-bold text-sm sm:text-base text-white mb-2">Tokenomics Architecture</h3>
        <p className="text-xs text-slate-400 mb-4">
          Total Supply: 1,000,000,000 $CARB. Fully community-centric model with zero VC allocations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30">
            <span className="text-xl font-black font-mono text-amber-400 block tabular-nums">60%</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Community Drop</span>
            <span className="text-[10px] text-slate-400 block mt-1">Telegram bot miners</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30">
            <span className="text-xl font-black font-mono text-purple-400 block tabular-nums">15%</span>
            <span className="text-xs font-semibold text-white block mt-0.5">DEX Liquidity</span>
            <span className="text-[10px] text-slate-400 block mt-1">DeDust & STON.fi</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30">
            <span className="text-xl font-black font-mono text-sky-400 block tabular-nums">15%</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Rig Yield Pool</span>
            <span className="text-[10px] text-slate-400 block mt-1">Continuous staking</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30">
            <span className="text-xl font-black font-mono text-slate-400 block tabular-nums">10%</span>
            <span className="text-xs font-semibold text-white block mt-0.5">Dev & Audits</span>
            <span className="text-[10px] text-slate-400 block mt-1">Vested for 24 months</span>
          </div>
        </div>
      </div>
    </div>
  );
};
