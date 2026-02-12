
import { Worm, Food, Particle, Vector2, Skin, PowerUp, PowerUpType, Pit, Collectible } from '../types';
import { Vec2, randomRange, randomPosition } from './math';
import { MAP_SIZE, BASE_SPEED, BOOST_SPEED, TURN_SPEED, SEGMENT_DISTANCE, BASE_RADIUS, SKINS, BOT_NAMES, POWER_UP_CONFIG, POWER_UP_RADIUS, PIT_CONFIG, FOOD_CONFIG, COIN_CONFIG, DIAMOND_CONFIG } from '../constants';

// --- Helpers ---

export const createWorm = (
  id: string,
  name: string,
  pos: Vector2,
  skin: Skin,
  isBot: boolean = false
): Worm => {
  const body: Vector2[] = [];
  const initialLength = 20;
  for (let i = 0; i < initialLength; i++) {
    body.push({ x: pos.x, y: pos.y + i * SEGMENT_DISTANCE });
  }

  return {
    id,
    name,
    body,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    radius: BASE_RADIUS,
    speed: BASE_SPEED,
    turnSpeed: TURN_SPEED,
    skin,
    isDead: false,
    isBoosting: false,
    isBot,
    score: 0,
    hueShift: Math.random() * 360,
    expression: 'neutral',
    expressionTimer: 0,
    expressionIntensity: 0,
    killCount: 0,
    isInvincible: false,
    invincibilityTimer: 0,
    // Power-up states
    powerUps: {
      magnet: 0,
      speed: 0,
      freeze: 0,
      shield: 0
    },
    isFrozen: false
  };
};

// Create a random power-up at a random position
export const createPowerUp = (mapSize: number): PowerUp => {
  const types: PowerUpType[] = ['magnet', 'speed', 'freeze', 'shield'];
  const type = types[Math.floor(Math.random() * types.length)];
  const config = POWER_UP_CONFIG[type];

  // Spawn (circular)
  const position = randomPosition(mapSize);

  return {
    id: `powerup-${Date.now()}-${Math.random()}`,
    type,
    position,
    radius: POWER_UP_RADIUS,
    spawnTime: Date.now(),
    duration: config.duration
  };
};

// Create a random pit (hazard zone)
export const createPit = (mapSize: number, existingPits: Pit[] = [], enabledTypes?: string[]): Pit => {
  const allowed = enabledTypes && enabledTypes.length > 0 ? enabledTypes : Object.keys(PIT_CONFIG);
  const type = allowed[Math.floor(Math.random() * allowed.length)] as Pit['type'];
  const config = PIT_CONFIG[type];

  // Calculate radius
  const radius = randomRange(config.minRadius, config.maxRadius);

  // Spawn away from edges and other pits
  const margin = 300;
  let position: Vector2;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    position = randomPosition(mapSize);
    attempts++;

    // Check distance from other pits
    const tooClose = existingPits.some(pit => {
      const dist = Vec2.dist(position, pit.position);
      return dist < pit.radius + radius + 200; // Keep pits apart
    });

    if (!tooClose) break;
  } while (attempts < maxAttempts);

  return {
    id: `pit-${Date.now()}-${Math.random()}`,
    type,
    position,
    radius
  };
};

export const createFood = (mapSize: number, type: Food['type'] = 'regular', pos?: Vector2, valueOverride?: number, foodType: string = 'random'): Food => {
  const categories = Object.keys(FOOD_CONFIG) as (keyof typeof FOOD_CONFIG)[];

  let categoryKey: keyof typeof FOOD_CONFIG;
  if (foodType && foodType !== 'random' && FOOD_CONFIG[foodType as keyof typeof FOOD_CONFIG]) {
    categoryKey = foodType as keyof typeof FOOD_CONFIG;
  } else {
    categoryKey = categories[Math.floor(Math.random() * categories.length)];
  }

  // Custom logic: REMAINS should be bigger/cooler items
  if (type === 'remains') {
    // If random, pick new random
    if (!foodType || foodType === 'random') {
      categoryKey = categories[Math.floor(Math.random() * categories.length)];
    }
  }

  let config = FOOD_CONFIG[categoryKey];
  let item = config.items[Math.floor(Math.random() * config.items.length)];

  // Calculate size based on type
  let radius = 16 + (item.value * 0.4);
  if (type === 'remains') radius *= 1.8; // Remains are much bigger

  // Standard values: regular food = 10, remains = 20
  const finalValue = type === 'remains' ? 20 : 10;

  return {
    id: Math.random().toString(36).substr(2, 9),
    position: pos || randomPosition(mapSize),
    radius,
    value: finalValue,
    color: '#ffffff',
    type,
    emoji: item.emoji
  };
};

// --- Physics & Update ---

// Create a collectible coin or diamond
export const createCollectible = (mapSize: number, type: 'coin' | 'diamond', pos?: Vector2): Collectible => {
  const config = type === 'coin' ? COIN_CONFIG : DIAMOND_CONFIG;
  const margin = 200;
  return {
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    position: pos || randomPosition(mapSize),
    radius: config.radius,
    spawnTime: Date.now()
  };
};

// Returns true if the worm hit the boundary (should die)
export const updateWormPosition = (worm: Worm, mapSize: number, dt: number): boolean => {
  if (worm.isDead) return false;

  // Update Expression Timer
  if (worm.expressionTimer > 0) {
    worm.expressionTimer -= dt;
    if (worm.expressionTimer <= 0) {
      worm.expression = 'neutral';
    }
  }

  // CRITICAL SAFETY CHECK: Detect NaNs and kill corrupt worms to prevent game freeze
  if (isNaN(worm.angle) || isNaN(worm.targetAngle) || isNaN(worm.body[0].x) || isNaN(worm.body[0].y)) {
    console.warn(`Worm ${worm.id} corrupted (NaN detected), forcing death/respawn.`);
    return true; // Treat as hitting wall -> dies
  }

  // Update Invincibility Timer
  if (worm.invincibilityTimer > 0) {
    worm.invincibilityTimer -= dt;
    if (worm.invincibilityTimer <= 0) {
      worm.isInvincible = false;
    }
  }

  // 1. Turn towards target angle
  let diff = worm.targetAngle - worm.angle;
  while (diff <= -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  const maxTurn = worm.turnSpeed * (60 * dt);
  if (Math.abs(diff) > maxTurn) {
    worm.angle += Math.sign(diff) * maxTurn;
  } else {
    worm.angle = worm.targetAngle;
  }

  // 2. Move Head
  const currentSpeed = worm.isBoosting && worm.body.length > 15 ? BOOST_SPEED : worm.speed;

  // Inline velocity calculation (faster than Vec2.fromAngle)
  const vx = Math.cos(worm.angle) * currentSpeed;
  const vy = Math.sin(worm.angle) * currentSpeed;

  const newHeadX = worm.body[0].x + vx;
  const newHeadY = worm.body[0].y + vy;

  // Check boundary collision (CIRCULAR ARENA)
  const mapRadius = mapSize / 2;
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;
  const distFromCenter = Math.sqrt((newHeadX - centerX) ** 2 + (newHeadY - centerY) ** 2);
  const boundaryMargin = worm.radius + 5;

  const hitBoundary = !worm.isInvincible && (distFromCenter > mapRadius - boundaryMargin);

  // Clamp position to stay in bounds (push back into circle)
  let clampedX = newHeadX;
  let clampedY = newHeadY;

  if (distFromCenter > mapRadius - worm.radius) {
    const angle = Math.atan2(newHeadY - centerY, newHeadX - centerX);
    clampedX = centerX + Math.cos(angle) * (mapRadius - worm.radius);
    clampedY = centerY + Math.sin(angle) * (mapRadius - worm.radius);
  }

  // 3. Move Body - optimized with in-place mutation
  // Shift all segments back and add new head
  const targetDist = SEGMENT_DISTANCE;
  const targetDistSq = targetDist * targetDist;

  // Calculate target length with a cap for performance
  const targetLength = Math.min(300, 20 + Math.floor(worm.score / 8)); // Cap at 300 segments, faster growth

  // Remove excess segments first
  while (worm.body.length > targetLength) {
    worm.body.pop();
  }

  // Add new head position
  worm.body.unshift({ x: clampedX, y: clampedY });

  // Update body segments (follow the leader) - optimized inline math
  for (let i = 1; i < worm.body.length; i++) {
    const prev = worm.body[i - 1];
    const curr = worm.body[i];

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > targetDistSq) {
      const dist = Math.sqrt(distSq);
      const ratio = targetDist / dist;
      curr.x = prev.x + dx * ratio;
      curr.y = prev.y + dy * ratio;
    }
  }

  // Remove the last segment (since we added one at the front)
  if (worm.body.length > targetLength) {
    worm.body.pop();
  }

  if (worm.isBoosting && worm.body.length > 15) {
    worm.score = Math.max(0, worm.score - 0.3);
  }

  return hitBoundary;
};

export const updateBotAI = (bot: Worm, food: Food[], otherWorms: Worm[], mapSize: number) => {
  if (bot.isDead) return;

  const head = bot.body[0];

  // 1. Avoid Walls
  const wallMargin = 200;
  if (head.x < wallMargin) bot.targetAngle = 0;
  else if (head.x > mapSize - wallMargin) bot.targetAngle = Math.PI;
  else if (head.y < wallMargin) bot.targetAngle = Math.PI / 2;
  else if (head.y > mapSize - wallMargin) bot.targetAngle = -Math.PI / 2;

  // 2. Avoid Other Worms
  let avoidanceForce = { x: 0, y: 0 };
  let closeThreats = 0;

  otherWorms.forEach(other => {
    if (other.id === bot.id || other.isDead || other.isInvincible) return;

    const distToOtherHead = Vec2.dist(head, other.body[0]);
    if (distToOtherHead < 400) {
      for (let k = 0; k < other.body.length; k += 4) {
        const seg = other.body[k];
        const d = Vec2.dist(head, seg);
        if (d < bot.radius + other.radius + 80) {
          const diff = Vec2.sub(head, seg);
          // Avoid division by zero if d is extremely small
          const safeDist = Math.max(d, 1.0);
          avoidanceForce = Vec2.add(avoidanceForce, Vec2.div(Vec2.norm(diff), safeDist));
          closeThreats++;
        }
      }
    }
  });

  if (closeThreats > 0) {
    const avoidanceAngle = Vec2.angle(avoidanceForce);
    bot.targetAngle = avoidanceAngle;
    bot.isBoosting = true;
    bot.expression = 'scared';
    bot.expressionTimer = 0.5;
    bot.expressionIntensity = Math.min(1, closeThreats * 0.3);
    return;
  } else {
    bot.isBoosting = false;
  }

  // 3. Seek Food (Optimized: Check random subset)
  let closestFood: Food | null = null;
  let minDist = Infinity;

  // Performance hack: Only check 20 random food items + close ones if possible
  // Iterating 500+ items for 30 bots is too slow
  const checkCount = 20;
  const startIdx = Math.floor(Math.random() * (food.length - checkCount));

  for (let i = 0; i < checkCount; i++) {
    const idx = (startIdx + i) % food.length;
    if (!food[idx]) continue;

    const f = food[idx];
    const d = Vec2.dist(head, f.position);

    if (d < 500) {
      const heuristic = d - (f.value * 2);
      if (heuristic < minDist) {
        minDist = heuristic;
        closestFood = f;
      }
    }
  }

  if (closestFood) {
    const dir = Vec2.sub(closestFood.position, head);
    bot.targetAngle = Vec2.angle(dir);
  } else {
    if (Math.random() < 0.05) {
      bot.targetAngle += randomRange(-0.5, 0.5);
    }
  }

  // Final NaN Safety check for targetAngle
  if (isNaN(bot.targetAngle)) {
    bot.targetAngle = Math.random() * Math.PI * 2;
  }
};

export const checkCollisions = (worms: Worm[]): { deadWormIds: string[], killerIds: string[] } => {
  const deadWormIds: string[] = [];
  const killerIds: string[] = [];

  for (let i = 0; i < worms.length; i++) {
    const w1 = worms[i];
    if (w1.isDead || w1.isInvincible) continue;

    const head = w1.body[0];

    for (let j = 0; j < worms.length; j++) {
      const w2 = worms[j];
      if (w1.id === w2.id || w2.isDead || w2.isInvincible) continue;

      // Quick distance check between heads
      const headDist = Math.abs(w1.body[0].x - w2.body[0].x) + Math.abs(w1.body[0].y - w2.body[0].y);
      if (headDist > 400) continue;

      let collision = false;
      const collisionDist = w1.radius + w2.radius - 5;

      // Skip segments for performance - check every 2nd or 3rd segment
      // For short worms check more segments, for long worms skip more
      const skipFactor = Math.max(1, Math.floor(w2.body.length / 40));

      for (let k = 0; k < w2.body.length; k += skipFactor) {
        const seg = w2.body[k];
        // Use Manhattan distance first (faster) for quick reject
        const manhattanDist = Math.abs(head.x - seg.x) + Math.abs(head.y - seg.y);
        if (manhattanDist > collisionDist * 2) continue;

        // Only calculate actual distance if Manhattan check passes
        const dx = head.x - seg.x;
        const dy = head.y - seg.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < collisionDist * collisionDist) {
          collision = true;
          break;
        }
      }

      if (collision) {
        // FREEZE POWER-UP MECHANIC: If w1 has freeze active and w2 is frozen, w2 dies instead!
        if (w1.powerUps.freeze > 0 && w2.isFrozen) {
          // Frozen enemy dies when you collide with them!
          deadWormIds.push(w2.id);
          killerIds.push(w1.id);

          // Player/attacker gets the laughing expression!
          w1.expression = 'killer';
          w1.expressionTimer = 2.0;
          w1.expressionIntensity = 1;
          w1.killCount++;
        } else {
          // Normal collision - w1 dies
          deadWormIds.push(w1.id);
          killerIds.push(w2.id);

          // Killer gets the laughing expression!
          w2.expression = 'killer';
          w2.expressionTimer = 2.0;
          w2.expressionIntensity = 1;
          w2.killCount++;
        }
        break;
      }
    }
  }

  return { deadWormIds, killerIds };
};
