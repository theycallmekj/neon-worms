// ---- Neon Worms Audio Controller ----
// Idempotent init, persistent BGM, bounded SFX pool, throttled playback.

const SFX_POOL_SIZE = 3;          // max simultaneous clones per sound key
const SFX_THROTTLE_MS = 60;       // minimum ms between plays of the same SFX

type BGMState = 'stopped' | 'playing' | 'starting';

interface SFXPool {
    elements: HTMLAudioElement[];
    cursor: number;
    lastPlayedAt: number;
}

export class AudioController {
    private bgm: HTMLAudioElement | null = null;
    private bgmState: BGMState = 'stopped';

    private sfxTemplates = new Map<string, HTMLAudioElement>();
    private sfxPools = new Map<string, SFXPool>();

    private initialized = false;

    // ---- Idempotent Init ----
    preload() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;

        const sfxFiles: Record<string, { path: string; vol: number }> = {
            coin: { path: '/sfx/Coin.opus', vol: 0.5 },
            food: { path: '/sfx/Food.opus', vol: 0.3 },
            collision: { path: '/sfx/Collision.opus', vol: 0.7 },
            powerup: { path: '/sfx/Powerup.opus', vol: 0.6 },
        };

        // --- BGM (single persistent element) ---
        this.bgm = new Audio('/sfx/Game.opus');
        this.bgm.loop = true;
        this.bgm.volume = 0.4;
        // Preload hint
        this.bgm.preload = 'auto';

        // --- SFX templates + pools ---
        for (const [key, cfg] of Object.entries(sfxFiles)) {
            const template = new Audio(cfg.path);
            template.volume = cfg.vol;
            template.preload = 'auto';
            this.sfxTemplates.set(key, template);

            // Pre-create a small pool of clones for each SFX
            const pool: SFXPool = { elements: [], cursor: 0, lastPlayedAt: 0 };
            for (let i = 0; i < SFX_POOL_SIZE; i++) {
                const el = new Audio(cfg.path);
                el.volume = cfg.vol;
                el.preload = 'auto';
                pool.elements.push(el);
            }
            this.sfxPools.set(key, pool);
        }
    }

    // ---- SFX Playback (pooled + throttled) ----
    play(key: string, _forceClone: boolean = false) {
        if (!this.initialized) this.preload();

        const pool = this.sfxPools.get(key);
        if (!pool) return;

        // Throttle: skip if played too recently
        const now = performance.now();
        if (now - pool.lastPlayedAt < SFX_THROTTLE_MS) return;
        pool.lastPlayedAt = now;

        // Round-robin through the pre-allocated pool
        const el = pool.elements[pool.cursor % pool.elements.length];
        pool.cursor++;

        // Reset and play
        el.currentTime = 0;
        el.play().catch(() => { /* expected before interaction */ });
    }

    // ---- BGM Start (deduplicated) ----
    requestMusicStart() {
        if (!this.initialized) this.preload();
        if (!this.bgm) return;

        // Already playing or in the middle of starting — do nothing
        if (this.bgmState === 'playing' || this.bgmState === 'starting') return;

        this.bgmState = 'starting';
        this.bgm.play()
            .then(() => { this.bgmState = 'playing'; })
            .catch(() => { this.bgmState = 'stopped'; /* no interaction yet */ });
    }

    // ---- BGM Stop ----
    stop(key: string) {
        if (key === 'game' && this.bgm) {
            this.bgm.pause();
            // Don't reset currentTime — allows seamless resume
            this.bgmState = 'stopped';
            return;
        }

        // For SFX: stop all pool elements
        const pool = this.sfxPools.get(key);
        if (pool) {
            for (const el of pool.elements) {
                el.pause();
                el.currentTime = 0;
            }
        }
    }
}

export const audioController = new AudioController();
