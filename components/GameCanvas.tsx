
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import { GameState, Worm, Food, Vector2, Skin, PowerUp, PowerUpType, Pit, Collectible, PlayerWallet, UpgradeLevels } from '../types';
import { createWorm, createFood, createPowerUp, createPit, createCollectible, updateWormPosition, updateBotAI, checkCollisions } from '../utils/gameEngine';
import { AnimationEngine } from '../utils/AnimationEngine';
import { MAP_SIZE, BOT_COUNT, FOOD_COUNT, SKINS, BASE_RADIUS, POWER_UP_CONFIG, MAX_POWER_UPS, POWER_UP_SPAWN_INTERVAL, PIT_CONFIG, DEFAULT_PIT_COUNT, MAX_TOTAL_FOOD, ARENA_CONFIG, FOOD_CONFIG, COIN_CONFIG, DIAMOND_CONFIG, UPGRADE_DURATION_MULTIPLIER, BASE_SPEED, BOOST_SPEED, TURN_SPEED, SEGMENT_DISTANCE, BOT_NAMES, POWER_UP_RADIUS } from '../constants';
import { Vec2, randomPosition, randomRange } from '../utils/math';
import { audioController } from '../utils/audio';

interface GameCanvasProps {
  playerName: string;
  playerSkin: Skin;
  botNameList: string[];
  onGameOver: (score: number, time: number, killedBy: string, killCount: number) => void;
  isPaused: boolean;
  pitCount?: number;
  arenaId?: string;
  enabledPitTypes?: string[];
  foodType?: string;
  wallet: PlayerWallet;
  onWalletChange: (wallet: PlayerWallet) => void;
  upgradeLevels: UpgradeLevels;
}

export interface GameCanvasHandle {
  revive: () => void;
}

// Virtual Joystick Configuration
const JOYSTICK_SIZE = 120;
const JOYSTICK_KNOB_SIZE = 50;
const JOYSTICK_MARGIN = 30;

// Performance constants
const MAX_VISIBLE_SEGMENTS = 80; // Maximum segments to render per worm
const SEGMENT_RENDER_SKIP = 2; // Skip every N segments when rendering (draw circles further apart)
const COLLISION_CHECK_SKIP = 3; // Skip segments in collision detection
const FOOD_BATCH_SIZE = 100; // Process food in batches

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ playerName, playerSkin, botNameList, onGameOver, isPaused, pitCount = DEFAULT_PIT_COUNT, arenaId = 'dark', enabledPitTypes = [], foodType = 'random', wallet, onWalletChange, upgradeLevels }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const reqRef = useRef<number>(0);
  const mouseRef = useRef<Vector2>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  // Mobile touch state
  const isMobileRef = useRef<boolean>(false);
  const joystickActiveRef = useRef<boolean>(false);
  const joystickOriginRef = useRef<Vector2>({ x: 0, y: 0 });
  const joystickPosRef = useRef<Vector2>({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const boostTouchIdRef = useRef<number | null>(null);

  // Performance optimization
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Power-up spawning
  const lastPowerUpSpawnRef = useRef<number>(Date.now());
  const activePowerUpMessageRef = useRef<{ text: string; type?: PowerUpType; color: string; timer: number } | null>(null);

  // Coin spawning
  const lastCoinSpawnRef = useRef<number>(Date.now());
  // Floating text messages (for coin/diamond collect)
  const floatingTextsRef = useRef<{ text: string; x: number; y: number; timer: number; color: string }[]>([]);

  // Wallet ref for use inside game loop (avoids stale closure)
  const walletRef = useRef<PlayerWallet>(wallet);
  walletRef.current = wallet;
  const upgradeLevelsRef = useRef<UpgradeLevels>(upgradeLevels);
  upgradeLevelsRef.current = upgradeLevels;

  // Pre-load collectible sprites
  const collectibleSpritesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // Pre-load power-up sprites
  const powerUpSpritesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    // Collectibles
    [COIN_CONFIG.sprite, DIAMOND_CONFIG.sprite].forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => { collectibleSpritesRef.current.set(src, img); };
    });

    // Power-Ups
    Object.values(POWER_UP_CONFIG).forEach(config => {
      const img = new Image();
      img.src = config.sprite;
      img.onload = () => {
        console.log(`[GameCanvas] Loaded sprite: ${config.sprite}`);
        powerUpSpritesRef.current.set(config.sprite, img);
      };
      img.onerror = (e) => {
        console.error(`[GameCanvas] Failed to load sprite: ${config.sprite}`, e);
      };
    });
  }, []);

  // Pre-cached emoji sprites for faster rendering
  const foodCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Pre-render emoji to canvas for faster drawing
  const getEmojiSprite = useCallback((emoji: string, size: number): HTMLCanvasElement => {
    const key = `${emoji}_${size}`;
    if (foodCacheRef.current.has(key)) {
      return foodCacheRef.current.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size, size);

    foodCacheRef.current.set(key, canvas);
    return canvas;
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pre-load Food Sprites into a ref-based cache (avoids race condition on first render)
  const foodSpritesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [spritesReady, setSpritesReady] = useState(false);

  useEffect(() => {
    const cache = foodSpritesRef.current;
    const allSprites = new Set<string>();

    // Check both FOOD_CONFIG and any other collections that might have sprites
    Object.values(FOOD_CONFIG).forEach(config => {
      config.items.forEach((item: any) => {
        if (item.sprite) allSprites.add(item.sprite);
      });
    });

    if (allSprites.size === 0) {
      setSpritesReady(true);
      return;
    }

    let loaded = 0;
    const total = allSprites.size;
    allSprites.forEach(spritePath => {
      const img = new Image();
      img.src = spritePath;
      img.onload = () => {
        cache.set(spritePath, img);
        loaded++;
        if (loaded >= total) setSpritesReady(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded >= total) setSpritesReady(true);
      };
    });
  }, []);

  // Expose revive method to parent
  useImperativeHandle(ref, () => ({
    revive() {
      const state = stateRef.current;
      if (!state || !state.player.isDead) return;

      // Reset player state
      // Persist existing power-ups (if any time left)
      const oldPowerUps = { ...state.player.powerUps };
      // Ensure we explicitly keep them, or if 0, they stay 0.
      state.player.powerUps = oldPowerUps;
      // Add a shield for spawn protection (don't overwrite if they had a longer one)
      state.player.powerUps.shield = Math.max(state.player.powerUps.shield, 3);

      state.player.isDead = false;
      state.player.isInvincible = true;
      state.player.invincibilityTimer = 3; // 3 seconds of safety
      state.player.isFrozen = false;
      // state.player.powerUps is already set above
      state.isGameOver = false;

      // Find a safe spot or just reset to center
      const spawnPos = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };

      // Calculate head movement to new position
      const oldHead = state.player.body[0];
      const dx = spawnPos.x - oldHead.x;
      const dy = spawnPos.y - oldHead.y;

      // Move entire body to new location
      state.player.body = state.player.body.map(seg => ({ x: seg.x + dx, y: seg.y + dy }));

      // Clear pits near spawn
      state.pits = state.pits.filter(p => Vec2.dist(p.position, spawnPos) > 400);

      // Clear bots near spawn safely
      state.bots.forEach(bot => {
        if (Vec2.dist(bot.body[0], spawnPos) < 600) {
          // Instead of freezing (which was permanent!), just move them away
          // and ensure they stay within arena bounds
          const angle = Math.atan2(bot.body[0].y - spawnPos.y, bot.body[0].x - spawnPos.x);
          const pushDist = 800;

          bot.body.forEach(seg => {
            seg.x += Math.cos(angle) * pushDist;
            seg.y += Math.sin(angle) * pushDist;

            // Constrain to map boundary
            const mapRadius = MAP_SIZE / 2;
            const distFromCenter = Math.sqrt((seg.x - mapRadius) ** 2 + (seg.y - mapRadius) ** 2);
            if (distFromCenter > mapRadius - 100) {
              const edgeAngle = Math.atan2(seg.y - mapRadius, seg.x - mapRadius);
              seg.x = mapRadius + Math.cos(edgeAngle) * (mapRadius - 100);
              seg.y = mapRadius + Math.sin(edgeAngle) * (mapRadius - 100);
            }
          });

          bot.isFrozen = false; // Force unfreeze if they were frozen during death
          bot.expression = 'scared';
          bot.expressionTimer = 1.0;
        }
      });
    }
  }));

  // Initialize Game State
  useEffect(() => {

    const bots: Worm[] = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      const name = botNameList[i % botNameList.length] || `Bot-${i}`;
      const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
      bots.push(createWorm(`bot-${i}`, name, randomPosition(MAP_SIZE), skin, true));
    }

    const food: Food[] = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      food.push(createFood(MAP_SIZE, 'regular', undefined, undefined, foodType));
    }

    // Spawn initial power-ups (more of them!)
    const powerUps: PowerUp[] = [];
    for (let i = 0; i < 5; i++) {
      powerUps.push(createPowerUp(MAP_SIZE));
    }

    // Spawn initial coins
    const collectibles: Collectible[] = [];
    for (let i = 0; i < 5; i++) {
      collectibles.push(createCollectible(MAP_SIZE, 'coin'));
    }

    // Spawn pits (hazard zones)
    const pits: Pit[] = [];
    for (let i = 0; i < pitCount; i++) {
      // Pass enabledPitTypes to ensure only selected hazards spawn
      pits.push(createPit(MAP_SIZE, pits, enabledPitTypes));
    }

    const startPos = randomPosition(MAP_SIZE);

    // Initial camera position centered on player
    const initialCamera = {
      x: startPos.x - window.innerWidth / 2,
      y: startPos.y - window.innerHeight / 2
    };

    // Create Player with safe spawn shield
    const player = createWorm('player', playerName || 'You', startPos, playerSkin, false);
    player.isInvincible = true;
    player.invincibilityTimer = 3.0;

    stateRef.current = {
      player,
      bots,
      food,
      powerUps,
      collectibles,
      pits,
      particles: [],
      camera: initialCamera,
      mapSize: { x: MAP_SIZE, y: MAP_SIZE },
      isRunning: true,
      isGameOver: false,
      highScore: 0,
    };

    startTimeRef.current = Date.now();
    lastPowerUpSpawnRef.current = Date.now();

    // Pre-cache common food emojis and power-up emojis
    const commonEmojis = ['🥬', '🥕', '🍎', '🍌', '🍔', '🍕', '🍩', '🍪', '🧲', '⚡', '❄️', '🛡️'];
    commonEmojis.forEach(emoji => {
      getEmojiSprite(emoji, 24);
      getEmojiSprite(emoji, 32);
      getEmojiSprite(emoji, 50);
    });

    // Initialize Audio
    audioController.preload();
  }, [playerName, playerSkin, botNameList, getEmojiSprite, pitCount, enabledPitTypes, foodType]);

  // Mouse Input Handling (Desktop) - Also triggers audio context
  useEffect(() => {
    const handleInteraction = () => {
      audioController.requestMusicStart();
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleInteraction();
      if (!canvasRef.current || !stateRef.current || isMobileRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = canvasRef.current.width / 2;
      const cy = canvasRef.current.height / 2;
      mouseRef.current = { x: e.clientX - rect.left - cx, y: e.clientY - rect.top - cy };
    };
    const handleMouseDown = () => {
      if (!isMobileRef.current) isMouseDownRef.current = true;
    };
    const handleMouseUp = () => {
      if (!isMobileRef.current) isMouseDownRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Touch Input Handling (Mobile)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      audioController.requestMusicStart(); // Start music on first touch
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Use CSS pixels (not DPR-scaled canvas.width) for touch zone detection
        const halfWidth = window.innerWidth / 2;
        if (touchX < halfWidth && touchIdRef.current === null) {
          touchIdRef.current = touch.identifier;
          joystickActiveRef.current = true;
          joystickOriginRef.current = { x: touchX, y: touchY };
          joystickPosRef.current = { x: touchX, y: touchY };
        } else if (touchX >= halfWidth && boostTouchIdRef.current === null) {
          boostTouchIdRef.current = touch.identifier;
          isMouseDownRef.current = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === touchIdRef.current) {
          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;

          const dx = touchX - joystickOriginRef.current.x;
          const dy = touchY - joystickOriginRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = JOYSTICK_SIZE / 2;

          if (dist > maxDist) {
            joystickPosRef.current = {
              x: joystickOriginRef.current.x + (dx / dist) * maxDist,
              y: joystickOriginRef.current.y + (dy / dist) * maxDist
            };
          } else {
            joystickPosRef.current = { x: touchX, y: touchY };
          }

          mouseRef.current = {
            x: joystickPosRef.current.x - joystickOriginRef.current.x,
            y: joystickPosRef.current.y - joystickOriginRef.current.y
          };
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          joystickActiveRef.current = false;
        }

        if (touch.identifier === boostTouchIdRef.current) {
          boostTouchIdRef.current = null;
          isMouseDownRef.current = false;
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Image cache for skins
  const skinCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper to get or load skin image
  const getSkinImage = useCallback((url: string): HTMLImageElement | null => {
    if (skinCacheRef.current.has(url)) {
      const img = skinCacheRef.current.get(url)!;
      return img.complete ? img : null;
    }
    const img = new Image();
    img.src = url;
    skinCacheRef.current.set(url, img);
    return null;
  }, []);

  // --------------- RENDER LOOP -----------------
  // Render loop moved to useEffect below

  // Optimized worm drawing function
  const drawWormOptimized = useCallback((ctx: CanvasRenderingContext2D, w: Worm, camera: Vector2, worldWidth: number, worldHeight: number, animTime: number) => {
    if (w.isDead && w.id !== 'player') return;

    const head = w.body[0];
    // Quick bounds check - skip if worm head is far off screen (using world dimensions)
    // Relaxed margin to 1000 to account for long snake bodies trailing into the viewport
    if (head.x < camera.x - 1000 || head.x > camera.x + worldWidth + 1000 ||
      head.y < camera.y - 1000 || head.y > camera.y + worldHeight + 1000) return;

    ctx.save();
    if (w.isInvincible) {
      ctx.globalAlpha = 0.4 + Math.abs(Math.sin(animTime * 10)) * 0.4;
    }

    const isImageSkin = w.skin.type === 'image' && w.skin.images;
    const isCompositeSkin = false; // DISABLED: composite rendering causes canvas corruption. Falls back to color rendering.

    // Determine overlapping factor for body segments
    const totalSegments = w.body.length;
    // Optimize: Draw fewer segments for image/composite skins
    const baseSkip = (isImageSkin || isCompositeSkin) ? 3 : 1;
    const skipFactor = Math.max(baseSkip, Math.ceil(totalSegments / MAX_VISIBLE_SEGMENTS));

    // Draw body segments (from tail to head)
    for (let i = totalSegments - 1; i >= 1; i -= skipFactor) {
      const pos = w.body[i];
      // Skip segments outside viewport or with invalid coordinates
      if (!pos || isNaN(pos.x) || isNaN(pos.y) ||
        pos.x < camera.x - 200 || pos.x > camera.x + worldWidth + 200 ||
        pos.y < camera.y - 200 || pos.y > camera.y + worldHeight + 200) continue;

      const adjustedRadius = w.radius * (skipFactor > 1 ? 1.2 : 1);

      if (isImageSkin && w.skin.images?.body) {
        const bodyImg = getSkinImage(w.skin.images.body);
        if (bodyImg) {
          const nextPos = w.body[Math.max(0, i - 1)];
          const prevPos = w.body[Math.min(totalSegments - 1, i + 1)];
          const angle = Math.atan2(nextPos.y - prevPos.y, nextPos.x - prevPos.x);

          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(angle);

          if (i >= totalSegments - 1 - skipFactor && w.skin.images.tail) {
            const tailImg = getSkinImage(w.skin.images.tail);
            if (tailImg) {
              ctx.save();
              ctx.rotate(Math.sin(animTime * 15) * 0.2);
              ctx.drawImage(tailImg, -adjustedRadius * 1.5, -adjustedRadius, adjustedRadius * 3, adjustedRadius * 2);
              ctx.restore();
            }
          }

          ctx.drawImage(bodyImg, -adjustedRadius, -adjustedRadius, adjustedRadius * 2, adjustedRadius * 2);
          ctx.restore();
        } else {
          // Fallback to color
          const colorIdx = Math.floor(i / 2) % w.skin.colors.length;
          ctx.fillStyle = w.skin.colors[colorIdx];
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, adjustedRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const colorIdx = Math.floor(i / 2) % w.skin.colors.length;
        const color = w.skin.colors[colorIdx];

        ctx.fillStyle = color;

        // Pattern: Electric/Neon Glow
        const isElectric = w.skin.pattern === 'electric';
        if (isElectric) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, adjustedRadius, 0, Math.PI * 2);
        ctx.fill();

        if (isElectric) ctx.shadowBlur = 0;

        // Pattern: Spots
        if (w.skin.pattern === 'spots' && i % 4 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.arc(pos.x + adjustedRadius * 0.2, pos.y - adjustedRadius * 0.2, adjustedRadius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pattern: Cracks/Texture (Simple lines)
        if (w.skin.pattern === 'cracks' && i % 3 === 0) {
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x - adjustedRadius * 0.5, pos.y);
          ctx.lineTo(pos.x + adjustedRadius * 0.5, pos.y);
          ctx.stroke();
        }

        // 3D Shine (Glossy look)
        if (!isElectric) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.ellipse(pos.x - adjustedRadius * 0.2, pos.y - adjustedRadius * 0.2, adjustedRadius * 0.3, adjustedRadius * 0.15, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Always draw the head
    const headPos = w.body[0];

    if (isImageSkin) {
      const headImg = getSkinImage(w.skin.images.head);
      if (headImg) {
        ctx.save();
        ctx.translate(headPos.x, headPos.y);
        ctx.rotate(w.angle);
        const headSize = w.radius * 2.4;
        ctx.drawImage(headImg, -headSize / 2, -headSize / 2, headSize, headSize);
        ctx.restore();
      } else {
        // Fallback
        ctx.fillStyle = w.skin.headColor;
        ctx.beginPath();
        ctx.arc(headPos.x, headPos.y, w.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = w.skin.headColor;
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, w.radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Draw animated expressive face (ONLY IF NOT IMAGE SKIN)
      ctx.save();
      ctx.translate(headPos.x, headPos.y);
      ctx.rotate(w.angle);
      const r = w.radius;
      const bounce = Math.sin(animTime * 8) * 0.1; // Subtle animation bounce
      const intensity = w.expressionIntensity || 0.5;

      // Eye positions
      const eyeX = r * 0.45;
      const eyeY1 = -r * 0.35;
      const eyeY2 = r * 0.35;
      const eyeSize = r * 0.28;
      const pupilSize = r * 0.14;

      switch (w.expression) {
        case 'eating': // 😊 Happy/Smiling - squinted happy eyes with smile
          // Squinted happy eyes (curved lines)
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.08;
          ctx.lineCap = 'round';

          // Top eye - happy arc
          ctx.beginPath();
          ctx.arc(eyeX, eyeY1, eyeSize * 0.6, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();

          // Bottom eye - happy arc
          ctx.beginPath();
          ctx.arc(eyeX, eyeY2, eyeSize * 0.6, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();

          // Big smile
          ctx.beginPath();
          ctx.arc(r * 0.7, 0, r * 0.25, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();

          // Blush cheeks
          ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
          ctx.beginPath();
          ctx.arc(r * 0.3, eyeY1 + r * 0.15, r * 0.12, 0, Math.PI * 2);
          ctx.arc(r * 0.3, eyeY2 - r * 0.15, r * 0.12, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'killer': // 😂 Laughing - closed eyes, big open mouth
          // Closed laughing eyes (upward arcs)
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.1;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.arc(eyeX, eyeY1, eyeSize * 0.5, Math.PI * 1.2, Math.PI * 1.8);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(eyeX, eyeY2, eyeSize * 0.5, Math.PI * 1.2, Math.PI * 1.8);
          ctx.stroke();

          // Big open laughing mouth
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.ellipse(r * 0.75, 0, r * 0.2 + bounce * r, r * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tongue
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.ellipse(r * 0.8, 0, r * 0.1, r * 0.15, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tears of joy
          ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
          const tearY = Math.sin(animTime * 12) * r * 0.1;
          ctx.beginPath();
          ctx.ellipse(eyeX - r * 0.15, eyeY1 + tearY, r * 0.06, r * 0.1, 0.3, 0, Math.PI * 2);
          ctx.ellipse(eyeX - r * 0.15, eyeY2 + tearY, r * 0.06, r * 0.1, -0.3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'sad': // 😢 Crying - droopy eyes with tears
          // Sad droopy eyes
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.ellipse(eyeX, eyeY1, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
          ctx.ellipse(eyeX, eyeY2, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sad pupils looking down
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(eyeX + r * 0.05, eyeY1 + r * 0.08, pupilSize, 0, Math.PI * 2);
          ctx.arc(eyeX + r * 0.05, eyeY2 + r * 0.08, pupilSize, 0, Math.PI * 2);
          ctx.fill();

          // Sad eyebrows
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.06;
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeSize, eyeY1 - eyeSize * 0.8);
          ctx.lineTo(eyeX + eyeSize * 0.5, eyeY1 - eyeSize * 1.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeSize, eyeY2 + eyeSize * 0.8);
          ctx.lineTo(eyeX + eyeSize * 0.5, eyeY2 + eyeSize * 1.2);
          ctx.stroke();

          // Sad mouth
          ctx.beginPath();
          ctx.arc(r * 0.7, r * 0.15, r * 0.15, Math.PI * 1.2, Math.PI * 1.8);
          ctx.stroke();

          // Animated tears
          ctx.fillStyle = 'rgba(100, 180, 255, 0.9)';
          const tearDrop = (animTime * 3) % 1;
          ctx.beginPath();
          ctx.ellipse(eyeX - r * 0.2, eyeY1 + r * 0.3 + tearDrop * r * 0.5, r * 0.05, r * 0.12, 0, 0, Math.PI * 2);
          ctx.ellipse(eyeX - r * 0.2, eyeY2 - r * 0.3 - tearDrop * r * 0.5, r * 0.05, r * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'frustrated': // 😠 Angry/Frustrated - angry eyebrows, gritted teeth
          // Angry eyes
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(eyeX, eyeY1, eyeSize, 0, Math.PI * 2);
          ctx.arc(eyeX, eyeY2, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Angry pupils (looking forward intensely)
          ctx.fillStyle = '#cc0000';
          ctx.beginPath();
          ctx.arc(eyeX + r * 0.08, eyeY1, pupilSize * 1.2, 0, Math.PI * 2);
          ctx.arc(eyeX + r * 0.08, eyeY2, pupilSize * 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Angry eyebrows (V shape)
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeSize * 1.2, eyeY1 - eyeSize * 0.5);
          ctx.lineTo(eyeX + eyeSize * 0.8, eyeY1 - eyeSize * 1.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeSize * 1.2, eyeY2 + eyeSize * 0.5);
          ctx.lineTo(eyeX + eyeSize * 0.8, eyeY2 + eyeSize * 1.2);
          ctx.stroke();

          // Gritted teeth mouth
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.04;
          ctx.beginPath();
          ctx.roundRect(r * 0.55, -r * 0.15, r * 0.35, r * 0.3, r * 0.05);
          ctx.fill();
          ctx.stroke();
          // Teeth lines
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(r * 0.62 + i * r * 0.1, -r * 0.15);
            ctx.lineTo(r * 0.62 + i * 0.1, r * 0.15);
            ctx.stroke();
          }
          break;

        case 'scared': // 😱 Scared - wide eyes, small O mouth
          // Wide scared eyes
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(eyeX, eyeY1, eyeSize * 1.3, 0, Math.PI * 2);
          ctx.arc(eyeX, eyeY2, eyeSize * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Tiny scared pupils
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(eyeX + r * 0.05, eyeY1, pupilSize * 0.6, 0, Math.PI * 2);
          ctx.arc(eyeX + r * 0.05, eyeY2, pupilSize * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Raised eyebrows
          ctx.strokeStyle = 'black';
          ctx.lineWidth = r * 0.06;
          ctx.beginPath();
          ctx.arc(eyeX, eyeY1 - eyeSize * 1.5, eyeSize, Math.PI * 0.3, Math.PI * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(eyeX, eyeY2 + eyeSize * 1.5, eyeSize, -Math.PI * 0.7, -Math.PI * 0.3);
          ctx.stroke();

          // Small O mouth
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(r * 0.7, 0, r * 0.12 + bounce * r * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;

        default: // 😐 Neutral - normal eyes
          // Normal round eyes
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(eyeX, eyeY1, eyeSize, 0, Math.PI * 2);
          ctx.arc(eyeX, eyeY2, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Normal pupils
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(eyeX + r * 0.05, eyeY1, pupilSize, 0, Math.PI * 2);
          ctx.arc(eyeX + r * 0.05, eyeY2, pupilSize, 0, Math.PI * 2);
          ctx.fill();

          // Eye shine
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(eyeX + r * 0.02, eyeY1 - r * 0.05, pupilSize * 0.4, 0, Math.PI * 2);
          ctx.arc(eyeX + r * 0.02, eyeY2 - r * 0.05, pupilSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }

    // Fallback block removed to restore animated faces
    ctx.restore();
  }, [getSkinImage]);

  // Draw virtual joystick
  const drawJoystick = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!isMobileRef.current) return;

    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    const baseX = joystickActiveRef.current
      ? joystickOriginRef.current.x
      : JOYSTICK_MARGIN + JOYSTICK_SIZE / 2;
    const baseY = joystickActiveRef.current
      ? joystickOriginRef.current.y
      : cssHeight - JOYSTICK_MARGIN - JOYSTICK_SIZE / 2;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(baseX, baseY, JOYSTICK_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const knobX = joystickActiveRef.current ? joystickPosRef.current.x : baseX;
    const knobY = joystickActiveRef.current ? joystickPosRef.current.y : baseY;

    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(knobX, knobY, JOYSTICK_KNOB_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Boost button — use CSS pixel dimensions
    const boostX = cssWidth - JOYSTICK_MARGIN - JOYSTICK_SIZE / 2;
    const boostY = cssHeight - JOYSTICK_MARGIN - JOYSTICK_SIZE / 2;
    const boostRadius = JOYSTICK_SIZE / 2.5;

    ctx.save();
    ctx.globalAlpha = isMouseDownRef.current ? 0.9 : 0.4;
    ctx.beginPath();
    ctx.arc(boostX, boostY, boostRadius, 0, Math.PI * 2);
    ctx.fillStyle = isMouseDownRef.current ? '#f97316' : 'rgba(249, 115, 22, 0.5)';
    ctx.fill();
    ctx.strokeStyle = isMouseDownRef.current ? '#fb923c' : 'rgba(251, 146, 60, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Icon (Sprite or fallback)
    const speedSprite = powerUpSpritesRef.current.get(POWER_UP_CONFIG.speed.sprite);
    if (speedSprite && speedSprite.complete) {
      const iconSize = boostRadius * 1.2;
      ctx.globalAlpha = isMouseDownRef.current ? 1 : 0.8;
      ctx.drawImage(speedSprite, boostX - iconSize / 2, boostY - iconSize / 2, iconSize, iconSize);
    } else {
      ctx.globalAlpha = isMouseDownRef.current ? 1 : 0.6;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', boostX, boostY);
    }

    ctx.restore();
  }, []);

  // Game Loop
  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const deltaTime = Math.min((now - lastFrameTimeRef.current) / 1000, 0.033); // Cap at 30FPS minimum
      lastFrameTimeRef.current = now;
      frameCountRef.current++;

      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) {
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        return;
      }

      const animTime = now / 1000;

      // Reset canvas transform to identity at start of each frame
      // This prevents any accumulated transform corruption
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.scale(dpr, dpr);

      // --- Update Logic ---
      if (!isPaused && !state.isGameOver) {
        state.player.targetAngle = Math.atan2(mouseRef.current.y, mouseRef.current.x);
        state.player.isBoosting = isMouseDownRef.current;

        // Speed boost power-up - auto-boost without losing score!
        if (state.player.powerUps.speed > 0) {
          state.player.isBoosting = true;
          // Temporarily prevent score loss from boosting
          state.player.score += 0.3; // Compensate for boost score drain
        }

        const playerHitWall = updateWormPosition(state.player, MAP_SIZE, deltaTime);

        if (playerHitWall) {
          state.isGameOver = true;
          state.player.isDead = true;
          audioController.play('collision');
          onGameOver(state.player.score, (Date.now() - startTimeRef.current) / 1000, 'The Wall', state.player.killCount);
        }

        // Check pit collisions for player
        if (!state.player.isDead && !state.player.isInvincible) {
          for (const pit of state.pits) {
            const distToPit = Vec2.dist(state.player.body[0], pit.position);
            if (distToPit < pit.radius - state.player.radius * 0.5) {
              state.isGameOver = true;
              state.player.isDead = true;
              audioController.play('collision');
              const pitConfig = PIT_CONFIG[pit.type];
              onGameOver(state.player.score, (Date.now() - startTimeRef.current) / 1000, pitConfig.name, state.player.killCount);
              break;
            }
          }
        }

        // Update bots with distance-based optimization
        const playerHead = state.player.body[0];
        const botsToRemove: number[] = [];

        for (let i = 0; i < state.bots.length; i++) {
          const bot = state.bots[i];

          // 1. Update power-up timers for bots (FIX: was missing)
          const botPowerUpTypes: (keyof typeof bot.powerUps)[] = ['magnet', 'speed', 'freeze', 'shield'];
          botPowerUpTypes.forEach(type => {
            if (bot.powerUps[type] > 0) {
              bot.powerUps[type] -= deltaTime;
              if (bot.powerUps[type] <= 0) {
                bot.powerUps[type] = 0;
                if (type === 'shield') bot.isInvincible = false;
              }
            }
          });

          // Skip frozen bots (from freeze power-up)!
          if (bot.isFrozen) {
            // Safety: If player doesn't have freeze power-up, bot shouldn't be frozen
            if (state.player.powerUps.freeze <= 0) {
              bot.isFrozen = false;
            } else {
              continue;
            }
          }

          const distToPlayer = Vec2.dist(playerHead, bot.body[0]);
          const mapRadius = MAP_SIZE / 2;
          const distFromCenter = Math.sqrt((bot.body[0].x - mapRadius) ** 2 + (bot.body[0].y - mapRadius) ** 2);
          const isNearBoundary = distFromCenter > mapRadius - 600; // Increased margin for AI activation

          // Always update AI if near boundary (FIX: prevents getting stuck)
          // otherwise use distance-based optimization
          if (isNearBoundary || distToPlayer < 1200) {
            updateBotAI(bot, state.food, [state.player, ...state.bots], MAP_SIZE);
          } else if (distToPlayer < 2400 && frameCountRef.current % 3 === 0) {
            // Update distant bots less frequently
            updateBotAI(bot, state.food, [state.player, ...state.bots], MAP_SIZE);
          }

          const botHitWall = updateWormPosition(bot, MAP_SIZE, deltaTime);
          if (botHitWall) {
            botsToRemove.push(i);
          }

          // Check pit collisions for bots
          if (!botsToRemove.includes(i)) {
            for (const pit of state.pits) {
              const distToPit = Vec2.dist(bot.body[0], pit.position);
              if (distToPit < pit.radius - bot.radius * 0.5) {
                botsToRemove.push(i);
                break;
              }
            }
          }
        }

        // Remove bots that hit walls and respawn
        for (let i = botsToRemove.length - 1; i >= 0; i--) {
          const idx = botsToRemove[i];
          state.bots.splice(idx, 1);
          const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
          state.bots.push(createWorm(`bot-${Date.now()}-${Math.random()}`, "Bot", randomPosition(MAP_SIZE), skin, true));
        }

        // Optimized collision detection - only check nearby worms
        const nearbyWorms = state.bots.filter(bot =>
          Vec2.dist(playerHead, bot.body[0]) < 600
        );

        const allWorms = [state.player, ...nearbyWorms];
        const { deadWormIds, killerIds } = checkCollisions(allWorms);

        if (deadWormIds.includes(state.player.id)) {
          state.isGameOver = true;
          state.player.isDead = true;
          const killerIndex = deadWormIds.indexOf(state.player.id);
          const killerId = killerIds[killerIndex] || 'Unknown';
          let killerName = 'Yourself';
          const killerWorm = allWorms.find(w => w.id === killerId);
          if (killerWorm) killerName = killerWorm.name;
          onGameOver(state.player.score, (Date.now() - startTimeRef.current) / 1000, killerName, state.player.killCount);
          audioController.play('collision');
        }

        // Handle bot deaths from collisions
        deadWormIds.forEach(id => {
          if (id === state.player.id) return;
          const botIndex = state.bots.findIndex(b => b.id === id);
          if (botIndex !== -1) {
            const deadBot = state.bots[botIndex];
            // Drop fewer food items for performance (max 15 items)
            const dropCount = Math.min(10, Math.floor(deadBot.body.length / 15)); // Reduced drop count

            // Remove old food if we are over the limit
            if (state.food.length + dropCount > MAX_TOTAL_FOOD) {
              const excess = (state.food.length + dropCount) - MAX_TOTAL_FOOD;
              state.food.splice(0, excess); // Remove oldest food
            }

            for (let i = 0; i < dropCount; i++) {
              const segIndex = Math.floor(i * deadBot.body.length / dropCount);
              state.food.push(createFood(MAP_SIZE, 'remains', deadBot.body[segIndex], undefined, foodType));
            }

            // Check if player killed this bot → drop COINS!
            const deadIdx = deadWormIds.indexOf(id);
            if (deadIdx !== -1 && killerIds[deadIdx] === state.player.id) {
              // Drop 3-5 coins scattered around the head
              const coinCount = 3 + Math.floor(Math.random() * 3);
              for (let c = 0; c < coinCount; c++) {
                const offset = {
                  x: (Math.random() - 0.5) * 60,
                  y: (Math.random() - 0.5) * 60
                };
                const pos = { x: deadBot.body[0].x + offset.x, y: deadBot.body[0].y + offset.y };
                state.collectibles.push(createCollectible(MAP_SIZE, 'coin', pos));
              }
            }

            state.bots.splice(botIndex, 1);
            const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
            state.bots.push(createWorm(`bot-${Date.now()}`, "Bot", randomPosition(MAP_SIZE), skin, true));
          }
        });

        // Optimized food eating - only check nearby food
        const eatRadius = state.player.radius + 20;
        const playerAteFood: number[] = [];

        for (let i = state.food.length - 1; i >= 0; i--) {
          const f = state.food[i];
          const distToPlayer = Vec2.dist(playerHead, f.position);

          if (distToPlayer < eatRadius) {
            state.player.score += f.value;
            state.player.radius = BASE_RADIUS + Math.sqrt(state.player.score) * 0.04;
            playerAteFood.push(i);

            // 😊 EATING expression - happy when eating!
            state.player.expression = 'eating';
            state.player.expressionTimer = 0.5;
            state.player.expressionIntensity = 0.8;

            state.player.expressionIntensity = 0.8;

            if (f.type !== 'remains') state.food.push(createFood(MAP_SIZE, 'regular', undefined, undefined, foodType));

            // Audio: Play sound for every food item (allow overlap for satisfaction)
            audioController.play('food', true);
          }
        }

        // Remove eaten food
        for (let i = playerAteFood.length - 1; i >= 0; i--) {
          state.food.splice(playerAteFood[i], 1);
        }

        // Check if player should be FRUSTRATED (enemy snake very close)
        if (state.player.expression === 'neutral' || state.player.expressionTimer <= 0) {
          const veryCloseThreats = nearbyWorms.filter(bot =>
            Vec2.dist(playerHead, bot.body[0]) < 150
          ).length;

          if (veryCloseThreats > 0) {
            // 😠 FRUSTRATED expression - when enemies are too close!
            state.player.expression = 'frustrated';
            state.player.expressionTimer = 0.3;
            state.player.expressionIntensity = Math.min(1, veryCloseThreats * 0.4);
          }
        }

        // Bot eating - less frequent, with sad expression trigger for player
        if (frameCountRef.current % 2 === 0) {
          state.bots.forEach(bot => {
            for (let i = state.food.length - 1; i >= 0; i--) {
              const f = state.food[i];
              if (Vec2.dist(bot.body[0], f.position) < bot.radius + 15) {
                // Check if player was close to this food (they'll be sad!)
                const playerWasClose = Vec2.dist(playerHead, f.position) < 80;

                bot.score += f.value;
                bot.radius = BASE_RADIUS + Math.sqrt(bot.score) * 0.04;

                // Bot gets happy eating
                bot.expression = 'eating';
                bot.expressionTimer = 0.4;
                bot.expressionIntensity = 0.7;

                state.food.splice(i, 1);
                if (f.type !== 'remains') state.food.push(createFood(MAP_SIZE, 'regular', undefined, undefined, foodType));

                // 😢 SAD expression - player sad when bot steals their food!
                if (playerWasClose && state.player.expression !== 'eating') {
                  state.player.expression = 'sad';
                  state.player.expressionTimer = 1.0;
                  state.player.expressionIntensity = 0.9;
                }

                break; // Only eat one food per frame
              }
            }
          });
        }

        // Update expression timers for all worms
        if (state.player.expressionTimer > 0) {
          state.player.expressionTimer -= deltaTime;
          if (state.player.expressionTimer <= 0) {
            state.player.expression = 'neutral';
            state.player.expressionIntensity = 0;
          }
        }

        state.bots.forEach(bot => {
          if (bot.expressionTimer > 0) {
            bot.expressionTimer -= deltaTime;
            if (bot.expressionTimer <= 0) {
              bot.expression = 'neutral';
              bot.expressionIntensity = 0;
            }
          }
        });

        // Bot Power-Up Collection (Added Feature)
        // Bots can take all power-ups EXCEPT Freeze
        if (frameCountRef.current % 3 === 0) { // Check every few frames
          state.bots.forEach(bot => {
            for (let i = state.powerUps.length - 1; i >= 0; i--) {
              const pu = state.powerUps[i];
              // Bots can't pick up Freeze
              if (pu.type === 'freeze') continue;

              if (Vec2.dist(bot.body[0], pu.position) < bot.radius + pu.radius) {
                // Bot collects power-up!
                state.powerUps.splice(i, 1);

                // Apply effect
                bot.powerUps[pu.type] = pu.duration;
                if (pu.type === 'shield') bot.isInvincible = true;

                // Bot happiness
                bot.expression = 'eating';
                bot.expressionTimer = 1.0;
                bot.expressionIntensity = 1.0;
                break; // One per frame
              }
            }
          });
        }

        // ============ POWER-UP SYSTEM ============

        // Spawn new power-ups periodically
        const timeSinceLastSpawn = (Date.now() - lastPowerUpSpawnRef.current) / 1000;
        if (timeSinceLastSpawn > POWER_UP_SPAWN_INTERVAL && state.powerUps.length < MAX_POWER_UPS) {
          state.powerUps.push(createPowerUp(MAP_SIZE));
          lastPowerUpSpawnRef.current = Date.now();
        }

        // Player power-up collection
        for (let i = state.powerUps.length - 1; i >= 0; i--) {
          const pu = state.powerUps[i];
          const distToPlayer = Vec2.dist(playerHead, pu.position);

          if (distToPlayer < state.player.radius + pu.radius) {
            // Collect power-up!
            const config = POWER_UP_CONFIG[pu.type];
            // Apply upgrade-level duration scaling
            const upgradeLevel = upgradeLevelsRef.current[pu.type] || 0;
            const scaledDuration = pu.duration * UPGRADE_DURATION_MULTIPLIER(upgradeLevel);
            state.player.powerUps[pu.type] = scaledDuration;

            // Show collection message (FIX: Use type instead of emoji)
            activePowerUpMessageRef.current = {
              text: `${config.name}!`,
              type: pu.type, // Store type to look up sprite
              color: config.color,
              timer: 2
            };

            // Apply immediate effects
            if (pu.type === 'shield') {
              state.player.isInvincible = true;
            }
            if (pu.type === 'freeze') {
              // Freeze all bots!
              state.bots.forEach(bot => {
                bot.isFrozen = true;
              });
            }

            state.powerUps.splice(i, 1);
            audioController.play('powerup');
          }
        }

        // Update player's active power-up timers
        const powerUpTypes: (keyof typeof state.player.powerUps)[] = ['magnet', 'speed', 'freeze', 'shield'];
        powerUpTypes.forEach(type => {
          if (state.player.powerUps[type] > 0) {
            state.player.powerUps[type] -= deltaTime;

            if (state.player.powerUps[type] <= 0) {
              state.player.powerUps[type] = 0;

              // Remove effects when timer expires
              if (type === 'shield') {
                state.player.isInvincible = false;
              }
              if (type === 'freeze') {
                state.bots.forEach(bot => {
                  bot.isFrozen = false;
                });
              }
            }
          }
        });

        // MAGNET effect - attract nearby food
        if (state.player.powerUps.magnet > 0) {
          const magnetRange = 200;
          state.food.forEach(f => {
            const dist = Vec2.dist(playerHead, f.position);
            if (dist < magnetRange && dist > 10) {
              // Pull food towards player
              const pullStrength = 8;
              const dx = playerHead.x - f.position.x;
              const dy = playerHead.y - f.position.y;
              const pullFactor = pullStrength / dist;
              f.position.x += dx * pullFactor;
              f.position.y += dy * pullFactor;
            }
          });
        }

        // Update power-up message timer
        if (activePowerUpMessageRef.current) {
          activePowerUpMessageRef.current.timer -= deltaTime;
          if (activePowerUpMessageRef.current.timer <= 0) {
            activePowerUpMessageRef.current = null;
          }
        }

        // ============ COIN / DIAMOND SYSTEM ============

        // Spawn coins periodically (max on map)
        const timeSinceLastCoin = (Date.now() - lastCoinSpawnRef.current) / 1000;
        const coinsOnMap = state.collectibles.filter(c => c.type === 'coin').length;
        if (timeSinceLastCoin > COIN_CONFIG.spawnInterval && coinsOnMap < COIN_CONFIG.maxOnMap) {
          state.collectibles.push(createCollectible(MAP_SIZE, 'coin'));
          lastCoinSpawnRef.current = Date.now();
        }

        // Player-only collectible pickup
        for (let i = state.collectibles.length - 1; i >= 0; i--) {
          const c = state.collectibles[i];
          const distToPlayer = Vec2.dist(playerHead, c.position);
          if (distToPlayer < state.player.radius + c.radius) {
            // Collect!
            const newWallet = { ...walletRef.current };
            if (c.type === 'coin') {
              newWallet.coins += 1;
              floatingTextsRef.current.push({ text: '+1 🪙', x: c.position.x, y: c.position.y, timer: 1.5, color: '#ffd700' });
            } else {
              newWallet.diamonds += 1;
              floatingTextsRef.current.push({ text: '+1 💎', x: c.position.x, y: c.position.y, timer: 1.5, color: '#4fc3f7' });
            }
            onWalletChange(newWallet);
            state.collectibles.splice(i, 1);
            if (c.type === 'coin') audioController.play('coin');
            // Can add diamond sound later if needed
          } else if (c.type === 'coin' && Date.now() - c.spawnTime > 15000) {
            // Expire Coin after 15s and Respawn Elsewhere
            state.collectibles.splice(i, 1);
            // Push new one immediately to maintain count, at random pos
            state.collectibles.push(createCollectible(MAP_SIZE, 'coin'));
          }
        }

        // Update floating texts
        floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
          ft.timer -= deltaTime;
          ft.y -= 40 * deltaTime; // Float upward
          return ft.timer > 0;
        });
      }

      // --- Render Logic ---
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;

      // Define Zoom factor (More zoomed out on mobile for better visibility)
      const zoom = isMobileRef.current ? 0.6 : 0.8;

      // Calculate viewport dimensions in world-space
      const worldViewWidth = canvasWidth / zoom;
      const worldViewHeight = canvasHeight / zoom;

      // Smooth camera follow (Centered on player head)
      const targetCamX = state.player.body[0].x - worldViewWidth / 2;
      const targetCamY = state.player.body[0].y - worldViewHeight / 2;
      state.camera.x += (targetCamX - state.camera.x) * 0.08;
      state.camera.y += (targetCamY - state.camera.y) * 0.08;

      // Clear canvas (Solid Background)
      const arenaConfig = ARENA_CONFIG[arenaId] || ARENA_CONFIG['dark'];
      ctx.fillStyle = arenaConfig.colors.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // --- World Space Rendering (Apply Zoom & Camera) ---
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-state.camera.x, -state.camera.y);

      // 1. Draw Map Boundary & Grid (Inside Scaled Space)
      drawWorldGrid(ctx, state.camera, worldViewWidth, worldViewHeight, arenaId);

      // Draw Pits (Hazard Zones) with animated effects
      state.pits.forEach(pit => {
        // Check if visible (using world dimensions)
        if (pit.position.x < state.camera.x - pit.radius - 50 || pit.position.x > state.camera.x + worldViewWidth + pit.radius + 50 ||
          pit.position.y < state.camera.y - pit.radius - 50 || pit.position.y > state.camera.y + worldViewHeight + pit.radius + 50) return;

        const config = PIT_CONFIG[pit.type];
        const pulse = Math.sin(animTime * 3) * 0.15 + 0.85;

        ctx.save();
        ctx.translate(pit.position.x, pit.position.y);

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(0, 0, pit.radius * 1.15, 0, Math.PI * 2);
        ctx.strokeStyle = config.glowColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Main pit gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pit.radius);
        gradient.addColorStop(0, config.innerColor);
        gradient.addColorStop(0.5, config.baseColor);
        gradient.addColorStop(0.9, config.glowColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');

        ctx.beginPath();
        ctx.arc(0, 0, pit.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner darkness/depth
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pit.radius * 0.5);
        innerGradient.addColorStop(0, 'rgba(0,0,0,0.9)');
        innerGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(0, 0, pit.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();

        // Type-specific effects
        if (pit.type === 'lava') {
          // Lava bubbles
          for (let i = 0; i < 6; i++) {
            const angle = (animTime * 0.5 + i * Math.PI / 3) % (Math.PI * 2);
            const dist = pit.radius * 0.4 + Math.sin(animTime * 2 + i) * 20;
            const bx = Math.cos(angle) * dist;
            const by = Math.sin(angle) * dist;
            const bsize = 6 + Math.sin(animTime * 3 + i) * 3;
            ctx.beginPath();
            ctx.arc(bx, by, bsize, 0, Math.PI * 2);
            ctx.fillStyle = '#ffff00';
            ctx.fill();
          }
        } else if (pit.type === 'void') {
          // Spiral effect
          ctx.save();
          ctx.rotate(animTime);
          ctx.strokeStyle = 'rgba(150, 100, 255, 0.4)';
          ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, pit.radius * (0.3 + i * 0.2), 0, Math.PI * 1.5);
            ctx.stroke();
          }
          ctx.restore();
        } else if (pit.type === 'acid') {
          // Bubbling effect
          for (let i = 0; i < 8; i++) {
            const bx = Math.sin(animTime * 2 + i * 1.2) * pit.radius * 0.5;
            const by = Math.cos(animTime * 1.5 + i * 0.8) * pit.radius * 0.5;
            const bsize = 4 + Math.sin(animTime * 4 + i) * 2;
            ctx.beginPath();
            ctx.arc(bx, by, bsize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
          }
        } else if (pit.type === 'electric') {
          // Electric sparks
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const angle = (animTime * 3 + i * Math.PI / 2) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const x1 = Math.cos(angle) * pit.radius * 0.3;
            const y1 = Math.sin(angle) * pit.radius * 0.3;
            ctx.lineTo(x1, y1);
            const x2 = Math.cos(angle + 0.3) * pit.radius * 0.5;
            const y2 = Math.sin(angle + 0.3) * pit.radius * 0.5;
            ctx.lineTo(x2, y2);
            const x3 = Math.cos(angle) * pit.radius * 0.7;
            const y3 = Math.sin(angle) * pit.radius * 0.7;
            ctx.lineTo(x3, y3);
            ctx.stroke();
          }
        }

        // Warning icon in center
        ctx.font = `bold ${pit.radius * 0.4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.7 + Math.sin(animTime * 4) * 0.3;
        const icon = pit.type === 'lava' ? '🔥' : pit.type === 'void' ? '🕳️' : pit.type === 'acid' ? '☠️' : '⚡';
        ctx.fillText(icon, 0, 0);
        ctx.globalAlpha = 1;

        ctx.restore();
      });


      // Food (optimized with cached sprites and frustum culling)
      const viewMargin = 400; // Increased margin to preventing popping
      const visibleFood = state.food.filter(f =>
        f.position.x >= state.camera.x - viewMargin &&
        f.position.x <= state.camera.x + worldViewWidth + viewMargin &&
        f.position.y >= state.camera.y - viewMargin &&
        f.position.y <= state.camera.y + worldViewHeight + viewMargin
      );

      // Super fast food rendering with visual improvements
      for (const f of visibleFood) {
        let renderRadius = f.radius;
        const isRemains = f.type === 'remains';

        // Floating bob animation for all food
        const bobOffset = Math.sin(animTime * 2.5 + f.position.x * 0.05 + f.position.y * 0.03) * 3;
        const drawY = f.position.y + bobOffset;

        if (isRemains) {
          // Dramatic pulsing for remains
          const pulse = 1 + Math.sin(animTime * 5 + f.position.x * 0.02) * 0.35;
          renderRadius = f.radius * pulse;

          // Subtle light for remains (less "bubbly")
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.4 + Math.sin(animTime * 3) * 0.1;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(f.position.x, drawY, renderRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // No "bubble" glow for regular food - cleaner look
          // Just the sprite bobbing/rotating
        }

        const spriteImg = f.sprite ? foodSpritesRef.current.get(f.sprite) || null : null;

        if (spriteImg && spriteImg.complete && spriteImg.width > 0) {
          // Individual Sprite Drawing with gentle rotation
          const drawSize = renderRadius * 3.5; // Increased from 2.8 for better visibility
          const rot = Math.sin(animTime * 1.5 + f.position.x * 0.1) * 0.1; // gentle wobble
          ctx.save();
          ctx.translate(f.position.x, drawY);
          ctx.rotate(rot);
          ctx.drawImage(spriteImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          ctx.restore();
        } else {
          // Fallback Logic (Emoji or Circle)
          if (f.emoji) {
            try {
              const baseSize = Math.round(f.radius * 2.5); // Increased
              const sprite = getEmojiSprite(f.emoji, baseSize);
              const drawSize = renderRadius * 2.5; // Increased
              ctx.drawImage(sprite, f.position.x - renderRadius * 1.25, f.position.y - renderRadius * 1.25, drawSize, drawSize);
            } catch {
              ctx.font = `${renderRadius * 2.5}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(f.emoji, f.position.x, f.position.y);
            }
          } else {
            // Simple Colored Circle (for new food while loading)
            ctx.fillStyle = f.color || (f.value > 10 ? '#ffaa00' : '#4ade80');
            ctx.beginPath();
            ctx.arc(f.position.x, f.position.y, renderRadius * 1.3, 0, Math.PI * 2); // Increased radius
            ctx.fill();

            // Inner dot for style
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(f.position.x - renderRadius * 0.4, f.position.y - renderRadius * 0.4, renderRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // "2x" label for remains
        if (isRemains) {
          ctx.font = 'bold 10px Orbitron';
          ctx.fillStyle = '#ffd700';
          ctx.textAlign = 'center';
          ctx.fillText('2x', f.position.x, drawY + renderRadius + 12);
        }
      }

      // 3. Draw Collectibles (Coins & Diamonds) with animations
      state.collectibles.forEach(c => {
        // Zoom-Aware Frustum culling
        // Calculate the actual visible world bounds
        const worldViewWidth = canvasWidth / zoom;
        const worldViewHeight = canvasHeight / zoom;
        const margin = 300; // Extra margin for animations/bounce

        if (c.position.x < state.camera.x - margin ||
          c.position.x > state.camera.x + worldViewWidth + margin ||
          c.position.y < state.camera.y - margin ||
          c.position.y > state.camera.y + worldViewHeight + margin) {
          return;
        }

        const sprite = c.type === 'coin' ? COIN_CONFIG.sprite : DIAMOND_CONFIG.sprite;
        const img = collectibleSpritesRef.current.get(sprite);
        const bounce = Math.sin(animTime * 4 + c.position.x * 0.1) * 4;
        const pulse = 1 + Math.sin(animTime * 3 + c.position.y * 0.1) * 0.15;
        // Make coins larger!
        const baseScale = c.type === 'coin' ? 5.0 : 2.5;
        const drawSize = c.radius * baseScale * pulse;

        ctx.save();
        ctx.translate(c.position.x, c.position.y + bounce);

        // Glow ring (Only for Diamonds now - removed bubble from Coin)
        if (c.type !== 'coin') {
          const glowColor = 'rgba(79, 195, 247, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, drawSize * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.fill();
        }

        // Spin rotation for coins
        if (c.type === 'coin') {
          const scaleX = Math.cos(animTime * 3 + c.position.x * 0.05);
          ctx.scale(Math.abs(scaleX) * 0.8 + 0.2, 1);
        } else {
          ctx.rotate(Math.sin(animTime * 2) * 0.2);
        }

        if (img && img.complete && img.width > 0) {
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          // Fallback: emoji
          ctx.font = `${c.radius * 1.5}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.type === 'coin' ? '🪙' : '💎', 0, 0);
        }

        // Sparkle particles
        const sparkleCount = c.type === 'diamond' ? 4 : 2;
        for (let i = 0; i < sparkleCount; i++) {
          const sparkAngle = animTime * 2 + i * (Math.PI * 2 / sparkleCount);
          const sparkDist = drawSize * 0.6;
          const sx = Math.cos(sparkAngle) * sparkDist;
          const sy = Math.sin(sparkAngle) * sparkDist;
          const sparkSize = 2 + Math.sin(animTime * 6 + i) * 1;
          ctx.fillStyle = c.type === 'coin' ? '#fff8dc' : '#e1f5fe';
          ctx.globalAlpha = 0.6 + Math.sin(animTime * 4 + i) * 0.4;
          ctx.beginPath();
          ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.restore();
      });

      // Draw floating texts (world-space)
      floatingTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.timer);
        ctx.font = 'bold 18px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Draw Power-Ups with cool effects!
      state.powerUps.forEach(pu => {
        // Check if visible - Fixed bug: Use worldViewWidth/Height, not canvasWidth
        // Also increased margin to 300
        if (pu.position.x < state.camera.x - 300 || pu.position.x > state.camera.x + worldViewWidth + 300 ||
          pu.position.y < state.camera.y - 300 || pu.position.y > state.camera.y + worldViewHeight + 300) return;

        const config = POWER_UP_CONFIG[pu.type];
        const pulse = Math.sin(animTime * 4) * 0.2 + 0.8;
        const rotation = animTime * 2;

        ctx.save();
        ctx.translate(pu.position.x, pu.position.y);

        // Animated glow ring
        ctx.beginPath();
        ctx.arc(0, 0, pu.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = config.glowColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Background circle
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pu.radius);
        gradient.addColorStop(0, config.color);
        gradient.addColorStop(1, config.glowColor);
        ctx.beginPath();
        ctx.arc(0, 0, pu.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner glow
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, pu.radius * 0.8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rotating Sprite (fallback to emoji)
        const sprite = powerUpSpritesRef.current.get(config.sprite);

        ctx.save();
        ctx.rotate(rotation);

        if (sprite && sprite.complete) {
          const size = pu.radius * 1.4;
          ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        } else {
          ctx.font = `bold ${pu.radius}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(config.emoji, 0, 0);
        }
        ctx.restore();

        ctx.restore();
      });

      // Draw worms (optimized)
      state.bots.forEach(bot => {
        // Draw frozen indicator for frozen bots
        if (bot.isFrozen) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
          ctx.beginPath();
          ctx.arc(bot.body[0].x, bot.body[0].y, bot.radius * 2, 0, Math.PI * 2);
          ctx.fill();

          // Frozen snowflake
          ctx.font = `${bot.radius * 1.5}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❄️', bot.body[0].x, bot.body[0].y - bot.radius * 2);
          ctx.restore();
        }
        drawWormOptimized(ctx, bot, state.camera, worldViewWidth, worldViewHeight, animTime);
      });

      // Draw player with power-up effects
      // Shield bubble effect
      if (state.player.powerUps.shield > 0) {
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(animTime * 6) * 0.2;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(state.player.body[0].x, state.player.body[0].y, state.player.radius * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.fill();
        ctx.restore();
      }

      // Magnet range indicator
      if (state.player.powerUps.magnet > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(state.player.body[0].x, state.player.body[0].y, 200, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      drawWormOptimized(ctx, state.player, state.camera, worldViewWidth, worldViewHeight, animTime);

      ctx.restore();

      // ==================== HUD DRAWING (World Scale Reset) ====================
      ctx.restore(); // Exit World Space Scaling

      const padding = isMobileRef.current ? 30 : 25;

      // Helper to draw glass panel
      const drawGlassPanel = (x: number, y: number, w: number, h: number, radius: number = 12) => {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 12, 24, 0.65)'; // Darker, glassier
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(x, y, w, h, radius);
        } else {
          ctx.rect(x, y, w, h);
        }
        ctx.fill();
        ctx.stroke();

        // Gloss highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(x + 1, y + 1, w - 2, h / 2, [radius, radius, 0, 0]);
        }
        ctx.fill();
        ctx.restore();
      };

      // --- 1. HUD LAYOUT REARRANGEMENT ---

      // -- Minimap (Now Top-Left) --
      const mmSize = isMobileRef.current ? 55 : 80;
      const mmMargin = padding;
      const mmDiameter = mmSize * 2;
      const mmX = mmSize + mmMargin;
      const mmY = mmSize + mmMargin;

      ctx.save();
      drawGlassPanel(mmX - mmSize, mmY - mmSize, mmDiameter, mmDiameter, mmSize);
      ctx.beginPath();
      ctx.arc(mmX, mmY, mmSize, 0, Math.PI * 2);
      ctx.clip();

      const scale = mmDiameter / MAP_SIZE;
      const mapCenterX = MAP_SIZE / 2;
      const mapCenterY = MAP_SIZE / 2;

      state.bots.forEach(bot => {
        if (bot.isDead) return;
        const head = bot.body[0];
        const dx = (head.x - mapCenterX) * scale;
        const dy = (head.y - mapCenterY) * scale;
        if (dx * dx + dy * dy < mmSize * mmSize) {
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(mmX + dx, mmY + dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (!state.player.isDead) {
        const pHead = state.player.body[0];
        const dx = (pHead.x - mapCenterX) * scale;
        const dy = (pHead.y - mapCenterY) * scale;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.4 + Math.sin(animTime * 10) * 0.2})`;
        ctx.beginPath();
        ctx.arc(mmX + dx, mmY + dy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mmX + dx, mmY + dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // -- Score & Wallet (Now Top-Left, next to Minimap) --
      const statsW = isMobileRef.current ? 140 : 180;
      const statsH = isMobileRef.current ? 60 : 75;
      const statsX = mmX + mmSize + 15;
      const statsY = padding;

      drawGlassPanel(statsX, statsY, statsW, statsH);

      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Score Label
      ctx.font = `bold ${isMobileRef.current ? '9px' : '11px'} Rajdhani`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('SCORE', statsX + 12, statsY + 10);

      // Score Value
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isMobileRef.current ? '18px' : '22px'} Orbitron`;
      ctx.fillText(`${Math.floor(state.player.score)}`, statsX + 12, statsY + (isMobileRef.current ? 20 : 24));

      // Wallet Icons (Better Visuals)
      const coinImg = collectibleSpritesRef.current.get(COIN_CONFIG.sprite);
      const diamondImg = collectibleSpritesRef.current.get(DIAMOND_CONFIG.sprite);
      const curY = statsY + (isMobileRef.current ? 42 : 54);
      const iconSize = isMobileRef.current ? 14 : 18;

      if (coinImg && coinImg.complete) {
        ctx.drawImage(coinImg, statsX + 12, curY, iconSize, iconSize);
      }
      ctx.fillStyle = '#ffd700';
      ctx.font = `700 ${isMobileRef.current ? '12px' : '15px'} Orbitron`;
      ctx.fillText(`${walletRef.current.coins}`, statsX + 12 + iconSize + 6, curY);

      const coinValWidth = ctx.measureText(`${walletRef.current.coins}`).width;
      const dX = statsX + 12 + iconSize + 6 + coinValWidth + 12;

      if (diamondImg && diamondImg.complete) {
        ctx.drawImage(diamondImg, dX, curY, iconSize, iconSize);
      }
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText(`${walletRef.current.diamonds}`, dX + iconSize + 5, curY);

      ctx.restore();


      // -- Leaderboard (Top-Right Corner) --
      const lbW = isMobileRef.current ? 120 : 160;
      const lbH = isMobileRef.current ? 150 : 200;
      const lbX = canvasWidth - lbW - padding;
      const lbY = padding;

      drawGlassPanel(lbX, lbY, lbW, lbH);

      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${isMobileRef.current ? '11px' : '13px'} Orbitron`;
      ctx.textAlign = 'center';
      ctx.fillText('LEADERBOARD', lbX + lbW / 2, lbY + 18);

      const sortedWorms = [state.player, ...state.bots].filter(w => !w.isDead).sort((a, b) => b.score - a.score).slice(0, 7);

      ctx.textAlign = 'left';
      sortedWorms.forEach((w, i) => {
        const rowY = lbY + 42 + (i * (isMobileRef.current ? 16 : 22));
        const isMe = w.id === 'player';
        ctx.font = `${isMe ? '700' : '500'} ${isMobileRef.current ? '10px' : '12px'} Rajdhani`;

        ctx.fillStyle = i < 3 ? '#ffd700' : 'rgba(255,255,255,0.4)';
        ctx.fillText(`${i + 1}.`, lbX + 10, rowY);

        ctx.fillStyle = isMe ? '#4ade80' : 'rgba(255,255,255,0.8)';
        let cName = w.name;
        if (cName.length > (isMobileRef.current ? 8 : 10)) cName = cName.substring(0, isMobileRef.current ? 7 : 9) + '..';
        ctx.fillText(cName, lbX + 26, rowY);

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(Math.floor(w.score).toString(), lbX + lbW - 10, rowY);
        ctx.textAlign = 'left';
      });
      ctx.restore();


      // --- 2. ACTIVE POWER-UPS (Left Edge) ---
      let puy = isMobileRef.current ? canvasHeight / 2 - 50 : 150;
      const pbW = isMobileRef.current ? 100 : 130;
      const pbH = isMobileRef.current ? 20 : 24;
      const pTypes: (keyof typeof state.player.powerUps)[] = ['magnet', 'speed', 'freeze', 'shield'];

      pTypes.forEach(type => {
        if (state.player.powerUps[type] > 0) {
          const config = POWER_UP_CONFIG[type];
          const ratio = Math.max(0, state.player.powerUps[type] / config.maxDuration);
          drawGlassPanel(padding, puy, pbW, pbH, 6);

          if (ratio > 0) {
            ctx.save();
            ctx.fillStyle = config.color;
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(padding + 1, puy + 1, (pbW - 2) * ratio, pbH - 2, 4);
            ctx.fill();
            ctx.restore();
          }

          const s = powerUpSpritesRef.current.get(config.sprite);
          if (s && s.complete) {
            ctx.drawImage(s, padding + 4, puy + 3, pbH - 6, pbH - 6);
          }

          ctx.fillStyle = 'white';
          ctx.font = `bold ${isMobileRef.current ? '9px' : '10px'} Orbitron`;
          ctx.textAlign = 'right';
          ctx.fillText(`${state.player.powerUps[type].toFixed(1)}s`, padding + pbW - 6, puy + pbH / 2 + 4);

          puy += pbH + 8;
        }
      });

      // --- 3. NOTIFICATIONS (Top Center) ---
      if (activePowerUpMessageRef.current) {
        const msg = activePowerUpMessageRef.current;
        const msgAlpha = Math.min(1, msg.timer * 2);
        ctx.save();
        ctx.globalAlpha = msgAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = msg.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'white';

        const fontSize = isMobileRef.current ? 20 : 32;
        ctx.font = `900 ${fontSize}px Orbitron`;

        const textY = 80;
        const textWidth = ctx.measureText(msg.text).width;

        // Draw Icon if available
        if (msg.type) {
          const config = POWER_UP_CONFIG[msg.type];
          const sprite = powerUpSpritesRef.current.get(config.sprite);
          if (sprite && sprite.complete) {
            const iconSize = fontSize * 1.5;
            const spacing = 15;
            const totalWidth = textWidth + iconSize + spacing;
            const startX = (canvasWidth - totalWidth) / 2;

            ctx.drawImage(sprite, startX, textY - iconSize / 2, iconSize, iconSize);
            ctx.textAlign = 'left';
            ctx.fillText(msg.text, startX + iconSize + spacing, textY);
          } else {
            ctx.fillText(msg.text, canvasWidth / 2, textY);
          }
        } else {
          ctx.fillText(msg.text, canvasWidth / 2, textY);
        }

        ctx.restore();
      }

      // Draw virtual joystick
      drawJoystick(ctx, canvas);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isPaused, drawWormOptimized, drawJoystick, getEmojiSprite, onGameOver, arenaId, pitCount]);

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Lower DPR for performance
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        canvasRef.current.style.width = window.innerWidth + 'px';
        canvasRef.current.style.height = window.innerHeight + 'px';

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" style={{ touchAction: 'none' }} />;
});

export default GameCanvas;

// --- Standalone Helper Functions ---

const drawWorldGrid = (ctx: CanvasRenderingContext2D, camera: Vector2, worldViewWidth: number, worldViewHeight: number, arenaId: string = 'dark') => {
  const config = ARENA_CONFIG[arenaId] || ARENA_CONFIG['dark'];

  // 1. Grid / Pattern (Drawn in world space)
  ctx.lineWidth = 1;
  ctx.strokeStyle = config.colors.grid;

  const step = 50;
  const startX = Math.floor(camera.x / step) * step;
  const startY = Math.floor(camera.y / step) * step;
  const endX = camera.x + worldViewWidth;
  const endY = camera.y + worldViewHeight;

  ctx.beginPath();

  if (config.pattern === 'hex') {
    const r = 30;
    const h = r * Math.sqrt(3);
    const w = 2 * r;
    const startQ = Math.floor(camera.x / (w * 0.75)) - 1;
    const startR = Math.floor(camera.y / h) - 1;
    const countX = Math.ceil(worldViewWidth / (w * 0.75)) + 2;
    const countY = Math.ceil(worldViewHeight / h) + 2;

    for (let q = startQ; q < startQ + countX; q++) {
      for (let r = startR; r < startR + countY; r++) {
        const x = q * w * 0.75;
        const y = r * h + (q % 2) * (h / 2);
        ctx.moveTo(x + r * Math.cos(0), y + r * Math.sin(0));
        for (let i = 0; i < 7; i++) {
          ctx.lineTo(x + 30 * Math.cos(i * Math.PI / 3), y + 30 * Math.sin(i * Math.PI / 3));
        }
      }
    }
  } else if (config.pattern === 'stars') {
    // Static stars need to be drawn in screen space usually, or large world-space grid
    // For simplicity with zoom, we'll keep them world-aligned here
    for (let x = startX; x <= endX; x += 100) {
      for (let y = startY; y <= endY; y += 100) {
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const starX = x + (Math.abs(hash) % 100);
        const starY = y + (Math.abs(hash * 10) % 100);
        const size = (Math.abs(hash * 100) % 3) + 1;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + ((Math.abs(hash * 20) % 10) / 10) + ')';
        ctx.fillRect(starX, starY, size, size);
      }
    }
  } else if (config.pattern === 'field') {
    // Soccer Field: Stripes
    const stripeSize = 200;
    const fieldStartX = Math.floor(camera.x / (stripeSize * 2)) * (stripeSize * 2);
    for (let x = fieldStartX; x <= endX; x += stripeSize * 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x, camera.y, stripeSize, worldViewHeight);
    }
    // Lines
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, camera.y); ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(camera.x, y); ctx.lineTo(endX, y);
    }
  } else {
    // Default Grid
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, camera.y);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(camera.x, y);
      ctx.lineTo(endX, y);
    }
  }

  ctx.stroke();

  // 2. Map Boundary (NOW PERFECTLY ALIGNED IN WORLD SPACE)
  ctx.strokeStyle = config.colors.border;
  ctx.lineWidth = 10; // Thicker for better visibility
  ctx.beginPath();
  ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Draw dark-out outside boundary
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 500; // Fake "fog of war" outside arena
  ctx.beginPath();
  ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE / 2 + 250, 0, Math.PI * 2);
  ctx.stroke();
};
