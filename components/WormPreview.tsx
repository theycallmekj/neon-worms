import React, { useRef, useEffect } from 'react';
import { Skin } from '../types';

interface WormPreviewProps {
    skin: Skin;
    className?: string;
}

const WormPreview: React.FC<WormPreviewProps> = ({ skin, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const timeRef = useRef<number>(0);

    // Cache for images
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        // Preload composite skin images if needed
        if (skin.type === 'composite' && skin.composite) {
            const load = (src: string) => {
                if (!imagesRef.current.has(src)) {
                    const img = new Image();
                    img.src = src;
                    imagesRef.current.set(src, img);
                }
            };
            if (skin.composite.headBase) load(skin.composite.headBase);
            if (skin.composite.eyes?.imageSrc) load(skin.composite.eyes.imageSrc);
            if (skin.composite.mouth?.imageSrc) load(skin.composite.mouth.imageSrc);
            if (skin.composite.body?.imageSrc) load(skin.composite.body.imageSrc);
            if (skin.composite.tail?.imageSrc) load(skin.composite.tail.imageSrc);
        }
    }, [skin]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            timeRef.current += 0.016; // Approx 60fps
            const time = timeRef.current;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Setup worm parameters
            const centerX = canvas.width / 2;
            const segmentCount = 12; // Shorter worm
            const segmentSpacing = 16; // Spacing between segments
            const radius = 28; // Fatter worm

            // Calculate head position (Moved up from bottom)
            const headY = canvas.height - 140;

            // Draw body segments (from tail to head for correct layering, actually head is top layer so draw tail first)
            // Head is index 0. Tail is index segmentCount-1.
            // We draw from tail (index N) to head (index 0) so head is on top.

            for (let i = segmentCount - 1; i >= 0; i--) {
                // Vertical position: Head at bottom, tail goes up
                // y = headY - (i * spacing) -> segments go UP from head
                const segY = headY - (i * segmentSpacing);

                // Horizontal wiggle: Sine wave
                // Amplitude increases slightly towards tail
                const wiggleAmp = 10 + (i * 2);
                const wiggleFreq = 0.2;
                const wiggleSpeed = 3;
                const segX = centerX + Math.sin(time * wiggleSpeed + i * wiggleFreq) * wiggleAmp;

                // Determine segment color/style
                ctx.save();
                ctx.translate(segX, segY);

                // --- Drawing Logic based on Skin Type ---
                if (skin.type === 'composite' && skin.composite) {
                    // Composite Skin Body
                    if (i === 0) {
                        // HEAD
                        const headSize = radius * 2.4;

                        // Head Base
                        const headImg = imagesRef.current.get(skin.composite.headBase || '');
                        if (headImg && headImg.complete) {
                            ctx.drawImage(headImg, -headSize / 2, -headSize / 2, headSize, headSize);
                        } else {
                            // Fallback head
                            ctx.fillStyle = skin.headColor || skin.colors[0];
                            ctx.beginPath();
                            ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // Face Animation (Wiggle rotation)
                        const faceRot = Math.sin(time * 5) * 0.1;
                        ctx.rotate(faceRot);

                        // Eyes
                        if (skin.composite.eyes?.imageSrc) {
                            const eyesImg = imagesRef.current.get(skin.composite.eyes.imageSrc);
                            if (eyesImg && eyesImg.complete) {
                                ctx.drawImage(eyesImg, -headSize / 2, -headSize / 2, headSize, headSize);
                            }
                        }

                        // Mouth (Wiggle/Talk)
                        if (skin.composite.mouth?.imageSrc) {
                            const mouthImg = imagesRef.current.get(skin.composite.mouth.imageSrc);
                            if (mouthImg && mouthImg.complete) {
                                // Mouth render logic (maybe scale/open-close)
                                const mouthOpen = 1 + Math.sin(time * 8) * 0.1;
                                ctx.save();
                                ctx.scale(1, mouthOpen);
                                ctx.drawImage(mouthImg, -headSize / 2, -headSize / 2, headSize, headSize);
                                ctx.restore();
                            }
                        }

                    } else if (i === segmentCount - 1) {
                        // TAIL
                        const tailImg = imagesRef.current.get(skin.composite.tail?.imageSrc || '');
                        if (tailImg && tailImg.complete) {
                            const tailSize = radius * 2.5;
                            ctx.rotate(Math.sin(time * 5) * 0.2); // Tail wag
                            ctx.drawImage(tailImg, -tailSize / 2, -tailSize / 2, tailSize, tailSize);
                        } else {
                            // Fallback tail
                            ctx.fillStyle = skin.colors[skin.colors.length - 1];
                            ctx.beginPath();
                            ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else {
                        // BODY SEGMENT
                        const bodyImg = imagesRef.current.get(skin.composite.body?.imageSrc || '');
                        if (bodyImg && bodyImg.complete) {
                            const bodySize = radius * 2.2;
                            ctx.drawImage(bodyImg, -bodySize / 2, -bodySize / 2, bodySize, bodySize);
                        } else {
                            // Fallback body
                            const colorIndex = i % skin.colors.length;
                            ctx.fillStyle = skin.colors[colorIndex];
                            ctx.beginPath();
                            ctx.arc(0, 0, radius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }

                } else {
                    // Standard Skin Logic
                    const colorIndex = i % skin.colors.length;
                    ctx.fillStyle = skin.colors[colorIndex];

                    if (i === 0) {
                        // Head
                        ctx.fillStyle = skin.headColor || skin.colors[0];
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
                        ctx.fill();

                        // Face (Eyes/Mouth)
                        ctx.fillStyle = 'white';
                        // Left Eye
                        ctx.beginPath(); ctx.arc(-8, -5, 5, 0, Math.PI * 2); ctx.fill();
                        // Right Eye
                        ctx.beginPath(); ctx.arc(8, -5, 5, 0, Math.PI * 2); ctx.fill();
                        // Pupils
                        ctx.fillStyle = 'black';
                        ctx.beginPath(); ctx.arc(-8 + Math.sin(time) * 2, -5, 2.5, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(8 + Math.sin(time) * 2, -5, 2.5, 0, Math.PI * 2); ctx.fill();

                        // Mouth
                        ctx.fillStyle = 'white'; // Smile
                        ctx.beginPath();
                        ctx.arc(0, 5, 6, 0.1, Math.PI - 0.1);
                        ctx.fill();

                    } else {
                        // Body
                        ctx.beginPath();
                        ctx.arc(0, 0, radius, 0, Math.PI * 2);
                        ctx.fill();

                        // Shadow/Highlight for 3D effect
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.beginPath();
                        ctx.arc(-4, -4, radius * 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [skin]);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Glow effect behind worm */}
            <div
                className="absolute inset-x-10 inset-y-20 rounded-full blur-[60px] opacity-40 transition-colors duration-500"
                style={{ background: skin.colors[0] }}
            />
            <canvas
                ref={canvasRef}
                width={300}
                height={500}
                className="w-full h-full object-contain relative z-10"
            />
        </div>
    );
};

export default WormPreview;
