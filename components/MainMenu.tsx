import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SKINS } from '../constants';
import { GameSettings, PlayerWallet, Skin } from '../types';
import WardrobeModal from './WardrobeModal';
import SettingsModal from './SettingsModal';
import { adManager } from '../utils/ads';

interface MainMenuProps {
  onStart: (name: string, skin: Skin) => void;
  currentSettings: GameSettings;
  onUpdateSettings: (s: GameSettings) => void;
  onOpenUpgrades?: () => void;
  wallet?: PlayerWallet;
  customSkins?: Skin[];
  onAddCustomSkin?: (skin: Skin, cost: { type: 'coins' | 'diamonds', amount: number }) => void;
  onOpenShop?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStart,
  currentSettings,
  onUpdateSettings,
  onOpenUpgrades,
  wallet,
  customSkins = [],
  onAddCustomSkin,
  onOpenShop
}) => {
  const [name, setName] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<Skin>(() => {
    const saved = localStorage.getItem('neon-worms-skin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved skin', e);
      }
    }
    return SKINS[6] || SKINS[0];
  });

  const [isMobile, setIsMobile] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // The hero worm
  const heroWormRef = useRef<{
    body: { x: number; y: number }[];
    angle: number;
    targetAngle: number;
    speed: number;
    skin: typeof SKINS[0];
    radius: number;
  }>({
    body: [],
    angle: 0,
    targetAngle: 0,
    speed: 150,
    skin: SKINS[6] || SKINS[0],
    radius: 30,
  });

  // Small background worms
  const bgWormsRef = useRef<{
    body: { x: number; y: number }[];
    angle: number;
    targetAngle: number;
    speed: number;
    skin: typeof SKINS[0];
    radius: number;
  }[]>([]);

  // Floating food particles
  const foodRef = useRef<{ x: number; y: number; size: number; emoji: string; bobOffset: number; speed: number }[]>([]);

  const initScene = useCallback((w: number, h: number) => {
    // Hero worm - BIG prominent centerpiece (Physics Body)
    const heroBody: { x: number; y: number }[] = [];
    const centerX = isMobile ? w / 2 : w / 3;
    const centerY = h / 2;
    const heroRadius = isMobile ? 22 : 30;
    const heroSegments = isMobile ? 40 : 50;

    // Initialize standard straight body to start
    for (let i = 0; i < heroSegments; i++) {
      heroBody.push({
        x: centerX,
        y: centerY + i * 5
      });
    }

    heroWormRef.current = {
      body: heroBody,
      angle: -Math.PI / 2, // Facing UP
      targetAngle: -Math.PI / 2,
      speed: 150, // Active moving speed
      skin: selectedSkin,
      radius: heroRadius,
    };

    // Background worms - Standard wander (fewer on mobile)
    bgWormsRef.current = Array.from({ length: isMobile ? 2 : 4 }, (_, idx) => {
      const body: { x: number; y: number }[] = [];
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const r = isMobile ? 4 : 6;
      const ang = Math.random() * Math.PI * 2;
      for (let i = 0; i < (isMobile ? 10 : 15); i++) {
        body.push({
          x: sx - Math.cos(ang) * i * r * 1.1,
          y: sy - Math.sin(ang) * i * r * 1.1
        });
      }
      return {
        body,
        angle: ang,
        targetAngle: ang,
        speed: 30 + Math.random() * 30,
        skin: SKINS[(idx * 4 + 2) % SKINS.length],
        radius: r,
      };
    });

    // Floating food - ORBS
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    foodRef.current = Array.from({ length: isMobile ? 12 : 25 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: (isMobile ? 5 : 10) + Math.random() * 6,
      emoji: colors[i % colors.length],
      bobOffset: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.4,
    }));
  }, [isMobile, selectedSkin]);

  const updateWorm = useCallback((worm: typeof heroWormRef.current, w: number, h: number, dt: number, time: number, isHero: boolean) => {

    if (isHero) {
      // PHYSICS-BASED FIGURE-8 TRAVERSAL
      const centerX = w / 2;
      const centerY = h / 2;

      // Large Figure-8 Path
      const scaleX = isMobile ? w * 0.35 : w * 0.25;
      const scaleY = isMobile ? h * 0.25 : h * 0.2;
      const speed = 0.6;

      const targetX = centerX + Math.sin(time * speed) * scaleX;
      const targetY = centerY + Math.sin(time * speed * 2) * scaleY;

      const head = worm.body[0];
      const dx = targetX - head.x;
      const dy = targetY - head.y;

      let targetAngle = Math.atan2(dy, dx);

      // Safety: Prevent NaN
      if (isNaN(targetAngle)) targetAngle = worm.angle;

      // Smooth rotation using safe modulo arithmetic
      let diff = targetAngle - worm.angle;
      // Normalize to -PI..PI safely without loops
      diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;

      // Cap turn speed
      const turnSpeed = 3;
      const maxTurn = turnSpeed * dt;
      if (diff > maxTurn) diff = maxTurn;
      if (diff < -maxTurn) diff = -maxTurn;

      worm.angle += diff;

      // Move head forward
      const dist = worm.speed * dt;
      const newHead = {
        x: head.x + Math.cos(worm.angle) * dist,
        y: head.y + Math.sin(worm.angle) * dist
      };

      worm.body.unshift(newHead);

      // Strict length enforcement
      const maxLength = isMobile ? 40 : 50;
      if (worm.body.length > maxLength) {
        worm.body.length = maxLength; // Hard cut
      }

      return;
    }

    // STANDARD RANDOM MOVEMENT (Background worms)
    if (Math.random() < 0.02) {
      worm.targetAngle = worm.angle + (Math.random() - 0.5) * Math.PI * 0.8;
    }

    const pad = 50;
    const head = worm.body[0];
    if (head.x < pad) worm.targetAngle = 0;
    else if (head.x > w - pad) worm.targetAngle = Math.PI;
    if (head.y < pad) worm.targetAngle = Math.PI / 2;
    else if (head.y > h - pad) worm.targetAngle = -Math.PI / 2;

    // Safe normalization here too
    let diff = worm.targetAngle - worm.angle;
    diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;

    worm.angle += diff * 3 * dt;

    const dist = worm.speed * dt;
    const newHead = {
      x: head.x + Math.cos(worm.angle) * dist,
      y: head.y + Math.sin(worm.angle) * dist,
    };

    if (newHead.x < -50) newHead.x = w + 50;
    if (newHead.x > w + 50) newHead.x = -50;
    if (newHead.y < -50) newHead.y = h + 50;
    if (newHead.y > h + 50) newHead.y = -50;

    worm.body.unshift(newHead);
    if (worm.body.length > 20) worm.body.pop(); // Static limit for BG worms
  }, [isMobile]);

  const drawWorm = useCallback((ctx: CanvasRenderingContext2D, worm: typeof heroWormRef.current, time: number, isHero: boolean) => {
    const { body, skin, radius } = worm;
    if (!body || body.length === 0) return;

    // Glow trail for hero - DISABLED ON MOBILE FOR PERFORMANCE
    if (isHero && !isMobile) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      for (let i = body.length - 1; i >= 0; i -= 3) {
        const seg = body[i];
        if (!seg) continue;
        const taper = 1 - (i / body.length) * 0.4;
        ctx.fillStyle = skin.colors[0];
        ctx.shadowColor = skin.colors[0];
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, radius * taper * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Body segments
    for (let i = body.length - 1; i >= 0; i--) {
      const seg = body[i];
      if (!seg) continue;
      const taper = 1 - (i / body.length) * 0.15;
      const r = radius * taper;
      const colorIdx = Math.floor(i / 2) % skin.colors.length;

      if (isMobile) {
        // MOBILE: flat solid color — no radial gradients
        ctx.fillStyle = skin.colors[colorIdx];
      } else {
        const grad = ctx.createRadialGradient(
          seg.x - r * 0.3, seg.y - r * 0.3, r * 0.1,
          seg.x, seg.y, r
        );
        grad.addColorStop(0, lightenColor(skin.colors[colorIdx], 40));
        grad.addColorStop(0.5, lightenColor(skin.colors[colorIdx], 10));
        grad.addColorStop(0.8, skin.colors[colorIdx]);
        grad.addColorStop(1, darkenColor(skin.colors[colorIdx], 30));
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight only on desktop
      if (!isMobile && isHero && i % 3 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(seg.x - r * 0.2, seg.y - r * 0.25, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // HEAD
    const head = body[0];
    const next = body[1];
    if (!head || !next) return;
    const headAngle = Math.atan2(head.y - next.y, head.x - next.x);
    // Head size reduced to be roughly equal/slightly smaller than body max width
    const hr = radius * (isHero ? 0.95 : 1.0);

    if (isMobile) {
      ctx.fillStyle = skin.headColor;
    } else {
      const hGrad = ctx.createRadialGradient(
        head.x - hr * 0.25, head.y - hr * 0.25, hr * 0.1,
        head.x, head.y, hr
      );
      hGrad.addColorStop(0, lightenColor(skin.headColor, 45));
      hGrad.addColorStop(0.4, lightenColor(skin.headColor, 15));
      hGrad.addColorStop(0.8, skin.headColor);
      hGrad.addColorStop(1, darkenColor(skin.headColor, 30));
      ctx.fillStyle = hGrad;
    }
    ctx.beginPath();
    ctx.arc(head.x, head.y, hr, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(isHero ? worm.angle : headAngle);

    const eyeOff = hr * 0.35;
    // Adjusted eye sizing for smaller head
    const eyeR = hr * (isHero ? 0.38 : 0.35);
    const pupilR = hr * (isHero ? 0.22 : 0.2);

    if (!isMobile) {
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
    }
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(hr * 0.25, -eyeOff, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hr * 0.25, eyeOff, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const lookX = Math.sin(time * 1.5 + (isHero ? 0 : 3)) * 2;
    const lookY = Math.cos(time * 1.2 + (isHero ? 0 : 3)) * 1;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(hr * 0.3 + lookX, -eyeOff + lookY, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hr * 0.3 + lookX, eyeOff + lookY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(hr * 0.38 + lookX, -eyeOff - pupilR * 0.35 + lookY, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hr * 0.38 + lookX, eyeOff - pupilR * 0.35 + lookY, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();

    if (isHero) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(hr * 0.35, 0, hr * 0.22, -0.5, 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
    bg.addColorStop(0, '#2d7ec7');
    bg.addColorStop(0.5, '#1a60a0');
    bg.addColorStop(1, '#0d3a6b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (!isMobile) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x < w; x += 30) {
        for (let y = 0; y < h; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    foodRef.current.forEach(food => {
      const bobY = Math.sin(time * food.speed + food.bobOffset) * 8;
      const r = food.size;
      ctx.globalAlpha = 0.8;
      if (isMobile) {
        // MOBILE: simple solid circle
        ctx.fillStyle = food.emoji;
        ctx.beginPath();
        ctx.arc(food.x, food.y + bobY, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const g = ctx.createRadialGradient(food.x, food.y + bobY, 0, food.x, food.y + bobY, r);
        g.addColorStop(0, 'white');
        g.addColorStop(0.5, food.emoji);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(food.x, food.y + bobY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.save();
    ctx.globalAlpha = 0.35;
    bgWormsRef.current.forEach(worm => {
      drawWorm(ctx, worm, time, false);
    });
    ctx.restore();

    drawWorm(ctx, heroWormRef.current, time, true);
  }, [drawWorm]);

  function lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    if (isNaN(num)) return color;
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  function darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    if (isNaN(num)) return color;
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setTimeout(() => setMenuReady(true), 150);
  }, []);

  useEffect(() => {
    heroWormRef.current.skin = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    lastTimeRef.current = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;
      const time = now / 1000;

      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = window.innerWidth;
      const h = window.innerHeight;

      updateWorm(heroWormRef.current, w, h, dt, time, true);
      bgWormsRef.current.forEach(bw => updateWorm(bw, w, h, dt, time, false));

      drawScene(ctx, w, h, time);

      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initScene, updateWorm, drawScene]);

  useEffect(() => {
    const savedName = localStorage.getItem('neon-worms-name');
    if (savedName) setName(savedName);
  }, []);

  const handleStart = () => {
    const finalName = name.trim() || 'Player';
    localStorage.setItem('neon-worms-name', finalName);
    onStart(finalName, selectedSkin);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black safe-area-inset font-sans" style={{ height: '100dvh' }}>
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* TOP LEFT - Profile (Compact) */}
      <div className={`absolute top-4 left-4 z-20 flex items-center gap-3 safe-area-inset transition-all duration-700 transform ${menuReady ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        {/* Avatar Frame - Cute Snake */}
        <div className="relative group">
          <div className="w-14 h-14 rounded-full border-2 border-white/20 bg-black/40 overflow-hidden shadow-lg">
            <img src="/assets/ui/avatar_snake.svg" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Name Only */}
        <div className="bg-black/60 border border-white/10 rounded-full px-4 py-1.5 flex items-center shadow-lg">
          <span className="text-white font-orbitron font-bold text-lg tracking-wide drop-shadow-md">{name || 'PLAYER'}</span>
          <button onClick={() => { const n = prompt('Enter Name'); if (n) setName(n); }} className="ml-2 text-white/50 hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        </div>
      </div>

      {/* TOP RIGHT - Currency (Large & Clear) */}
      {wallet && (
        <div className={`absolute top-4 right-4 z-20 transition-all duration-700 delay-100 transform ${menuReady ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="flex items-center gap-6 bg-black/60 rounded-full px-6 py-2 border border-white/10 shadow-xl">
            {/* Diamonds - 3D Logo, No Bubble */}
            <div className="flex items-center gap-2 drop-shadow-lg">
              <img src="/assets/ui/diamond_3d.svg" alt="Diamond" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="font-orbitron font-black text-2xl text-red-500 tracking-wider shadow-black drop-shadow-sm">{wallet.diamonds.toLocaleString()}</span>
              <button
                onClick={onOpenShop}
                className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm hover:bg-blue-400 transition-colors transform translate-y-0.5"
              >+</button>
            </div>

            {/* Coins - Clearer */}
            <div className="flex items-center gap-2 drop-shadow-lg">
              <img src="/assets/ui/coin.svg" alt="Coin" className="w-9 h-9 object-contain drop-shadow-md" />
              <span className="font-orbitron font-black text-2xl text-yellow-400 tracking-wider shadow-black drop-shadow-sm">{wallet.coins.toLocaleString()}</span>
              <button
                onClick={onOpenShop}
                className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm hover:bg-blue-400 transition-colors transform translate-y-0.5"
              >+</button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT BUTTON (Top Right - Below Currency) */}
      <div className={`absolute top-28 right-6 z-20 transition-all duration-700 delay-200 transform ${menuReady ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
        <button
          onClick={() => setShowQuitModal(true)}
          className="group flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full px-4 py-1.5 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 group-hover:text-red-200">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="font-orbitron font-bold text-[10px] text-red-100 tracking-wider">EXIT</span>
        </button>
      </div>

      {/* CENTER MENU - Logo & Buttons */}
      <div className={`absolute inset-0 flex flex-col items-center justify-end pb-32 sm:justify-center sm:pb-0 z-30 pointer-events-none transition-all duration-700 delay-200 transform ${menuReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

        {/* LOGO - Animated & Juicy */}
        <div className="mb-8 sm:mb-12 flex flex-col items-center transform scale-90 sm:scale-110 select-none">
          <div className="flex gap-2">
            {/* NEON */}
            <div className="flex">
              {['N', 'E', 'O', 'N'].map((char, i) => (
                <span key={i} className="font-titan text-6xl md:text-7xl text-white animate-letter drop-shadow-[0_5px_0_#0ea5e9]"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    WebkitTextStroke: '2px #0284c7',
                    textShadow: '0 0 20px rgba(14, 165, 233, 0.8)'
                  }}>
                  {char}
                </span>
              ))}
            </div>

            <div className="w-4"></div> {/* Spacer */}

            {/* WORMS */}
            <div className="flex">
              {['W', 'O', 'R', 'M', 'S'].map((char, i) => (
                <span key={`w-${i}`} className="font-titan text-6xl md:text-7xl text-green-400 animate-letter drop-shadow-[0_5px_0_#16a34a]"
                  style={{
                    animationDelay: `${(i + 4) * 0.1}s`,
                    WebkitTextStroke: '2px #15803d',
                    textShadow: '0 0 20px rgba(74, 222, 128, 0.6)'
                  }}>
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 1. ADVENTURE (Battle) - Primary Action */}
        <button
          onClick={handleStart}
          className="pointer-events-auto group relative w-64 h-16 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_6px_0_#581c87,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0_0_#581c87] active:translate-y-1.5 mb-6"
          style={{
            background: 'linear-gradient(180deg, #d8b4fe 0%, #a855f7 45%, #7e22ce 50%, #581c87 100%)',
            border: '3px solid #fcd34d'
          }}
        >
          <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center gap-3 h-full">
            <div className="drop-shadow-lg text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path></svg>
            </div>
            <span className="font-orbitron font-black text-2xl text-white tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '1px #581c87' }}>BATTLE</span>
          </div>
        </button>

        {/* 2. COLLECTION - Secondary Action */}
        <button
          onClick={() => setShowWardrobe(true)}
          className="pointer-events-auto group relative w-56 h-14 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_5px_0_#15803d,0_12px_15px_rgba(0,0,0,0.4)] active:shadow-[0_0_0_#15803d] active:translate-y-1.5"
          style={{
            background: 'linear-gradient(180deg, #86efac 0%, #4ade80 45%, #16a34a 50%, #15803d 100%)',
            border: '3px solid #fcd34d'
          }}
        >
          <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-center gap-3 h-full">
            <div className="drop-shadow-lg text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
            </div>
            <span className="font-orbitron font-black text-lg text-white tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">WARDROBE</span>
          </div>
        </button>
      </div>

      {/* BOTTOM CORNER BUTTONS - Settings (Left) & Upgrades (Right) */}

      {/* Settings - Bottom Left */}
      <div className={`absolute bottom-6 left-6 z-20 transition-all duration-700 delay-300 transform ${menuReady ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <button onClick={() => {
          adManager.showInterstitial();
          setShowSettings(true);
        }} className="flex flex-col items-center gap-1 group active:scale-95 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 flex items-center justify-center filter drop-shadow-md text-white bg-black/60 rounded-2xl border border-white/10 hover:bg-black/80 transition-colors shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <span className="text-[11px] font-bold text-white/90 shadow-black drop-shadow-md tracking-wider">SETTINGS</span>
        </button>
      </div>

      {/* Upgrades - Bottom Right */}
      {onOpenUpgrades && (
        <div className={`absolute bottom-6 right-6 z-20 transition-all duration-700 delay-300 transform ${menuReady ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button onClick={() => {
            adManager.showInterstitial();
            onOpenUpgrades();
          }} className="flex flex-col items-center gap-1 group active:scale-95 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 flex items-center justify-center filter drop-shadow-md text-white bg-black/60 rounded-2xl border border-white/10 hover:bg-black/80 transition-colors shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <span className="text-[11px] font-bold text-white/90 shadow-black drop-shadow-md tracking-wider">UPGRADES</span>
          </button>
        </div>
      )}

      {/* QUIT CONFIRMATION MODAL - Root Level */}
      {showQuitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in bg-black/80 pointer-events-auto">
          <div className="bg-[#1a0b2e] border-2 border-red-500/50 rounded-3xl p-6 w-[90%] max-w-sm text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] transform scale-100 animate-bounce-small relative">

            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </div>

            <h3 className="font-orbitron font-black text-2xl text-white mb-2">QUIT GAME?</h3>
            <p className="font-rajdhani font-semibold text-white/60 mb-8 text-lg leading-tight">
              Are you sure you want to exit?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-sm transition-colors border border-white/10"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  try {
                    import('@capacitor/app').then(mod => mod.App.exitApp());
                  } catch (e) {
                    console.log('Exit App Triggered');
                    window.close();
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-sm transition-all shadow-lg shadow-red-600/30"
              >
                QUIT
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Wardrobe Modal Overlay */}
      <WardrobeModal
        isOpen={showWardrobe}
        onClose={() => setShowWardrobe(false)}
        selectedSkin={selectedSkin}
        onSelectSkin={(skin) => {
          setSelectedSkin(skin);
          localStorage.setItem('neon-worms-skin', JSON.stringify(skin));
        }}
        wallet={wallet}
        customSkins={customSkins}
        onAddCustomSkin={onAddCustomSkin}
      />

      {/* Settings Modal Overlay */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={currentSettings}
        onOpenUpgrades={onOpenUpgrades}
        onSave={(s) => {
          onUpdateSettings(s);
          // also save to localstorage? happens in App
        }}
      />
    </div>
  );
};

export default MainMenu;
