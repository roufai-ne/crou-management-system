import React, { useState, ReactNode } from 'react';
import { cn } from '@/utils/cn';

// Types
export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface ModernTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'line' | 'pills' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  className?: string;
  contentClassName?: string;
}

const ModernTabs: React.FC<ModernTabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'line',
  size = 'md',
  orientation = 'horizontal',
  fullWidth = false,
  className,
  contentClassName,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || ''
  );

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    
    setInternalActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-1.5 gap-1.5';
      case 'lg':
        return 'text-base px-6 py-3 gap-3';
      default:
        return 'text-sm px-4 py-2 gap-2';
    }
  };

  const getVariantClasses = (tab: Tab, isActive: boolean) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium transition-all cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
      getSizeClasses(),
      tab.disabled && 'opacity-50 cursor-not-allowed'
    );

    switch (variant) {
      case 'pills':
        return cn(
          baseClasses,
          'rounded-lg',
          isActive
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
        );
      
      case 'cards':
        return cn(
          baseClasses,
          'rounded-t-lg border border-b-0',
          isActive
            ? 'bg-white text-emerald-600 border-gray-200 relative z-10'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        );
      
      default: // line
        return cn(
          baseClasses,
          'border-b-2',
          isActive
            ? 'border-emerald-600 text-emerald-600'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        );
    }
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'w-full',
        isVertical && 'flex gap-6',
        className
      )}
    >
      {/* Tab List */}
      <div
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          'flex',
          isVertical ? 'flex-col flex-shrink-0 w-48' : 'flex-row',
          variant === 'line' && !isVertical && 'border-b border-gray-200',
          variant === 'cards' && !isVertical && 'border-b border-gray-200',
          !isVertical && fullWidth && 'w-full',
          !isVertical && !fullWidth && 'overflow-x-auto'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              className={cn(
                getVariantClasses(tab, isActive),
                fullWidth && !isVertical && 'flex-1',
                isVertical && 'w-full justify-start'
              )}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                    isActive
                      ? variant === 'pills'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTabContent && (
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={activeTab}
          className={cn(
            variant === 'cards' && !isVertical && 'border border-gray-200 rounded-b-lg rounded-tr-lg p-6 bg-white',
            variant !== 'cards' && 'mt-4',
            isVertical && 'flex-1 mt-0',
            contentClassName
          )}
        >
          <div className="animate-fade-in">{activeTabContent}</div>
        </div>
      )}
    </div>
  );
};

export default ModernTabs;
