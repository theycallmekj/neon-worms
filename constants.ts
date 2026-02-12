
import { Skin } from './types';

// Mobile detection for performance tuning
const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export const MAP_SIZE = 4000;
export const INITIAL_ZOOM = isMobile ? 0.7 : 0.8; // Slightly more zoomed out on mobile
export const BASE_SPEED = 4.0;
export const BOOST_SPEED = 8.0;
export const TURN_SPEED = isMobile ? 0.09 : 0.07; // Slightly faster turning on mobile for responsiveness
export const BASE_RADIUS = 20; // Chunky worms
export const SEGMENT_DISTANCE = 10;
export const BOT_COUNT = isMobile ? 15 : 25; // Fewer bots on mobile for performance
export const FOOD_COUNT = isMobile ? 300 : 450;
export const MAX_TOTAL_FOOD = isMobile ? 500 : 800; // Hard cap on food items to prevent lag
// Less food on mobile for performance
// NEW: Visual Food Assets (Individual Sprites)
export const FOOD_CONFIG = {
  fast_food: {
    name: 'Fast Food Frenzy',
    rows: 0, cols: 0,
    items: [
      { id: 'burger', index: 0, value: 10, emoji: '🍔' },
      { id: 'fries', index: 1, value: 5, emoji: '🍟' },
      { id: 'pizza', index: 2, value: 12, emoji: '🍕' },
      { id: 'hotdog', index: 3, value: 10, emoji: '🌭' },
      { id: 'taco', index: 4, value: 8, emoji: '🌮' },
      { id: 'burrito', index: 5, value: 15, emoji: '🌯' },
      { id: 'sandwich', index: 6, value: 8, emoji: '🥪' },
      { id: 'popcorn', index: 7, value: 5, emoji: '🍿' },
      { id: 'bacon', index: 8, value: 8, emoji: '🥓' },
      { id: 'egg', index: 9, value: 5, emoji: '🍳' }
    ]
  },
  bakery: {
    name: 'Bakery & Desserts',
    rows: 0, cols: 0,
    items: [
      { id: 'donut', index: 0, value: 8, emoji: '🍩' },
      { id: 'cookie', index: 1, value: 5, emoji: '🍪' },
      { id: 'cake', index: 2, value: 15, emoji: '🍰' },
      { id: 'cupcake', index: 3, value: 10, emoji: '🧁' },
      { id: 'pie', index: 4, value: 12, emoji: '🥧' },
      { id: 'croissant', index: 5, value: 8, emoji: '🥐' },
      { id: 'pancakes', index: 6, value: 10, emoji: '🥞' },
      { id: 'waffle', index: 7, value: 8, emoji: '🧇' },
      { id: 'bread', index: 8, value: 5, emoji: '🥖' },
      { id: 'pretzel', index: 9, value: 5, emoji: '🥨' }
    ]
  },
  street: {
    name: 'Street Food Fiesta',
    rows: 0, cols: 0,
    items: [
      { id: 'taco', index: 0, value: 10, emoji: '🌮' },
      { id: 'burrito', index: 1, value: 15, emoji: '🌯' },
      { id: 'stuffed_flatbread', index: 2, value: 10, emoji: '🥙' },
      { id: 'curry', index: 3, value: 12, emoji: '🍛' },
      { id: 'noodle', index: 4, value: 8, emoji: '🍜' },
      { id: 'spaghetti', index: 5, value: 10, emoji: '🍝' },
      { id: 'dumpling', index: 6, value: 8, emoji: '🥟' },
      { id: 'oden', index: 7, value: 8, emoji: '🍢' },
      { id: 'skewer', index: 8, value: 12, emoji: '🍡' },
      { id: 'corn', index: 9, value: 5, emoji: '🌽' }
    ]
  },
  sushi: {
    name: 'Sushi & Asian Culture',
    rows: 0, cols: 0,
    items: [
      { id: 'sushi', index: 0, value: 10, emoji: '🍣' },
      { id: 'fried_shrimp', index: 1, value: 12, emoji: '🍤' },
      { id: 'rice_ball', index: 2, value: 8, emoji: '🍙' },
      { id: 'rice', index: 3, value: 5, emoji: '🍚' },
      { id: 'rice_cracker', index: 4, value: 5, emoji: '🍘' },
      { id: 'fish_cake', index: 5, value: 8, emoji: '🍥' },
      { id: 'dango', index: 6, value: 10, emoji: '🍡' },
      { id: 'bento', index: 7, value: 15, emoji: '🍱' },
      { id: 'custard', index: 8, value: 8, emoji: '🍮' },
      { id: 'tea', index: 9, value: 5, emoji: '🍵' }
    ]
  },
  candy: {
    name: 'Cute Shapes / Candies',
    rows: 0, cols: 0,
    items: [
      { id: 'candy', index: 0, value: 5, emoji: '🍬' },
      { id: 'lollipop', index: 1, value: 10, emoji: '🍭' },
      { id: 'chocolate', index: 2, value: 8, emoji: '🍫' },
      { id: 'honey', index: 3, value: 8, emoji: '🍯' },
      { id: 'ice_cream', index: 4, value: 10, emoji: '🍦' },
      { id: 'shaved_ice', index: 5, value: 8, emoji: '🍧' },
      { id: 'ice_cream_bowl', index: 6, value: 12, emoji: '🍨' },
      { id: 'cake', index: 7, value: 10, emoji: '🍰' },
      { id: 'cookie', index: 8, value: 5, emoji: '🍪' },
      { id: 'custard', index: 9, value: 8, emoji: '🍮' }
    ]
  }
};

export const SKINS: Skin[] = [
  { id: 'neon-pulse', name: 'Neon Pulse', colors: ['#000000', '#00ff00', '#000000', '#ff00ff'], headColor: '#ffffff', pattern: 'electric' },
  { id: 'rainbow-drift', name: 'Rainbow Drift', colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'], headColor: '#ffffff', pattern: 'gradient' },
  { id: 'cyber-grid', name: 'Cyber Grid', colors: ['#001133', '#003366'], headColor: '#00ffff', pattern: 'grid' },
  { id: 'lava-core', name: 'Lava Core', colors: ['#330000', '#550000'], headColor: '#ff4400', pattern: 'cracks' },
  { id: 'galaxy-swirl', name: 'Galaxy Swirl', colors: ['#0f0c29', '#302b63', '#24243e'], headColor: '#ffffff', pattern: 'stars' },
  { id: 'emerald-samurai', name: 'Emerald Samurai', colors: ['#005500', '#007700'], headColor: '#ffd700', pattern: 'plates' },
  { id: 'bumble-burst', name: 'Bumble Burst', colors: ['#ffd700', '#1a1a1a'], headColor: '#ffffe0', pattern: 'stripes' },
  { id: 'frost-crystal', name: 'Frost Crystal', colors: ['#e0f7fa', '#b2ebf2', '#ffffff'], headColor: '#ffffff', pattern: 'gradient' },
  { id: 'toxic-slime', name: 'Toxic Slime', colors: ['#ccff00', '#39ff14'], headColor: '#eeffee', pattern: 'spots' },
  { id: 'pixel-snake', name: 'Pixel Snake', colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'], headColor: '#ffffff', pattern: 'pixel' },
  { id: 'comic-pop', name: 'Comic Pop', colors: ['#ff0055', '#ffffff'], headColor: '#ffff00', pattern: 'spots' },
  { id: 'sushi-roll', name: 'Sushi Roll', colors: ['#2f3a25', '#ffffff', '#ff7f50'], headColor: '#ff7f50', pattern: 'sushi' },
  { id: 'golden-pharaoh', name: 'Golden Pharaoh', colors: ['#ffd700', '#b8860b'], headColor: '#000000', pattern: 'stripes' },
  { id: 'laser-beam', name: 'Laser Beam', colors: ['#000000'], headColor: '#ffffff', pattern: 'electric' },
  { id: 'storm-surge', name: 'Storm Surge', colors: ['#4a5568', '#2d3748'], headColor: '#fbbf24', pattern: 'electric' },
  { id: 'chocolate-swirl', name: 'Chocolate Swirl', colors: ['#5d4037', '#d7ccc8'], headColor: '#8d6e63', pattern: 'stripes' },
  { id: 'stealth-shadow', name: 'Stealth Shadow', colors: ['#1a1a1a', '#333333'], headColor: '#000000', pattern: 'gradient' },
  { id: 'bubblegum-pop', name: 'Bubblegum Pop', colors: ['#ff69b4', '#ff1493'], headColor: '#ffc0cb', pattern: 'bubble' },
  { id: 'hologram-shift', name: 'Hologram Shift', colors: ['#ffffff'], headColor: '#ffffff', pattern: 'gradient' },
  { id: 'camo-forest', name: 'Camo Forest', colors: ['#33691e', '#558b2f', '#1b5e20', '#795548'], headColor: '#33691e', pattern: 'spots' },
  { id: 'diamond-shard', name: 'Diamond Shard', colors: ['#00bcd4', '#e0f7fa'], headColor: '#ffffff', pattern: 'plates' },
  { id: 'volcano-ridge', name: 'Volcano Ridge', colors: ['#212121', '#1a1a1a'], headColor: '#ff5722', pattern: 'cracks' },
  { id: 'mystic-runes', name: 'Mystic Runes', colors: ['#311b92', '#4527a0'], headColor: '#d1c4e9', pattern: 'runes' },
  { id: 'ocean-wave', name: 'Ocean Wave', colors: ['#0288d1', '#03a9f4', '#e1f5fe'], headColor: '#ffffff', pattern: 'stripes' },
  { id: 'electric-honeycomb', name: 'Electric Honeycomb', colors: ['#ff6f00', '#ffca28'], headColor: '#ffffff', pattern: 'grid' },
  { id: 'marble-luxe', name: 'Marble Luxe', colors: ['#f5f5f5', '#eeeeee'], headColor: '#ffffff', pattern: 'cracks' },
  { id: 'dragonflame', name: 'Dragon Flame', colors: ['#d32f2f', '#fbc02d'], headColor: '#ff5722', pattern: 'gradient' },
  { id: 'starlight-candy', name: 'Starlight Candy', colors: ['#f8bbd0', '#e1bee7', '#b2dfdb'], headColor: '#ffffff', pattern: 'stars' },
  { id: 'robot-armor', name: 'Mecha Armor', colors: ['#90a4ae', '#607d8b'], headColor: '#cfd8dc', pattern: 'plates' },
  { id: 'ancient-moss', name: 'Ancient Moss', colors: ['#424242', '#616161'], headColor: '#7cb342', pattern: 'spots' },
];

export const BOT_NAMES = [
  // Cyberpunk names
  "Neon", "Viper", "Cobra", "Phantom", "Shadow", "Blaze", "Storm", "Thunder",
  "Cipher", "Nexus", "Flux", "Vertex", "Matrix", "Vector", "Quantum", "Proxy",
  // Tech names
  "Byte", "Pixel", "Glitch", "Script", "Kernel", "Debug", "Cache", "Buffer",
  // Aggressive names
  "Slayer", "Crusher", "Destroyer", "Hunter", "Reaper", "Killer", "Predator", "Striker",
  // Cool names
  "Zeus", "Odin", "Thor", "Loki", "Mars", "Apollo", "Atlas", "Titan",
  // Meme names
  "Snek", "Danger", "NoScope", "360", "MLG", "Pro", "Epic", "Legend",
  // Animal names
  "Python", "Anaconda", "Mamba", "Venom", "Fang", "Scale", "Coil", "Slither"
];

// Food Configuration
export const FOOD_TYPES = {
  VEGGIES: [
    { emoji: '🥬', sprite: '/assets/food/veggies/lettuce.svg', value: 10 },
    { emoji: '🥕', sprite: '/assets/food/veggies/carrot.svg', value: 10 },
    { emoji: '🥦', sprite: '/assets/food/veggies/broccoli.svg', value: 10 },
    { emoji: '🥒', sprite: '/assets/food/veggies/cucumber.svg', value: 10 }
  ],
  FRUITS: [
    { emoji: '🍎', sprite: '/assets/food/fruits/apple.svg', value: 15 },
    { emoji: '🍌', sprite: '/assets/food/fruits/banana.svg', value: 15 },
    { emoji: '🍇', sprite: '/assets/food/fruits/grapes.svg', value: 15 },
    { emoji: '🍉', sprite: '/assets/food/fruits/watermelon.svg', value: 15 },
    { emoji: '🍓', sprite: '/assets/food/fruits/strawberry.svg', value: 20 }
  ],
  FAST_FOOD: [
    { emoji: '🍔', sprite: '/assets/food/fast_food/burger.svg', value: 50 },
    { emoji: '🍕', sprite: '/assets/food/fast_food/pizza.svg', value: 50 },
    { emoji: '🍟', sprite: '/assets/food/fast_food/fries.svg', value: 40 },
    { emoji: '🌭', sprite: '/assets/food/fast_food/hotdog.svg', value: 45 },
    { emoji: '🌮', sprite: '/assets/food/fast_food/taco.svg', value: 45 }
  ],
  SWEETS: [
    { emoji: '🍩', sprite: '/assets/food/fast_food/donut.svg', value: 80 },
    { emoji: '🍪', sprite: '/assets/food/bakery/cookie.svg', value: 70 },
    { emoji: '🍰', sprite: '/assets/food/bakery/cake.svg', value: 100 },
    { emoji: '🍦', sprite: '/assets/food/bakery/muffin.svg', value: 90 }, // Using Muffin for Ice Cream fallback for now or need to generate Ice Cream
    { emoji: '🍭', sprite: '/assets/food/candy/lollipop.svg', value: 60 }
  ]
};

// Power-Up Configuration
export const POWER_UP_CONFIG = {
  magnet: {
    emoji: '🧲', // Typescript might assume this property exists, keeping for safety
    sprite: '/assets/powerups/magnet.svg',
    name: 'Magnet',
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.5)',
    duration: 5, // seconds
    maxDuration: 5,
    description: 'Attracts nearby food'
  },
  speed: {
    emoji: '⚡',
    sprite: '/assets/powerups/speed.svg',
    name: 'Speed Boost',
    color: '#eab308', // Yellow
    glowColor: 'rgba(234, 179, 8, 0.5)',
    duration: 5, // seconds
    maxDuration: 5,
    description: 'Move faster'
  },
  freeze: {
    emoji: '❄️',
    sprite: '/assets/powerups/freeze.svg',
    name: 'Freeze',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.5)',
    duration: 3, // seconds - freezes OTHER snakes
    maxDuration: 3,
    description: 'Freezes all enemies'
  },
  shield: {
    emoji: '🛡️',
    sprite: '/assets/powerups/shield.svg',
    name: 'Shield',
    color: '#8b5cf6', // Purple
    glowColor: 'rgba(139, 92, 246, 0.5)',
    duration: 10, // seconds
    maxDuration: 10,
    description: 'Invincible protection'
  }
};

export const POWER_UP_SPAWN_INTERVAL = 4; // Seconds between spawns (faster!)
export const MAX_POWER_UPS = isMobile ? 6 : 10; // More power-ups on map
export const POWER_UP_RADIUS = 45; // Significantly larger for visibility (was 30)
export const INITIAL_POWER_UPS = 5; // Start with more power-ups

// Upgrade System Configuration
export const MAX_UPGRADE_LEVEL = 6;
export const UPGRADE_COSTS = {
  coins: [100, 200, 600, 2400, 12000, 72000],
  diamonds: [10, 20, 40, 80, 160, 320]
};

// Duration multiplier per upgrade level: level 0 = 1x, level 6 = 2.5x
export const UPGRADE_DURATION_MULTIPLIER = (level: number) => 1 + level * 0.25;

// Collectible (Coin / Diamond) Configuration
export const COIN_CONFIG = {
  maxOnMap: 10,
  spawnInterval: 9, // Reduced rate (was 5s), now approx 40% slower
  radius: 18,
  sprite: '/assets/ui/coin.svg'
};

export const DIAMOND_CONFIG = {
  radius: 20,
  sprite: '/assets/ui/diamond.svg'
};

// Pit (Hazard) Configuration
export const DEFAULT_PIT_COUNT = 4;
export const MIN_PIT_COUNT = 0;
export const MAX_PIT_COUNT = 12;
export const PIT_CONFIG = {
  lava: {
    name: 'Lava Pit',
    baseColor: '#ff4500',
    glowColor: 'rgba(255, 69, 0, 0.6)',
    innerColor: '#ff6b00',
    minRadius: 80,
    maxRadius: 150,
  },
  void: {
    name: 'Void Pit',
    baseColor: '#1a0a2e',
    glowColor: 'rgba(75, 0, 130, 0.5)',
    innerColor: '#2a1a4e',
    minRadius: 70,
    maxRadius: 130,
  },
  acid: {
    name: 'Acid Pool',
    baseColor: '#39ff14',
    glowColor: 'rgba(57, 255, 20, 0.5)',
    innerColor: '#7fff00',
    minRadius: 60,
    maxRadius: 120,
  },
  electric: {
    name: 'Electric Field',
    baseColor: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    innerColor: '#00ffff',
    minRadius: 75,
    maxRadius: 140,
  },
  ice: {
    name: 'Ice Patch',
    baseColor: '#aeeeee',
    glowColor: 'rgba(174, 238, 238, 0.5)',
    innerColor: '#e0ffff',
    minRadius: 70,
    maxRadius: 130,
  },
  tar: {
    name: 'Tar Pit',
    baseColor: '#2d2d2d',
    glowColor: 'rgba(45, 45, 45, 0.6)',
    innerColor: '#1a1a1a',
    minRadius: 65,
    maxRadius: 125,
  },
  radioactive: {
    name: 'Radioactive Zone',
    baseColor: '#ccff00',
    glowColor: 'rgba(204, 255, 0, 0.6)',
    innerColor: '#ffff00',
    minRadius: 80,
    maxRadius: 140,
  },
  spike: {
    name: 'Spike Trap',
    baseColor: '#800000',
    glowColor: 'rgba(128, 0, 0, 0.5)',
    innerColor: '#a52a2a',
    minRadius: 60,
    maxRadius: 110,
  },
  ghost: {
    name: 'Ghost Realm',
    baseColor: '#4b0082', // Indigo
    glowColor: 'rgba(75, 0, 130, 0.4)',
    innerColor: '#9370db', // Medium Purple
    minRadius: 75,
    maxRadius: 135,
  }
};

export const ALL_PIT_TYPES = Object.keys(PIT_CONFIG);

// Arena (Background) Configuration
export const ARENA_CONFIG = {
  dark: {
    id: 'dark',
    name: 'Dark Grid',
    colors: { background: '#0f172a', grid: 'rgba(255, 255, 255, 0.05)', border: '#334155' },
    pattern: 'grid'
  },
  neon: {
    id: 'neon',
    name: 'Neon City',
    colors: { background: '#050510', grid: 'rgba(0, 255, 255, 0.15)', border: '#00e5ff' },
    pattern: 'hex'
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: { background: '#1a472a', grid: 'rgba(255, 255, 255, 0.1)', border: '#2d6a4f' },
    pattern: 'grass'
  },
  ice: {
    id: 'ice',
    name: 'Frozen Lake',
    colors: { background: '#e0f7fa', grid: 'rgba(0, 100, 200, 0.1)', border: '#81d4fa' },
    pattern: 'ice'
  },
  space: {
    id: 'space',
    name: 'Deep Space',
    colors: { background: '#000000', grid: 'rgba(255, 255, 255, 0.05)', border: '#4b0082' },
    pattern: 'stars'
  },
  soccer: {
    id: 'soccer',
    name: 'Soccer Field',
    colors: { background: '#4ade80', grid: 'rgba(255, 255, 255, 0.4)', border: '#ffffff' },
    pattern: 'field'
  },
  candy: {
    id: 'candy',
    name: 'Candy Land',
    colors: { background: '#ffe4e1', grid: 'rgba(255, 105, 180, 0.2)', border: '#ff69b4' },
    pattern: 'candy'
  }
};

export const DEFAULT_ARENA = 'dark';


