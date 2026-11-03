/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MiningCore } from './components/MiningCore';
import { BoostersTab } from './components/BoostersTab';
import { QuestsTab } from './components/QuestsTab';
import { SquadTab } from './components/SquadTab';
import { WalletTab } from './components/WalletTab';
import { BottomNav, NavTab } from './components/BottomNav';
import { WalletModal } from './components/WalletModal';
import { OfflineModal } from './components/OfflineModal';
import { AdminPanel } from './components/AdminPanel';
import { sound } from './utils/sound';
import {
  INITIAL_USER_STATS,
  INITIAL_RIGS,
  INITIAL_QUESTS,
  LEADERBOARD_DATA,
} from './data/mockData';
import { UserStats, MinerRig, Quest, FloatingTapNumber, MiningPlan } from './types';

const STORAGE_KEY = 'carbondrop_save_v1';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_USER_STATS;
  });

  const [rigs, setRigs] = useState<MinerRig[]>(INITIAL_RIGS);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [activeTab, setActiveTab] = useState<NavTab>('mine');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [offlineModalData, setOfflineModalData] = useState<{ amount: number; minutes: number } | null>(null);

  // Web Admin endpoint routing: /admin or #/admin
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
  });

  // Base daily drop rate set by Admin
  const [baseDropRate, setBaseDropRate] = useState<number>(1000);

  // Sync route changes
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin')
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync admin config
  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => {
        if (data?.config?.dailyBaseDropRate) {
          setBaseDropRate(data.config.dailyBaseDropRate);
        }
      })
      .catch(() => {});
  }, []);

  // Daily boost charges
  const [energyRechargesRemaining, setEnergyRechargesRemaining] = useState(3);
  const [turboUsesRemaining, setTurboUsesRemaining] = useState(3);

  // Floating tap text numbers
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingTapNumber[]>([]);
  const tapIdCounter = useRef(0);

  // Sound sync
  useEffect(() => {
    sound.enabled = !isMuted;
  }, [isMuted]);

  // Telegram WebApp SDK Lifecycle Initialization
  useEffect(() => {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          ready: () => void;
          expand: () => void;
          setHeaderColor?: (color: string) => void;
          setBackgroundColor?: (color: string) => void;
          initDataUnsafe?: {
            user?: {
              id: number;
              first_name?: string;
              last_name?: string;
              username?: string;
              is_premium?: boolean;
            };
            start_param?: string;
          };
        };
      };
    })?.Telegram?.WebApp;

    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#07050e');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#07050e');

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          const displayUser = tgUser.username || tgUser.first_name || 'Quantum_Miner';
          setStats((prev) => ({
            ...prev,
            username: displayUser,
            telegramId: String(tgUser.id),
          }));

          // Notify backend
          fetch('/api/bot/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: String(tgUser.id),
              username: displayUser,
              balance: stats.carbBalance,
              hashrate: stats.hashrate,
            }),
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('Telegram init info:', e);
      }
    }
  }, []);

  // Check offline earnings on initial load
  useEffect(() => {
    const now = Date.now();
    const lastSaved = stats.lastSavedTimestamp || now;
    const diffSeconds = Math.floor((now - lastSaved) / 1000);

    if (diffSeconds > 60 && stats.hashrate > 0) {
      const minutesOffline = Math.min(1440, Math.floor(diffSeconds / 60)); // max 24h
      const minedWhileAway = Math.min(5000, minutesOffline * 60 * stats.hashrate * 0.4);

      if (minedWhileAway > 5) {
        setOfflineModalData({
          amount: minedWhileAway,
          minutes: minutesOffline,
        });
      }
    }
  }, []);

  // Main game loop ticker: 1-second interval
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => {
        const now = Date.now();
        const isTurbo = prev.turboActiveUntil !== null && prev.turboActiveUntil > now;
        const currentMultiplier = isTurbo ? prev.turboMultiplier : 1;
        const autoHashPerSec = prev.hashrate * currentMultiplier;

        // Auto-regenerate energy
        const newEnergy = Math.min(prev.maxEnergy, prev.energy + prev.energyPerSecond);

        // Calculate maximum storage capacity
        const maxTank = Math.max(500, prev.hashrate * 120);

        // If autoBot is active, stream directly into balance
        const isAutoBot = prev.autoBotActiveUntil !== null && prev.autoBotActiveUntil > now;
        let newCarb = prev.carbBalance;
        let newLifetime = prev.totalMinedLifetime;
        let newUnclaimed = prev.unclaimedYield;

        if (isAutoBot) {
          // Auto-bot dumps directly to balance
          newCarb += autoHashPerSec;
          newLifetime += autoHashPerSec;
        } else {
          // Fill tank up to max capacity
          newUnclaimed = Math.min(maxTank, newUnclaimed + autoHashPerSec);
        }

        return {
          ...prev,
          carbBalance: newCarb,
          totalMinedLifetime: newLifetime,
          unclaimedYield: newUnclaimed,
          energy: newEnergy,
          lastSavedTimestamp: now,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Save to localStorage every 5 seconds
  useEffect(() => {
    const saveTimer = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      } catch {}
    }, 5000);
    return () => clearInterval(saveTimer);
  }, [stats]);

  // Handle Tap action (Visual and tactile feedback only - no token balance increase)
  const handleTapMine = (clickX: number, clickY: number) => {
    sound.playTap(false);
    sound.triggerHaptic('light');

    // Spawn floating particle effect
    const newId = ++tapIdCounter.current;
    setFloatingNumbers((prev) => [
      ...prev.slice(-12),
      {
        id: newId,
        x: clickX,
        y: clickY,
        value: 0,
        isCrit: false,
      },
    ]);

    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((item) => item.id !== newId));
    }, 900);
  };

  // Claim once-a-day token drop
  const handleClaimDailyDrop = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance + amount,
      totalMinedLifetime: prev.totalMinedLifetime + amount,
      lastDailyClaimTimestamp: Date.now(),
    }));
  };

  // Activate 30-day Mining Plan ($2 to $9)
  const handleActivatePlan = (plan: MiningPlan) => {
    setStats((prev) => ({
      ...prev,
      activePlanId: plan.id,
      activePlanExpiresAt: Date.now() + plan.durationDays * 86400000,
    }));
  };

  // Claim yield from tank
  const handleClaimYield = () => {
    sound.playClaim();
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance + prev.unclaimedYield,
      totalMinedLifetime: prev.totalMinedLifetime + prev.unclaimedYield,
      unclaimedYield: 0,
    }));
  };

  // Upgrade rig
  const handleUpgradeRig = (rigId: string) => {
    const rig = rigs.find((r) => r.id === rigId);
    if (!rig) return;

    const cost = Math.floor(rig.baseCost * Math.pow(rig.costMultiplier, rig.level));
    if (stats.carbBalance < cost) return;

    const newLevel = rig.level + 1;
    const updatedRigs = rigs.map((r) => (r.id === rigId ? { ...r, level: newLevel } : r));

    // Recalculate total hashrate & tap power from rigs
    let totalHash = 0;
    let extraTap = 0;

    updatedRigs.forEach((r) => {
      if (r.level > 0) {
        if (r.id === 'rig_pickaxe') {
          extraTap += r.level * 2;
        } else {
          totalHash += r.baseHashrate + (r.level - 1) * r.hashratePerLevel;
        }
      }
    });

    setRigs(updatedRigs);
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance - cost,
      hashrate: Math.max(1, totalHash),
      tapPower: 2 + extraTap,
    }));
  };

  // Boost triggers
  const handleRefillEnergy = () => {
    if (energyRechargesRemaining <= 0) return;
    setEnergyRechargesRemaining((prev) => prev - 1);
    setStats((prev) => ({
      ...prev,
      energy: prev.maxEnergy,
    }));
  };

  const handleActivateTurbo = () => {
    if (turboUsesRemaining <= 0) return;
    setTurboUsesRemaining((prev) => prev - 1);
    setStats((prev) => ({
      ...prev,
      turboActiveUntil: Date.now() + 25000, // 25 seconds
    }));
  };

  const handleBuyBatteryUpgrade = () => {
    const cost = 800;
    if (stats.carbBalance < cost) return;
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance - cost,
      maxEnergy: prev.maxEnergy + 500,
      energy: prev.energy + 500,
    }));
  };

  const handleActivateAutoBot = () => {
    const cost = 1500;
    if (stats.carbBalance < cost) return;
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance - cost,
      autoBotActiveUntil: Date.now() + 86400000, // 24 hours
    }));
  };

  // Quests & streak
  const handleClaimQuest = (questId: string, reward: number) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, status: 'claimed' } : q))
    );
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance + reward,
      totalMinedLifetime: prev.totalMinedLifetime + reward,
    }));
  };

  const handleClaimDailyStreak = (day: number, reward: number) => {
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance + reward,
      totalMinedLifetime: prev.totalMinedLifetime + reward,
      dailyStreak: (day % 7) + 1,
      lastDailyStreakTimestamp: Date.now(),
    }));
  };

  // Squad referral claims
  const handleClaimSquadBonus = () => {
    setStats((prev) => ({
      ...prev,
      carbBalance: prev.carbBalance + prev.squadEarned,
      totalMinedLifetime: prev.totalMinedLifetime + prev.squadEarned,
      squadEarned: 0,
    }));
  };

  // Wallet
  const handleConnectWallet = (address: string, name: string) => {
    setStats((prev) => ({
      ...prev,
      walletAddress: address,
      walletName: name,
    }));
    // Also mark wallet quest as complete if present
    setQuests((prev) =>
      prev.map((q) => (q.id === 'quest_wallet' ? { ...q, status: 'claimed' } : q))
    );
    setIsWalletOpen(false);
  };

  const handleDisconnectWallet = () => {
    setStats((prev) => ({
      ...prev,
      walletAddress: null,
      walletName: null,
    }));
    setIsWalletOpen(false);
  };

  const unclaimedQuestsCount = quests.filter((q) => q.status === 'completed').length;

  // Dedicated Web Endpoint for Admin: /admin
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#07050e] text-slate-100 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {/* Blurry Cosmic Portal Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div
            className="absolute inset-[-20px] bg-cover bg-center bg-no-repeat filter blur-[8px] scale-105 opacity-60"
            style={{
              backgroundImage: "url('/assets/aistudio/Neon_Cosmic_Crypto_Portal_d9ce475f.webp')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07050e]/80 via-[#080512]/60 to-[#07050e]/90" />
        </div>

        <AdminPanel
          isOpen={true}
          onClose={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050e] text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Blurry Cosmic Portal Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute inset-[-20px] bg-cover bg-center bg-no-repeat filter blur-[8px] scale-105 opacity-60"
          style={{
            backgroundImage: "url('/assets/aistudio/Neon_Cosmic_Crypto_Portal_d9ce475f.webp')",
          }}
        />
        {/* Subtle dark gradient scrim for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07050e]/75 via-[#080512]/50 to-[#07050e]/85" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#07050e]/30 to-[#07050e]/80" />
      </div>

      {/* Main Container Wrapper */}
      <div
        className={`mx-auto w-full transition-all duration-300 flex-1 flex flex-col ${
          isMobileFrame
            ? 'max-w-[420px] my-0 sm:my-4 border-0 sm:border border-purple-700/50 rounded-none sm:rounded-[36px] shadow-2xl bg-[#0a0717]/85 backdrop-blur-md overflow-hidden ring-1 ring-purple-500/20'
            : 'max-w-6xl'
        }`}
      >
        {/* Top Header */}
        <Header
          stats={stats}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onOpenWallet={() => setIsWalletOpen(true)}
          activeTab={activeTab}
        />

        {/* Tab Viewport Content */}
        <main className="flex-1 pb-20 sm:pb-24 pt-2">
          {activeTab === 'mine' && (
            <MiningCore
              stats={stats}
              baseDropRate={baseDropRate}
              onClaimDailyDrop={handleClaimDailyDrop}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )}

          {activeTab === 'boost' && (
            <BoostersTab
              stats={stats}
              onRefillEnergy={handleRefillEnergy}
              onActivateTurbo={handleActivateTurbo}
              onBuyBatteryUpgrade={handleBuyBatteryUpgrade}
              onActivateAutoBot={handleActivateAutoBot}
              onActivatePlan={handleActivatePlan}
              energyRechargesRemaining={energyRechargesRemaining}
              turboUsesRemaining={turboUsesRemaining}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsTab
              quests={quests}
              stats={stats}
              onClaimQuest={handleClaimQuest}
              onClaimDailyStreak={handleClaimDailyStreak}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )}

          {activeTab === 'squad' && (
            <SquadTab stats={stats} onClaimSquadBonus={handleClaimSquadBonus} />
          )}

          {activeTab === 'wallet' && (
            <WalletTab
              stats={stats}
              onConnect={handleConnectWallet}
              onDisconnect={handleDisconnectWallet}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unclaimedQuestsCount={unclaimedQuestsCount}
        />
      </div>

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        currentAddress={stats.walletAddress}
        walletName={stats.walletName}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Offline Earnings Claim Modal */}
      {offlineModalData && (
        <OfflineModal
          isOpen={true}
          onClose={() => setOfflineModalData(null)}
          earnedAmount={offlineModalData.amount}
          minutesOffline={offlineModalData.minutes}
          onClaim={(mult) => {
            const finalGain = offlineModalData.amount * mult;
            setStats((prev) => ({
              ...prev,
              carbBalance: prev.carbBalance + finalGain,
              totalMinedLifetime: prev.totalMinedLifetime + finalGain,
            }));
            setOfflineModalData(null);
          }}
        />
      )}
    </div>
  );
}
