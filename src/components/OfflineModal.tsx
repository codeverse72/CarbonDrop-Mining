/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Clock, Coins, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';

interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedAmount: number;
  minutesOffline: number;
  onClaim: (multiplier: number) => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  isOpen,
  onClose,
  earnedAmount,
  minutesOffline,
  onClaim,
}) => {
  if (!isOpen || earnedAmount <= 0) return null;

  const hoursAway = (minutesOffline / 60).toFixed(1);

  const handleClaim = (mult: number = 1) => {
    sound.playClaim();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#fbbf24', '#3b82f6'],
    });
    onClaim(mult);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-purple-600/50 shadow-2xl text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Artwork Header */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <picture className="w-full h-full flex items-center justify-center">
            <source srcSet="/assets/aistudio/NeonLogo_bf9560f5.webp" type="image/webp" />
            <img
              src="/assets/aistudio/NeonLogo_bf9560f5.png"
              alt="Offline Mining"
              className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-pulse"
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-950/70 border border-purple-700/40 text-purple-300 text-[11px] font-mono mb-2">
          <Clock className="w-3.5 h-3.5 text-purple-300" />
          <span>Away for {hoursAway} hours</span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mb-1">
          Rigs Mined While You Slept!
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Your quantum fullerene nodes continued unbinding isotope tokens in your absence.
        </p>

        {/* Earned Amount Highlight */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-purple-800/40 mb-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Accumulated Tokens</span>
          <div className="text-3xl font-black font-mono text-amber-300 my-0.5 tabular-nums">
            +{Math.floor(earnedAmount).toLocaleString()}
            <span className="text-sm font-sans font-bold text-purple-300 ml-1">$CARB</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">100% Ready for Deposit</span>
        </div>

        {/* Claim Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleClaim(2)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 text-slate-950" />
            <span>Double Claim (2X): +{Math.floor(earnedAmount * 2).toLocaleString()} $CARB</span>
          </button>

          <button
            onClick={() => handleClaim(1)}
            className="w-full py-2 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 text-slate-300 font-semibold text-xs active:scale-95 transition-colors"
          >
            Collect Regular (+{Math.floor(earnedAmount).toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
};
