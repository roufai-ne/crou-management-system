import React from 'react';
import { cn } from '@/utils/cn';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour le spinner
const spinnerVariants = (props: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
}) => {
  const baseClasses = 'animate-spin rounded-full border-solid';
  
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };
  
  const variantClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-white/20 border-t-white'
  };
  
  return cn(
    baseClasses,
    sizeClasses[props.size || 'md'],
    variantClasses[props.variant || 'primary']
  );
};

// Fonction de variantes pour le skeleton
const skeletonVariants = (props: {
  variant?: 'text' | 'circular' | 'rectangular';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };
  
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6'
  };
  
  return cn(
    baseClasses,
    variantClasses[props.variant || 'text'],
    props.variant === 'text' ? sizeClasses[props.size || 'md'] : ''
  );
};

// Interface pour le Spinner
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
}

// Composant Spinner
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label="Chargement"
      {...props}
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

// Interface pour le Skeleton
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

// Composant Skeleton
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  size = 'md',
  width,
  height,
  lines = 1,
  className,
  style,
  ...props
}) => {
  const skeletonStyle = {
    width: width,
    height: height,
    ...style
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              skeletonVariants({ variant, size }),
              index === lines - 1 && 'w-3/4', // Dernière ligne plus courte
              className
            )}
            style={skeletonStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(skeletonVariants({ variant, size }), className)}
      style={skeletonStyle}
      {...props}
    />
  );
};

// Interface pour le LoadingDots
interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

// Composant LoadingDots
export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) => {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const dotColors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600'
  };

  return (
    <div
      className={cn('flex items-center space-x-1', className)}
      role="status"
      aria-label="Chargement"
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            dotSizes[size],
            dotColors[variant]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

// Interface pour le LoadingBar
interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// Composant LoadingBar
export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress = 0,
  variant = 'primary',
  size = 'md',
  animated = true,
  className,
  ...props
}) => {
  const barHeights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const barColors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  return (
    <div
      className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        barHeights[size],
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          barColors[variant],
          animated && 'animate-pulse'
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

// Composant Loading principal (export par défaut)
interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'spinner' | 'dots' | 'skeleton' | 'bar';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  progress?: number;
  lines?: number;
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'md',
  variant = 'primary',
  text,
  progress,
  lines,
  className,
  ...props
}) => {
  const renderLoading = () => {
    switch (type) {
      case 'dots':
        return <LoadingDots size={size} variant={variant} />;
      case 'skeleton':
        return <Skeleton lines={lines} size={size} />;
      case 'bar':
        return <LoadingBar progress={progress} variant={variant} size={size} />;
  default:
        return <Spinner size={size} variant={variant} />;
    }
  };

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      {...props}
    >
      {renderLoading()}
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading;
