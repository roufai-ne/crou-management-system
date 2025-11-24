import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface CarouselItem {
  id: string;
  content: ReactNode;
  alt?: string;
}

interface ModernCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showControls?: boolean;
  loop?: boolean;
  variant?: 'default' | 'gradient-crou';
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  className?: string;
}

const ModernCarousel: React.FC<ModernCarouselProps> = ({
  items,
  autoPlay = false,
  interval = 5000,
  showIndicators = true,
  showControls = true,
  loop = true,
  variant = 'default',
  aspectRatio = '16/9',
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (index < 0) {
      setCurrentIndex(loop ? items.length - 1 : 0);
    } else if (index >= items.length) {
      setCurrentIndex(loop ? 0 : items.length - 1);
    } else {
      setCurrentIndex(index);
    }
  }, [items.length, loop]);

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered) return;

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16/9':
        return 'aspect-video';
      case '4/3':
        return 'aspect-[4/3]';
      case '1/1':
        return 'aspect-square';
      default:
        return '';
    }
  };

  const canGoPrevious = loop || currentIndex > 0;
  const canGoNext = loop || currentIndex < items.length - 1;

  return (
    <div
      className={cn('relative w-full group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Carousel"
    >
      {/* Carousel Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-gray-100',
          getAspectRatioClass(),
          variant === 'gradient-crou' && 'ring-2 ring-emerald-500/20'
        )}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="min-w-full h-full flex items-center justify-center"
              aria-hidden={index !== currentIndex}
            >
              {item.content}
            </div>
          ))}
        </div>

        {/* Previous Button */}
        {showControls && canGoPrevious && (
          <button
            type="button"
            onClick={goToPrevious}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white/90 backdrop-blur-sm shadow-lg',
              'text-gray-800 hover:bg-white hover:scale-110',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500'
            )}
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {showControls && canGoNext && (
          <button
            type="button"
            onClick={goToNext}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white/90 backdrop-blur-sm shadow-lg',
              'text-gray-800 hover:bg-white hover:scale-110',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500'
            )}
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToSlide(index)}
              className={cn(
                'transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full'
              )}
              aria-label={`Aller à la slide ${index + 1}`}
              aria-current={index === currentIndex}
            >
              {variant === 'gradient-crou' && index === currentIndex ? (
                <div className="w-8 h-2 rounded-full bg-gradient-to-r from-emerald-600 to-orange-600" />
              ) : (
                <Circle
                  className={cn(
                    'w-2 h-2 transition-all',
                    index === currentIndex
                      ? 'fill-emerald-600 text-emerald-600 scale-125'
                      : 'fill-gray-300 text-gray-300 hover:fill-gray-400 hover:text-gray-400'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
};

export default ModernCarousel;
