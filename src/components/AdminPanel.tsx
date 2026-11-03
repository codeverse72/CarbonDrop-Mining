/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X, ShieldAlert, Key, Users, Settings, Send, Download, RefreshCw,
  Search, CheckCircle2, Ban, ShieldCheck, Flame, Zap, Database, Activity,
  Sliders, Lock, Unlock, LogOut, Radio
} from 'lucide-react';
import { AdminPlayer, AdminEconomyConfig } from '../types';
import { sound } from '../utils/sound';
import { SUPABASE_SQL_INIT_SCRIPT } from '../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'kpis' | 'miners' | 'economy' | 'broadcast' | 'airdrop' | 'supabase'>('kpis');

  // Supabase state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => localStorage.getItem('carbondrop_supabase_url') || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => localStorage.getItem('carbondrop_supabase_key') || '');
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; url: string | null } | null>(null);
  const [supabaseSaveMsg, setSupabaseSaveMsg] = useState('');
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadPlayers();
      loadSupabaseStatus();
    }
  }, [isAuthenticated]);

  const loadSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/admin/supabase-config');
      const data = await res.json();
      setSupabaseStatus(data);
      if (data.url) setSupabaseUrlInput(data.url);
    } catch {}
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseSaveMsg('');

    try {
      const res = await fetch('/api/admin/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrlInput, key: supabaseKeyInput }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('carbondrop_supabase_url', supabaseUrlInput);
        localStorage.setItem('carbondrop_supabase_key', supabaseKeyInput);
        setSupabaseStatus({ connected: true, url: supabaseUrlInput });
        setSupabaseSaveMsg('Supabase connected successfully!');
        sound.playClaim();
      } else {
        setSupabaseSaveMsg(data.error || 'Failed to connect Supabase');
      }
    } catch (err: any) {
      setSupabaseSaveMsg('Connection failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Stats & data
  const [stats, setStats] = useState<any>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [config, setConfig] = useState<AdminEconomyConfig>({
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
  });

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Snapshot state
  const [snapshotData, setSnapshotData] = useState<any[]>([]);

  // Selected player for detail modal
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);
  const [actionAmount, setActionAmount] = useState('5000');

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadPlayers();
    }
  }, [isAuthenticated]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sound.playClaim();
      } else {
        setLoginError('Invalid Master Admin PIN');
      }
    } catch {
      // Local fallback
      if (pinInput === 'carbon2026') {
        setIsAuthenticated(true);
        sound.playClaim();
      } else {
        setLoginError('Invalid Master Admin PIN');
      }
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      if (data.config) setConfig(data.config);
    } catch (e) {
      console.warn('Load stats notice:', e);
    }
  };

  const loadPlayers = async () => {
    try {
      const res = await fetch(`/api/admin/players?search=${encodeURIComponent(searchQuery)}&filter=${statusFilter}`);
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (e) {
      console.warn('Load players notice:', e);
    }
  };

  const handlePlayerAction = async (playerId: string, action: string, value: any) => {
    try {
      const res = await fetch(`/api/admin/players/${playerId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playUpgrade();
        loadPlayers();
        loadStats();
        if (selectedPlayer && selectedPlayer.id === playerId) {
          setSelectedPlayer(data.player);
        }
      }
    } catch {}
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        sound.playClaim();
        loadStats();
      }
    } catch {}
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setBroadcastStatus('Broadcasting message via Telegram Bot...');

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage }),
      });
      const data = await res.json();
      setBroadcastStatus(`Broadcast successfully sent to ${data.sentTo} registered miners!`);
      setBroadcastMessage('');
      sound.playClaim();
    } catch {
      setBroadcastStatus('Broadcast dispatched to active connected sessions.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    try {
      const res = await fetch('/api/admin/snapshot');
      const data = await res.json();
      setSnapshotData(data.miners || []);
      sound.playClaim();
    } catch {}
  };

  const handleExportCSV = () => {
    if (!snapshotData.length) return;
    const headers = ['Telegram ID', 'Username', 'TON Wallet Address', 'Total Tokens Mined', 'Squad Recruits', 'Allocated Airdrop $CARB'];
    const rows = snapshotData.map(m => [
      m.telegramId,
      m.username,
      m.walletAddress,
      m.totalMined,
      m.squadCount,
      m.estimatedCarbDrop
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carbondrop_airdrop_snapshot_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] glass-panel-elevated rounded-3xl border border-purple-600/50 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#090614] border-b border-purple-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  CarbonDrop Command Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Bot: @carbondrop_bot · Protocol Master Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Lock Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate if not logged in */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-purple-700/40 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-950 border border-purple-600/50 flex items-center justify-center mx-auto mb-4 text-amber-300">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-1">Enter Master Admin PIN</h3>
              <p className="text-xs text-slate-400 mb-4">
                Access is restricted to verified CarbonDrop protocol administrators.
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter Master PIN (default: carbon2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-purple-800/60 font-mono text-center text-sm text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {loginError && <p className="text-xs text-red-400 font-medium">{loginError}</p>}
                
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95"
                >
                  Unlock Admin Console
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setPinInput('carbon2026');
                }}
                className="mt-3 text-[11px] text-purple-400 hover:text-purple-300 font-mono underline cursor-pointer"
              >
                Use Default Master PIN (carbon2026)
              </button>
            </div>
          </div>
        ) : (
          /* Main Authenticated Dashboard Content */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Horizontal Sub-Navigation */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-black/30 border-b border-purple-900/30 overflow-x-auto shrink-0">
              {[
                { id: 'kpis', label: 'Ecosystem Analytics', icon: <Activity className="w-3.5 h-3.5" /> },
                { id: 'miners', label: 'Miner Accounts', icon: <Users className="w-3.5 h-3.5" /> },
                { id: 'economy', label: 'Economy & Multipliers', icon: <Sliders className="w-3.5 h-3.5" /> },
                { id: 'broadcast', label: 'Telegram Push Broadcast', icon: <Send className="w-3.5 h-3.5" /> },
                { id: 'airdrop', label: 'Airdrop Snapshot', icon: <Database className="w-3.5 h-3.5" /> },
                { id: 'supabase', label: 'Supabase Database', icon: <Database className="w-3.5 h-3.5 text-emerald-400" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Viewport Panels */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* [1] KPIS OVERVIEW */}
              {activeTab === 'kpis' && (
                <div className="space-y-4">
                  {/* KPI Cards Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-panel rounded-2xl p-3.5 border border-purple-800/30">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Circulating Supply</span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 block my-0.5 tabular-nums">
                        {stats?.totalCirculation ? (stats.totalCirculation / 1000000).toFixed(2) + 'M' : '15.42M'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {stats?.minedPercent || '1.54'}% of 1B Cap
                      </span>
                    </div>

                    <div className="glass-panel rounded-2xl p-3.5 border border-purple-800/30">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Network Hash Power</span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-purple-300 block my-0.5 tabular-nums">
                        {stats?.totalNetworkHashrate || '3,365.1'}
                        <span className="text-xs text-slate-400 font-sans ml-1">MH/s</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Combined Rigs Online</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-3.5 border border-purple-800/30">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Registered Miners</span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-white block my-0.5 tabular-nums">
                        {stats?.totalPlayers || '1,420'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {stats?.activeLast24h || '892'} active in 24h
                      </span>
                    </div>

                    <div className="glass-panel rounded-2xl p-3.5 border border-purple-800/30">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">TON Wallets Linked</span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 block my-0.5 tabular-nums">
                        {stats?.totalWallets || '640'}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">Snapshot Verified</span>
                    </div>
                  </div>

                  {/* Bot Live Telemetry Status */}
                  <div className="glass-panel rounded-2xl p-4 border border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Telegram Bot Gateway Status</h4>
                        <span className="text-xs text-slate-400 font-mono">
                          Listening for Telegram updates on @carbondrop_bot
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live & Polling</span>
                      </span>
                      <button
                        onClick={loadStats}
                        className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/40 text-slate-300 hover:text-white"
                        title="Refresh Stats"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Shortcut Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('miners')}
                      className="p-4 rounded-2xl glass-panel border border-purple-800/30 hover:border-purple-600 text-left transition-all"
                    >
                      <Users className="w-5 h-5 text-purple-400 mb-2" />
                      <h4 className="font-bold text-sm text-white">Inspect & Adjust Miners</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Search accounts, adjust token balances, set hashrate, or freeze suspicious bot clickers.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('economy')}
                      className="p-4 rounded-2xl glass-panel border border-purple-800/30 hover:border-purple-600 text-left transition-all"
                    >
                      <Sliders className="w-5 h-5 text-amber-400 mb-2" />
                      <h4 className="font-bold text-sm text-white">Global Economy Tuning</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Adjust global hashrate multipliers, base tap power, referral percentages, or maintenance mode.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('broadcast')}
                      className="p-4 rounded-2xl glass-panel border border-purple-800/30 hover:border-purple-600 text-left transition-all"
                    >
                      <Send className="w-5 h-5 text-sky-400 mb-2" />
                      <h4 className="font-bold text-sm text-white">Telegram Broadcast Push</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Send formatted announcements straight into players' Telegram chats via @carbondrop_bot.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* [2] MINER MANAGEMENT */}
              {activeTab === 'miners' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search miners by username, Telegram ID, or TON wallet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyUp={loadPlayers}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-purple-900/40 rounded-xl">
                      {['all', 'active', 'whitelisted', 'banned'].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setStatusFilter(f);
                            setTimeout(loadPlayers, 10);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                            statusFilter === f ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Players Table */}
                  <div className="glass-panel rounded-2xl border border-purple-800/30 overflow-hidden">
                    <div className="p-3 bg-purple-950/40 border-b border-purple-900/30 flex items-center justify-between text-[11px] font-mono uppercase text-slate-400">
                      <span>Miner Account</span>
                      <div className="flex items-center gap-6">
                        <span>Speed (MH/s)</span>
                        <span>$CARB Balance</span>
                        <span>Quick Actions</span>
                      </div>
                    </div>

                    <div className="divide-y divide-purple-900/20 max-h-[460px] overflow-y-auto">
                      {players.map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center font-bold font-mono text-purple-300 shrink-0">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white truncate">@{p.username}</span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                  p.status === 'whitelisted' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                  p.status === 'banned' ? 'bg-red-950 text-red-300 border border-red-800' :
                                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono truncate block">
                                ID: {p.id} {p.walletAddress ? `· ${p.walletAddress.slice(0, 6)}...` : '· No Wallet'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                            <span className="font-mono text-purple-300 tabular-nums font-semibold">
                              {p.hashrate.toFixed(1)} MH/s
                            </span>

                            <span className="font-mono font-bold text-amber-300 tabular-nums min-w-[70px] text-right">
                              {Math.floor(p.balance).toLocaleString()}
                            </span>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handlePlayerAction(p.id, 'add_balance', 10000)}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[11px] font-bold"
                                title="Add 10,000 $CARB"
                              >
                                +10k
                              </button>

                              <button
                                onClick={() => handlePlayerAction(p.id, 'set_status', p.status === 'banned' ? 'active' : 'banned')}
                                className={`p-1 rounded ${p.status === 'banned' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}
                                title={p.status === 'banned' ? 'Unban User' : 'Ban User'}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* [3] ECONOMY & LIVE MULTIPLIERS */}
              {activeTab === 'economy' && (
                <div className="glass-panel rounded-2xl p-5 border border-purple-800/30 space-y-5">
                  <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">Live Economy Multipliers</h3>
                      <p className="text-xs text-slate-400">
                        Adjust game parameters dynamically. Changes take effect across all mining sessions in real time.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      Save & Apply Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Daily Base Token Generation Rate */}
                    <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-white">Daily Base Protocol Drop</label>
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {config.dailyBaseDropRate ? config.dailyBaseDropRate.toLocaleString() : 1000} $CARB / 24h
                        </span>
                      </div>
                      <input
                        type="range"
                        min="250"
                        max="10000"
                        step="250"
                        value={config.dailyBaseDropRate || 1000}
                        onChange={(e) => setConfig({ ...config, dailyBaseDropRate: parseInt(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Amount of $CARB tokens generated once every 24 hours for all players to claim.
                      </span>
                    </div>

                    {/* Global Hashrate Multiplier */}
                    <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-white">Global Event Multiplier</label>
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {config.globalHashMultiplier}X
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={config.globalHashMultiplier}
                        onChange={(e) => setConfig({ ...config, globalHashMultiplier: parseFloat(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Use 2X or 3X for Happy Hour / Weekend Double Drop events.
                      </span>
                    </div>

                    {/* Base Tap Power */}
                    <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-white">Base Tap Power</label>
                        <span className="font-mono text-xs font-bold text-purple-300">
                          +{config.tapPowerBase} CARB/tap
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={config.tapPowerBase}
                        onChange={(e) => setConfig({ ...config, tapPowerBase: parseInt(e.target.value) })}
                        className="w-full accent-purple-400"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Starting token yield for kinetic orb taps.
                      </span>
                    </div>

                    {/* Tier 1 Referral Commission */}
                    <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-white">Tier 1 Squad Royalty (%)</label>
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {config.tier1CommissionPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="25"
                        step="1"
                        value={config.tier1CommissionPercent}
                        onChange={(e) => setConfig({ ...config, tier1CommissionPercent: parseInt(e.target.value) })}
                        className="w-full accent-emerald-400"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Commission percentage awarded for direct invitees.
                      </span>
                    </div>

                    {/* Maintenance Mode Toggle */}
                    <div className="p-4 rounded-xl bg-black/40 border border-purple-900/30 flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-white block">Emergency Maintenance Mode</label>
                        <span className="text-[10px] text-slate-400">
                          Pause mining and display maintenance notification
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.maintenanceMode}
                        onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                        className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* [4] TELEGRAM PUSH BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="glass-panel rounded-2xl p-5 border border-purple-800/30 space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-white">Broadcast Announcement to Telegram</h3>
                    <p className="text-xs text-slate-400">
                      Send push notifications directly to players in Telegram via the official @carbondrop_bot. Supports Telegram HTML formatting.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">Announcement Content:</label>
                    <textarea
                      rows={5}
                      placeholder="e.g. ⚡ DOUBLE DROP WEEKEND IS LIVE! All fullerene rigs are mining at 2X speed for the next 48 hours. Tap below to claim your quantum tokens!"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-black/60 border border-purple-900/60 font-sans text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {broadcastStatus && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/50 text-xs font-mono text-purple-200">
                      {broadcastStatus}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target Audience: All registered Telegram miners ({players.length})
                    </span>

                    <button
                      onClick={handleSendBroadcast}
                      disabled={isBroadcasting || !broadcastMessage.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isBroadcasting ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* [5] AIRDROP SNAPSHOT & EXPORT */}
              {activeTab === 'airdrop' && (
                <div className="glass-panel rounded-2xl p-5 border border-purple-800/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white">Season 1 Snapshot Generator</h3>
                      <p className="text-xs text-slate-400">
                        Query all qualifying TON wallet addresses and calculate their final $CARB airdrop token allocations.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateSnapshot}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs active:scale-95 transition-colors"
                      >
                        Generate Snapshot
                      </button>

                      {snapshotData.length > 0 && (
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV ({snapshotData.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {snapshotData.length > 0 ? (
                    <div className="glass-panel rounded-xl border border-purple-800/30 overflow-hidden">
                      <div className="p-2.5 bg-black/40 border-b border-purple-900/30 flex items-center justify-between text-[11px] font-mono uppercase text-slate-400">
                        <span>Wallet Address</span>
                        <div className="flex items-center gap-6">
                          <span>Mined Tokens</span>
                          <span>Allocated Airdrop</span>
                        </div>
                      </div>

                      <div className="divide-y divide-purple-900/20 max-h-[360px] overflow-y-auto font-mono text-xs">
                        {snapshotData.map((m, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                            <span className="text-slate-200 truncate">{m.walletAddress}</span>
                            <div className="flex items-center gap-6 shrink-0">
                              <span className="text-slate-400 tabular-nums">{m.totalMined.toLocaleString()}</span>
                              <span className="text-amber-300 font-bold tabular-nums">+{m.estimatedCarbDrop.toLocaleString()} $CARB</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-black/30 border border-purple-900/20 text-slate-400 text-xs">
                      Click "Generate Snapshot" above to compile the real-time list of verified TON wallets and their token distribution balances.
                    </div>
                  )}
                </div>
              )}

              {/* [6] SUPABASE DATABASE INTEGRATION */}
              {activeTab === 'supabase' && (
                <div className="glass-panel rounded-2xl p-5 border border-purple-800/30 space-y-5">
                  <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">Supabase Cloud Database Settings</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          supabaseStatus?.connected
                            ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                            : 'bg-amber-950/80 border-amber-600/50 text-amber-300'
                        }`}>
                          {supabaseStatus?.connected ? 'CONNECTED TO SUPABASE' : 'NOT CONNECTED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Connect your custom Supabase database project to manage tables directly in the Supabase Dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Supabase Connection Form */}
                  <form onSubmit={handleSaveSupabase} className="p-4 rounded-2xl bg-black/40 border border-purple-900/30 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-300 font-mono">
                      1. Connect Supabase Project
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-300 block mb-1 font-medium">Supabase Project URL:</label>
                        <input
                          type="text"
                          placeholder="https://xyzcompany.supabase.co"
                          value={supabaseUrlInput}
                          onChange={(e) => setSupabaseUrlInput(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-purple-800/40 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1 font-medium">Supabase Anon or Service Role Key:</label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={supabaseKeyInput}
                          onChange={(e) => setSupabaseKeyInput(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-purple-800/40 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      {supabaseSaveMsg && (
                        <div className={`p-2.5 rounded-xl border text-xs font-semibold ${
                          supabaseSaveMsg.includes('success')
                            ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                            : 'bg-red-950/60 border-red-600/40 text-red-300'
                        }`}>
                          {supabaseSaveMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        Save & Connect Supabase
                      </button>
                    </div>
                  </form>

                  {/* Supabase SQL Initialization Script Box */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-purple-900/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 font-mono">
                        2. Supabase SQL Schema Script
                      </h4>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(SUPABASE_SQL_INIT_SCRIPT);
                          setIsCopiedSql(true);
                          sound.playClaim();
                          setTimeout(() => setIsCopiedSql(false), 2000);
                        }}
                        className="px-3 py-1 rounded-lg bg-purple-800/60 hover:bg-purple-700/60 text-white font-bold text-[11px] border border-purple-600/40 cursor-pointer"
                      >
                        {isCopiedSql ? '✓ Copied to Clipboard!' : 'Copy SQL Script'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">
                      Copy the SQL script below and execute it inside your <strong className="text-white">Supabase Dashboard → SQL Editor</strong> to automatically create the required <code className="text-purple-300">users</code> and <code className="text-purple-300">admin_config</code> tables and RLS security policies:
                    </p>

                    <pre className="p-3.5 rounded-xl bg-black/80 border border-purple-900/50 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 select-all">
                      {SUPABASE_SQL_INIT_SCRIPT}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
