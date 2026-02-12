import { Vector2 } from '../types';

export const Vec2 = {
  add: (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  mul: (v: Vector2, s: number): Vector2 => ({ x: v.x * s, y: v.y * s }),
  div: (v: Vector2, s: number): Vector2 => (s === 0 ? { x: 0, y: 0 } : { x: v.x / s, y: v.y / s }),
  mag: (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  norm: (v: Vector2): Vector2 => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },
  dist: (v1: Vector2, v2: Vector2): number => {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  angle: (v: Vector2): number => Math.atan2(v.y, v.x),
  fromAngle: (angle: number, mag: number = 1): Vector2 => ({
    x: Math.cos(angle) * mag,
    y: Math.sin(angle) * mag,
  }),
  lerpAngle: (start: number, end: number, amount: number): number => {
    const cs = (1 - amount) * Math.cos(start) + amount * Math.cos(end);
    const sn = (1 - amount) * Math.sin(start) + amount * Math.sin(end);
    return Math.atan2(sn, cs);
  }
};

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const randomPosition = (mapSize: number): Vector2 => {
  const radius = mapSize / 2;
  const angle = Math.random() * Math.PI * 2;
  // Uniform distribution in circle requires sqrt(random) for radius
  const r = Math.sqrt(Math.random()) * (radius - 150); // Keep margin from edge
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;

  return {
    x: centerX + Math.cos(angle) * r,
    y: centerY + Math.sin(angle) * r
  };
};
