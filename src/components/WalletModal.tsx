/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, Check, ExternalLink, AlertCircle, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string | null;
  walletName: string | null;
  onConnect: (address: string, name: string) => void;
  onDisconnect: () => void;
}

const WALLET_OPTIONS = [
  {
    id: 'tonkeeper',
    name: 'Tonkeeper',
    desc: 'Most popular mobile TON wallet',
    badge: 'Recommended',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'telegram_wallet',
    name: 'Telegram Wallet (@wallet)',
    desc: 'Built straight into Telegram app',
    badge: 'Native TG',
    iconBg: 'bg-sky-500',
  },
  {
    id: 'mytonwallet',
    name: 'MyTonWallet',
    desc: 'Web & browser extension',
    badge: 'Fast',
    iconBg: 'bg-indigo-600',
  },
  {
    id: 'openmask',
    name: 'OpenMask',
    desc: 'Biometric biometric security',
    badge: 'Advanced',
    iconBg: 'bg-purple-600',
  },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  walletName,
  onConnect,
  onDisconnect,
}) => {
  const [customAddress, setCustomAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectWallet = (wallet: typeof WALLET_OPTIONS[0]) => {
    setConnectingWallet(wallet.id);

    // Simulate instant TON Connect handshake
    setTimeout(() => {
      // Realistic random TON mainnet address format
      const mockAddr = 'EQ' + Array.from({ length: 46 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('');
      sound.playClaim();
      confetti({
        particleCount: 30,
        spread: 60,
        colors: ['#0098ea', '#a855f7'],
      });
      onConnect(mockAddr, wallet.name);
      setConnectingWallet(null);
    }, 700);
  };

  const handleCustomConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim() || customAddress.length < 10) return;
    sound.playClaim();
    onConnect(customAddress.trim(), 'Custom TON Wallet');
  };

  const handleCopy = () => {
    if (currentAddress) {
      navigator.clipboard.writeText(currentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-purple-700/50 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Connect TON Wallet</h3>
            <span className="text-xs text-slate-400">Non-custodial airdrop deposit address</span>
          </div>
        </div>

        {/* If already connected */}
        {currentAddress ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Wallet Connected via {walletName || 'TON'}</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300 uppercase px-1.5 py-0.5 rounded bg-emerald-900/60">
                  Mainnet
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 p-2 rounded-xl bg-black/50 border border-emerald-900/40">
                <span className="font-mono text-xs text-white truncate select-all">
                  {currentAddress}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                  title="Copy address"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your wallet is verified for the $CARB airdrop distribution snapshot. All community tokens will be minted straight to this address.
            </p>

            <button
              onClick={() => {
                onDisconnect();
              }}
              className="w-full py-2.5 rounded-xl border border-red-900/50 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-bold transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed mb-1">
              Select your preferred TON wallet provider to connect your non-custodial address for token snapshots.
            </p>

            <div className="space-y-2">
              {WALLET_OPTIONS.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleSelectWallet(wallet)}
                  disabled={connectingWallet !== null}
                  className="w-full p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 flex items-center justify-between text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${wallet.iconBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      💎
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-white block">
                        {wallet.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {wallet.desc}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/40">
                    {connectingWallet === wallet.id ? 'Connecting...' : wallet.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom address input toggle */}
            <form onSubmit={handleCustomConnect} className="pt-2 border-t border-purple-900/30">
              <label className="text-[11px] text-slate-400 block mb-1">Or paste TON address manually:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="EQ..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-purple-900/50 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!customAddress.trim()}
                  className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                >
                  Link
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center gap-2 text-[11px] text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>CarbonDrop never asks for private keys or seed phrases.</span>
        </div>
      </div>
    </div>
  );
};
