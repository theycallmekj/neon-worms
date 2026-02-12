import React from 'react';
import { PlayerWallet, UpgradeLevels, PowerUpType } from '../types';
import { POWER_UP_CONFIG, UPGRADE_COSTS, MAX_UPGRADE_LEVEL, UPGRADE_DURATION_MULTIPLIER } from '../constants';
import NeonButton from './NeonButton';

interface UpgradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallet: PlayerWallet;
    upgradeLevels: UpgradeLevels;
    onUpgrade: (type: PowerUpType, currency: 'coins' | 'diamonds') => void;
}

const UpgradesModal: React.FC<UpgradesModalProps> = ({ isOpen, onClose, wallet, upgradeLevels, onUpgrade }) => {
    if (!isOpen) return null;

    const types: PowerUpType[] = ['magnet', 'speed', 'freeze', 'shield'];

    const getPowerUpIcon = (type: string) => {
        switch (type) {
            case 'magnet':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 15v-4a6 6 0 1 1 12 0v4" />
                        <path d="M6 19a2 2 0 0 1 2 2h0a2 2 0 0 1-2-2v-4h4v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2Z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M14 19a2 2 0 0 1 2 2h0a2 2 0 0 1-2-2v-4h4v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2Z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M10 9a2 2 0 0 1 2 2" />
                        <path d="M9 8a3 3 0 0 1 3 3" />
                        <path d="M8 7a4 4 0 0 1 4 4" />
                    </svg>
                );
            case 'speed':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M2 10h.01" />
                        <path d="M4 6h.01" />
                        <path d="M22 18h.01" />
                    </svg>
                );
            case 'freeze':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse-slow" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="12" y1="2" x2="12" y2="22" transform="rotate(60 12 12)" />
                        <line x1="12" y1="2" x2="12" y2="22" transform="rotate(120 12 12)" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
                    </svg>
                );
            case 'shield':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center animate-fade-in-up">
            {/* Backdrop */}
            <div onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md sm:bg-black/80 transition-opacity duration-300" />

            {/* Modal Container */}
            <div className="relative z-10 w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0f] sm:border sm:border-white/10 sm:shadow-[0_0_80px_rgba(0,0,0,0.8)] safe-area-inset">

                {/* Header - Compact Glassmorphism */}
                <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900/90 p-4 flex items-center justify-between border-b border-white/10 shrink-0 shadow-lg z-30 sticky top-0">
                    <div className="absolute inset-0 bg-[url('/assets/ui/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

                    {/* Left: Close Button + Title */}
                    <div className="flex items-center gap-4 relative z-10 flex-1">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95 border border-transparent hover:border-white/10"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <h2 className="font-orbitron font-bold text-lg text-white tracking-widest text-glow drop-shadow-lg flex items-center gap-2">
                            LABORATORY
                        </h2>
                    </div>

                    {/* Right: Wallet/Currency */}
                    <div className="flex items-center gap-4 relative z-10 bg-black/40 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
                        <div className="flex items-center gap-2">
                            <img src="/assets/ui/coin.svg" alt="Coin" className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                            <span className="font-orbitron font-bold text-yellow-400 text-base drop-shadow-sm tracking-wide">
                                {wallet.coins.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <img src="/assets/ui/diamond_3d.svg" alt="Diamond" className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                            <span className="font-orbitron font-bold text-red-500 text-base drop-shadow-sm tracking-wide">
                                {wallet.diamonds.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-[#0a0a0f] pb-28 sm:pb-6 relative">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        {types.map(type => {
                            const config = POWER_UP_CONFIG[type];
                            const level = upgradeLevels[type];
                            const isMax = level >= MAX_UPGRADE_LEVEL;
                            const coinCost = isMax ? 0 : UPGRADE_COSTS.coins[level];
                            const diamondCost = isMax ? 0 : UPGRADE_COSTS.diamonds[level];
                            const canAffordCoins = wallet.coins >= coinCost;
                            const canAffordDiamonds = wallet.diamonds >= diamondCost;

                            const baseDuration = config.duration;
                            const currentDuration = (baseDuration * UPGRADE_DURATION_MULTIPLIER(level)).toFixed(1);
                            const nextDuration = isMax ? currentDuration : (baseDuration * UPGRADE_DURATION_MULTIPLIER(level + 1)).toFixed(1);

                            return (
                                <div key={type} className={`relative p-0 rounded-2xl border transition-all duration-300 group overflow-hidden flex flex-col ${isMax
                                    ? 'bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                    : 'bg-gradient-to-br from-white/5 to-black border-white/10 hover:border-white/20 hover:bg-white/10 shadow-lg'
                                    }`}>

                                    {/* Card Content Area */}
                                    <div className="p-4 sm:p-5 flex-1 flex flex-col relative z-20">

                                        {/* Header: Icon + Title */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 bg-gradient-to-br from-white/10 to-transparent relative overflow-hidden group-hover:scale-105 transition-transform duration-500 ${isMax ? 'shadow-yellow-500/20 border-yellow-500/30' : ''
                                                }`}>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none"></div>
                                                <div className="relative z-10 transform scale-110">
                                                    {getPowerUpIcon(type)}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-orbitron font-bold text-lg text-white mb-0.5 truncate pr-2" style={{ color: config.color, textShadow: `0 0 10px ${config.color}40` }}>
                                                        {config.name}
                                                    </h3>
                                                    {isMax && (
                                                        <span className="bg-yellow-500/10 text-yellow-300 text-[10px] font-orbitron font-bold px-2 py-0.5 rounded border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)] whitespace-nowrap">
                                                            MAX LVL
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-rajdhani text-sm text-white/50 leading-tight line-clamp-2 min-h-[2.5em]">
                                                    {config.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar - Segmented */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-rajdhani font-bold text-white/30 uppercase tracking-wider mb-1.5">
                                                <span>Upgrade Level</span>
                                                <span style={{ color: isMax ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>{level} / {MAX_UPGRADE_LEVEL}</span>
                                            </div>
                                            <div className="flex gap-1 h-2 bg-black/40 rounded-full p-0.5 border border-white/5">
                                                {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, i) => (
                                                    <div key={i}
                                                        className={`h-full flex-1 rounded-sm transition-all duration-500 ${i < level
                                                            ? 'shadow-[0_0_5px_currentColor] scale-100'
                                                            : 'bg-white/5 scale-90 opacity-30'
                                                            }`}
                                                        style={{
                                                            backgroundColor: i < level ? config.color : undefined,
                                                            color: config.color
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats Display */}
                                        <div className="mt-auto bg-black/30 rounded-lg p-2.5 border border-white/5 flex justify-between items-center group-hover:border-white/10 transition-colors">
                                            <span className="font-rajdhani font-bold text-xs text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                Duration
                                            </span>
                                            <div className="font-orbitron text-sm flex items-center gap-2">
                                                <span className="text-white font-bold tracking-wide">{currentDuration}s</span>
                                                {!isMax && (
                                                    <>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                                        <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{nextDuration}s</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area - Separate from Content */}
                                    {!isMax && (
                                        <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-2 gap-3 relative z-20 backdrop-blur-sm">
                                            <button
                                                onClick={() => onUpgrade(type, 'coins')}
                                                disabled={!canAffordCoins}
                                                className={`group/btn relative py-3 px-2 rounded-xl border transition-all duration-200 active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 overflow-hidden ${canAffordCoins
                                                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50'
                                                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1.5 relative z-10">
                                                    <img src="/assets/ui/coin.svg" alt="C" className="w-5 h-5 object-contain" />
                                                    <span className={`font-orbitron font-bold text-sm ${canAffordCoins ? 'text-yellow-100' : 'text-white/40'}`}>
                                                        {coinCost.toLocaleString()}
                                                    </span>
                                                </div>
                                                {canAffordCoins && <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none"></div>}
                                            </button>

                                            <button
                                                onClick={() => onUpgrade(type, 'diamonds')}
                                                disabled={!canAffordDiamonds}
                                                className={`group/btn relative py-3 px-2 rounded-xl border transition-all duration-200 active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 overflow-hidden ${canAffordDiamonds
                                                    ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50'
                                                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1.5 relative z-10">
                                                    <img src="/assets/ui/diamond_3d.svg" alt="D" className="w-5 h-5 object-contain" />
                                                    <span className={`font-orbitron font-bold text-sm ${canAffordDiamonds ? 'text-red-100' : 'text-white/40'}`}>
                                                        {diamondCost.toLocaleString()}
                                                    </span>
                                                </div>
                                                {canAffordDiamonds && <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none"></div>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Background decorative glow */}
                                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-[0.08] pointer-events-none -translate-y-1/2 translate-x-1/2" style={{ background: config.color }}></div>
                                    {isMax && <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-2xl pointer-events-none shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer - Close Button for Mobile Accessibility */}
                <div className="p-4 border-t border-white/5 bg-black/90 backdrop-blur-xl shrink-0 safe-area-inset sm:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40">
                    <NeonButton variant="primary" fullWidth onClick={onClose} className="py-4 text-lg tracking-widest font-black shadow-lg">
                        EXIT LAB
                    </NeonButton>
                </div>
            </div>
        </div>
    );
};

export default UpgradesModal;

