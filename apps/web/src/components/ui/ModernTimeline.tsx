import React from 'react';
import { LucideIcon, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TimelineEvent {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: LucideIcon;
  iconColor?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'default';
  metadata?: Record<string, any>;
}

export interface ModernTimelineProps {
  events: TimelineEvent[];
  variant?: 'default' | 'gradient-crou';
  showIcons?: boolean;
  className?: string;
}

export function ModernTimeline({
  events,
  variant = 'default',
  showIcons = true,
  className,
}: ModernTimelineProps) {
  const getStatusColor = (status?: TimelineEvent['status']) => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          icon: 'text-green-600',
          line: 'bg-green-200',
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          icon: 'text-red-600',
          line: 'bg-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-amber-100',
          border: 'border-amber-500',
          icon: 'text-amber-600',
          line: 'bg-amber-200',
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          line: 'bg-blue-200',
        };
      default:
        return {
          bg: 'bg-primary-100',
          border: 'border-primary-500',
          icon: 'text-primary-600',
          line: 'bg-primary-200',
        };
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        variant === 'default' && 'border-gray-200 bg-white',
        variant === 'gradient-crou' && [
          'border-transparent',
          'bg-gradient-to-br from-primary-50 via-white to-secondary-50',
        ],
        className
      )}
    >
      <div className="relative">
        {events.map((event, index) => {
          const colors = getStatusColor(event.status);
          const EventIcon = event.icon || Clock;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative pb-8 last:pb-0">
              {/* Ligne verticale */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-5 top-11 w-0.5 h-full -ml-px',
                    colors.line
                  )}
                />
              )}

              <div className="relative flex items-start gap-4">
                {/* Icône */}
                {showIcons && (
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center',
                      colors.bg,
                      colors.border,
                      'shadow-sm'
                    )}
                  >
                    <EventIcon className={cn('w-5 h-5', colors.icon)} strokeWidth={2} />
                  </div>
                )}

                {/* Contenu */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {event.title}
                    </h4>
                    <time className="flex-shrink-0 text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </time>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {event.description}
                    </p>
                  )}

                  {/* Metadata */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                        >
                          <span className="text-gray-500">{key}:</span>
                          <span>{String(value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message si aucun événement */}
      {events.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucun événement pour le moment</p>
        </div>
      )}
    </div>
  );
}

export default ModernTimeline;
