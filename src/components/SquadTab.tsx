/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Sparkles, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { sound } from '../utils/sound';

interface SquadTabProps {
  stats: UserStats;
  onClaimSquadBonus: () => void;
}

export const SquadTab: React.FC<SquadTabProps> = ({ stats, onClaimSquadBonus }) => {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/carbondrop_bot?start=ref_${stats.telegramId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    sound.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `⚡ Join my CarbonDrop mining squad! Mine $CARB tokens on Telegram and claim airdrops with 5X Overdrive.\n${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const mockSquadMembers = [
    { username: 'crypto_vlad', joined: '2 days ago', mined: 14200, commission: 142, status: 'Active' },
    { username: 'ton_sorcerer', joined: '4 days ago', mined: 9800, commission: 98, status: 'Active' },
    { username: 'elena_sol', joined: '1 week ago', mined: 6500, commission: 65, status: 'Idle' },
    { username: 'carbon_digger', joined: '1 week ago', mined: 3500, commission: 35, status: 'Active' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* Squad Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Squad Mining Network</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Recruit Miners, Earn Lifetime Yields
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Earn <span className="text-amber-300 font-bold font-mono">350 $CARB</span> instantly for every verified referral, plus 10% lifetime royalties from all tokens mined by your direct recruits and 2.5% from secondary recruits!
            </p>
          </div>

          {/* Quick Squad Metrics */}
          <div className="flex items-center gap-4 bg-purple-950/70 border border-purple-800/40 px-4 py-3 rounded-xl shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Recruits</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {stats.squadCount} <span className="text-xs text-slate-400 font-sans">Miners</span>
              </span>
            </div>
            <div className="h-8 w-px bg-purple-800/40" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Accumulated Commission</span>
              <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">
                +{stats.squadEarned} <span className="text-xs text-slate-400 font-sans">$CARB</span>
              </span>
            </div>
          </div>
        </div>

        {/* Claim commission button if available */}
        {stats.squadEarned > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-900/40 flex items-center justify-between">
            <span className="text-xs text-slate-300">
              Uncollected referral royalties ready to transfer to balance:
            </span>
            <button
              onClick={() => {
                sound.playClaim();
                confetti({
                  particleCount: 40,
                  spread: 60,
                  colors: ['#10b981', '#fbbf24'],
                });
                onClaimSquadBonus();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
            >
              Collect +{stats.squadEarned} $CARB
            </button>
          </div>
        )}
      </div>

      {/* Share / Copy Box */}
      <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 border border-purple-700/40">
        <h3 className="font-bold text-sm sm:text-base text-white mb-2">Your Personal Invite Link</h3>
        <p className="text-xs text-slate-400 mb-3">
          Share this link in Telegram chats or channels. You get <span className="text-amber-300 font-bold">350 $CARB</span> for every verified recruit who joins via your link!
        </p>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-black/50 border border-purple-800/40 font-mono text-xs text-purple-200 select-all truncate">
            {referralLink}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/50 text-white font-semibold text-xs transition-colors active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to TG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-panel rounded-xl p-3.5 border border-purple-800/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
            <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-300 font-mono flex items-center justify-center">
              1
            </span>
            <span>Direct Recruits (Tier 1)</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mb-1">+350 $CARB + 10% Royalty</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get 350 $CARB credited instantly for each verified referral recruit, plus 10% lifetime royalties from all tokens they mine.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-3.5 border border-purple-800/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
            <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 font-mono flex items-center justify-center">
              2
            </span>
            <span>Sub-Recruits (Tier 2)</span>
          </div>
          <div className="text-lg font-bold font-mono text-purple-300 mb-1">2.5% Royalty</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When your invited friends invite their friends, you earn 2.5% secondary commission from their entire networks.
          </p>
        </div>
      </div>

      {/* Squad Member Roster */}
      <div className="glass-panel rounded-2xl p-4 border border-purple-800/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-white">Your Recruited Squad ({mockSquadMembers.length})</h3>
          <span className="text-xs font-mono text-slate-400">Total Yield: +340 $CARB</span>
        </div>

        <div className="divide-y divide-purple-900/20">
          {mockSquadMembers.map((member, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-700/50 flex items-center justify-center font-mono font-bold text-purple-300 text-xs">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-white block">@{member.username}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{member.joined}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-amber-300 block tabular-nums">
                  +{member.commission} $CARB
                </span>
                <span className={`text-[10px] font-semibold ${member.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
