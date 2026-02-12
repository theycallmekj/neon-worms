import React from 'react';

interface NeonButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'gold';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

const NeonButton: React.FC<NeonButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    disabled = false,
    icon,
}) => {
    // Styles based on variant
    const variants = {
        primary: {
            background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            shadow: '0 0 15px rgba(0, 198, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            text: 'white'
        },
        secondary: {
            background: 'rgba(255, 255, 255, 0.05)',
            shadow: '0 0 0 transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            text: 'rgba(255, 255, 255, 0.8)'
        },
        danger: {
            background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
            shadow: '0 0 15px rgba(255, 65, 108, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            text: 'white'
        },
        gold: {
            background: 'linear-gradient(135deg, #fce38a 0%, #f38181 100%)',
            shadow: '0 0 15px rgba(243, 129, 129, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            text: '#4a0e0e'
        },
    };

    const style = variants[variant];

    // Map sizes to Tailwind classes with touch-friendly min-height
    const sizeClasses = {
        sm: 'text-xs px-3 py-2 min-h-[40px] sm:min-h-[36px]',
        md: 'text-sm px-6 py-3 min-h-[48px]',
        lg: 'text-lg px-8 py-4 min-h-[56px]',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${sizeClasses[size]} ${fullWidth ? 'w-full' : 'w-auto'} ${className}`}
            style={{
                position: 'relative',
                borderRadius: '12px',
                border: style.border,
                background: style.background,
                boxShadow: style.shadow,
                color: style.text,
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                opacity: disabled ? 0.6 : 1,
                backdropFilter: 'blur(4px)',
                touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${style.shadow.split(' ')[3].replace('0.4', '0.6')}`;
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = style.shadow;
                }
            }}
            onMouseDown={(e) => {
                if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
                if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
        >
            {/* Shimmer effect overlay */}
            {
                variant !== 'secondary' && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.1), rgba(255,255,255,0))',
                        transform: 'skewX(-20deg)',
                        pointerEvents: 'none',
                    }} />
                )
            }

            {icon && <span style={{ fontSize: '1.2em' }}>{icon}</span>}
            {children}
        </button >
    );
};

export default NeonButton;
