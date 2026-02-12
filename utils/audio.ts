export class AudioController {
    private sounds: Map<string, HTMLAudioElement>;
    private initialized: boolean = false;
    private musicStarted: boolean = false;

    constructor() {
        this.sounds = new Map();
    }

    preload() {
        if (typeof window === 'undefined') return;

        const soundFiles = {
            'game': '/sfx/Game.opus',
            'coin': '/sfx/Coin.opus',
            'food': '/sfx/Food.opus',
            'collision': '/sfx/Collision.opus',
            'powerup': '/sfx/Powerup.opus'
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);

            // Volume tuning
            if (key === 'food') audio.volume = 0.3; // Requested lower volume
            if (key === 'game') {
                audio.volume = 0.4; // Background music shouldn't be too loud
                audio.loop = true;
            }
            if (key === 'coin') audio.volume = 0.5;
            if (key === 'powerup') audio.volume = 0.6;
            if (key === 'collision') audio.volume = 0.7;

            this.sounds.set(key, audio);
        });

        this.initialized = true;
    }

    play(key: string, forceClone: boolean = false) {
        if (!this.initialized) this.preload();

        const original = this.sounds.get(key);
        if (!original) return;

        if (forceClone) {
            // Allow overlapping sounds (e.g. rapid coin pickup)
            const clone = original.cloneNode() as HTMLAudioElement;
            clone.volume = original.volume;
            clone.play().catch(e => console.warn('Audio play failed', e));
        } else {
            if (original.paused || original.ended) {
                original.play().catch(e => console.warn('Audio play failed', e));
            } else {
                // If already playing, reset to start
                original.currentTime = 0;
                original.play().catch(e => console.warn('Audio play failed', e));
            }
        }
    }

    requestMusicStart() {
        if (this.musicStarted) return;

        const music = this.sounds.get('game');
        if (music) {
            music.play().then(() => {
                this.musicStarted = true;
            }).catch(e => {
                // Expected if no user interaction yet
                // console.log("Waiting for interaction to start music");
            });
        }
    }

    stop(key: string) {
        const audio = this.sounds.get(key);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
}

export const audioController = new AudioController();
