import React from 'react';
import { LucideIcon } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconVariant = 'default' | 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'gradient-crou' | 'gradient-primary' | 'gradient-accent';

interface IconWrapperProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  strokeWidth?: number;
  animate?: 'spin' | 'pulse' | 'bounce' | 'scale' | 'none';
}

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48
};

const variantClasses: Record<IconVariant, string> = {
  default: 'text-gray-600',
  primary: 'text-primary-600',
  accent: 'text-accent-600',
  success: 'text-success-600',
  danger: 'text-danger-600',
  warning: 'text-warning-600',
  info: 'text-info-600',
  'gradient-crou': 'text-transparent bg-clip-text bg-gradient-crou',
  'gradient-primary': 'text-transparent bg-clip-text bg-gradient-primary',
  'gradient-accent': 'text-transparent bg-clip-text bg-gradient-accent'
};

const animationClasses: Record<string, string> = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce-subtle',
  scale: 'hover:scale-110 transition-transform duration-200',
  none: ''
};

/**
 * Composant IconWrapper pour gérer les icônes Lucide avec support de gradients CROU
 * 
 * @example
 * // Icône simple
 * <IconWrapper icon={Home} size="md" variant="primary" />
 * 
 * @example
 * // Icône avec gradient CROU (Vert → Orange)
 * <IconWrapper icon={TrendingUp} size="lg" variant="gradient-crou" />
 * 
 * @example
 * // Icône animée
 * <IconWrapper icon={Loader} size="md" variant="primary" animate="spin" />
 */
export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 'md',
  variant = 'default',
  className = '',
  strokeWidth = 2,
  animate = 'none'
}) => {
  const iconSize = sizeMap[size];
  const variantClass = variantClasses[variant];
  const animationClass = animationClasses[animate];

  // Pour les gradients, on wrap l'icône dans un span avec le gradient
  if (variant.startsWith('gradient-')) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${animationClass} ${className}`}
        style={{
          background: variant === 'gradient-crou' 
            ? 'linear-gradient(135deg, #10b981 0%, #f97316 100%)'
            : variant === 'gradient-primary'
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        <Icon 
          size={iconSize} 
          strokeWidth={strokeWidth}
          style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}
        />
      </span>
    );
  }

  return (
    <Icon 
      size={iconSize} 
      strokeWidth={strokeWidth}
      className={`${variantClass} ${animationClass} ${className}`}
    />
  );
};

/**
 * Composant IconWithBackground pour icônes avec fond coloré ou gradient
 */
interface IconWithBackgroundProps extends IconWrapperProps {
  background?: 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'gradient-crou' | 'gradient-primary' | 'gradient-accent';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  padding?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const backgroundClasses: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  accent: 'bg-accent-100 text-accent-600',
  success: 'bg-success-100 text-success-600',
  danger: 'bg-danger-100 text-danger-600',
  warning: 'bg-warning-100 text-warning-600',
  info: 'bg-info-100 text-info-600',
  'gradient-crou': 'bg-gradient-crou text-white',
  'gradient-primary': 'bg-gradient-primary text-white',
  'gradient-accent': 'bg-gradient-accent text-white'
};

const roundedClasses: Record<string, string> = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full'
};

const paddingClasses: Record<string, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3'
};

export const IconWithBackground: React.FC<IconWithBackgroundProps> = ({
  icon: Icon,
  size = 'md',
  variant = 'default',
  background = 'primary',
  rounded = 'md',
  padding = 'md',
  glow = false,
  className = '',
  strokeWidth = 2,
  animate = 'none'
}) => {
  const iconSize = sizeMap[size];
  const backgroundClass = backgroundClasses[background];
  const roundedClass = roundedClasses[rounded];
  const paddingClass = paddingClasses[padding];
  const animationClass = animationClasses[animate];
  
  const glowClass = glow 
    ? background === 'gradient-crou' || background === 'primary'
      ? 'shadow-card-glow-green'
      : background === 'accent'
      ? 'shadow-card-glow-orange'
      : ''
    : '';

  return (
    <div 
      className={`
        inline-flex items-center justify-center
        ${backgroundClass}
        ${roundedClass}
        ${paddingClass}
        ${glowClass}
        ${animationClass}
        transition-all duration-200
        ${className}
      `}
    >
      <Icon 
        size={iconSize} 
        strokeWidth={strokeWidth}
      />
    </div>
  );
};

/**
 * Composant IconDecorative pour grandes icônes décoratives en arrière-plan
 */
interface IconDecorativeProps {
  icon: LucideIcon;
  size?: number;
  opacity?: number;
  className?: string;
  gradient?: boolean;
}

export const IconDecorative: React.FC<IconDecorativeProps> = ({
  icon: Icon,
  size = 120,
  opacity = 0.05,
  className = '',
  gradient = false
}) => {
  if (gradient) {
    return (
      <div 
        className={`absolute pointer-events-none ${className}`}
        style={{
          opacity,
          background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)',
          WebkitMask: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>')}")`,
          WebkitMaskSize: `${size}px ${size}px`,
          WebkitMaskRepeat: 'no-repeat',
          width: `${size}px`,
          height: `${size}px`
        }}
      />
    );
  }

  return (
    <Icon 
      size={size} 
      strokeWidth={1}
      className={`absolute text-gray-200 pointer-events-none ${className}`}
      style={{ opacity }}
    />
  );
};

export default IconWrapper;
