
import { Worm, CompositeSkin, SkinPart, Vector2 } from '../types';
import { Vec2 } from './math';

export type AnimationState = 'idle' | 'moving' | 'boosting' | 'dead';

export class AnimationEngine {

    static getTransform(
        part: SkinPart,
        worm: Worm,
        segmentIndex: number,
        totalSegments: number,
        animTime: number
    ): { x: number, y: number, rotation: number, scale: number } {

        // Default transform
        let x = 0;
        let y = 0;
        let rotation = 0;
        let scale = 1;

        const speed = part.params?.speed || 1;
        const intensity = part.params?.intensity || 0.1;
        const offset = part.params?.offset || 0;

        switch (part.animation) {
            case 'sine-wave':
                // Classic snake wiggle
                // Offset by segment index to create a traveling wave
                const wavePhase = (animTime * speed) + (segmentIndex * 0.2) + offset;
                rotation = Math.sin(wavePhase) * intensity;
                break;

            case 'pulse':
                // Breathing effect
                scale = 1 + Math.sin(animTime * speed + offset) * intensity;
                break;

            case 'jitters':
                // Nervous shaking
                x = (Math.random() - 0.5) * intensity * 10;
                y = (Math.random() - 0.5) * intensity * 10;
                break;

            case 'rotate-spin':
                // Continuous spinning (e.g., for shruikens, not usually for organic skins)
                rotation = (animTime * speed) % (Math.PI * 2);
                break;

            case 'tail-whip':
                // Intense tail movement
                // Only affects last 20% of segments
                if (totalSegments > 5 && segmentIndex > totalSegments * 0.8) {
                    const tailSection = totalSegments * 0.2;
                    // Avoid division by zero
                    const tailFactor = tailSection > 0 ? (segmentIndex - (totalSegments * 0.8)) / tailSection : 0;
                    rotation = Math.sin(animTime * speed * 2) * intensity * tailFactor;
                }
                break;

            case 'stretch':
                // Elongate and squash
                const stretch = Math.sin(animTime * speed) * intensity;
                scale = 1 + stretch;
                break;
        }

        return { x, y, rotation, scale };
    }

    static getFaceState(worm: Worm, animTime: number): {
        eyes: 'open' | 'closed' | 'squint' | 'wide' | 'angry' | 'sad',
        mouth: 'idle' | 'open' | 'smile' | 'frown' | 'chewing'
    } {
        // Determine Eye State
        let eyes: 'open' | 'closed' | 'squint' | 'wide' | 'angry' | 'sad' = 'open';

        if (worm.isDead) {
            eyes = 'closed'; // X_X
        } else if (worm.expression === 'eating') {
            eyes = 'squint'; // ^_^
        } else if (worm.expression === 'killer' || worm.expression === 'frustrated') {
            eyes = 'angry'; // >_<
        } else if (worm.expression === 'sad') {
            eyes = 'sad'; // ;_;
        } else if (worm.expression === 'scared') {
            eyes = 'wide'; // O_O
        } else {
            // Periodic blinking
            const blinkCycle = animTime % 3; // Blink every 3 seconds
            if (blinkCycle < 0.15) {
                eyes = 'closed';
            }
        }

        // Determine Mouth State
        let mouth: 'idle' | 'open' | 'smile' | 'frown' | 'chewing' = 'idle';

        if (worm.isDead) {
            mouth = 'open';
        } else if (worm.expression === 'eating') {
            // Chewing animation
            mouth = (animTime * 10) % 1 < 0.5 ? 'open' : 'chewing';
        } else if (worm.expression === 'killer') {
            mouth = 'smile'; // Evil grin
        } else if (worm.expression === 'sad' || worm.expression === 'frustrated') {
            mouth = 'frown';
        } else if (worm.isBoosting) {
            mouth = 'open'; // O face from exertion
        }

        return { eyes, mouth };
    }
}
