import React, { useState, useEffect } from 'react';

interface GameOverModalProps {
  score: number;
  time: number;
  killedBy: string;
  killCount: number;
  rank: number;
  onRestart: () => void;
  onHome: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, time, killedBy, killCount, rank, onRestart, onHome }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setShowContent(true), 100);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto overflow-hidden">

      {/* Background - Spotlight / Disco Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main Spotlight */}
        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-radial from-[#8b5cf6]/40 via-transparent to-transparent opacity-60 blur-3xl animate-pulse-slow"></div>
        {/* Ambient Particles */}
        <div className="absolute inset-0 opacity-20 bg-[url('/assets/ui/noise.png')] mix-blend-overlay"></div>
      </div>

      {/* Main Container - Responsive Layout (Landscape vs Portrait) */}
      <div className={`relative z-10 w-full max-w-4xl h-full max-h-screen p-4 sm:p-6 transition-all duration-700 flex flex-col items-center justify-center ${showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'}`}>

        {/* LANDSCAPE LAYOUT DETECTION: If height is small (mobile landscape), use row. Else col. */}
        <div className="w-full h-full flex flex-col landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-8 portrait:flex-col portrait:justify-between portrait:max-w-md">

          {/* LEFT SIDE (Landscape) / TOP (Portrait) - Trophy & Title */}
          <div className="flex flex-col items-center justify-center flex-1 landscape:max-w-[50%]">

            {/* Title */}
            <div className="relative mb-2 w-full text-center">
              <h1 className="font-orbitron font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#fde047] to-[#d97706] drop-shadow-[0_4px_0_rgba(180,83,9,1)] italic tracking-wider transform -skew-x-6">
                Game Over
              </h1>
            </div>

            {/* Trophy Graphic */}
            <div className="relative w-32 h-32 sm:w-56 sm:h-56 my-2 animate-bounce-gentle">
              {/* Glow behind trophy */}
              <div className="absolute inset-0 bg-yellow-500/30 blur-3xl rounded-full scale-125"></div>

              {/* Trophy SVG */}
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#a16207" />
                  </linearGradient>
                </defs>
                {/* Simplified Cup Shape */}
                <path d="M40 50 Q40 20 100 20 Q160 20 160 50 L140 130 Q140 160 100 160 Q60 160 60 130 Z" fill="url(#goldGradient)" />
                {/* Handles */}
                <path d="M40 60 C10 60 10 100 40 110" fill="none" stroke="#eab308" strokeWidth="12" strokeLinecap="round" />
                <path d="M160 60 C190 60 190 100 160 110" fill="none" stroke="#eab308" strokeWidth="12" strokeLinecap="round" />
                {/* Base */}
                <rect x="70" y="160" width="60" height="15" fill="#854d0e" rx="4" />
                <rect x="60" y="175" width="80" height="15" fill="#a16207" rx="4" />
                {/* Shine */}
                <path d="M70 40 L90 40 L80 140 L60 140 Z" fill="white" fillOpacity="0.2" />
              </svg>

              {/* Rank Badge */}
              <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full border-2 border-yellow-200 flex items-center justify-center shadow-inner">
                <span className="font-orbitron font-black text-xl sm:text-2xl text-[#713f12] drop-shadow-sm">{rank}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Landscape) / BOTTOM (Portrait) - Stats & Buttons */}
          <div className="flex flex-col w-full landscape:w-[50%] landscape:max-w-md landscape:justify-center gap-4">

            {/* Stats Card */}
            <div className="w-full bg-[#4c1d95]/80 backdrop-blur-md rounded-2xl border-t-2 border-white/20 p-4 shadow-2xl relative overflow-hidden group">
              <div className="space-y-2 sm:space-y-3 relative z-10">
                {/* Score Row */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⭐</span>
                    <span className="font-rajdhani font-bold text-white/80 text-base sm:text-lg uppercase tracking-wider">Score</span>
                  </div>
                  <span className="font-orbitron font-black text-xl sm:text-2xl text-yellow-300 drop-shadow-md">{Math.floor(score).toLocaleString()}</span>
                </div>

                {/* Kill Row */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚔️</span>
                    <span className="font-rajdhani font-bold text-white/80 text-base sm:text-lg uppercase tracking-wider">Kills</span>
                  </div>
                  <span className="font-orbitron font-black text-xl sm:text-2xl text-white drop-shadow-md">{killCount}</span>
                </div>

                {/* Time Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏱️</span>
                    <span className="font-rajdhani font-bold text-white/80 text-base sm:text-lg uppercase tracking-wider">Time</span>
                  </div>
                  <span className="font-orbitron font-black text-xl sm:text-2xl text-blue-200 drop-shadow-md">{formatTime(time)}</span>
                </div>
              </div>
            </div>

            {/* Buttons Grid */}
            <div className="w-full grid grid-cols-2 gap-4">
              {/* Home Button */}
              <button
                onClick={onHome}
                className="group relative h-12 sm:h-14 bg-[#f43f5e] hover:bg-[#e11d48] rounded-xl border-b-[4px] sm:border-b-[6px] border-[#9f1239] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center shadow-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="drop-shadow-md">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </button>

              {/* Restart Button */}
              <button
                onClick={onRestart}
                className="group relative h-12 sm:h-14 bg-[#fbbf24] hover:bg-[#f59e0b] rounded-xl border-b-[4px] sm:border-b-[6px] border-[#b45309] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center shadow-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="drop-shadow-md group-hover:rotate-180 transition-transform duration-500">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
