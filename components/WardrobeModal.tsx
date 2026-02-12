import React, { useState } from 'react';
import { Skin, PlayerWallet } from '../types';
import { SKINS } from '../constants';
import WormPreview from './WormPreview';

interface WardrobeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSkin: Skin;
    onSelectSkin: (skin: Skin) => void;
    wallet?: PlayerWallet;
    customSkins?: Skin[];
    onAddCustomSkin?: (skin: Skin, cost: { type: 'coins' | 'diamonds', amount: number }) => void;
}

const WardrobeModal: React.FC<WardrobeModalProps> = ({
    isOpen,
    onClose,
    selectedSkin,
    onSelectSkin,
    wallet,
    customSkins = [],
    onAddCustomSkin
}) => {
    const [isCreatingSkin, setIsCreatingSkin] = useState(false);
    const [newSkinName, setNewSkinName] = useState('My Custom Skin');
    const [primaryColor, setPrimaryColor] = useState('#ff0000');
    const [secondaryColor, setSecondaryColor] = useState('#00ff00');

    if (!isOpen) return null;

    const allSkins = [...SKINS, ...customSkins];

    const COLORS = [
        '#ff0000', '#ff4500', '#ff8c00', '#ffd700', '#32cd32',
        '#00fa9a', '#00ffff', '#1e90ff', '#4b0082', '#9400d3',
        '#ff1493', '#ffffff', '#000000', '#ffff00', '#00ff00'
    ];

    const handleCreate = (currency: 'coins' | 'diamonds') => {
        if (!onAddCustomSkin) return;

        const costAmount = currency === 'coins' ? 20000 : 100;
        if (currency === 'coins' && (wallet?.coins || 0) < costAmount) {
            alert("Not enough coins!");
            return;
        }
        if (currency === 'diamonds' && (wallet?.diamonds || 0) < costAmount) {
            alert("Not enough diamonds!");
            return;
        }

        const newSkin: Skin = {
            id: `custom-${Date.now()}`,
            name: newSkinName || 'Custom Skin',
            colors: [primaryColor, secondaryColor],
            headColor: primaryColor,
            type: 'color'
        };

        onAddCustomSkin(newSkin, { type: currency, amount: costAmount });
        onSelectSkin(newSkin);
        setIsCreatingSkin(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in bg-[#050510]/95">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative z-10 w-full h-[95%] sm:h-[90%] max-w-6xl flex flex-col bg-[#0a0a0f] sm:border sm:border-white/10 rounded-3xl overflow-hidden shadow-xl safe-area-inset transform transition-all duration-300 scale-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-black p-5 flex justify-between items-center border-b border-white/5 shrink-0 z-20 shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30 flex items-center justify-center shadow-lg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-orbitron font-black text-2xl text-white tracking-widest leading-none">WARDROBE</h2>
                                <button
                                    onClick={() => setIsCreatingSkin(true)}
                                    className="px-3 py-1 rounded bg-green-500 hover:bg-green-400 text-black font-orbitron font-bold text-[10px] tracking-widest transition-all shadow-md active:scale-95"
                                >
                                    CREATE SKIN
                                </button>
                            </div>
                            <p className="font-rajdhani font-bold text-green-400/80 text-[10px] tracking-[0.2em] uppercase mt-1">TOTAL SKINS: {allSkins.length}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-transparent hover:border-white/10 active:scale-95"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Main Content Area - Split Layout (Always Row for Landscape Optimization) */}
                <div className="flex flex-row flex-1 overflow-hidden relative min-h-0">

                    {/* Left Panel: Worm Preview */}
                    <div className="w-[40%] text-white relative flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/50 to-black/80 border-r border-white/5 p-4 lg:p-8 overflow-hidden group shrink-0">
                        {/* Background Grid for Preview */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] lg:bg-[size:40px_40px] pointer-events-none opacity-50"></div>

                        {/* Spotlight Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-green-500/10 to-transparent blur-[80px] lg:blur-[100px] pointer-events-none"></div>

                        {/* Portal / Hole Graphic - Moved significantly up to avoid name text */}
                        <div className="absolute bottom-[28%] lg:bottom-[32%] left-1/2 -translate-x-1/2 w-[160px] h-[50px] lg:w-[220px] lg:h-[70px] bg-black rounded-[50%] blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-t-4 border-white/5 z-0 transform scale-y-50">
                            <div className="absolute inset-2 bg-gradient-to-b from-black to-slate-900 rounded-[50%]"></div>
                        </div>

                        {/* The Wiggling Worm Component - Pushed up even more */}
                        <WormPreview skin={selectedSkin} className="w-full h-full object-contain relative z-10 scale-90 lg:scale-100 drop-shadow-xl -translate-y-16 lg:-translate-y-20" />

                        {/* Skin Name & Type */}
                        <div className="absolute bottom-4 lg:bottom-8 left-0 right-0 text-center z-20 pointer-events-none">
                            <h3 className="font-orbitron font-bold text-xl lg:text-3xl text-white tracking-wide mb-1 lg:mb-2 drop-shadow-md truncate px-4">
                                {selectedSkin.name}
                            </h3>
                            <span className="inline-block px-2 py-0.5 lg:px-3 lg:py-1 rounded-full bg-white/5 border border-white/10 text-[10px] lg:text-xs font-rajdhani font-bold text-green-400 uppercase tracking-widest">
                                {selectedSkin.type === 'composite' ? 'Premium Animated' : 'Standard Neon'}
                            </span>
                        </div>
                    </div>

                    {/* Right Panel: Skin Grid */}
                    <div className="flex-1 w-[60%] bg-[#050510] flex flex-col relative overflow-hidden min-h-0">
                        <div className="absolute inset-0 bg-[url('/assets/ui/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>

                        {/* Scrollable Grid - Increased density (more columns, smaller cards) */}
                        <div className="flex-1 touch-scroll-y p-3 lg:p-4 pb-20 lg:pb-24 min-h-0" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">

                                {allSkins.map((skin) => {
                                    const isSelected = selectedSkin.id === skin.id;

                                    return (
                                        <button
                                            key={skin.id}
                                            onClick={() => onSelectSkin(skin)}
                                            className={`group relative aspect-[4/5] rounded-xl border transition-all duration-300 overflow-hidden flex flex-col ${isSelected
                                                ? 'bg-gradient-to-br from-green-900/30 to-black border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-[1.02] ring-1 ring-green-500/50'
                                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg'
                                                }`}
                                        >
                                            {/* Preview Dot / Gradient */}
                                            <div className="flex-1 w-full relative flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                <div
                                                    className={`w-16 h-16 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'scale-110 animate-pulse-slow' : ''}`}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${skin.colors[0]}, ${skin.colors[1] || skin.colors[0]})`,
                                                        boxShadow: `0 0 25px ${skin.colors[0]}60`
                                                    }}
                                                >
                                                    {/* Simple Face for icon */}
                                                    <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-white rounded-full opacity-80"></div>
                                                    <div className="absolute top-[30%] right-[25%] w-[15%] h-[15%] bg-white rounded-full opacity-80"></div>
                                                </div>

                                                {/* Pattern Overlay Hint */}
                                                {skin.pattern && (
                                                    <div className="absolute inset-0 opacity-10 bg-white/10 mix-blend-overlay" style={{ backgroundImage: `url(/assets/patterns/${skin.pattern}.png)` }}></div>
                                                )}
                                            </div>

                                            {/* Info Bar */}
                                            <div className={`relative z-10 w-full p-3 border-t transition-colors flex flex-col items-center gap-1 ${isSelected
                                                ? 'bg-green-500 text-black border-green-400'
                                                : 'bg-black/60 border-white/5 text-white/70 group-hover:text-white group-hover:bg-black/80'
                                                }`}>
                                                <span className="font-orbitron text-[10px] tracking-wider uppercase font-bold truncate w-full text-center">
                                                    {skin.name}
                                                </span>
                                                {isSelected && (
                                                    <span className="text-[9px] font-rajdhani font-bold bg-black/20 px-1.5 rounded uppercase tracking-widest text-black/70">
                                                        EQUIPPED
                                                    </span>
                                                )}
                                            </div>

                                            {/* Checkmark for Selected */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce-small">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Skin Overlay */}
            {isCreatingSkin && (
                <div className="absolute inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 sm:p-12 lg:p-24">
                    <div className="w-full h-fit max-w-2xl bg-[#0a0a15] sm:border sm:border-white/10 sm:rounded-[2rem] shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col overflow-hidden relative">

                        {/* Header - Ultra Compact */}
                        <div className="flex justify-between items-center px-6 py-2.5 sm:px-7 border-b border-white/5 bg-slate-900/80 backdrop-blur-md shrink-0 z-20">
                            <h3 className="font-orbitron font-black text-sm sm:text-base text-white tracking-widest uppercase text-glow">NEW SKIN CREATOR</h3>
                            <button
                                onClick={() => setIsCreatingSkin(false)}
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5 shadow-lg active:scale-90"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Main Split Content - Tightened */}
                        <div className="flex flex-col sm:flex-row overflow-hidden bg-[#050510]">

                            {/* Left Panel: Preview (Compact) */}
                            <div className="h-32 sm:h-auto sm:w-[35%] bg-gradient-to-b from-slate-900/50 to-black relative flex flex-col items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-40"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.15),transparent)] opacity-100"></div>

                                <div className="w-full h-full flex items-center justify-center relative z-10">
                                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                                        <WormPreview
                                            skin={{
                                                id: 'preview',
                                                name: newSkinName,
                                                colors: [primaryColor, secondaryColor],
                                                headColor: primaryColor,
                                                type: 'color'
                                            }}
                                            className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Controls (Ultra Tight) */}
                            <div className="flex-1 p-5 sm:p-6 space-y-4">

                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-orbitron font-bold text-green-400 uppercase tracking-[0.2em] ml-1">Designation</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newSkinName}
                                            onChange={(e) => setNewSkinName(e.target.value)}
                                            placeholder="Enter name..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-rajdhani font-black text-base focus:border-green-500/50 focus:bg-white/[0.08] outline-none transition-all placeholder:text-white/5 shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Compact Color Choice */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Primary */}
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                                        <label className="text-[8px] font-orbitron font-bold text-white/40 uppercase tracking-[0.2em] text-center">Core Color</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-12 h-12 rounded-lg cursor-pointer bg-white/10 border-2 border-white/20 p-0.5 relative z-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary */}
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                                        <label className="text-[8px] font-orbitron font-bold text-white/40 uppercase tracking-[0.2em] text-center">Glow Aura</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-lg blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <input
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-12 h-12 rounded-lg cursor-pointer bg-white/10 border-2 border-white/20 p-0.5 relative z-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Smaller/Compact */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <button
                                        onClick={() => handleCreate('coins')}
                                        className="group relative h-10 rounded-lg overflow-hidden active:scale-95 transition-all shadow-xl border border-yellow-500/30 hover:border-yellow-400"
                                        style={{ background: 'linear-gradient(180deg, #fef08a 0%, #ca8a04 100%)' }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center justify-center gap-2 h-full relative z-10 px-3">
                                            <img src="/assets/ui/coin.svg" className="w-4 h-4 drop-shadow-md" alt="coins" />
                                            <span className="font-orbitron font-black text-black text-sm">20,000</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleCreate('diamonds')}
                                        className="group relative h-10 rounded-lg overflow-hidden active:scale-95 transition-all shadow-xl border border-red-500/30 hover:border-red-400"
                                        style={{ background: 'linear-gradient(180deg, #f87171 0%, #991b1b 100%)' }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center justify-center gap-2 h-full relative z-10 px-3">
                                            <img src="/assets/ui/diamond_3d.svg" className="w-4 h-4 drop-shadow-md" alt="diamonds" />
                                            <span className="font-orbitron font-black text-white text-sm">100</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardrobeModal;
