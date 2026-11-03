/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Award, Send, MessageSquare, Twitter, Wallet, Zap, Users, Gift, Sparkles, Tv, Play, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quest, UserStats } from '../types';
import { DAILY_STREAK_REWARDS } from '../data/mockData';
import { sound } from '../utils/sound';

interface QuestsTabProps {
  quests: Quest[];
  stats: UserStats;
  onClaimQuest: (questId: string, reward: number) => void;
  onClaimDailyStreak: (day: number, reward: number) => void;
  onOpenWallet: () => void;
}

export const QuestsTab: React.FC<QuestsTabProps> = ({
  quests,
  stats,
  onClaimQuest,
  onClaimDailyStreak,
  onOpenWallet,
}) => {
  const [verifyingQuests, setVerifyingQuests] = useState<{ [id: string]: number }>({});
  const [readyToClaim, setReadyToClaim] = useState<{ [id: string]: boolean }>({});
  
  // Sponsored Ad Player Modal state
  const [activeAdQuest, setActiveAdQuest] = useState<Quest | null>(null);
  const [adTimer, setAdTimer] = useState<number>(10);
  const [isAdFinished, setIsAdFinished] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeAdQuest) {
      setAdTimer(10);
      setIsAdFinished(false);
      interval = setInterval(() => {
        setAdTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsAdFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAdQuest]);

  const isDailyClaimedToday = () => {
    const lastClaim = stats.lastDailyStreakTimestamp;
    const now = Date.now();
    return now - lastClaim < 20 * 3600 * 1000;
  };

  const handleStartQuest = (quest: Quest) => {
    if (quest.category === 'ads' || quest.iconName === 'Tv') {
      sound.triggerHaptic('light');
      setActiveAdQuest(quest);
      return;
    }

    if (quest.id === 'quest_wallet' && !stats.walletAddress) {
      onOpenWallet();
      return;
    }

    // Simulate verification timer
    setVerifyingQuests((prev) => ({ ...prev, [quest.id]: 5 }));

    const interval = setInterval(() => {
      setVerifyingQuests((prev) => {
        const current = prev[quest.id] || 0;
        if (current <= 1) {
          clearInterval(interval);
          setReadyToClaim((rtc) => ({ ...rtc, [quest.id]: true }));
          const copy = { ...prev };
          delete copy[quest.id];
          return copy;
        }
        return { ...prev, [quest.id]: current - 1 };
      });
    }, 1000);
  };

  const handleFinishAdAndClaim = () => {
    if (!activeAdQuest) return;
    sound.playClaim();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#fbbf24', '#10b981'],
    });
    onClaimQuest(activeAdQuest.id, activeAdQuest.reward);
    setActiveAdQuest(null);
  };

  const getQuestIcon = (name: string) => {
    switch (name) {
      case 'Tv':
        return <Tv className="w-5 h-5 text-amber-300" />;
      case 'Send':
        return <Send className="w-5 h-5 text-sky-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'Twitter':
        return <Twitter className="w-5 h-5 text-slate-200" />;
      case 'Wallet':
        return <Wallet className="w-5 h-5 text-amber-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-emerald-400" />;
      default:
        return <Zap className="w-5 h-5 text-amber-300" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* 7-Day Daily Streak Card */}
      <div className="glass-panel-elevated rounded-2xl p-4 sm:p-5 border border-purple-700/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Daily Mining Streak</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-950/70 border border-amber-600/40 text-amber-300 font-semibold">
                  Day {stats.dailyStreak} of 7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log in every 24 hours to claim escalating token rewards and airdrop multiplier bonuses.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isDailyClaimedToday()) {
                const currentDayIndex = ((stats.dailyStreak - 1) % 7);
                const reward = DAILY_STREAK_REWARDS[currentDayIndex].reward;
                sound.playClaim();
                confetti({
                  particleCount: 50,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#fbbf24', '#a855f7'],
                });
                onClaimDailyStreak(stats.dailyStreak, reward);
              }
            }}
            disabled={isDailyClaimedToday()}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              !isDailyClaimedToday()
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            {isDailyClaimedToday() ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Claimed for Today</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim Day {stats.dailyStreak} Reward</span>
              </>
            )}
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAILY_STREAK_REWARDS.map((item) => {
            const isCompleted = item.day < stats.dailyStreak || (item.day === stats.dailyStreak && isDailyClaimedToday());
            const isCurrent = item.day === stats.dailyStreak && !isDailyClaimedToday();

            return (
              <div
                key={item.day}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                  isCurrent
                    ? 'bg-purple-900/40 border-amber-500/70 shadow-lg shadow-purple-900/30'
                    : isCompleted
                    ? 'bg-purple-950/30 border-purple-800/30 text-slate-400'
                    : 'bg-black/30 border-slate-800/60 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-mono uppercase font-semibold block text-slate-400">
                  Day {item.day}
                </span>

                <div className="my-1.5">
                  <span className="font-mono text-xs font-bold block text-white tabular-nums">
                    +{item.reward >= 1000 ? `${item.reward / 1000}k` : item.reward}
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono block">$CARB</span>
                </div>

                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mx-auto" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600 mx-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quest Categories & Bounties Header */}
      <div>
        <h3 className="font-bold text-lg text-white mb-1">Telegram & Community Bounties</h3>
        <p className="text-xs text-slate-400">
          Complete mandatory ecosystem criteria to maximize your upcoming $CARB token airdrop allocation.
        </p>
      </div>

      {/* Quests List */}
      <div className="space-y-2.5">
        {quests.map((quest) => {
          const isVerifying = verifyingQuests[quest.id] !== undefined;
          const isReady = readyToClaim[quest.id];
          const isClaimed = quest.status === 'claimed';

          return (
            <div
              key={quest.id}
              className={`glass-panel rounded-xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                isClaimed
                  ? 'border-purple-950/40 bg-purple-950/15 opacity-60'
                  : 'border-purple-800/30 hover:border-purple-700/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-950/70 border border-purple-800/40 flex items-center justify-center shrink-0">
                  {getQuestIcon(quest.iconName)}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                    {quest.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-semibold text-amber-300 tabular-nums">
                      +{quest.reward.toLocaleString()} $CARB
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-mono">
                      {quest.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {isClaimed ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Claimed</span>
                  </div>
                ) : isReady ? (
                  <button
                    onClick={() => {
                      sound.playClaim();
                      confetti({
                        particleCount: 30,
                        spread: 50,
                        colors: ['#a855f7', '#fbbf24'],
                      });
                      onClaimQuest(quest.id, quest.reward);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse"
                  >
                    Claim +{quest.reward.toLocaleString()}
                  </button>
                ) : isVerifying ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-700/40 text-purple-300 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying {verifyingQuests[quest.id]}s</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartQuest(quest)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/80 border border-purple-700/60 text-purple-200 hover:bg-purple-900/60 transition-colors active:scale-95"
                  >
                    {quest.actionText}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sponsored Video Ad Player Modal */}
      {activeAdQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-purple-600/50 shadow-2xl text-center space-y-4 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm text-white">{activeAdQuest.title}</h3>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Reward: +{activeAdQuest.reward.toLocaleString()} $CARB
                  </span>
                </div>
              </div>

              {isAdFinished && (
                <button
                  onClick={() => setActiveAdQuest(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Video Player Display Simulation */}
            <div className="relative w-full h-48 sm:h-56 rounded-2xl bg-black border border-purple-800/60 overflow-hidden flex flex-col items-center justify-center group shadow-inner">
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-xs opacity-50 scale-105"
                style={{ backgroundImage: "url('/assets/aistudio/Neon_Cosmic_Crypto_Portal_d9ce475f.webp')" }}
              />

              <div className="relative z-10 space-y-2 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600/80 border border-purple-400/60 flex items-center justify-center mx-auto text-amber-300 shadow-lg shadow-purple-900/50">
                  <Play className="w-6 h-6 fill-amber-300 translate-x-0.5" />
                </div>
                <h4 className="font-black text-sm text-white tracking-wide">
                  CarbonDrop TON Sponsored Video
                </h4>
                <p className="text-[11px] text-slate-300 font-mono">
                  Watch for {adTimer > 0 ? `${adTimer}s` : '0s'} to unlock reward
                </p>
              </div>

              {/* Progress Bar at bottom of Video */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-900">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${((10 - adTimer) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Status or Claim Button */}
            {isAdFinished ? (
              <button
                onClick={handleFinishAdAndClaim}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Claim +{activeAdQuest.reward.toLocaleString()} $CARB Reward</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs font-mono text-purple-200 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Video Ad Playing... Reward unlocks in {adTimer}s</span>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
