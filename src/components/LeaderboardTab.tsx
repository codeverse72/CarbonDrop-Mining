/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Medal, Award, Flame, Zap, Crown } from 'lucide-react';
import { LeaderboardUser, UserStats } from '../types';

interface LeaderboardTabProps {
  users: LeaderboardUser[];
  stats: UserStats;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ users, stats }) => {
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'sprint'>('all');

  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* Prize Pool Header */}
      <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 border border-purple-700/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Season 1 Mining Grand Prix</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Global Hashrate Leaderboard
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Top 100 miners share in the $10,000 TON Ecosystem Prize Pool distributed every Sunday.
            </p>
          </div>

          <div className="bg-black/50 border border-amber-500/40 px-4 py-2.5 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Prize Pool</span>
            <span className="text-xl font-bold font-mono text-amber-300 tabular-nums">
              5,000 TON <span className="text-xs text-slate-400 font-sans">(~$27,500)</span>
            </span>
          </div>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-purple-900/40 rounded-xl mt-4 w-fit">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframe === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time Hall of Fame
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframe === 'weekly' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Grand Prix
          </button>
          <button
            onClick={() => setTimeframe('sprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframe === 'sprint' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            24h Speed Sprint
          </button>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-400/30 text-center flex flex-col items-center relative order-1">
            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center font-mono mb-2">
              2
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-slate-400/60 flex items-center justify-center font-bold text-white mb-2">
              🥈
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[130px]">
              @{topThree[1].username}
            </h4>
            <span className="font-mono text-xs font-bold text-slate-300 mt-1 tabular-nums">
              {(topThree[1].totalMined / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {topThree[1].hashrate} MH/s
            </span>
          </div>
        )}

        {/* 1st Place Champion */}
        {topThree[0] && (
          <div className="glass-panel-elevated rounded-2xl p-3 sm:p-5 border-2 border-amber-500/70 text-center flex flex-col items-center relative order-2 -mt-4 shadow-xl shadow-amber-500/10">
            <div className="absolute -top-3">
              <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center font-mono mt-1 mb-2">
              1
            </div>
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-amber-950/40 border-2 border-amber-400 flex items-center justify-center font-bold text-white mb-2 shadow-inner">
              👑
            </div>
            <h4 className="font-bold text-xs sm:text-base text-amber-300 truncate max-w-[100px] sm:max-w-[150px]">
              @{topThree[0].username}
            </h4>
            <span className="font-mono text-sm sm:text-base font-black text-white mt-1 tabular-nums">
              {(topThree[0].totalMined / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-semibold">
              {topThree[0].hashrate} MH/s
            </span>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-amber-800/40 text-center flex flex-col items-center relative order-3">
            <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center font-mono mb-2">
              3
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-950 border-2 border-amber-700/60 flex items-center justify-center font-bold text-white mb-2">
              🥉
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[130px]">
              @{topThree[2].username}
            </h4>
            <span className="font-mono text-xs font-bold text-amber-500 mt-1 tabular-nums">
              {(topThree[2].totalMined / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {topThree[2].hashrate} MH/s
            </span>
          </div>
        )}
      </div>

      {/* Ranks 4 to 10 Table */}
      <div className="glass-panel rounded-2xl border border-purple-800/30 overflow-hidden">
        <div className="p-3.5 border-b border-purple-900/30 flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
          <span>Miner</span>
          <div className="flex items-center gap-6">
            <span>Speed</span>
            <span>Total Mined</span>
          </div>
        </div>

        <div className="divide-y divide-purple-900/20">
          {remaining.map((user) => {
            const isUser = user.isCurrentUser;
            return (
              <div
                key={user.rank}
                className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                  isUser ? 'bg-purple-900/30 border-l-2 border-amber-400' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-400 w-6 text-center">
                    #{user.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${isUser ? 'text-amber-300' : 'text-white'}`}>
                        @{isUser ? stats.username : user.username}
                      </span>
                      {isUser && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{user.tier}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-mono text-slate-300 tabular-nums">
                    {isUser ? stats.hashrate.toFixed(1) : user.hashrate} MH/s
                  </span>
                  <span className="font-mono font-bold text-purple-200 tabular-nums min-w-[70px] text-right">
                    {isUser ? Math.floor(stats.carbBalance).toLocaleString() : user.totalMined.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
