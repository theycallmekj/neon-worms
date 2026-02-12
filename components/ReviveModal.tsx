import React, { useState, useEffect } from 'react';
import { PlayerWallet } from '../types';

interface ReviveModalProps {
    countdownSeconds: number;
    diamondCost: number;
    wallet: PlayerWallet;
    onReviveWithDiamonds: () => void;
    onReviveWithAd: () => void;
    onSkip: () => void;
}

const ReviveModal: React.FC<ReviveModalProps> = ({
    countdownSeconds,
    diamondCost,
    wallet,
    onReviveWithDiamonds,
    onReviveWithAd,
    onSkip
}) => {
    const [timeLeft, setTimeLeft] = useState(countdownSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    onSkip(); // Auto-skip if timer hits zero
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, onSkip]);

    // Calculate progress for the circle (0 to 1)
    const progress = timeLeft / countdownSeconds;
    const strokeDashoffset = 251.2 * (1 - progress); // 251.2 is approx 2 * PI * 40 (radius)

    const canAfford = wallet.diamonds >= diamondCost;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
            <div className="relative w-full max-w-sm flex flex-col items-center">

                <h2 className="font-orbitron font-black text-3xl text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    Resurrect Now?
                </h2>

                {/* Countdown Circle */}
                <div className="relative w-40 h-40 mb-6 group">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Background Circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r="74"
                            stroke="rgba(30, 58, 138, 0.4)"
                            strokeWidth="8"
                            fill="rgba(0,0,0,0.5)"
                        />
                        {/* Progress Circle (Yellow) */}
                        <circle
                            cx="80"
                            cy="80"
                            r="74"
                            stroke="#facc15"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray="465"
                            style={{
                                strokeDashoffset: 465 * (1 - progress),
                                transition: 'stroke-dashoffset 1s linear'
                            }}
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Inner Rings for aesthetic */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-blue-600/30 flex items-center justify-center">
                            <span className="font-orbitron font-black text-6xl text-white drop-shadow-lg">{timeLeft}</span>
                        </div>
                    </div>
                </div>

                <p className="font-rajdhani font-semibold text-white/70 mb-10 text-xl">
                    Don't lose your progress
                </p>

                {/* Buttons Row */}
                <div className="flex w-full gap-4 items-stretch h-14">
                    {/* Diamond Revive */}
                    <button
                        onClick={() => {
                            if (canAfford) {
                                setIsActive(false);
                                onReviveWithDiamonds();
                            }
                        }}
                        disabled={!canAfford}
                        className={`flex-1 flex items-center justify-center gap-3 rounded-xl border border-white/20 px-4 transition-all scale-100 active:scale-95 shadow-lg ${canAfford ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/10 opacity-50 grayscale'
                            }`}
                    >
                        <img src="/assets/ui/diamond_3d.svg" alt="Diamond" className="w-10 h-10 object-contain drop-shadow-md" />
                        <span className="font-orbitron font-black text-2xl text-white tracking-widest leading-none translate-y-0.5">
                            {diamondCost}
                        </span>
                    </button>

                    {/* Ad Revive */}
                    <button
                        onClick={() => {
                            setIsActive(false);
                            onReviveWithAd();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#facc15] hover:bg-[#eab308] border-b-4 border-[#ca8a04] px-4 rounded-xl transition-all scale-100 active:scale-95 group overflow-hidden relative shadow-[0_4px_15px_rgba(250,204,21,0.4)]"
                    >
                        {/* Icon SVG */}
                        <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7.5v-3l2.5 1.5L11 13.5z" />
                            </svg>
                        </div>
                        <span className="font-orbitron font-black text-xl text-[#854d0e] tracking-tighter leading-none translate-y-0.5">
                            REVIVE
                        </span>
                        <div className="absolute top-0 right-0 p-1">
                            <span className="bg-[#854d0e] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">AD</span>
                        </div>
                    </button>
                </div>

                {/* Skip Text */}
                <button
                    onClick={() => {
                        setIsActive(false);
                        onSkip();
                    }}
                    className="mt-12 text-white/40 hover:text-white transition-colors font-rajdhani font-bold text-xl uppercase tracking-[0.2em]"
                >
                    Click to skip
                </button>

            </div>
        </div>
    );
};

export default ReviveModal;
