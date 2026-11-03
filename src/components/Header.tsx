/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Headset, Phone, Check, Copy, Sparkles } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
  isMobileFrame?: boolean;
  setIsMobileFrame?: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  onOpenWallet: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isMuted,
  setIsMuted,
}) => {
  const [copiedSupport, setCopiedSupport] = useState(false);

  // Determine miner tier based on lifetime mined
  const getTier = (mined: number) => {
    if (mined >= 2000000) return { name: 'Apex Overlord', color: 'text-amber-400 border-amber-500/40' };
    if (mined >= 500000) return { name: 'Diamond Core', color: 'text-cyan-400 border-cyan-500/40' };
    if (mined >= 100000) return { name: 'Platinum Rig', color: 'text-purple-300 border-purple-500/40' };
    if (mined >= 25000) return { name: 'Gold Miner', color: 'text-yellow-400 border-yellow-500/40' };
    if (mined >= 5000) return { name: 'Silver Rig', color: 'text-slate-300 border-slate-600' };
    return { name: 'Bronze Scout', color: 'text-amber-600 border-amber-700/40' };
  };

  const tier = getTier(stats.totalMinedLifetime);

  const handleSupportClick = () => {
    const phoneNum = '+19086418801';
    navigator.clipboard.writeText(phoneNum);
    setCopiedSupport(true);
    setTimeout(() => setCopiedSupport(false), 2500);

    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phoneNum}`;
    }
  };

  return (
    <header className="w-full bg-[#0d091b]/90 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-40 px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* User Identity / Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <picture>
              <source srcSet="/assets/aistudio/CarbonDrop_Neon_Mining_Badge_a91a6103.webp" type="image/webp" />
              <img
                src="/assets/aistudio/CarbonDrop_Neon_Mining_Badge_a91a6103.png"
                alt="CarbonDrop Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                width={40}
                height={40}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-0.5 border border-slate-950">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate">
                CarbonDrop
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border bg-purple-950/60 border-purple-800/40 text-purple-300">
                BOT
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
              <span className="text-slate-300 font-medium">@{stats.username}</span>
              <span className="text-slate-600">·</span>
              <span className={`text-[11px] font-semibold ${tier.color}`}>
                {tier.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right side quick actions & CarbonDrop Support */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Hashrate telemetry */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Hashrate</span>
            <span className="font-mono text-sm font-bold text-purple-300 tabular-nums">
              {stats.hashrate.toFixed(1)} <span className="text-xs font-normal text-slate-400">MH/s</span>
            </span>
          </div>

          {/* Sound Mute/Unmute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-300" />}
          </button>

          {/* CarbonDrop Telegram Support Direct Logo Button */}
          <button
            onClick={() => {
              window.open('https://t.me/+19086418801', '_blank');
            }}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-800 p-0.5 border border-purple-400/50 shadow-lg shadow-purple-950/60 hover:scale-105 transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0 group"
            title="CarbonDrop Support (Telegram: +19086418801)"
          >
            <picture>
              <source srcSet="/assets/aistudio/CarbonDrop_Neon_Mining_Badge_a91a6103.webp" type="image/webp" />
              <img
                src="/assets/aistudio/CarbonDrop_Neon_Mining_Badge_a91a6103.png"
                alt="CarbonDrop Support"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                width={40}
                height={40}
                decoding="async"
              />
            </picture>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 border border-slate-950 shadow">
              <Headset className="w-2.5 h-2.5 stroke-[2.5]" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
