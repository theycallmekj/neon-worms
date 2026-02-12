import React, { useState } from 'react';
import { MIN_PIT_COUNT, MAX_PIT_COUNT, PIT_CONFIG, ARENA_CONFIG, FOOD_CONFIG } from '../constants';
import { GameSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: GameSettings;
    onSave: (settings: GameSettings) => void;
    onOpenUpgrades?: () => void;
}

type TabId = 'nutrition' | 'arena' | 'hazards';

// Helper to map food types to their icon files
const getFoodIcon = (type: string) => {
    if (type === 'random') return '/assets/ui/icons/icon_food_random.svg';
    const map: Record<string, string> = {
        'fast_food': 'icon_food_fastfood.svg',
        'bakery': 'icon_food_bakery.svg',
        'street': 'icon_food_street.svg',
        'sushi': 'icon_food_sushi.svg',
        'candy': 'icon_food_candy.svg',
    };
    return `/assets/ui/icons/${map[type] || 'icon_food_random.svg'}`;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onOpenUpgrades }) => {
    const [pitCount, setPitCount] = useState(settings.pitCount);
    const [enabledPits, setEnabledPits] = useState<string[]>(settings.enabledPitTypes || Object.keys(PIT_CONFIG));
    const [activeTab, setActiveTab] = useState<TabId>('nutrition');

    if (!isOpen) return null;

    const updateSettings = (updates: Partial<GameSettings>) => {
        const newSettings = {
            pitCount,
            enabledPitTypes: enabledPits,
            arenaId: settings.arenaId || 'dark',
            foodType: settings.foodType || 'random',
            ...updates
        };
        // Update local state if needed (mainly for pitCount which is a slider)
        if (updates.pitCount !== undefined) setPitCount(updates.pitCount);
        if (updates.enabledPitTypes !== undefined) setEnabledPits(updates.enabledPitTypes);

        // Persist immediately
        onSave(newSettings);
    };

    const togglePit = (type: string) => {
        let newPits;
        if (enabledPits.includes(type)) {
            newPits = enabledPits.filter(p => p !== type);
        } else {
            newPits = [...enabledPits, type];
        }
        setEnabledPits(newPits);
        updateSettings({ enabledPitTypes: newPits });
    };

    const tabs: { id: TabId; icon: React.ReactNode; label: string; activeColor: string }[] = [
        {
            id: 'nutrition',
            label: 'NUTRITION',
            activeColor: 'text-yellow-400',
            // Cutlery Icon
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
            )
        },
        {
            id: 'arena',
            label: 'BATTLEFIELD',
            activeColor: 'text-blue-400',
            // Mountain Icon
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                </svg>
            )
        },
        {
            id: 'hazards',
            label: 'THREATS',
            activeColor: 'text-red-500',
            // Warning/Hazard Icon
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </svg>
            )
        }
    ];

    const renderNutrition = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 animate-fade-in p-3 pb-20 md:p-4">
            {/* Random Choice */}
            <button
                onClick={() => updateSettings({ foodType: 'random' })}
                className={`relative w-full aspect-[4/3] rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden active:scale-95 group ${settings.foodType === 'random'
                    ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-[1.02] bg-black/40'
                    : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
                    }`}
            >
                {/* Large Center Icon - Scaled Up */}
                <div className={`transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 w-full h-full flex items-center justify-center p-4`}>
                    <img
                        src={getFoodIcon('random')}
                        alt="Random"
                        className="w-full h-full object-contain drop-shadow-2xl filter brightness-110 contrast-125"
                    />
                </div>

                {/* Internal Translucent Label Box - Smaller & Pill-shaped */}
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full backdrop-blur-md shadow-lg transition-colors border border-white/10 ${settings.foodType === 'random' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-black/40 text-white/70'}`}>
                    <span className="font-orbitron font-bold text-[10px] sm:text-xs tracking-wider whitespace-nowrap">
                        RANDOM
                    </span>
                </div>

                {/* Selection Checkmark - Top Right */}
                {settings.foodType === 'random' && (
                    <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 bg-yellow-400 rounded-full shadow-lg border-2 border-white animate-fade-in-up">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                )}
            </button>

            {/* Food Types */}
            {Object.entries(FOOD_CONFIG).map(([key, config]) => {
                const isSelected = settings.foodType === key;
                const itemConfig = config as any;
                return (
                    <button
                        key={key}
                        onClick={() => updateSettings({ foodType: key })}
                        className={`relative w-full aspect-[4/3] rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden active:scale-95 group ${isSelected
                            ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-[1.02] bg-black/40'
                            : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        {/* Large Center Icon - Scaled Up */}
                        <div className={`transition-transform duration-500 group-hover:scale-110 w-full h-full flex items-center justify-center p-4`}>
                            <img
                                src={getFoodIcon(key)}
                                alt={itemConfig.name}
                                className="w-full h-full object-contain drop-shadow-2xl filter brightness-110 contrast-125"
                            />
                        </div>

                        {/* Internal Translucent Label Box */}
                        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full backdrop-blur-md shadow-lg transition-colors border border-white/10 ${isSelected ? 'bg-yellow-400/20 text-yellow-300' : 'bg-black/40 text-white/70'}`}>
                            <span className="font-orbitron font-bold text-[10px] sm:text-xs tracking-wider whitespace-nowrap">
                                {itemConfig.name.split(' ')[0].toUpperCase()}
                            </span>
                        </div>

                        {/* Selection Checkmark */}
                        {isSelected && (
                            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 bg-yellow-400 rounded-full shadow-lg border-2 border-white animate-fade-in-up">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    );

    const renderArena = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 animate-fade-in p-3 pb-20 md:p-4">
            {Object.values(ARENA_CONFIG).map((arena) => {
                const isSelected = settings.arenaId === arena.id;
                return (
                    <button
                        key={arena.id}
                        onClick={() => updateSettings({ arenaId: arena.id })}
                        className={`relative w-full aspect-[4/3] rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden active:scale-95 group ${isSelected
                            ? 'border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.5)] scale-[1.02] bg-black/40'
                            : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        {/* Preview Background */}
                        <div
                            className="absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100"
                            style={{
                                backgroundColor: arena.colors.background,
                                backgroundImage: `
                                    linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%),
                                    ${arena.pattern === 'grid' ? `linear-gradient(${arena.colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${arena.colors.grid} 1px, transparent 1px)` : ''}
                                    ${arena.pattern === 'stars' ? `radial-gradient(white 1px, transparent 1px)` : ''}
                                `,
                                backgroundSize: arena.pattern === 'grid' ? '20px 20px' : 'cover'
                            }}
                        />

                        {/* Internal Label Box */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 z-10 shadow-lg">
                            <h4 className={`font-orbitron font-bold text-[10px] sm:text-xs tracking-wider whitespace-nowrap ${isSelected ? 'text-blue-400' : 'text-white'}`}>{arena.name.toUpperCase()}</h4>
                        </div>

                        {isSelected && (
                            <div className="absolute top-3 right-3 z-20 flex items-center justify-center w-7 h-7 bg-blue-400 rounded-full shadow-lg border-2 border-white animate-fade-in-up">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );

    const getHazardIcon = (type: string) => {
        switch (type) {
            case 'lava':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.5.7 1 1 1.5 0 1.25.5 2 2 2.3Z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.5.7 1 1 1.5 0 1.25.5 2 2 2.3Z" />
                    </svg>
                );
            case 'void':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-spin-slow" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                        <circle cx="12" cy="12" r="6" fill="currentColor" fillOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                );
            case 'acid':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" fill="currentColor" fillOpacity="0.2" />
                        <circle cx="10" cy="16" r="1" fill="currentColor" />
                        <circle cx="14" cy="16" r="1" fill="currentColor" />
                        <path d="M12 14v.01" />
                    </svg>
                );
            case 'ice':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                    </svg>
                );
            case 'electric':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.2" />
                    </svg>
                );
            case 'tar':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21a9 9 0 0 0 9-9c0-3.87-2.33-7.15-5.6-8.54L12 2 8.6 3.46C5.33 4.85 3 8.13 3 12a9 9 0 0 0 9 9z" fill="currentColor" fillOpacity="0.2" />
                        <path d="M12 17a5 5 0 0 0 5-5c0-2.21-1.33-4.15-3.2-4.88L12 6l-1.8 1.12C8.33 7.85 7 9.79 7 12a5 5 0 0 0 5 5z" />
                    </svg>
                );
            case 'radioactive':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-[#ccff00] drop-shadow-[0_0_8px_rgba(204,255,0,0.8)] animate-spin-slow-reverse" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <path d="M12 12 4.93 4.93" />
                        <path d="M12 12 19.07 19.07" />
                        <path d="M12 12 19.07 4.93" />
                        <path d="M12 12 4.93 19.07" />
                        <circle cx="12" cy="12" r="8" strokeDasharray="12 12" />
                    </svg>
                );
            case 'spike':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-red-700 drop-shadow-[0_0_8px_rgba(185,28,28,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" fill="currentColor" fillOpacity="0.3" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                );
            case 'ghost':
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 22a9.003 9.003 0 0 1-6.19-2.81 1 1 0 0 1 1.41-1.42 7 7 0 1 0 13.56 0 1 1 0 0 1 1.41 1.42A9 9 0 0 1 9 22z" />
                        <path d="M9 2a6 6 0 0 0-6 6v7h12V8a6 6 0 0 0-6-6z" fill="currentColor" fillOpacity="0.2" />
                        <circle cx="7" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="11" cy="10" r="1.5" fill="currentColor" />
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 md:w-10 md:h-10 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
        }
    };

    const renderHazards = () => (
        <div className="flex flex-col h-full animate-fade-in p-4 gap-4 md:p-6 md:gap-6 pb-24">


            {/* Grid of Threats - Rectangular Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {Object.entries(PIT_CONFIG).map(([type, config]) => {
                    const isEnabled = enabledPits.includes(type);
                    return (
                        <button
                            key={type}
                            onClick={() => togglePit(type)}
                            className={`group relative flex items-center justify-between p-3 md:p-4 rounded-2xl border-2 transition-all duration-300 active:scale-[0.98] ${isEnabled
                                ? 'bg-gradient-to-r from-red-900/60 to-red-900/20 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            {/* Left Side: Icon + Text */}
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${isEnabled ? 'bg-red-900/40 border border-red-500/30' : 'bg-black/40 border border-white/5'}`}>
                                    {getHazardIcon(type)}
                                </div>
                                <div className="text-left flex flex-col gap-0.5">
                                    <h4 className={`font-orbitron font-bold text-sm tracking-wide transition-colors ${isEnabled ? 'text-white text-glow' : 'text-white/60'}`}>
                                        {config.name.toUpperCase()}
                                    </h4>
                                    <span className="text-[10px] font-rajdhani font-semibold text-white/30 uppercase tracking-wider group-hover:text-white/50 transition-colors">Tap to toggle</span>
                                </div>
                            </div>

                            {/* Right Side: Checkbox Circle */}
                            <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isEnabled
                                ? 'bg-red-500 border-red-500 scale-110 shadow-lg shadow-red-500/30'
                                : 'border-white/20 bg-black/20 group-hover:border-white/40'}`}>
                                {isEnabled && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Main Container - Adjusted Size/Width */}
            <div className="relative z-10 w-full max-w-5xl h-[90vh] md:h-[80vh] flex flex-row overflow-hidden rounded-3xl md:rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[#0a0a1a]/95 backdrop-blur-2xl">

                {/* Close Button - TOP LEFT (Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 md:top-6 md:left-6 z-50 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110 active:scale-95 group border border-white/10 shadow-lg"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70 group-hover:text-white transition-colors"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Left Content Area (Scrollable) - EXPANDED */}
                <div className="flex-1 flex flex-col relative bg-transparent pt-16 md:pt-20 pb-4 pl-3 md:pl-4 pr-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {activeTab === 'nutrition' && renderNutrition()}
                        {activeTab === 'arena' && renderArena()}
                        {activeTab === 'hazards' && renderHazards()}
                    </div>
                </div>

                {/* Right Sidebar (Navigation) - FIXED WIDTH - NO BACKGROUND */}
                <div className="w-20 md:w-32 flex flex-col items-center justify-center py-6 gap-4 md:gap-6 shrink-0 relative z-20">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex flex-col items-center justify-center gap-2 md:gap-3 p-2 md:p-4 rounded-2xl md:rounded-3xl transition-all duration-300 w-16 h-16 md:w-20 md:h-20 active:scale-95 ${isActive
                                    ? 'bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-110 border border-white/20'
                                    : 'bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100 hover:scale-105 border border-transparent hover:border-white/10'
                                    }`}
                            >
                                <div className={`transition-transform duration-300 drop-shadow-lg ${isActive ? 'scale-110 ' + tab.activeColor : 'group-hover:scale-110 text-white'}`}>
                                    {tab.icon}
                                </div>

                                {/* Active Indicator - Optional Dot */}
                                {isActive && (
                                    <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${tab.activeColor.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`} />
                                )}
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
