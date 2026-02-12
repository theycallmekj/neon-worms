import React from 'react';
import { Skin } from '../types';
import { SKINS } from '../constants';

interface WardrobeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSkin: Skin;
    onSelectSkin: (skin: Skin) => void;
}

const WardrobeModal: React.FC<WardrobeModalProps> = ({ isOpen, onClose, selectedSkin, onSelectSkin }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in bg-black/80 backdrop-blur-sm">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full h-[90%] sm:h-[85%] max-w-5xl flex flex-col bg-black/40 sm:glass-panel sm:border sm:border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(74,222,128,0.2)] safe-area-inset transform transition-all duration-300 scale-100">

                {/* Header */}
                <div className="bg-gradient-to-b from-green-900/50 to-black/50 p-6 flex justify-between items-center border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
                        </div>
                        <div>
                            <h2 className="font-orbitron font-black text-2xl text-white tracking-widest text-glow">WARDROBE</h2>
                            <p className="font-rajdhani text-white/50 text-sm">Select your neon skin</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content - Grid of Skins */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {SKINS.map((skin) => {
                            const isSelected = selectedSkin.id === skin.id;

                            return (
                                <button
                                    key={skin.id}
                                    onClick={() => onSelectSkin(skin)}
                                    className={`group relative aspect-square rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col items-center justify-end p-4 ${isSelected
                                            ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {/* Skin Preview (Simplified Circle for now, or actual preview if possible) */}
                                    <div className="absolute inset-0 flex items-center justify-center p-6">
                                        <div
                                            className="w-full h-full rounded-full shadow-lg transition-transform group-hover:scale-110"
                                            style={{
                                                background: `linear-gradient(135deg, ${skin.colors[0]}, ${skin.colors[1] || skin.colors[0]})`,
                                                boxShadow: `0 0 20px ${skin.colors[0]}`
                                            }}
                                        >
                                            {/* Eyes */}
                                            <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-white rounded-full"></div>
                                            <div className="absolute top-[30%] right-[25%] w-[15%] h-[15%] bg-white rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Name Label */}
                                    <div className={`relative z-10 w-full text-center py-2 rounded-lg backdrop-blur-md transition-colors ${isSelected ? 'bg-green-500 text-black font-bold' : 'bg-black/50 text-white group-hover:bg-black/70'
                                        }`}>
                                        <span className="font-orbitron text-xs tracking-wider uppercase truncate block px-2">
                                            {skin.name}
                                        </span>
                                    </div>

                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer info */}
                <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-md text-center">
                    <p className="font-rajdhani text-white/30 text-xs">
                        More skins coming soon. Total available: <span className="text-green-400">{SKINS.length}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WardrobeModal;
