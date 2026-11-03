/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Coins, Sparkles, CheckCircle2, Flame, TrendingUp, Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { MINING_PLANS } from '../data/mockData';
import { sound } from '../utils/sound';

interface MiningCoreProps {
  stats: UserStats;
  baseDropRate: number; // Configured by admin (default: 1000)
  onClaimDailyDrop: (amount: number) => void;
  onOpenWallet: () => void;
}

export const MiningCore: React.FC<MiningCoreProps> = ({
  stats,
  baseDropRate = 1000,
  onClaimDailyDrop,
}) => {
  const [corePress, setCorePress] = useState(false);
  const [isAnimationOn, setIsAnimationOn] = useState(() => localStorage.getItem('carbondrop_anim') === 'on');

  const toggleAnimation = () => {
    sound.triggerHaptic('light');
    const newState = !isAnimationOn;
    setIsAnimationOn(newState);
    localStorage.setItem('carbondrop_anim', newState ? 'on' : 'off');
  };

  // Time calculation for once-a-day drop (24 hours cooldown = 86,400,000 ms)
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const lastClaim = stats.lastDailyClaimTimestamp || 0;
  const timeSinceLastClaim = now - lastClaim;
  const isClaimReady = timeSinceLastClaim >= COOLDOWN_MS;

  const msRemaining = Math.max(0, COOLDOWN_MS - timeSinceLastClaim);

  const [timeLeft, setTimeLeft] = useState({
    hours: Math.floor(msRemaining / (1000 * 60 * 60)),
    minutes: Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((msRemaining % (1000 * 60)) / 1000),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      const currentRemaining = Math.max(0, COOLDOWN_MS - (currentNow - (stats.lastDailyClaimTimestamp || 0)));
      setTimeLeft({
        hours: Math.floor(currentRemaining / (1000 * 60 * 60)),
        minutes: Math.floor((currentRemaining % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((currentRemaining % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.lastDailyClaimTimestamp]);

  // Calculate current active plan daily bonus
  const activePlan = MINING_PLANS.find((p) => p.id === stats.activePlanId);
  const planDailyBonus = activePlan ? activePlan.dailyTokens : 0;
  const totalDailyDropAmount = baseDropRate + planDailyBonus;

  // Calculate tokens generated so far & current generation rate
  const elapsedRatio = Math.min(1, Math.max(0, timeSinceLastClaim / COOLDOWN_MS));
  const tokensGeneratedSoFar = Math.floor(totalDailyDropAmount * elapsedRatio);
  const tokensPerHour = (totalDailyDropAmount / 24).toFixed(1);
  const tokensPerSecond = (totalDailyDropAmount / 86400).toFixed(4);

  // Handle core tactile touch (visual & haptic feedback only)
  const handleCoreTouch = () => {
    setCorePress(true);
    sound.triggerHaptic('light');
    sound.playTap(false);
    setTimeout(() => setCorePress(false), 150);
  };

  const handleClaim = () => {
    if (!isClaimReady) return;
    sound.playClaim();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#fbbf24', '#06b6d4'],
    });
    onClaimDailyDrop(totalDailyDropAmount);
  };

  // Cooldown percentage
  const progressPercent = Math.min(100, Math.max(0, ((COOLDOWN_MS - msRemaining) / COOLDOWN_MS) * 100));

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-2 sm:py-4 space-y-4">
      {/* Animation Control Bar */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Fullerene Core Reactor</span>
        </div>

        <button
          onClick={toggleAnimation}
          className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            isAnimationOn
              ? 'bg-purple-900/50 border-purple-500/40 text-purple-200 hover:bg-purple-800/60 shadow-sm shadow-purple-500/20'
              : 'bg-slate-900/70 border-slate-700/50 text-slate-400 hover:bg-slate-800'
          }`}
          title={isAnimationOn ? 'Disable core spin animation' : 'Enable core spin animation'}
        >
          {isAnimationOn ? (
            <Pause className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          ) : (
            <Play className="w-3 h-3 text-slate-400 fill-slate-400" />
          )}
          <span>Animation: <strong className={isAnimationOn ? 'text-emerald-400' : 'text-slate-400'}>{isAnimationOn ? 'ON' : 'OFF'}</strong></span>
        </button>
      </div>

      {/* Interactive Fullerene Core Orb (Visual & Tactile Only) */}
      <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center select-none my-1">
        <div className={`absolute inset-0 rounded-full border border-purple-500/20 pointer-events-none ${isAnimationOn ? 'animate-spin-slow' : ''}`} />
        <div className={`absolute inset-4 rounded-full border border-dashed border-indigo-400/25 pointer-events-none ${isAnimationOn ? 'animate-spin-reverse' : ''}`} />
        <div className={`absolute inset-8 rounded-full bg-gradient-to-tr from-purple-900/30 via-fuchsia-900/20 to-indigo-950/30 pointer-events-none ${isAnimationOn ? 'blur-2xl animate-pulse' : 'blur-xl opacity-40'}`} />

        <div
          onClick={handleCoreTouch}
          className={`relative z-10 w-52 h-52 sm:w-64 sm:h-64 rounded-full cursor-pointer flex items-center justify-center transition-transform duration-100 touch-none ${
            corePress ? 'scale-95' : 'hover:scale-[1.02]'
          }`}
          title="CarbonDrop Fullerene Core"
        >
          <picture className="w-full h-full flex items-center justify-center">
            <source srcSet="/assets/aistudio/NeonLogo_bf9560f5.webp" type="image/webp" />
            <img
              src="/assets/aistudio/NeonLogo_bf9560f5.png"
              alt="Carbon Fullerene Core"
              className={`w-full h-full object-contain filter transition-all ${
                isAnimationOn ? 'drop-shadow-[0_0_35px_rgba(168,85,247,0.75)]' : 'drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
              draggable={false}
              width={256}
              height={256}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      </div>

      {/* 24-Hour Daily Drop Claim Module with Countdown Timer & Generation Telemetry */}
      <div className="w-full glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-purple-700/40 text-center relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">24-Hour Daily Token Drop</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Automated isotope harvesting
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Daily Target Quota</span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 tabular-nums">
              +{totalDailyDropAmount.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">$CARB</span>
            </span>
          </div>
        </div>

        {/* Claim or Countdown Display */}
        {isClaimReady ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>Full 24-hour quota of {totalDailyDropAmount.toLocaleString()} $CARB generated! Ready to claim!</span>
            </div>

            <button
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins className="w-5 h-5 fill-slate-950" />
              <span>Claim +{totalDailyDropAmount.toLocaleString()} $CARB Daily Drop</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Real 24h Countdown Clock */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-purple-900/40">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono mb-3">
                Next Daily Drop Unlocks In
              </span>

              <div className="flex items-center justify-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/40 min-w-[58px]">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums block">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Hours</span>
                </div>

                <span className="text-2xl font-bold text-purple-400 font-mono">:</span>

                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/40 min-w-[58px]">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums block">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Mins</span>
                </div>

                <span className="text-2xl font-bold text-purple-400 font-mono">:</span>

                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/40 min-w-[58px]">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-amber-300 tabular-nums block">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Secs</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 mt-4 overflow-hidden p-0.5 border border-purple-900/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Live Generation Metrics Display */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-purple-900/40 text-left">
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-0.5">Tokens Generated So Far</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm sm:text-base font-black text-amber-300 tabular-nums">
                      {tokensGeneratedSoFar.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">/ {totalDailyDropAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-0.5">Live Generation Rate</span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-400 tabular-nums">
                      +{tokensPerHour} <span className="text-[10px] text-slate-400 font-sans font-normal">/ hr</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Generating at <span className="font-mono text-amber-300 font-semibold">{tokensPerSecond} $CARB/sec</span>. Visit the <span className="text-purple-300 font-semibold">Boost</span> tab to upgrade your 30-day Mining Plan!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
