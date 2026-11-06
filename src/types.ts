/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MinerRig {
  id: string;
  name: string;
  category: 'hardware' | 'quantum' | 'orbital';
  level: number;
  baseCost: number;
  costMultiplier: number;
  baseHashrate: number; // MH/s
  hashratePerLevel: number; // MH/s
  description: string;
  iconName: string;
  unlockedAtTotalMined?: number;
}

export interface Quest {
  id: string;
  title: string;
  category: 'telegram' | 'social' | 'mining' | 'squad' | 'ads';
  reward: number; // $CARB
  status: 'uncompleted' | 'verifying' | 'completed' | 'claimed';
  actionUrl?: string;
  actionText: string;
  iconName: string;
}

export interface Boost {
  id: string;
  name: string;
  type: 'energy_refill' | 'turbo_mining' | 'bot_miner' | 'quantum_surge';
  durationSeconds?: number;
  cooldownSeconds?: number;
  multiplier?: number;
  costCarb?: number;
  costStars?: number;
  usesRemainingToday?: number;
  maxUsesPerDay?: number;
  description: string;
}

export interface MiningPlan {
  id: string;
  name: string;
  priceUsd: number; // $2, $4, $6, $9
  priceTon: number; // TON equivalent
  dailyTokens: number; // Bonus $CARB delivered in daily drop
  totalMonthlyTokens: number;
  durationDays: number;
  badge: string;
  tierColor: string;
  features: string[];
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatarSeed: string;
  totalMined: number;
  hashrate: number;
  tier: string;
  isCurrentUser?: boolean;
}

export interface FloatingTapNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
}

export interface UserStats {
  carbBalance: number;
  totalMinedLifetime: number;
  unclaimedYield: number;
  energy: number;
  maxEnergy: number;
  energyPerSecond: number;
  tapPower: number;
  hashrate: number; // MH/s
  critChance: number; // 0.0 - 1.0
  lastSavedTimestamp: number;
  lastDailyStreakTimestamp: number;
  lastDailyClaimTimestamp: number; // Timestamp of last 24h drop claim
  dailyStreak: number;
  walletAddress: string | null;
  walletName: string | null;
  username: string;
  telegramId: string;
  squadCount: number;
  squadEarned: number;
  turboActiveUntil: number | null; // timestamp ms
  turboMultiplier: number;
  autoBotActiveUntil: number | null;
  activePlanId: string | null;
  activePlanExpiresAt: number | null;
  telegramUsername?: string;
}

export interface AdminPlayer {
  id: string;
  username: string;
  balance: number;
  hashrate: number;
  energy: number;
  squadCount: number;
  walletAddress: string | null;
  status: 'active' | 'frozen' | 'whitelisted' | 'banned';
  joinedAt: number;
  lastActive: number | string;
  activePlanId?: string | null;
  telegramId: number;
  firstName?: string;
  carbBalance: number;
  isBanned: boolean;
}

export interface AdminEconomyConfig {
  dailyBaseDropRate: number; // Daily $CARB generated for free claim
  globalHashMultiplier: number;
  tapPowerBase: number;
  energyRechargeRate: number;
  tier1CommissionPercent: number;
  tier2CommissionPercent: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  airdropSnapshotActive: boolean;
  minMinedForAirdrop: number;
}
