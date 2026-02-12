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

    return (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center animate-fade-in-up">
            {/* Backdrop */}
            <div onClick={onClose} className="absolute inset-0 bg-black/95 sm:bg-black/80 backdrop-blur-md" />

            {/* Modal Container */}
            <div className="relative z-10 w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col bg-black/20 sm:glass-panel sm:shadow-[0_0_60px_rgba(59,130,246,0.2)] sm:border sm:border-white/10 safe-area-inset">

                {/* Header */}
                <div className="bg-gradient-to-b from-slate-900/80 to-black/40 p-4 sm:p-5 flex items-center justify-between border-b border-white/5 shrink-0">
                    <h2 className="font-orbitron font-black text-xl italic text-white tracking-widest text-glow flex items-center gap-3">
                        <span className="text-yellow-400 text-2xl">⚡</span> LABORATORY
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all sm:hidden"
                    >
                        ✕
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/50 hover:text-white transition-all hidden sm:flex"
                    >
                        ✕
                    </button>
                </div>

                {/* Wallet Bar - Sticky beneath header */}
                <div className="bg-black/40 p-3 sm:p-4 border-b border-white/5 shrink-0 backdrop-blur-sm">
                    <div className="glass-panel bg-white/5 rounded-xl p-2 sm:p-3 flex justify-center gap-8 border border-white/5 shadow-inner">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🪙</span>
                            <span className="font-orbitron font-bold text-yellow-400 text-lg drop-shadow-md">
                                {wallet.coins.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💎</span>
                            <span className="font-orbitron font-bold text-red-500 text-lg drop-shadow-md">
                                {wallet.diamonds.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-transparent sm:bg-black/20 pb-20 sm:pb-5">
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
                            <div key={type} className={`relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${isMax
                                ? 'bg-yellow-900/10 border-yellow-500/30'
                                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                }`}>
                                {/* Header Row */}
                                <div className="flex items-start gap-4 mb-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg border border-white/10 bg-gradient-to-br from-white/10 to-transparent ${isMax ? 'shadow-yellow-500/20' : ''
                                        }`}>
                                        {config.emoji}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-orbitron font-bold text-lg text-white mb-1" style={{ color: config.color }}>
                                                {config.name}
                                            </h3>
                                            {isMax && <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-orbitron px-2 py-1 rounded border border-yellow-500/30">MAXED</span>}
                                        </div>
                                        <p className="font-rajdhani text-sm text-white/50 leading-tight mb-2">
                                            {config.description}
                                        </p>

                                        {/* Level Dots */}
                                        <div className="flex gap-1.5 mt-2">
                                            {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, i) => (
                                                <div key={i}
                                                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < level
                                                        ? 'shadow-[0_0_8px_currentColor]'
                                                        : 'bg-white/10'
                                                        }`}
                                                    style={{
                                                        backgroundColor: i < level ? config.color : undefined,
                                                        color: config.color
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex justify-between items-center mb-4 px-1 relative z-10">
                                    <span className="font-rajdhani font-bold text-xs text-white/40 uppercase tracking-wider">Effect Duration</span>
                                    <div className="font-orbitron text-sm">
                                        <span className="text-white">{currentDuration}s</span>
                                        {!isMax && (
                                            <>
                                                <span className="text-white/30 mx-2">➞</span>
                                                <span className="text-green-400 font-bold">{nextDuration}s</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions - Bigger Buttons for Mobile */}
                                {!isMax && (
                                    <div className="grid grid-cols-2 gap-3 relative z-10">
                                        <NeonButton
                                            variant="gold"
                                            size="sm"
                                            onClick={() => onUpgrade(type, 'coins')}
                                            disabled={!canAffordCoins}
                                            className={`py-3 ${!canAffordCoins ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm">
                                                <span className="text-lg">🪙</span> {coinCost.toLocaleString()}
                                            </span>
                                        </NeonButton>

                                        <NeonButton
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onUpgrade(type, 'diamonds')}
                                            disabled={!canAffordDiamonds}
                                            className={`py-3 ${!canAffordDiamonds ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm">
                                                <span className="text-lg">💎</span> {diamondCost.toLocaleString()}
                                            </span>
                                        </NeonButton>
                                    </div>
                                )}

                                {/* Background Glow Effect */}
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2`} style={{ background: config.color }}></div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer - Close Button for Mobile Accessibility */}
                <div className="p-4 border-t border-white/5 bg-black/80 backdrop-blur-xl shrink-0 safe-area-inset sm:hidden">
                    <NeonButton variant="primary" fullWidth onClick={onClose} className="py-4 text-lg tracking-widest">
                        EXIT LAB
                    </NeonButton>
                </div>
            </div>
        </div>
    );
};

export default UpgradesModal;
