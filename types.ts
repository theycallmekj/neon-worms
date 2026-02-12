
export interface Vector2 {
  x: number;
  y: number;
}

export type AnimationType = 'none' | 'sine-wave' | 'pulse' | 'jitters' | 'rotate-spin' | 'tail-whip' | 'stretch';

export interface SkinPart {
  imageSrc: string;
  animation?: AnimationType;
  params?: {
    speed?: number; // 1 = normal
    intensity?: number; // 0-1
    offset?: number; // phase shift
  };
}

export interface CompositeSkin {
  headBase: string;
  eyes?: SkinPart;
  mouth?: SkinPart;
  ears?: SkinPart;
  body: SkinPart;
  tail: SkinPart;
  decoration?: SkinPart;
}

export interface Skin {
  id: string;
  name: string;
  colors: string[]; // Gradient colors
  headColor: string;
  pattern?: 'stripes' | 'gradient' | 'grid' | 'cracks' | 'stars' | 'plates' | 'pixel' | 'sushi' | 'spots' | 'bubble' | 'electric' | 'runes';
  type?: 'color' | 'image' | 'composite'; // Defaults to 'color'
  images?: {
    head: string;
    body: string;
    tail: string;
  };
  composite?: CompositeSkin;
}

// Power-up types
export type PowerUpType = 'magnet' | 'speed' | 'freeze' | 'shield';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2;
  radius: number;
  spawnTime: number;
  duration: number; // How long the effect lasts when collected
}

// Active power-up effects on a worm
export interface ActivePowerUps {
  magnet: number; // Timer remaining (0 = inactive)
  speed: number;
  freeze: number; // This freezes OTHER snakes
  shield: number;
}

export interface Worm {
  id: string;
  name: string;
  body: Vector2[]; // Array of positions, head is at index 0
  angle: number; // Current movement angle in radians
  targetAngle: number; // Desired angle based on input/AI
  radius: number; // Radius of body segments
  speed: number;
  turnSpeed: number;
  skin: Skin;
  isDead: boolean;
  isBoosting: boolean;
  isBot: boolean;
  score: number;
  hueShift: number; // For rainbow effects
  // Animation states - more expressive faces!
  expression: 'neutral' | 'eating' | 'killer' | 'sad' | 'frustrated' | 'scared';
  expressionTimer: number;
  expressionIntensity: number; // 0-1 for animation intensity
  // Stats for expressions
  killCount: number;
  // Revival states
  isInvincible: boolean;
  invincibilityTimer: number;
  // Power-up effects
  powerUps: ActivePowerUps;
  isFrozen: boolean; // When affected by someone else's freeze power-up
}

export interface Food {
  id: string;
  position: Vector2;
  radius: number;
  value: number;
  color: string;
  emoji?: string;
  sprite?: string; // Path to individual food sprite SVG
  type: 'regular' | 'glowing' | 'remains';
}

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  life: number; // 0 to 1
  color: string;
  size: number;
}

// Pit (hazardous zone that kills snakes)
export interface Pit {
  id: string;
  position: Vector2;
  radius: number;
  type: 'lava' | 'void' | 'acid' | 'electric' | 'ice' | 'tar' | 'radioactive' | 'spike' | 'ghost';
}

// Collectible (coins & diamonds)
export interface Collectible {
  id: string;
  type: 'coin' | 'diamond';
  position: Vector2;
  radius: number;
  spawnTime: number;
}

// Player wallet (persistent)
export interface PlayerWallet {
  coins: number;
  diamonds: number;
}

// Power-up upgrade levels (0 = default, 6 = max)
export interface UpgradeLevels {
  magnet: number;
  speed: number;
  freeze: number;
  shield: number;
}

// Game settings
export interface GameSettings {
  pitCount: number; // Renamed to "Hazard Count" in UI
  enabledPitTypes: string[];
  arenaId: string; // New: Background Arena
  foodType: string; // New: Food Style ('random' or specific)
}

export interface GameState {
  player: Worm;
  bots: Worm[];
  food: Food[];
  powerUps: PowerUp[];
  collectibles: Collectible[];
  pits: Pit[];
  particles: Particle[];
  camera: Vector2; // Top-left corner of the view
  mapSize: Vector2;
  isRunning: boolean;
  isGameOver: boolean;
  highScore: number;
}
