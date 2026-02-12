import React, { useState, useEffect } from 'react';
import NeonButton from './NeonButton';

interface GameOverModalProps {
  score: number;
  time: number;
  killedBy: string;
  onRestart: () => void;
  onRevive: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, time, killedBy, onRestart, onRevive }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);
  }, []);

  const taunts = [
    "Better luck next time!",
    "That was slippery...",
    "Too greedy!",
    "Zig when you should zag!",
    "Back to the drawing board!",
    "The food chain is brutal!",
    "Ouch! That's gotta hurt!",
    "Worm down! 🐛",
  ];
  const taunt = taunts[Math.floor(Math.random() * taunts.length)];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 font-sans safe-area-inset">
      {/* Dark overlay with Red tint */}
      <div
        className="absolute inset-0 bg-black/95 sm:bg-black/80 backdrop-blur-md transition-opacity duration-500"
        style={{ opacity: showContent ? 1 : 0 }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(139, 0, 0, 0.4) 100%)' }}
      />

      {/* Modal Card - Full Screen on Mobile */}
      <div
        className={`glass-panel relative z-10 w-full h-full sm:h-auto sm:max-w-sm sm:rounded-3xl rounded-none overflow-hidden border-x-0 sm:border border-red-500/30 shadow-[0_0_50px_rgba(220,20,60,0.4)] transform transition-all duration-500 flex flex-col ${showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
          }`}
      >
        {/* Header - Vertically Centered Content on Mobile */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gradient-to-b from-red-900/80 to-red-950/80 p-8 sm:p-6 text-center border-b border-red-500/20 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('/assets/ui/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="text-6xl sm:text-5xl mb-4 sm:mb-2 animate-bounce">💀</div>
            <h2 className="font-orbitron font-black text-5xl sm:text-4xl text-white tracking-widest leading-none drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
              WASTED
            </h2>
            <p className="font-rajdhani text-xl sm:text-lg text-red-200 mt-3 sm:mt-2 italic font-semibold">"{taunt}"</p>
          </div>

          {/* Stats Grid */}
          <div className="p-6 sm:p-6 bg-black/40 space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex gap-4 sm:gap-3">
              {/* Score */}
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl sm:rounded-xl p-4 sm:p-3 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="font-rajdhani text-sm sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Score</span>
                <span className="font-orbitron font-black text-3xl sm:text-2xl text-yellow-400 drop-shadow-md">{Math.floor(score)}</span>
              </div>
              {/* Time */}
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl sm:rounded-xl p-4 sm:p-3 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="font-rajdhani text-sm sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Survived</span>
                <span className="font-orbitron font-black text-3xl sm:text-2xl text-cyan-400 drop-shadow-md">{formatTime(time)}</span>
              </div>
            </div>

            {/* Killed By */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-3 text-center my-4">
              <span className="font-rajdhani text-base sm:text-sm text-red-200 font-medium">Eliminated by </span>
              <span className="font-orbitron text-lg sm:text-base font-bold text-red-400 ml-1">{killedBy}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Bottom Fixed on Mobile */}
        <div className="p-6 sm:p-6 bg-black/60 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none space-y-3 sm:pt-2 border-t border-white/5 sm:border-0 shrink-0">
          <NeonButton
            variant="primary"
            fullWidth
            size="lg"
            onClick={onRevive}
            className="!bg-gradient-to-r !from-green-500 !to-emerald-600 !border-green-400/50 !shadow-[0_0_20px_rgba(34,197,94,0.4)] py-4 sm:py-3 text-xl sm:text-lg tracking-widest"
            icon="💚"
          >
            REVIVE
          </NeonButton>

          <NeonButton
            variant="secondary"
            fullWidth
            onClick={onRestart}
            icon="🔄"
            className="py-4 sm:py-3"
          >
            Main Menu
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
