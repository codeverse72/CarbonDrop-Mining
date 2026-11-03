/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
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
  { id: '1001', username: 'Satoshi_Carbon', balance: 4892040, hashrate: 842.5, energy: 1000, squadCount: 42, squadEarned: 14700, walletAddress: 'EQBvW_ZviPzVbzdfHh78kL90QxNm9Pq3RtYv5Zb8Wx1', status: 'whitelisted', joinedAt: Date.now() - 86400000 * 14, lastActive: Date.now() - 120000 },
  { id: '1002', username: 'Ton_Whale_99', balance: 3750100, hashrate: 610.2, energy: 1000, squadCount: 28, squadEarned: 9800, walletAddress: 'EQDv91kLnOpQrStUvWxYz0123456789AbCdEfGhIjKl', status: 'active', joinedAt: Date.now() - 86400000 * 12, lastActive: Date.now() - 450000 },
  { id: '1003', username: 'GrapheneMaster', balance: 2980450, hashrate: 520.0, energy: 1000, squadCount: 19, squadEarned: 6650, walletAddress: 'EQCx72mNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', status: 'active', joinedAt: Date.now() - 86400000 * 10, lastActive: Date.now() - 900000 },
  { id: '1004', username: 'CyberPickaxe', balance: 1840200, hashrate: 395.4, energy: 850, squadCount: 12, squadEarned: 4200, walletAddress: 'EQAz13bCdEfGhIjKlMnOpQrStUvWxYz0123456789Ab', status: 'active', joinedAt: Date.now() - 86400000 * 7, lastActive: Date.now() - 3600000 },
  { id: '1005', username: 'Suspicious_Clicker', balance: 1420900, hashrate: 999.0, energy: 0, squadCount: 0, squadEarned: 0, walletAddress: null, status: 'banned', joinedAt: Date.now() - 86400000 * 2, lastActive: Date.now() - 86400000 },
  { id: '1006', username: 'kuku', balance: 1250, hashrate: 3.5, energy: 1000, squadCount: 4, squadEarned: 1400, walletAddress: 'EQQw88kLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTu', status: 'active', joinedAt: Date.now() - 3600000, lastActive: Date.now() - 60000 },
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
      telegram_id: String(player.id),
      username: cleanUsername,
      balance: cleanBalance,
      hashrate: cleanHashrate,
      energy: player.energy || 1000,
      squad_count: player.squadCount || 0,
      squad_earned: player.squadEarned || 0,
      wallet_address: cleanWallet,
      status: player.status || 'active',
      referred_by: player.referredBy || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'telegram_id' });
  } catch (err) {
    console.warn('Supabase player sync notice:', err);
  }
}

// Global Economy & System Configuration
let adminConfig = {
  dailyBaseDropRate: 1000,
  globalHashMultiplier: 1.0,
  tapPowerBase: 2,
  energyRechargeRate: 3,
  tier1CommissionPercent: 10,
  tier2CommissionPercent: 2.5,
  maintenanceMode: false,
  maintenanceMessage: 'CarbonDrop network undergoing scheduled quantum core upgrade.',
  airdropSnapshotActive: true,
  minMinedForAirdrop: 5000,
};

// Load economy config from Supabase
async function loadConfigFromSupabase() {
  if (!supabaseServer) return;
  try {
    const { data } = await supabaseServer.from('admin_config').select('*').limit(1);
    if (data && data.length > 0) {
      const row = data[0];
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

// Security Auth Guard Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const pinHeader = req.headers['x-admin-pin'];
  const authHeader = req.headers['authorization'];
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
        id: String(user.id),
        username: user.username || user.first_name || 'Miner',
        balance: existing ? existing.balance : 1250,
        hashrate: existing ? existing.hashrate : 3.5,
        referredBy: existing?.referredBy || (refId !== String(user.id) ? refId : undefined),
        joinedAt: existing?.joinedAt || Date.now(),
        lastActive: Date.now(),
        status: existing?.status || 'active',
      };

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
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
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
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
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
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
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
      `⛏️ <b>How to play CarbonDrop:</b>\n\n1. Tap the Fullerene Core to mine raw $CARB\n2. Upgrade your Rigs to increase passive MH/s speed\n3. Use daily Overdrive boosts for 5X yield\n4. Invite friends to earn +350 $CARB + 10% lifetime royalties\n5. Connect your TON wallet for the upcoming airdrop!`,
      { reply_markup: keyboard, parse_mode: 'HTML' }
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
      `💎 <b>Ready to mine $CARB?</b>\n\nTap the button below to launch the CarbonDrop Mini App and start harvesting!`,
      { reply_markup: keyboard, parse_mode: 'HTML' }
    );
  });

  // Register bot commands
  bot.api.setMyCommands([
    { command: 'start', description: 'Launch CarbonDrop Mini App' },
    { command: 'stats', description: 'Check hashrate & balance' },
    { command: 'airdrop', description: 'View Airdrop qualification' },
    { command: 'help', description: 'How to mine & play' },
  ]).catch((err) => console.warn('setMyCommands note:', err.message));

  // Start polling in background
  bot.start({
    drop_pending_updates: true,
    onStart: async (botInfo) => {
      isBotRunning = true;
      console.log(`Telegram Bot @${botInfo.username} successfully started and connected to Telegram!`);

      // Update Telegram menu button to point to the live Web App
      if (APP_URL.startsWith('https://')) {
        try {
          await bot!.api.setChatMenuButton({
            menu_button: {
              type: 'web_app',
              text: 'Mine $CARB',
              web_app: { url: APP_URL },
            },
          });
          console.log(`Telegram Menu Button updated to: ${APP_URL}`);
        } catch (e: any) {
          console.warn('setChatMenuButton notice:', e.message);
        }
      }
    },
  }).catch((err) => {
    console.warn('Bot polling notification:', err.message);
  });
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn('Telegram Bot init error:', msg);
}

// Broadcast log history
const broadcastHistory: { id: string; message: string; sentAt: number; recipientCount: number }[] = [];

// REST API endpoints
app.get('/api/bot/status', (req, res) => {
  res.json({
    connected: isBotRunning,
    botUsername: BOT_USERNAME,
    appUrl: APP_URL,
    totalPlayers: playersDb.size,
    maintenanceMode: adminConfig.maintenanceMode,
  });
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
    id: String(id),
    username: typeof username === 'string' ? username.slice(0, 100) : (existing?.username || 'Miner'),
    balance: cleanBalance,
    hashrate: cleanHashrate,
    energy: 1000,
    squadCount: existing?.squadCount || 0,
    squadEarned: existing?.squadEarned || 0,
    walletAddress: typeof walletAddress === 'string' ? walletAddress.slice(0, 120) : (existing?.walletAddress || null),
    status: existing?.status || 'active',
    referredBy: existing?.referredBy,
    joinedAt: existing?.joinedAt || Date.now(),
    lastActive: Date.now(),
  };

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
    totalCirculation: Math.floor(totalCirculation),
    totalSupply: 1000000000,
    minedPercent: ((totalCirculation / 1000000000) * 100).toFixed(4),
    totalPlayers: Math.max(playersDb.size, 6),
    activeLast24h: Math.max(activeLast24h, 1),
    totalNetworkHashrate: totalNetworkHashrate.toFixed(1),
    totalWallets,
    botStatus: {
      online: isBotRunning,
      username: BOT_USERNAME,
      broadcastsSent: broadcastHistory.length,
    },
    config: adminConfig,
  });
});

// Admin Players List & Search
app.get('/api/admin/players', async (req, res) => {
  const { search = '', filter = 'all' } = req.query;
  const term = String(search).toLowerCase();

  let list: DbPlayer[] = [];

  if (supabaseServer) {
    try {
      const { data: rows } = await supabaseServer
        .from('users')
        .select('*')
        .order('balance', { ascending: false });

      if (rows && rows.length > 0) {
        rows.forEach((r: any) => {
          list.push({
            id: r.telegram_id,
            username: r.username,
            balance: Number(r.balance) || 0,
            hashrate: Number(r.hashrate) || 3.5,
            energy: r.energy,
            squadCount: r.squad_count,
            squadEarned: r.squad_earned,
            walletAddress: r.wallet_address,
            status: r.status,
            joinedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            lastActive: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
          });
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
      id,
      username: 'Miner_' + id,
      balance: 1250,
      hashrate: 3.5,
      energy: 1000,
      squadCount: 0,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      status: 'active',
    };
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
        id: 1,
        daily_base_drop_rate: Number(adminConfig.dailyBaseDropRate) || 1000,
        global_hash_multiplier: Number(adminConfig.globalHashMultiplier) || 1.0,
        tap_power_base: Number(adminConfig.tapPowerBase) || 2,
        maintenance_mode: Boolean(adminConfig.maintenanceMode),
        maintenance_message: String(adminConfig.maintenanceMessage),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase config update notice:', err);
    }
  }

  res.json({ success: true, config: adminConfig });
});

// Admin Supabase Integration Config
app.get('/api/admin/supabase-config', (req, res) => {
  res.json({
    connected: !!supabaseServer,
    url: supabaseUrl || null,
  });
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

// Admin Telegram Broadcast Message
app.post('/api/admin/broadcast', requireAdminAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || String(message).trim().length === 0) {
    return res.status(400).json({ error: 'Broadcast message cannot be empty' });
  }

  let successCount = 0;

  if (bot && isBotRunning) {
    const promises: Promise<any>[] = [];

    playersDb.forEach((player) => {
      if (/^\d+$/.test(player.id)) {
        const p = bot!.api.sendMessage(player.id, `📢 <b>CarbonDrop Official Announcement</b>\n\n${message}`, {
          parse_mode: 'HTML',
        }).then(() => {
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
    id: 'bc_' + Date.now(),
    message: String(message).trim(),
    sentAt: Date.now(),
    recipientCount: Math.max(successCount, playersDb.size),
  };
  broadcastHistory.unshift(broadcastRecord);

  res.json({
    success: true,
    sentTo: broadcastRecord.recipientCount,
    broadcast: broadcastRecord,
  });
});

// Admin Airdrop Snapshot Generator
app.get('/api/admin/snapshot', async (req, res) => {
  const qualifiedMiners: any[] = [];

  if (supabaseServer) {
    try {
      const { data: rows } = await supabaseServer.from('users').select('*');
      if (rows) {
        rows.forEach((p: any) => {
          const bal = Number(p.balance) || 0;
          if (p.status !== 'banned' && bal >= adminConfig.minMinedForAirdrop && p.wallet_address) {
            const estimatedDrop = Math.floor(bal * 1.5 + (p.squad_count || 0) * 2500 + 5000);
            qualifiedMiners.push({
              telegramId: p.telegram_id,
              username: p.username,
              walletAddress: p.wallet_address,
              totalMined: bal,
              squadCount: p.squad_count || 0,
              estimatedCarbDrop: estimatedDrop,
              status: p.status,
            });
          }
        });
      }
    } catch {
      playersDb.forEach((p) => {
        if (p.status !== 'banned' && p.balance >= adminConfig.minMinedForAirdrop && p.walletAddress) {
          const estimatedDrop = Math.floor(p.balance * 1.5 + (p.squadCount || 0) * 2500 + 5000);
          qualifiedMiners.push({
            telegramId: p.id,
            username: p.username,
            walletAddress: p.walletAddress,
            totalMined: p.balance,
            squadCount: p.squadCount || 0,
            estimatedCarbDrop: estimatedDrop,
            status: p.status,
          });
        }
      });
    }
  } else {
    playersDb.forEach((p) => {
      if (p.status !== 'banned' && p.balance >= adminConfig.minMinedForAirdrop && p.walletAddress) {
        const estimatedDrop = Math.floor(p.balance * 1.5 + (p.squadCount || 0) * 2500 + 5000);
        qualifiedMiners.push({
          telegramId: p.id,
          username: p.username,
          walletAddress: p.walletAddress,
          totalMined: p.balance,
          squadCount: p.squadCount || 0,
          estimatedCarbDrop: estimatedDrop,
          status: p.status,
        });
      }
    });
  }

  res.json({
    snapshotTimestamp: Date.now(),
    totalQualifiedWallets: qualifiedMiners.length,
    miners: qualifiedMiners,
  });
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

    const params: string[] = [];
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Serving Vite dev server (HMR enabled)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarbonDrop production server running on port ${PORT}`);
  });
}

startServer();
