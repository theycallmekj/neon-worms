import React from 'react';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWatchAdGold: () => void;
    onWatchAdDiamond: () => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, onWatchAdGold, onWatchAdDiamond }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center animate-fade-in bg-black/80 backdrop-blur-md px-2">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Container - Shortened for Mobile */}
            <div className="relative z-10 w-full max-w-md bg-[#1a1a2e] border-2 border-white/10 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-scale-in">

                {/* Header - Compact */}
                <div className="p-3 sm:p-5 text-center border-b border-white/5 bg-gradient-to-b from-blue-500/10 to-transparent">
                    <h2 className="font-orbitron font-black text-xl sm:text-2xl text-white tracking-tighter drop-shadow-lg uppercase leading-none">FREE REWARDS</h2>
                    <p className="font-rajdhani font-bold text-blue-400 text-[9px] sm:text-[11px] tracking-[0.2em] mt-1 sm:mt-2 uppercase opacity-80">Watch Ads and win Rewards</p>
                </div>

                {/* Close Button - Smaller */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/5 active:scale-90 z-20"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Rewards Content - SHORTER & SMALLER */}
                <div className="p-3 sm:p-6 grid grid-cols-2 gap-2 sm:gap-4">
                    {/* Gold Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 group hover:bg-white/10 transition-all shadow-lg">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400/10 blur-lg rounded-full" />
                            <img src="/assets/ui/coin.svg" alt="Gold" className="w-8 h-8 sm:w-14 sm:h-14 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                        </div>

                        <div className="text-center">
                            <span className="block font-orbitron font-black text-xl sm:text-3xl text-yellow-400 leading-none">50</span>
                            <span className="block font-rajdhani font-bold text-white/50 text-[7px] sm:text-[9px] tracking-widest uppercase mt-0.5">Gold Coins</span>
                        </div>

                        <button
                            onClick={onWatchAdGold}
                            className="w-full py-1.5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-orbitron font-black text-[8px] sm:text-[10px] rounded-lg shadow-[0_3px_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-1"
                        >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="sm:w-2.5 sm:h-2.5"><path d="M5 3l14 9-14 9V3z"></path></svg>
                            WATCH AD
                        </button>
                    </div>

                    {/* Diamond Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 group hover:bg-white/10 transition-all shadow-lg">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/10 blur-lg rounded-full" />
                            <img src="/assets/ui/diamond_3d.svg" alt="Diamonds" className="w-8 h-8 sm:w-14 sm:h-14 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        </div>

                        <div className="text-center">
                            <span className="block font-orbitron font-black text-xl sm:text-3xl text-red-500 leading-none">2</span>
                            <span className="block font-rajdhani font-bold text-white/50 text-[7px] sm:text-[9px] tracking-widest uppercase mt-0.5">Diamonds</span>
                        </div>

                        <button
                            onClick={onWatchAdDiamond}
                            className="w-full py-1.5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-orbitron font-black text-[8px] sm:text-[10px] rounded-lg shadow-[0_3px_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-1"
                        >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="sm:w-2.5 sm:h-2.5"><path d="M5 3l14 9-14 9V3z"></path></svg>
                            WATCH AD
                        </button>
                    </div>
                </div>

                {/* Footer Info - Tightened */}
                <div className="px-5 pb-4 text-center">
                    <p className="font-rajdhani font-bold text-white/30 text-[7px] sm:text-[9px] tracking-[0.15em] uppercase">Rewards are added instantly</p>
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
