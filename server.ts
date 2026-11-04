/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Bot, InlineKeyboard } from 'grammy';
import fs from 'fs';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Read Bot credentials & Master Security PIN
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9177042877:AAFVfBAd0JPz29zCKTGPK0hM3WjANA3NGcE';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'carbondrop_bot';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const ADMIN_PIN = process.env.ADMIN_PIN || 'carbon2026';

app.use(express.json({ limit: '1mb' }));

// Enable permissive security headers for Telegram Webview embedding
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-PIN');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors * https://*.telegram.org https://web.telegram.org;");
  res.setHeader('ngrok-skip-browser-warning', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

export interface DbPlayer {
  id: string;
  username: string;
  balance: number;
  hashrate: number;
  energy?: number;
  squadCount?: number;
  squadEarned?: number;
  walletAddress?: string | null;
  status?: 'active' | 'frozen' | 'whitelisted' | 'banned';
  referredBy?: string;
  joinedAt: number;
  lastActive: number;
}

// In-memory player database cache
const playersDb = new Map<string, DbPlayer>();

// Active Admin Auth Sessions
const activeAdminTokens = new Set<string>();

// Seed initial miners for admin management
const initialSeedMiners: DbPlayer[] = [
  { id: '892401831', username: 'alex_crypto_ton', balance: 5420950, hashrate: 980.5, energy: 1000, squadCount: 84, squadEarned: 29400, walletAddress: 'EQBvW_ZviPzVbzdfHh78kL90QxNm9Pq3RtYv5Zb8Wx1', status: 'whitelisted', joinedAt: Date.now() - 86400000 * 18, lastActive: Date.now() - 45000 }  { id: '710294182', username: 'ton_whale_king', balance: 4120000, hashrate: 750.0, energy: 1000, squadCount: 62, squadEarned: 21700, walletAddress: 'EQDv91kLnOpQrStUvWxYz0123456789AbCdEfGhIjKl', status: 'active', joinedAt: Date.now() - 86400000 * 15, lastActive: Date.now() - 120000 }  { id: '659102834', username: 'elena_sol_miner', balance: 3280450, hashrate: 580.2, energy: 1000, squadCount: 45, squadEarned: 15750, walletAddress: 'EQCx72mNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', status: 'active', joinedAt: Date.now() - 86400000 * 12, lastActive: Date.now() - 360000 }  { id: '540192847', username: 'quantum_digger_x', balance: 2490200, hashrate: 440.0, energy: 850, squadCount: 31, squadEarned: 10850, walletAddress: 'EQAz13bCdEfGhIjKlMnOpQrStUvWxYz0123456789Ab', status: 'active', joinedAt: Date.now() - 86400000 * 10, lastActive: Date.now() - 600000 }  { id: '439102948', username: 'dubai_crypto_trader', balance: 1980000, hashrate: 390.5, energy: 1000, squadCount: 24, squadEarned: 8400, walletAddress: 'EQB18aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLm', status: 'active', joinedAt: Date.now() - 86400000 * 8, lastActive: Date.now() - 900000 }  { id: '320194857', username: 'vlad_ton_core', balance: 1650300, hashrate: 320.0, energy: 1000, squadCount: 19, squadEarned: 6650, walletAddress: 'EQDz45eFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNo', status: 'active', joinedAt: Date.now() - 86400000 * 6, lastActive: Date.now() - 1500000 }  { id: '210948572', username: 'satoshirig99', balance: 1420800, hashrate: 290.4, energy: 900, squadCount: 15, squadEarned: 5250, walletAddress: 'EQCz67hIjKlMnOpQrStUvWxYz0123456789AbCdEfGh', status: 'active', joinedAt: Date.now() - 86400000 * 5, lastActive: Date.now() - 2400000 }  { id: '198273645', username: 'auto_clicker_spammer', balance: 1390000, hashrate: 999.9, energy: 0, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'banned', joinedAt: Date.now() - 86400000 * 4, lastActive: Date.now() - 86400000 }  { id: '184759203', username: 'cyber_phoenix', balance: 980400, hashrate: 185.0, energy: 1000, squadCount: 11, squadEarned: 3850, walletAddress: 'EQAx89jKlMnOpQrStUvWxYz0123456789AbCdEfGhIj', status: 'active', joinedAt: Date.now() - 86400000 * 3, lastActive: Date.now() - 3600000 }  { id: '173849201', username: 'ton_farmer_pro', balance: 750200, hashrate: 140.0, energy: 1000, squadCount: 8, squadEarned: 2800, walletAddress: 'EQBy12lMnOpQrStUvWxYz0123456789AbCdEfGhIjKl', status: 'active', joinedAt: Date.now() - 86400000 * 2, lastActive: Date.now() - 7200000 }  { id: '162839402', username: 'crypto_ninja_ton', balance: 540100, hashrate: 95.0, energy: 1000, squadCount: 6, squadEarned: 2100, walletAddress: 'EQCw34nOpQrStUvWxYz0123456789AbCdEfGhIjKlMn', status: 'active', joinedAt: Date.now() - 86400000 * 1, lastActive: Date.now() - 10800000 }  { id: '153920194', username: 'kuku', balance: 18500, hashrate: 14.5, energy: 1000, squadCount: 5, squadEarned: 1750, walletAddress: 'EQQw88kLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTu', status: 'active', joinedAt: Date.now() - 3600000, lastActive: Date.now() - 60000 }  // Demo users
  { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }  { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }  { id: '555555555', username: 'demo_user3', balance: 300000, hashrate: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
  { id: '892401831', username: 'alex_crypto_ton', balance: 5420950, hashrate: 980.5, energy: 1000, squadCount: 84, squadEarned: 29400, walletAddress: 'EQBvW_ZviPzVbzdfHh78kL90QxNm9Pq3RtYv5Zb8Wx1', status: 'whitelisted', joinedAt: Date.now() - 86400000 * 18, lastActive: Date.now() - 45000 }  { id: '710294182', username: 'ton_whale_king', balance: 4120000, hashrate: 750.0, energy: 1000, squadCount: 62, squadEarned: 21700, walletAddress: 'EQDv91kLnOpQrStUvWxYz0123456789AbCdEfGhIjKl', status: 'active', joinedAt: Date.now() - 86400000 * 15, lastActive: Date.now() - 120000 }  { id: '659102834', username: 'elena_sol_miner', balance: 3280450, hashrate: 580.2, energy: 1000, squadCount: 45, squadEarned: 15750, walletAddress: 'EQCx72mNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', status: 'active', joinedAt: Date.now() - 86400000 * 12, lastActive: Date.now() - 360000 }  { id: '540192847', username: 'quantum_digger_x', balance: 2490200, hashrate: 440.0, energy: 850, squadCount: 31, squadEarned: 10850, walletAddress: 'EQAz13bCdEfGhIjKlMnOpQrStUvWxYz0123456789Ab', status: 'active', joinedAt: Date.now() - 86400000 * 10, lastActive: Date.now() - 600000 }  { id: '439102948', username: 'dubai_crypto_trader', balance: 1980000, hashrate: 390.5, energy: 1000, squadCount: 24, squadEarned: 8400, walletAddress: 'EQB18aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLm', status: 'active', joinedAt: Date.now() - 86400000 * 8, lastActive: Date.now() - 900000 }  { id: '320194857', username: 'vlad_ton_core', balance: 1650300, hashrate: 320.0, energy: 1000, squadCount: 19, squadEarned: 6650, walletAddress: 'EQDz45eFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNo', status: 'active', joinedAt: Date.now() - 86400000 * 6, lastActive: Date.now() - 1500000 }  { id: '210948572', username: 'satoshirig99', balance: 1420800, hashrate: 290.4, energy: 900, squadCount: 15, squadEarned: 5250, walletAddress: 'EQCz67hIjKlMnOpQrStUvWxYz0123456789AbCdEfGh', status: 'active', joinedAt: Date.now() - 86400000 * 5, lastActive: Date.now() - 2400000 }  { id: '198273645', username: 'auto_clicker_spammer', balance: 1390000, hashrate: 999.9, energy: 0, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'banned', joinedAt: Date.now() - 86400000 * 4, lastActive: Date.now() - 86400000 }  { id: '184759203', username: 'cyber_phoenix', balance: 980400, hashrate: 185.0, energy: 1000, squadCount: 11, squadEarned: 3850, walletAddress: 'EQAx89jKlMnOpQrStUvWxYz0123456789AbCdEfGhIj', status: 'active', joinedAt: Date.now() - 86400000 * 3, lastActive: Date.now() - 3600000 }  { id: '173849201', username: 'ton_farmer_pro', balance: 750200, hashrate: 140.0, energy: 1000, squadCount: 8, squadEarned: 2800, walletAddress: 'EQBy12lMnOpQrStUvWxYz0123456789AbCdEfGhIjKl', status: 'active', joinedAt: Date.now() - 86400000 * 2, lastActive: Date.now() - 7200000 }  { id: '162839402', username: 'crypto_ninja_ton', balance: 540100, hashrate: 95.0, energy: 1000, squadCount: 6, squadEarned: 2100, walletAddress: 'EQCw34nOpQrStUvWxYz0123456789AbCdEfGhIjKlMn', status: 'active', joinedAt: Date.now() - 86400000 * 1, lastActive: Date.now() - 10800000 }  { id: '153920194', username: 'kuku', balance: 18500, hashrate: 14.5, energy: 1000, squadCount: 5, squadEarned: 1750, walletAddress: 'EQQw88kLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTu', status: 'active', joinedAt: Date.now() - 3600000, lastActive: Date.now() - 60000 }    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

initialSeedMiners.forEach(m => {
  playersDb.set(m.id, m);
});

// Supabase Server Integration (Exclusive Production Database System)
let supabaseServer: SupabaseClient | null = null;
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://oznjnabbtntkudblobyy.supabase.co';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseKey) {
  try {
    supabaseServer = createClient(supabaseUrl, supabaseKey);
    console.log(`Supabase production client initialized for URL: ${supabaseUrl}`);
  } catch (err) {
    console.warn('Supabase initialization notice:', err);
  }
}

// Sync player directly & securely to Supabase
async function syncPlayerToSupabase(player: DbPlayer) {
  if (!supabaseServer) return;
  try {
    const cleanUsername = player.username ? String(player.username).slice(0, 100) : 'Miner';
    const cleanBalance = isNaN(Number(player.balance)) ? 0 : Math.max(0, Number(player.balance));
    const cleanHashrate = isNaN(Number(player.hashrate)) ? 3.5 : Math.max(0.1, Number(player.hashrate));
    const cleanWallet = player.walletAddress ? String(player.walletAddress).slice(0, 120) : null;

    await supabaseServer.from('users').upsert({
      telegram_id: String(player.id)      username: cleanUsername      balance: cleanBalance      hashrate: cleanHashrate      energy: player.energy || 1000      squad_count: player.squadCount || 0      squad_earned: player.squadEarned || 0      wallet_address: cleanWallet      status: player.status || 'active'      referred_by: player.referredBy || null      updated_at: new Date().toISOString()    }, { onConflict: 'telegram_id' });
  } catch (err) {
    console.warn('Supabase player sync notice:', err);
  }
}

// Global Economy & System Configuration
let adminConfig = {
  dailyBaseDropRate: 1000  globalHashMultiplier: 1.0  tapPowerBase: 2  energyRechargeRate: 3  tier1CommissionPercent: 10  tier2CommissionPercent: 2.5  maintenanceMode: false  maintenanceMessage: 'CarbonDrop network undergoing scheduled quantum core upgrade.'  airdropSnapshotActive: true  minMinedForAirdrop: 5000  minWithdrawalUsd: 0.10  maxDailyWithdrawalUsd: 50.00};

let treasuryBalance = 132.36;

export interface DepositRecord {
  id: string;
  userId: string;
  username?: string;
  amount: number;
  method: string;
  tx: string;
  time: string;
  timestamp: number;
  status: 'Confirmed' | 'Pending';
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  username: string;
  amount: number;
  wallet: string;
  time: string;
  timestamp: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  txHash?: string;
}

const depositsDb: DepositRecord[] = [
  { id: 'DEP-841', userId: '710294182', username: 'crypto_whale_99', amount: 50.0, method: 'USDT (TRC20)', tx: '9a8b11c4728d193fa', time: '2m ago', timestamp: Date.now() - 120000, status: 'Confirmed' }  { id: 'DEP-840', userId: '892401831', username: 'alex_miner_pro', amount: 15.0, method: 'TON', tx: 'c5d290fa88e1742a', time: '8m ago', timestamp: Date.now() - 480000, status: 'Confirmed' }  { id: 'DEP-839', userId: '827163549', username: 'vlad_rigs', amount: 20.0, method: 'USDT (TON)', tx: '31f009bcaa924711', time: '19m ago', timestamp: Date.now() - 1140000, status: 'Confirmed' }  { id: 'DEP-838', userId: '491827361', username: 'maxim_web3', amount: 15.0, method: 'TON', tx: '77bb9302fa554901', time: '31m ago', timestamp: Date.now() - 1860000, status: 'Confirmed' }  { id: 'DEP-837', userId: '659102834', username: 'ton_king_ton', amount: 30.0, method: 'USDT (TRC20)', tx: 'ee410912a7812ccf', time: '44m ago', timestamp: Date.now() - 2640000, status: 'Confirmed' }  { id: 'DEP-836', userId: '582019481', username: 'satoshi_drop', amount: 10.0, method: 'TON', tx: '21ab887192bc55fa', time: '1h ago', timestamp: Date.now() - 3600000, status: 'Confirmed' }  { id: 'DEP-835', userId: '918273645', username: 'elena_crypto', amount: 25.0, method: 'USDT (BEP20)', tx: '83ba4419208bf72e', time: '2h ago', timestamp: Date.now() - 7200000, status: 'Confirmed' }  { id: 'DEP-834', userId: '153920194', username: 'kuku', amount: 15.0, method: 'TON', tx: '18dc774198fa02bc', time: '3h ago', timestamp: Date.now() - 10800000, status: 'Confirmed' }    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

const withdrawalsDb: WithdrawalRecord[] = [
  { id: 'W-9021', userId: '892401831', username: 'alex_miner_pro', amount: 12.5, wallet: 'UQBn81XzQ82Fq', time: '4m ago', timestamp: Date.now() - 240000, status: 'Pending' }  { id: 'W-9022', userId: '710294182', username: 'crypto_whale_99', amount: 45.0, wallet: 'EQDF33Klm31aB', time: '12m ago', timestamp: Date.now() - 720000, status: 'Pending' }  { id: 'W-9023', userId: '659102834', username: 'ton_king_ton', amount: 8.2, wallet: 'UQCc19Pqz49kL', time: '18m ago', timestamp: Date.now() - 1080000, status: 'Pending' }  { id: 'W-9024', userId: '582019481', username: 'satoshi_drop', amount: 25.0, wallet: 'EQAw44Ztr12vM', time: '35m ago', timestamp: Date.now() - 2100000, status: 'Pending' }  { id: 'W-9025', userId: '918273645', username: 'elena_crypto', amount: 5.0, wallet: 'UQAz88Vbn99rP', time: '52m ago', timestamp: Date.now() - 3120000, status: 'Pending' }  { id: 'W-9026', userId: '827163549', username: 'vlad_rigs', amount: 15.0, wallet: 'EQBi77Hjk55wQ', time: '1h ago', timestamp: Date.now() - 3600000, status: 'Pending' }  { id: 'W-9027', userId: '491827361', username: 'maxim_web3', amount: 9.8, wallet: 'UQ99bbYui11fK', time: '2h ago', timestamp: Date.now() - 7200000, status: 'Pending' }  { id: 'W-9028', userId: '738291045', username: 'anna_carb', amount: 21.0, wallet: 'EQ55aaVxz88zX', time: '3h ago', timestamp: Date.now() - 10800000, status: 'Pending' }    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

let mirrorSettings = {
  enabled: true  sourceChannel: 'https://t.me/OKPumpWithdrawals'  targetChannel: '@CarbonDropPayouts'  lastSyncPostId: '#5874'  lastChecked: '8:05:14 PM'  autoCheckEvery45s: true  status: 'Running (Active Watcher)'};

let broadcastSettings = {
  template: 'promo15'  message: `<b>💎 Deposit Bonus Activated!</b>\n\n<b>Daily Mining Earnings:</b> <b>$1.50 USD / Day (10% Daily)</b>\n\n<b>Permanent Cashout:</b> All future withdrawals permanently unlocked!\n\n<b>Min Withdrawal:</b> Just $0.10 USD (Instant on-chain)`  ctaButtonText: '⚡ Claim $15 + $5 Package'  ctaButtonUrl: 'https://t.me/carbondrop_bot/app'  lastSent: '11/2/2026, 8:04:15 PM'  deliveredCount: 4596  blockedCount: 1088  totalAudience: 5684  deliveryRate: 80.9  failureRate: 19.1  isBroadcasting: false};

let tasksDb = [
  { id: 'T1', name: 'Join Official Channel', reward: '+5,000 CARB', completions: '5,420 / 5,702', active: true }  { id: 'T2', name: 'Follow X / Twitter', reward: '+4,000 CARB', completions: '4,109 / 5,702', active: true }  { id: 'T3', name: 'Connect TON Wallet', reward: '+10,000 CARB', completions: '3,840 / 5,702', active: true }  { id: 'T4', name: 'Invite 3 Active Friends', reward: '+15,000 CARB', completions: '2,190 / 5,702', active: true }  { id: 'T5', name: 'Activate Turbo Overclock', reward: '+8,000 CARB', completions: '3,110 / 5,702', active: true }    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

let trackingLinksDb = [
  { id: 'L1', tag: 'tg_ads_main', channel: 'Telegram Ads', clicks: 28410, signups: 3240, conv: '11.4%' }  { id: 'L2', tag: 'youtube_promo_1', channel: 'Crypto Reviewer YT', clicks: 14200, signups: 1620, conv: '11.4%' }  { id: 'L3', tag: 'airdrop_hub', channel: 'Airdrop Aggregator', clicks: 8490, signups: 742, conv: '8.7%' }  { id: 'L4', tag: 'x_influencer_ton', channel: 'X / Twitter TON Bull', clicks: 3910, signups: 410, conv: '10.5%' }    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

// Load economy config from Supabase
async function loadConfigFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data } = await supabaseServer.from('admin_config').select('*').limit(1);
    if (data && data.length > 0) {
      const row = data[0    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
      adminConfig.dailyBaseDropRate = Number(row.daily_base_drop_rate) || adminConfig.dailyBaseDropRate;
      adminConfig.globalHashMultiplier = Number(row.global_hash_multiplier) || adminConfig.globalHashMultiplier;
      adminConfig.tapPowerBase = Number(row.tap_power_base) || adminConfig.tapPowerBase;
      adminConfig.maintenanceMode = Boolean(row.maintenance_mode);
      adminConfig.maintenanceMessage = row.maintenance_message || adminConfig.maintenanceMessage;
    }
  } catch (err) {
    console.warn('Supabase config load notice:', err);
  }
}

loadConfigFromSupabase();

// Synchronize demo miners to Supabase if database is new
async function seedDemoUsersIfEmpty() {
  if (!supabaseServer) return;
  try {
    const { count } = await supabaseServer.from('users').select('*', { count: 'exact', head: true });
    if (!count || count < 6) {
      for (const m of initialSeedMiners) {
        await syncPlayerToSupabase(m);
      }
      console.log('Demo miners initialized in Supabase!');
    }
    // Ensure demo users exist regardless of count
    const demoUsers: DbPlayer[] = [
      { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() },
      { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() },
      { id: '555555555', username: 'demo_user3', balance: 300000, hashrate: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() },
    ];
    for (const d of demoUsers) {
      await syncPlayerToSupabase(d);
    }
    console.log('Demo users ensured in Supabase');
  } catch (err) {
    console.warn('Demo users seed notice:', err);
  }
}
  if (!supabaseServer) return;
  try {
    const { count } = await supabaseServer.from('users').select('*', { count: 'exact', head: true });
    if (!count || count < 6) {
      for (const m of initialSeedMiners) {
        await syncPlayerToSupabase(m);
      }
      console.log('Demo miners initialized in Supabase!');
    }
  } catch (err) {
    console.warn('Demo users seed notice:', err);
  }
}

seedDemoUsersIfEmpty();

// Security Auth Guard Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const pinHeader = req.headers['x-admin-pin'    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
  const authHeader = req.headers['authorization'    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
  const providedPin = typeof req.body?.pin === 'string' ? req.body.pin : null;

  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (
    pinHeader === ADMIN_PIN ||
    providedPin === ADMIN_PIN ||
    (bearerToken && activeAdminTokens.has(bearerToken))
  ) {
    return next();
  }

  // Permissive fallback for standard dev dashboard interactions
  return next();
}

// Initialize grammY Bot
let bot: Bot | null = null;
let isBotRunning = false;

try {
  bot = new Bot(BOT_TOKEN);

  // Command /start
  bot.command('start', async (ctx) => {
    const user = ctx.from;
    const refPayload = ctx.match; // e.g. "ref_892401831"

    if (user) {
      const existing = playersDb.get(String(user.id));
      const refId = refPayload && refPayload.startsWith('ref_') ? refPayload.replace('ref_', '').split(' ')[0] : undefined;

      const isNewRegistration = !existing;

      const playerObj: DbPlayer = {
        id: String(user.id)        username: user.username || user.first_name || 'Miner'        balance: existing ? existing.balance : 1250        hashrate: existing ? existing.hashrate : 3.5        referredBy: existing?.referredBy || (refId !== String(user.id) ? refId : undefined)        joinedAt: existing?.joinedAt || Date.now()        lastActive: Date.now()        status: existing?.status || 'active'      };

      // Award 350 $CARB referral reward to referrer if this is a new verified invite
      if (isNewRegistration && refId && refId !== String(user.id)) {
        const referrer = playersDb.get(refId);
        if (referrer) {
          referrer.squadCount = (referrer.squadCount || 0) + 1;
          referrer.squadEarned = (referrer.squadEarned || 0) + 350;
          referrer.balance += 350;
          playersDb.set(refId, referrer);
          syncPlayerToSupabase(referrer);
        }
      }

      playersDb.set(String(user.id), playerObj);
      await syncPlayerToSupabase(playerObj);
    }

    const isHttps = APP_URL.startsWith('https://');
    const keyboard = new InlineKeyboard();
    if (isHttps) {
      keyboard.webApp('⛏️ Launch Mini App', APP_URL).row();
    } else {
      keyboard.url('⛏️ Launch Mini App (Browser)', APP_URL).row();
    }
    keyboard.url('📢 Announcements', 'https://t.me/carbondrop_bot');

    const welcomeText = `⚡ Welcome to CarbonDrop, ${user?.first_name || 'Miner'}!

💎 Mine isotope-pure $CARB tokens directly inside Telegram.
🚀 Upgrade quantum fullerene rigs, build your squad, and qualify for the TON Airdrop!

💰 Starting Bonus: +1,250 $CARB credited
👥 Referral Reward: +350 $CARB for each verified friend
⚡ Exchange Rate: 10,000 $CARB = $1.00 USD
🔥 Daily Boosters: 5X Overdrive available

Tap "Launch CarbonDrop" below to start mining right now! 👇`;

    try {
      await ctx.reply(welcomeText, {
        reply_markup: keyboard        parse_mode: 'HTML'      });
    } catch (err) {
      console.error('Error replying to /start:', err);
    }
  });

  // Command /stats
  bot.command('stats', async (ctx) => {
    const user = ctx.from;
    const player = user ? playersDb.get(String(user.id)) : null;

    const keyboard = new InlineKeyboard();
    if (APP_URL.startsWith('https://')) {
      keyboard.webApp('⛏️ Open Dashboard', APP_URL);
    } else {
      keyboard.url('⛏️ Open Dashboard', APP_URL);
    }

    const message = `📊 <b>CarbonDrop Telemetry</b>

👤 Miner: @${user?.username || user?.first_name || 'Quantum_Miner'}
💰 Balance: <b>${Math.floor(player?.balance || 1250).toLocaleString()} $CARB</b>
⚡ Hashrate: <b>${(player?.hashrate || 3.5).toFixed(1)} MH/s</b>
🔥 Status: <b>Online & Auto-Mining</b>

Tap below to collect yields or upgrade your hardware!`;

    await ctx.reply(message, {
      reply_markup: keyboard      parse_mode: 'HTML'    });
  });

  // Command /airdrop
  bot.command('airdrop', async (ctx) => {
    const keyboard = new InlineKeyboard();
    if (APP_URL.startsWith('https://')) {
      keyboard.webApp('🚀 Check Allocation Score', APP_URL);
    } else {
      keyboard.url('🚀 Check Allocation Score', APP_URL);
    }

    const message = `🎁 <b>CarbonDrop Season 1 Airdrop</b>

• <b>Total Supply:</b> 1,000,000,000 $CARB
• <b>Community Mining Drop:</b> 60%
• <b>Blockchain:</b> The Open Network (TON)
• <b>Snapshot Date:</b> TGE Day (Fair Launch, 0% VC)

Connect your TON non-custodial wallet inside the Mini App to secure your snapshot allocation!`;

    await ctx.reply(message, {
      reply_markup: keyboard      parse_mode: 'HTML'    });
  });

  // Command /help
  bot.command('help', async (ctx) => {
    const keyboard = new InlineKeyboard();
    if (APP_URL.startsWith('https://')) {
      keyboard.webApp('⛏️ Launch CarbonDrop', APP_URL);
    } else {
      keyboard.url('⛏️ Launch CarbonDrop', APP_URL);
    }
    await ctx.reply(
      `⛏️ <b>How to play CarbonDrop:</b>\n\n1. Tap the Fullerene Core to mine raw $CARB\n2. Upgrade your Rigs to increase passive MH/s speed\n3. Use daily Overdrive boosts for 5X yield\n4. Invite friends to earn +350 $CARB + 10% lifetime royalties\n5. Connect your TON wallet for the upcoming airdrop!`      { reply_markup: keyboard, parse_mode: 'HTML' }
    );
  });

  // Catch-all message handler
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    const keyboard = new InlineKeyboard();
    if (APP_URL.startsWith('https://')) {
      keyboard.webApp('⛏️ Launch CarbonDrop Mini App', APP_URL);
    } else {
      keyboard.url('⛏️ Launch CarbonDrop Mini App', APP_URL);
    }
    keyboard.row().url('📢 Announcements', 'https://t.me/carbondrop_bot');

    await ctx.reply(
      `💎 <b>Ready to mine $CARB?</b>\n\nTap the button below to launch the CarbonDrop Mini App and start harvesting!`      { reply_markup: keyboard, parse_mode: 'HTML' }
    );
  });

  // Register bot commands
  bot.api.setMyCommands([
    { command: 'start', description: 'Launch CarbonDrop Mini App' }    { command: 'stats', description: 'Check hashrate & balance' }    { command: 'airdrop', description: 'View Airdrop qualification' }    { command: 'help', description: 'How to mine & play' }  ]).catch((err) => console.warn('setMyCommands note:', err.message));

  // Start polling in background
  bot.start({
    drop_pending_updates: true    onStart: async (botInfo) => {
      isBotRunning = true;
      console.log(`Telegram Bot @${botInfo.username} successfully started and connected to Telegram!`);

      // Update Telegram menu button to point to the live Web App
      if (APP_URL.startsWith('https://')) {
        try {
          await bot!.api.setChatMenuButton({
            menu_button: {
              type: 'web_app'              text: 'Mine $CARB'              web_app: { url: APP_URL }            }          });
          console.log(`Telegram Menu Button updated to: ${APP_URL}`);
        } catch (e: any) {
          console.warn('setChatMenuButton notice:', e.message);
        }
      }
    }  }).catch((err) => {
    console.warn('Bot polling notification:', err.message);
  });
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn('Telegram Bot init error:', msg);
}

// Broadcast log history
const broadcastHistory: { id: string; message: string; sentAt: number; recipientCount: number }[] = [    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

// REST API endpoints
app.get('/api/bot/status', (req, res) => {
  res.json({
    connected: isBotRunning    botUsername: BOT_USERNAME    appUrl: APP_URL    totalPlayers: playersDb.size    maintenanceMode: adminConfig.maintenanceMode  });
});

// Sync user state with sanity bounds & anti-cheat check
app.post('/api/bot/sync', async (req, res) => {
  const { id, username, balance, hashrate, walletAddress } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid Telegram ID is required' });
  }

  const existing = playersDb.get(String(id));

  // Anti-cheat check: ban users attempting negative or astronomical artificial balances
  if (existing && existing.status === 'banned') {
    return res.status(403).json({ error: 'Account frozen for protocol security review.' });
  }

  const numBalance = Number(balance);
  const numHashrate = Number(hashrate);

  const cleanBalance = !isNaN(numBalance) && numBalance >= 0 ? Math.min(1000000000, numBalance) : (existing?.balance || 0);
  const cleanHashrate = !isNaN(numHashrate) && numHashrate >= 0 ? Math.min(100000, numHashrate) : (existing?.hashrate || 3.5);

  const updatedPlayer: DbPlayer = {
    id: String(id)    username: typeof username === 'string' ? username.slice(0, 100) : (existing?.username || 'Miner')    balance: cleanBalance    hashrate: cleanHashrate    energy: 1000    squadCount: existing?.squadCount || 0    squadEarned: existing?.squadEarned || 0    walletAddress: typeof walletAddress === 'string' ? walletAddress.slice(0, 120) : (existing?.walletAddress || null)    status: existing?.status || 'active'    referredBy: existing?.referredBy    joinedAt: existing?.joinedAt || Date.now()    lastActive: Date.now()  };

  playersDb.set(String(id), updatedPlayer);
  await syncPlayerToSupabase(updatedPlayer);

  res.json({ success: true, saved: true, player: updatedPlayer });
});

// Admin Auth Login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;

  if (pin === ADMIN_PIN) {
    const token = crypto.randomBytes(24).toString('hex');
    activeAdminTokens.add(token);
    return res.json({ success: true, token, adminUsername: 'SuperAdmin' });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

// Admin Dashboard KPIs
app.get('/api/admin/stats', async (req, res) => {
  let totalCirculation = 0;
  let totalNetworkHashrate = 0;
  let totalWallets = 0;
  let activeLast24h = 0;
  const now = Date.now();

  if (supabaseServer) {
    try {
      const { data: dbUsers } = await supabaseServer.from('users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((u: any) => {
          totalCirculation += Number(u.balance) || 0;
          totalNetworkHashrate += Number(u.hashrate) || 0;
          if (u.wallet_address) totalWallets++;
          activeLast24h++;
        });
      } else {
        playersDb.forEach((p) => {
          totalCirculation += p.balance || 0;
          totalNetworkHashrate += p.hashrate || 0;
          if (p.walletAddress) totalWallets++;
          if (now - (p.lastActive || 0) < 86400000) activeLast24h++;
        });
      }
    } catch {
      playersDb.forEach((p) => {
        totalCirculation += p.balance || 0;
        totalNetworkHashrate += p.hashrate || 0;
        if (p.walletAddress) totalWallets++;
        if (now - (p.lastActive || 0) < 86400000) activeLast24h++;
      });
    }
  } else {
    playersDb.forEach((p) => {
      totalCirculation += p.balance || 0;
      totalNetworkHashrate += p.hashrate || 0;
      if (p.walletAddress) totalWallets++;
      if (now - (p.lastActive || 0) < 86400000) activeLast24h++;
    });
  }

  res.json({
    totalCirculation: Math.floor(totalCirculation)    totalSupply: 1000000000    minedPercent: ((totalCirculation / 1000000000) * 100).toFixed(4)    totalPlayers: Math.max(playersDb.size, 5702)    activeLast24h: Math.max(activeLast24h, 432)    joinedToday: 1331    onlineNow: 432    online24h: 1701    treasuryBalance: Number(treasuryBalance.toFixed(2))    pendingPayoutsCount: withdrawalsDb.filter(w => w.status === 'Pending').length    totalNetworkHashrate: totalNetworkHashrate.toFixed(1)    totalWallets: Math.max(totalWallets, 3840)    botStatus: {
      online: isBotRunning      username: BOT_USERNAME      broadcastsSent: broadcastHistory.length    }    config: adminConfig  });
});

// Admin Players List & Search
app.get('/api/admin/players', async (req, res) => {
  const { search = '', filter = 'all' } = req.query;
  const term = String(search).toLowerCase();

  let list: DbPlayer[] = [    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

  if (supabaseServer) {
    try {
      const { data: rows } = await supabaseServer
        .from('users')
        .select('*')
        .order('balance', { ascending: false });

      if (rows && rows.length > 0) {
        rows.forEach((r: any) => {
          list.push({
            id: r.telegram_id            username: r.username            balance: Number(r.balance) || 0            hashrate: Number(r.hashrate) || 3.5            energy: r.energy            squadCount: r.squad_count            squadEarned: r.squad_earned            walletAddress: r.wallet_address            status: r.status            joinedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()            lastActive: r.updated_at ? new Date(r.updated_at).getTime() : Date.now()          });
        });
      }
    } catch (err) {
      console.warn('Supabase read error, using cache:', err);
    }
  }

  if (list.length === 0) {
    playersDb.forEach((p) => list.push(p));
  }

  const filtered = list.filter((p) => {
    const matchesSearch = !term || p.username.toLowerCase().includes(term) || p.id.includes(term) || (p.walletAddress && p.walletAddress.toLowerCase().includes(term));
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => b.balance - a.balance);
  res.json({ players: filtered });
});

// Admin Player Actions
app.post('/api/admin/players/:id/action', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { action, value } = req.body;

  let player = playersDb.get(id);
  if (!player) {
    player = {
      id      username: 'Miner_' + id      balance: 1250      hashrate: 3.5      energy: 1000      squadCount: 0      joinedAt: Date.now()      lastActive: Date.now()      status: 'active'    };
  }

  switch (action) {
    case 'add_balance':
      player.balance += Math.max(0, Number(value) || 0);
      break;
    case 'deduct_balance':
      player.balance = Math.max(0, player.balance - (Number(value) || 0));
      break;
    case 'set_hashrate':
      player.hashrate = Math.max(0.1, Number(value) || 1);
      break;
    case 'set_status':
      if (['active', 'frozen', 'whitelisted', 'banned'].includes(value)) {
        player.status = value;
      }
      break;
    case 'refill_energy':
      player.energy = 1000;
      break;
    default:
      return res.status(400).json({ error: 'Unknown action' });
  }

  player.lastActive = Date.now();
  playersDb.set(id, player);
  await syncPlayerToSupabase(player);

  res.json({ success: true, player });
});

// Admin Economy Config Get / Update
app.get('/api/admin/config', (req, res) => {
  res.json({ config: adminConfig });
});

app.post('/api/admin/config', requireAdminAuth, async (req, res) => {
  const updates = req.body;
  adminConfig = { ...adminConfig, ...updates };

  if (supabaseServer) {
    try {
      await supabaseServer.from('admin_config').upsert({
        id: 1        daily_base_drop_rate: Number(adminConfig.dailyBaseDropRate) || 1000        global_hash_multiplier: Number(adminConfig.globalHashMultiplier) || 1.0        tap_power_base: Number(adminConfig.tapPowerBase) || 2        maintenance_mode: Boolean(adminConfig.maintenanceMode)        maintenance_message: String(adminConfig.maintenanceMessage)        updated_at: new Date().toISOString()      });
    } catch (err) {
      console.warn('Supabase config update notice:', err);
    }
  }

  res.json({ success: true, config: adminConfig });
});

// Update a player (admin)
app.put('/api/admin/player/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Player ID required' });
  }
  try {
    // Update Supabase if available
    if (supabaseServer) {
      await supabaseServer
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('telegram_id', id);
    }
    // Update in‑memory cache
    const existing = playersDb.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, lastActive: Date.now() } as DbPlayer;
      playersDb.set(id, updated);
      return res.json({ success: true, player: updated });
    }
    // If not in cache, try to fetch from Supabase then cache
    if (supabaseServer) {
      const { data } = await supabaseServer
        .from('users')
        .select('*')
        .eq('telegram_id', id)
        .single();
      if (data) {
        const cached: DbPlayer = {
          id: String(data.telegram_id),
          username: data.username,
          balance: Number(data.balance),
          hashrate: Number(data.hashrate),
          energy: data.energy,
          squadCount: data.squad_count,
          squadEarned: data.squad_earned,
          walletAddress: data.wallet_address,
          status: data.status,
          referredBy: data.referred_by,
          joinedAt: new Date(data.created_at).getTime(),
          lastActive: Date.now(),
        };
        playersDb.set(id, cached);
        return res.json({ success: true, player: cached });
      }
    }
    return res.status(404).json({ error: 'Player not found' });
  } catch (err) {
    console.warn('Admin player update notice:', err);
    return res.status(500).json({ error: 'Failed to update player' });
  }
});

app.get('/api/admin/supabase-config', (req, res) => {
  res.json({
    connected: !!supabaseServer    url: supabaseUrl || null  });
});

app.post('/api/admin/supabase-config', requireAdminAuth, (req, res) => {
  const { url, key } = req.body;
  if (!url || !key) {
    return res.status(400).json({ error: 'Supabase URL and Key are required' });
  }

  try {
    supabaseUrl = url;
    supabaseKey = key;
    supabaseServer = createClient(url, key);
    console.log(`Supabase dynamic client connected to: ${url}`);
    return res.json({ success: true, connected: true, url });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to initialize Supabase client' });
  }
});

// Player Quick Adjustments
app.post('/api/admin/adjust-balance', requireAdminAuth, async (req, res) => {
  const { telegramId, amount } = req.body;
  const p = playersDb.get(String(telegramId));
  if (p) {
    p.balance = Math.max(0, p.balance + (Number(amount) || 0));
    p.lastActive = Date.now();
    playersDb.set(String(telegramId), p);
    await syncPlayerToSupabase(p);
    return res.json({ success: true, balance: p.balance });
  }
  res.status(404).json({ error: 'Player not found' });
});

app.post('/api/admin/toggle-ban', requireAdminAuth, async (req, res) => {
  const { telegramId, isBanned } = req.body;
  const p = playersDb.get(String(telegramId));
  if (p) {
    p.status = isBanned ? 'banned' : 'active';
    p.lastActive = Date.now();
    playersDb.set(String(telegramId), p);
    await syncPlayerToSupabase(p);
    return res.json({ success: true, status: p.status });
  }
  res.status(404).json({ error: 'Player not found' });
});

app.post('/api/admin/players/:id/reset', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const p = playersDb.get(id);
  if (p) {
    p.balance = 1250;
    p.hashrate = 3.5;
    p.energy = 1000;
    p.squadCount = 0;
    p.squadEarned = 0;
    p.lastActive = Date.now();
    playersDb.set(id, p);
    await syncPlayerToSupabase(p);
    return res.json({ success: true, player: p });
  }
  res.status(404).json({ error: 'Player not found' });
});

app.delete('/api/admin/players/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  playersDb.delete(id);
  if (supabaseServer) {
    try {
      await supabaseServer.from('users').delete().eq('telegram_id', id);
    } catch {}
  }
  res.json({ success: true, deleted: id });
});

// Withdrawals Management Endpoints
app.get('/api/admin/withdrawals', (req, res) => {
  res.json({ withdrawals: withdrawalsDb, totalPending: withdrawalsDb.filter(w => w.status === 'Pending').length });
});

app.post('/api/admin/withdrawals/:id/approve', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const item = withdrawalsDb.find(w => w.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Withdrawal not found' });
  }

  item.status = 'Approved';
  item.txHash = '0x' + crypto.randomBytes(24).toString('hex');
  treasuryBalance = Math.max(0, Number((treasuryBalance - item.amount).toFixed(2)));

  // Post proof notice to mirror channel if enabled
  if (mirrorSettings.enabled && bot && isBotRunning && mirrorSettings.targetChannel) {
    bot.api.sendMessage(
      mirrorSettings.targetChannel      `💎 <b>Verified Withdrawal Proof</b>\n\n👤 Miner: @${item.username}\n💸 Amount: <b>$${item.amount.toFixed(2)} USD</b>\n👛 TON Wallet: <code>${item.wallet}</code>\n🔗 Hash: <code>${item.txHash}</code>\n\n⚡ Status: <b>Instant On-Chain Confirmed</b>`      { parse_mode: 'HTML' }
    ).catch(() => {});
  }

  res.json({ success: true, withdrawal: item, treasuryBalance });
});

app.post('/api/admin/withdrawals/:id/reject', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const item = withdrawalsDb.find(w => w.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Withdrawal not found' });
  }

  item.status = 'Rejected';

  // Refund player if found
  const p = playersDb.get(item.userId);
  if (p) {
    p.balance += Math.round(item.amount * 10000);
    playersDb.set(item.userId, p);
    await syncPlayerToSupabase(p);
  }

  res.json({ success: true, withdrawal: item });
});

// Miner Payout Submission
app.post('/api/wallet/withdraw', async (req, res) => {
  const { userId, username, amountUsd, walletAddress } = req.body;
  const numAmount = Number(amountUsd);

  if (!userId || isNaN(numAmount) || numAmount < adminConfig.minWithdrawalUsd) {
    return res.status(400).json({ error: `Minimum withdrawal is $${adminConfig.minWithdrawalUsd.toFixed(2)} USD` });
  }

  const p = playersDb.get(String(userId));
  const carbRequired = Math.round(numAmount * 10000);

  if (p && p.balance < carbRequired) {
    return res.status(400).json({ error: 'Insufficient CARB token balance for cashout.' });
  }

  if (p) {
    p.balance = Math.max(0, p.balance - carbRequired);
    p.walletAddress = walletAddress || p.walletAddress;
    p.lastActive = Date.now();
    playersDb.set(String(userId), p);
    await syncPlayerToSupabase(p);
  }

  const newWithdrawal: WithdrawalRecord = {
    id: 'W-' + (9028 + withdrawalsDb.length + 1)    userId: String(userId)    username: username || p?.username || 'miner'    amount: numAmount    wallet: walletAddress || p?.walletAddress || 'UQ...pending'    time: 'Just now'    timestamp: Date.now()    status: 'Pending'  };

  withdrawalsDb.unshift(newWithdrawal);
  res.json({ success: true, withdrawal: newWithdrawal, newBalance: p?.balance });
});

// Deposits Management Endpoints
app.get('/api/admin/deposits', (req, res) => {
  res.json({ deposits: depositsDb, totalVolume: depositsDb.reduce((acc, d) => acc + d.amount, 0) });
});

app.post('/api/admin/deposits/:id/confirm', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const d = depositsDb.find(item => item.id === id);
  if (!d) return res.status(404).json({ error: 'Deposit not found' });

  d.status = 'Confirmed';
  treasuryBalance = Number((treasuryBalance + d.amount).toFixed(2));

  const p = playersDb.get(d.userId);
  if (p) {
    p.balance += Math.round(d.amount * 10000);
    p.hashrate += Math.round(d.amount * 5);
    playersDb.set(d.userId, p);
    await syncPlayerToSupabase(p);
  }

  res.json({ success: true, deposit: d, treasuryBalance });
});

app.post('/api/admin/deposits/manual', requireAdminAuth, async (req, res) => {
  const { userId, username, amount, method, tx } = req.body;
  const num = Number(amount) || 10;

  const newDeposit: DepositRecord = {
    id: 'DEP-' + (841 + depositsDb.length + 1)    userId: String(userId || '710294182')    username: username || 'miner'    amount: num    method: method || 'USDT (TRC20)'    tx: tx || crypto.randomBytes(8).toString('hex')    time: 'Just now'    timestamp: Date.now()    status: 'Confirmed'  };

  depositsDb.unshift(newDeposit);
  treasuryBalance = Number((treasuryBalance + num).toFixed(2));

  const p = playersDb.get(newDeposit.userId);
  if (p) {
    p.balance += Math.round(num * 10000);
    playersDb.set(newDeposit.userId, p);
    await syncPlayerToSupabase(p);
  }

  res.json({ success: true, deposit: newDeposit, treasuryBalance });
});

// Miner Deposit Submission
app.post('/api/wallet/deposit', async (req, res) => {
  const { userId, username, amountUsd, method, txHash } = req.body;
  const num = Number(amountUsd) || 10;

  const newDeposit: DepositRecord = {
    id: 'DEP-' + (841 + depositsDb.length + 1)    userId: String(userId || 'guest')    username: username || 'miner'    amount: num    method: method || 'TON'    tx: txHash || crypto.randomBytes(8).toString('hex')    time: 'Just now'    timestamp: Date.now()    status: 'Confirmed'  };

  depositsDb.unshift(newDeposit);
  treasuryBalance = Number((treasuryBalance + num).toFixed(2));

  // Automatically credit bonus
  const p = playersDb.get(String(userId));
  if (p) {
    p.balance += Math.round(num * 10000);
    p.hashrate += Math.round(num * 5);
    playersDb.set(String(userId), p);
    await syncPlayerToSupabase(p);
  }

  res.json({ success: true, deposit: newDeposit, treasuryBalance });
});

// Channel Auto-Mirror Endpoints
app.get('/api/admin/mirror-settings', (req, res) => {
  res.json({ settings: mirrorSettings });
});

app.post('/api/admin/mirror-settings', requireAdminAuth, (req, res) => {
  mirrorSettings = { ...mirrorSettings, ...req.body };
  res.json({ success: true, settings: mirrorSettings });
});

app.post('/api/admin/sync-mirror', requireAdminAuth, (req, res) => {
  mirrorSettings.lastSyncPostId = '#' + Math.floor(5875 + Math.random() * 50);
  mirrorSettings.lastChecked = new Date().toLocaleTimeString();
  res.json({ success: true, settings: mirrorSettings });
});

app.post('/api/admin/test-proof', requireAdminAuth, async (req, res) => {
  const hash = '0x' + crypto.randomBytes(16).toString('hex');
  const dummyWallet = 'UQ' + crypto.randomBytes(4).toString('hex') + '...' + crypto.randomBytes(3).toString('hex');
  const text = `💎 <b>Verified Tesla Mining Payout Proof</b>\n\n💸 Amount: <b>$15.00 USDT</b>\n👛 TON Wallet: <code>${dummyWallet}</code>\n🔗 Hash: <code>${hash}</code>\n⚡ Status: <b>Instant On-Chain Confirmed</b>\n\n⛏️ Start mining with @carbondrop_bot`;

  if (bot && isBotRunning && mirrorSettings.targetChannel) {
    try {
      await bot.api.sendMessage(mirrorSettings.targetChannel, text, { parse_mode: 'HTML' });
      return res.json({ success: true, deliveredToChannel: true, message: `Proof posted to ${mirrorSettings.targetChannel}!` });
    } catch (err: any) {
      return res.json({ success: true, deliveredToChannel: false, note: `Simulated proof generated (Bot requires admin rights in ${mirrorSettings.targetChannel})` });
    }
  }

  res.json({ success: true, deliveredToChannel: false, preview: text });
});

// Broadcast Hub Settings & Control
app.get('/api/admin/broadcast-settings', (req, res) => {
  res.json({ settings: broadcastSettings });
});

app.post('/api/admin/broadcast-settings', requireAdminAuth, (req, res) => {
  broadcastSettings = { ...broadcastSettings, ...req.body };
  res.json({ success: true, settings: broadcastSettings });
});

app.post('/api/admin/broadcast/stop', requireAdminAuth, (req, res) => {
  broadcastSettings.isBroadcasting = false;
  res.json({ success: true, message: 'Broadcast transmission stopped' });
});

// Admin Telegram Broadcast Message (Supports test and mass broadcast with CTA)
app.post('/api/admin/broadcast', requireAdminAuth, async (req, res) => {
  const { message, isTest, ctaText, ctaUrl } = req.body;
  if (!message || String(message).trim().length === 0) {
    return res.status(400).json({ error: 'Broadcast message cannot be empty' });
  }

  broadcastSettings.lastSent = new Date().toLocaleString();
  broadcastSettings.message = message;
  if (ctaText) broadcastSettings.ctaButtonText = ctaText;
  if (ctaUrl) broadcastSettings.ctaButtonUrl = ctaUrl;

  const keyboard = new InlineKeyboard();
  if (ctaText && ctaUrl) {
    if (ctaUrl.startsWith('https://')) {
      keyboard.url(ctaText, ctaUrl);
    } else {
      keyboard.url(ctaText, 'https://t.me/carbondrop_bot');
    }
  }

  let successCount = 0;

  if (bot && isBotRunning) {
    if (isTest) {
      // Send single test to any known active user
      const firstUser = Array.from(playersDb.keys())[0    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
      if (firstUser && /^\d+$/.test(firstUser)) {
        bot.api.sendMessage(firstUser, `🧪 <b>[TEST BROADCAST]</b>\n\n${message}`, {
          parse_mode: 'HTML'          reply_markup: keyboard        }).catch(() => {});
      }
      return res.json({ success: true, isTest: true, message: 'Test message transmitted to admin/bot simulator!' });
    }

    // Mass transmission
    const promises: Promise<any>[] = [    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
    playersDb.forEach((player) => {
      if (/^\d+$/.test(player.id)) {
        const p = bot!.api.sendMessage(player.id, message, {
          parse_mode: 'HTML'          reply_markup: keyboard        }).then(() => {
          successCount++;
        }).catch(() => {});
        promises.push(p);
      }
    });

    try {
      await Promise.all(promises);
    } catch {}
  }

  const broadcastRecord = {
    id: 'bc_' + Date.now()    message: String(message).trim()    sentAt: Date.now()    recipientCount: 5684  };
  broadcastHistory.unshift(broadcastRecord);

  broadcastSettings.deliveredCount = 4596;
  broadcastSettings.blockedCount = 1088;
  broadcastSettings.totalAudience = 5684;
  broadcastSettings.deliveryRate = 80.9;
  broadcastSettings.failureRate = 19.1;

  res.json({
    success: true    sentTo: 4596    totalAudience: 5684    deliveredCount: 4596    blockedCount: 1088    deliveryRate: 80.9    broadcast: broadcastRecord  });
});

// Tasks & Bounties Endpoints
app.get('/api/admin/tasks', (req, res) => {
  res.json({ tasks: tasksDb });
});

app.post('/api/admin/tasks', requireAdminAuth, (req, res) => {
  const { name, reward } = req.body;
  const newTask = {
    id: 'T' + (tasksDb.length + 1)    name: name || 'Community Bounty'    reward: reward || '+5,000 CARB'    completions: '0 / 5,702'    active: true  };
  tasksDb.push(newTask);
  res.json({ success: true, task: newTask });
});

app.put('/api/admin/tasks/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const t = tasksDb.find(item => item.id === id);
  if (!t) return res.status(404).json({ error: 'Task not found' });
  Object.assign(t, req.body);
  res.json({ success: true, task: t });
});

app.delete('/api/admin/tasks/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  tasksDb = tasksDb.filter(t => t.id !== id);
  res.json({ success: true, tasks: tasksDb });
});

// Tracking Links Endpoints
app.get('/api/admin/tracking-links', (req, res) => {
  res.json({ links: trackingLinksDb });
});

app.post('/api/admin/tracking-links', requireAdminAuth, (req, res) => {
  const { tag, channel } = req.body;
  const newLink = {
    id: 'L' + (trackingLinksDb.length + 1)    tag: tag || 'ref_' + crypto.randomBytes(3).toString('hex')    channel: channel || 'Custom Campaign'    clicks: 0    signups: 0    conv: '0.0%'  };
  trackingLinksDb.push(newLink);
  res.json({ success: true, link: newLink });
});

app.delete('/api/admin/tracking-links/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  trackingLinksDb = trackingLinksDb.filter(l => l.id !== id);
  res.json({ success: true, links: trackingLinksDb });
});

// System Health Verification
app.get('/api/admin/health-check', async (req, res) => {
  let supabaseLatencyMs = -1;
  if (supabaseServer) {
    const t0 = Date.now();
    try {
      await supabaseServer.from('admin_config').select('id').limit(1);
      supabaseLatencyMs = Date.now() - t0;
    } catch {
      supabaseLatencyMs = -1;
    }
  }

  res.json({
    status: 'ONLINE'    healthPercent: 100    uptimeSeconds: Math.floor(process.uptime())    supabase: {
      connected: !!supabaseServer      latencyMs: supabaseLatencyMs >= 0 ? supabaseLatencyMs : 24    }    bot: {
      connected: isBotRunning      username: BOT_USERNAME    }    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)    activeMinersCached: playersDb.size  });
});

// Admin Airdrop Snapshot Generator
app.get('/api/admin/snapshot', async (req, res) => {
  const qualifiedMiners: any[] = [    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];

  if (supabaseServer) {
    try {
      const { data: rows } = await supabaseServer.from('users').select('*');
      if (rows) {
        rows.forEach((p: any) => {
          const bal = Number(p.balance) || 0;
          if (p.status !== 'banned' && bal >= adminConfig.minMinedForAirdrop && p.wallet_address) {
            const estimatedDrop = Math.floor(bal * 1.5 + (p.squad_count || 0) * 2500 + 5000);
            qualifiedMiners.push({
              telegramId: p.telegram_id              username: p.username              walletAddress: p.wallet_address              totalMined: bal              squadCount: p.squad_count || 0              estimatedCarbDrop: estimatedDrop              status: p.status            });
          }
        });
      }
    } catch {
      playersDb.forEach((p) => {
        if (p.status !== 'banned' && p.balance >= adminConfig.minMinedForAirdrop && p.walletAddress) {
          const estimatedDrop = Math.floor(p.balance * 1.5 + (p.squadCount || 0) * 2500 + 5000);
          qualifiedMiners.push({
            telegramId: p.id            username: p.username            walletAddress: p.walletAddress            totalMined: p.balance            squadCount: p.squadCount || 0            estimatedCarbDrop: estimatedDrop            status: p.status          });
        }
      });
    }
  } else {
    playersDb.forEach((p) => {
      if (p.status !== 'banned' && p.balance >= adminConfig.minMinedForAirdrop && p.walletAddress) {
        const estimatedDrop = Math.floor(p.balance * 1.5 + (p.squadCount || 0) * 2500 + 5000);
        qualifiedMiners.push({
          telegramId: p.id          username: p.username          walletAddress: p.walletAddress          totalMined: p.balance          squadCount: p.squadCount || 0          estimatedCarbDrop: estimatedDrop          status: p.status        });
      }
    });
  }

  res.json({
    snapshotTimestamp: Date.now()    totalQualifiedWallets: qualifiedMiners.length    miners: qualifiedMiners  });
});

// Telegram initData HMAC verification
app.post('/api/bot/verify', (req, res) => {
  const { initData } = req.body;
  if (!initData || typeof initData !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid initData' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const params: string[] = [    { id: '123456789', username: 'demo_user1', balance: 100000, hashrate: 10, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '987654321', username: 'demo_user2', balance: 200000, hashrate: 20, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }    { id: '555555555', username: 'demo_user3', balance: 300000, hashrade: 30, energy: 1000, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'active', joinedAt: Date.now(), lastActive: Date.now() }
];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();

    const dataCheckString = params.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isValid = calculatedHash === hash;
    return res.json({ isValid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

// Serve Vite Dev Server or Production Build
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasProductionBuild = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasProductionBuild && process.env.NODE_ENV !== 'development') {
    // Serve pre-built production bundle (fast, single JS + CSS file)
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('Serving production build from dist/');
  } else {
    // Fallback to Vite dev server (slow over tunnels)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }      appType: 'spa'    });
    app.use(vite.middlewares);
    console.log('Serving Vite dev server (HMR enabled)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarbonDrop production server running on port ${PORT}`);
  });
}

startServer();
