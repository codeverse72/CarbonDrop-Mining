/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wallet, ShieldCheck, Check, Copy, ExternalLink, ArrowUpRight, ArrowDownLeft,
  Sparkles, Zap, Coins, QrCode, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { sound } from '../utils/sound';

interface WalletTabProps {
  stats: UserStats;
  onConnect: (address: string, name: string) => void;
  onDisconnect: () => void;
}

const SUPPORTED_CURRENCIES = [
  { id: 'carb_ton', name: 'CARB / TON', network: 'TON', min: '$1.00', icon: '💎', color: 'bg-sky-500' },
  { id: 'usdt_bep20', name: 'USDT (BEP20)', network: 'BNB', min: '$1.00', icon: '₮', color: 'bg-emerald-500' },
  { id: 'usdt_trc20', name: 'USDT (TRC20)', network: 'Tron', min: '$1.00', icon: '₮', color: 'bg-teal-500' },
  { id: 'bnb', name: 'BNB', network: 'BNB', min: '$1.00', icon: '❖', color: 'bg-amber-500' },
  { id: 'trx', name: 'TRX', network: 'Tron', min: '$1.00', icon: '▼', color: 'bg-red-500' },
  { id: 'sol', name: 'SOL (Solana)', network: 'Solana', min: '$1.00', icon: '≡', color: 'bg-purple-500' },
  { id: 'base', name: 'Base (USDC / ETH)', network: 'Base', min: '$1.00', icon: '⬡', color: 'bg-blue-600' },
];

export const WalletTab: React.FC<WalletTabProps> = ({
  stats,
  onConnect,
}) => {
  const [activeMode, setActiveMode] = useState<'deposit' | 'payout'>('deposit');
  const [selectedCurrency, setSelectedCurrency] = useState('carb_ton');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [txidInput, setTxidInput] = useState('');
  const [payoutAddress, setPayoutAddress] = useState(stats.walletAddress || '');
  const [payoutAmount, setPayoutAmount] = useState<string>('10000');

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [paymentSentStatus, setPaymentSentStatus] = useState<string | null>(null);
  const [payoutSentStatus, setPayoutSentStatus] = useState<string | null>(null);

  // 10,000 $CARB = $1.00 USD
  const usdBalance = (stats.carbBalance / 10000).toFixed(4);

  const depositAddress = 'UQA64uUd8dZ1J1ywXethY1IOPj8WEMPAE15N5zq73IamtcW6';
  const memoId = stats.telegramId || '8441612863';

  const handleCopyAddr = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopiedAddr(true);
    sound.triggerHaptic('light');
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(memoId);
    setCopiedMemo(true);
    sound.triggerHaptic('light');
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleSendPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClaim();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#0098ea'],
    });
    setPaymentSentStatus(`Payment request for $${selectedAmount}.00 USD registered! On-chain detector listening for deposit tx.`);
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClaim();
    confetti({
      particleCount: 40,
      spread: 60,
      colors: ['#3b82f6', '#10b981'],
    });
    setPayoutSentStatus(`Instant Payout request submitted to ${payoutAddress.slice(0, 8)}... Pending blockchain release!`);
  };

  const currObj = SUPPORTED_CURRENCIES.find((c) => c.id === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-4 space-y-4 font-sans animate-in fade-in duration-200 text-slate-100">
      
      {/* Top Header Title */}
      <div className="text-center font-black text-xl sm:text-2xl text-white tracking-wide">
        {activeMode === 'deposit' ? 'Deposit' : 'Payout'}
      </div>

      {/* Top Reinvest Power Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/70 to-fuchsia-900/80 border border-purple-500/50 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-200">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1">
              Reinvest: +5% extra power <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            </h4>
            <span className="text-[11px] text-purple-300 font-mono">0% Commission</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-300 uppercase font-mono block">Balance</span>
          <span className="font-mono text-base sm:text-lg font-black text-white tabular-nums">
            ${usdBalance} <span className="text-[10px] text-slate-400 font-sans">USD</span>
          </span>
        </div>
      </div>

      {/* Mode Selector Toggle Switch */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/60 border border-purple-900/50 font-mono text-xs font-bold">
        <button
          onClick={() => {
            sound.triggerHaptic('light');
            setActiveMode('payout');
          }}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'payout'
              ? 'bg-purple-900/80 text-cyan-300 border border-purple-500/50 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          <span>Payout</span>
        </button>

        <button
          onClick={() => {
            sound.triggerHaptic('light');
            setActiveMode('deposit');
          }}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'deposit'
              ? 'bg-purple-900/80 text-amber-300 border border-purple-500/50 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-amber-400" />
          <span>Deposit</span>
        </button>
      </div>

      {/* MODE = DEPOSIT */}
      {activeMode === 'deposit' && (
        <div className="space-y-4">

          {/* Flash Deal Banner Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-950/60 via-purple-950/70 to-black/80 border border-amber-500/60 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] font-mono tracking-wider">
                ⚡ LIMITED FLASH DEAL
              </span>
              <span className="text-[11px] font-bold text-amber-300 font-mono flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> Instant 20% Cashback
              </span>
            </div>

            <div className="space-y-1 mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                🎁 Deposit <span className="text-amber-300">$10.00</span> ➔ Get <span className="text-emerald-400">+$2.00 USDT</span> Instant!
              </h3>
              <p className="text-xs text-slate-300">
                Earn <span className="text-cyan-300 font-semibold">+$1.00 USDT Daily</span> automated passive mining income!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-emerald-300">
                <span className="block text-slate-400 font-sans text-[9px] font-normal">Instant Bonus</span>
                +$2.00 USDT
              </div>
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-cyan-300">
                <span className="block text-slate-400 font-sans text-[9px] font-normal">Daily Income</span>
                +$1.00 USDT/d
              </div>
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-amber-300">
                <span className="block text-slate-400 font-sans text-[9px] font-normal">Withdrawals</span>
                Instant / No Fee
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer">
                Tap to apply $10 offer & view deposit address <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Live Payout Proofs Link */}
          <div
            onClick={() => window.open('https://t.me/carbondrop_bot', '_blank')}
            className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-600/40 hover:border-emerald-500 flex items-center justify-between text-xs font-semibold cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 text-emerald-300">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                💸
              </div>
              <div>
                <span className="font-bold block text-white">Live Payout Proofs</span>
                <span className="text-[11px] text-emerald-400/90 font-mono">View verified receipts on @CarbonDropPayouts</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Main Deposit Box Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-black/70 border border-purple-800/50 space-y-4">
            
            {/* Currency Title */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${currObj.color} flex items-center justify-center text-white font-bold text-sm shadow`}>
                  {currObj.icon}
                </div>
                <div>
                  <h3 className="font-black text-base text-white">{currObj.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Network: {currObj.network}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-mono uppercase block font-bold">DEPOSIT</span>
                <span className="text-xs text-slate-400 font-mono">Min: {currObj.min}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-center space-y-3">
              <div className="w-40 h-40 mx-auto rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=UQA64uUd8dZ1J1ywXethY1IOPj8WEMPAE15N5zq73IamtcW6"
                  alt="Deposit QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <span className="text-xs text-slate-300 block font-medium">
                Scan with ANY crypto wallet or copy address below
              </span>

              <div className="p-2 rounded-xl bg-black/60 border border-purple-900/50 text-[11px] font-mono text-cyan-300">
                ✓ Binance • Telegram Wallet • MetaMask • Phantom • OKX • Any App
              </div>
            </div>

            {/* Official Deposit Address Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-slate-400 uppercase">OFFICIAL {currObj.name} DEPOSIT ADDRESS</span>
                <span className="text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  ALL WALLETS SUPPORTED
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/80 border border-purple-900/60">
                <span className="font-mono text-xs text-purple-200 truncate flex-1 select-all">
                  {depositAddress}
                </span>
                <button
                  onClick={handleCopyAddr}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/60 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>{copiedAddr ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Memo / Transfer Comment Box */}
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-slate-300 uppercase flex items-center gap-1">
                  📄 TRANSFER COMMENT / MEMO (OPTIONAL)
                </span>
                <span className="text-amber-300 uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  FASTEST AUTO-CREDIT
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-black text-amber-300 tracking-wider">
                  {memoId}
                </span>
                <button
                  onClick={handleCopyMemo}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0 border border-amber-500/30"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedMemo ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-sans">
                Tip: Paste your Telegram ID in the transfer comment/memo for guaranteed instant credit!
              </p>
            </div>

            {/* Open in Telegram / Any TON Wallet Button */}
            <button
              onClick={() => {
                sound.playClaim();
                window.open(`https://t.me/wallet?start=attach_ton_${depositAddress}`, '_blank');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4 text-amber-300" />
              <span>OPEN IN TELEGRAM WALLET / ANY TON WALLET</span>
            </button>

            {/* Select Deposit Amount Preset Selector */}
            <div className="space-y-2 pt-2 border-t border-purple-900/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Select Deposit Amount (USD):</span>
                <span className="text-emerald-400 font-mono font-bold">Min: $1.00</span>
              </div>

              <div className="grid grid-cols-5 gap-2 font-mono text-xs font-bold">
                {[
                  { amt: 1, label: '$1' },
                  { amt: 3, label: '$3' },
                  { amt: 5, label: '$5' },
                  { amt: 10, label: '$10', badge: '+25 GIFT' },
                  { amt: 50, label: '$50', badge: 'VIP' },
                ].map((item) => (
                  <button
                    key={item.amt}
                    type="button"
                    onClick={() => setSelectedAmount(item.amt)}
                    className={`py-2.5 rounded-xl border relative flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedAmount === item.amt
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black border-emerald-300 shadow-lg scale-105'
                        : 'bg-black/50 border-purple-900/50 text-slate-300 hover:border-purple-700'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-2 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px] uppercase">
                        {item.badge}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Best Value Offer Box */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-amber-300 flex items-center gap-1">
                  🔑 BEST VALUE (+20% CASHBACK)
                </span>
                <span className="text-emerald-400">● Auto-Credited</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono font-bold">
                <div className="p-2 rounded-xl bg-black/60 border border-amber-900/40 text-amber-300">
                  <span className="text-[9px] text-slate-400 font-sans block font-normal">INSTANT BONUS</span>
                  +${(selectedAmount * 0.2).toFixed(2)} USDT
                </div>
                <div className="p-2 rounded-xl bg-black/60 border border-amber-900/40 text-cyan-300">
                  <span className="text-[9px] text-slate-400 font-sans block font-normal">DAILY PASSIVE YIELD</span>
                  +${(selectedAmount * 0.1).toFixed(2)} USDT / day
                </div>
              </div>

              <div className="text-center font-mono text-xs font-bold text-amber-300 pt-1">
                Estimated 30-Day Return: +${(selectedAmount * 3.2).toFixed(2)} USDT (~320% ROI)
              </div>
            </div>

            {/* On-Chain Auto-Detect Badge */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 flex items-start gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 mt-1" />
              <div>
                <strong className="text-emerald-300 block font-bold mb-0.5">Auto-Detect Listening On-Chain</strong>
                <span className="text-slate-300 leading-relaxed text-[11px] block">
                  Send from ANY wallet or exchange. Hashrate updates 100% automatically — zero hash, zero memo, zero technical steps!
                </span>
              </div>
            </div>

            {/* Transaction Hash / TXID Form */}
            <form onSubmit={handleSendPaymentSubmit} className="space-y-3 pt-2 border-t border-purple-900/40">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-slate-300 uppercase">TRANSACTION HASH / TXID (OPTIONAL)</span>
                  <span className="text-purple-300">Self-Serve Instant Verification</span>
                </div>
                <input
                  type="text"
                  placeholder="Paste TXID / Transaction hash here (optional)"
                  value={txidInput}
                  onChange={(e) => setTxidInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/80 border border-purple-900/60 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {paymentSentStatus && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{paymentSentStatus}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>⚡ I HAVE SENT PAYMENT (${selectedAmount}.00)</span>
              </button>
            </form>

          </div>

          {/* Crypto Currency Selection List */}
          <div className="p-4 rounded-3xl bg-black/70 border border-purple-800/50 space-y-2">
            <h4 className="font-bold text-xs uppercase text-slate-400 font-mono tracking-wider mb-2">
              Select Alternate Crypto Deposit Currency:
            </h4>

            <div className="divide-y divide-purple-900/30">
              {SUPPORTED_CURRENCIES.map((c) => {
                const isSelected = selectedCurrency === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      sound.triggerHaptic('light');
                      setSelectedCurrency(c.id);
                    }}
                    className={`w-full py-3 px-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-950/40 text-amber-300' : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center text-white font-bold text-xs`}>
                        {c.icon}
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Network: {c.network}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-400 block">DEPOSIT</span>
                      <span className="text-[10px] text-slate-400 font-mono">Min: {c.min}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODE = PAYOUT */}
      {activeMode === 'payout' && (
        <div className="p-5 rounded-3xl bg-black/70 border border-purple-800/50 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">Instant Payout Request</h3>
              <p className="text-xs text-slate-400">Withdraw mined $CARB directly to your non-custodial TON wallet.</p>
            </div>

            <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 font-mono text-xs font-bold">
              0% Fee
            </span>
          </div>

          <form onSubmit={handlePayoutSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Destination TON Wallet Address:</label>
              <input
                type="text"
                placeholder="EQ..."
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/80 border border-purple-900/60 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Amount to Withdraw ($CARB):</label>
                <span className="text-amber-300 font-mono font-bold">
                  Available: {Math.floor(stats.carbBalance).toLocaleString()} $CARB
                </span>
              </div>
              <input
                type="number"
                min="1000"
                max={Math.floor(stats.carbBalance)}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/80 border border-purple-900/60 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                required
              />
              <span className="text-[10px] text-slate-400 font-mono block">
                Rate: 10,000 $CARB = $1.00 USD (Est. Payout Value: ${(Number(payoutAmount) / 10000).toFixed(2)} USD)
              </span>
            </div>

            {payoutSentStatus && (
              <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-600/50 text-cyan-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{payoutSentStatus}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!payoutAddress.trim() || Number(payoutAmount) <= 0 || Number(payoutAmount) > stats.carbBalance}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-300" />
              <span>SUBMIT INSTANT PAYOUT REQUEST</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
