import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface ModernAccordionProps {
  items: AccordionItem[];
  defaultOpen?: string | string[];
  mode?: 'single' | 'multiple';
  variant?: 'default' | 'bordered' | 'gradient-crou';
  allowToggle?: boolean;
  className?: string;
}

const ModernAccordion: React.FC<ModernAccordionProps> = ({
  items,
  defaultOpen,
  mode = 'single',
  variant = 'default',
  allowToggle = true,
  className,
}) => {
  const getInitialOpenItems = (): string[] => {
    if (!defaultOpen) return [];
    return Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen];
  };

  const [openItems, setOpenItems] = useState<string[]>(getInitialOpenItems());

  const isOpen = (itemId: string) => openItems.includes(itemId);

  const handleToggle = (itemId: string, disabled?: boolean) => {
    if (disabled) return;

    setOpenItems((prev) => {
      const isCurrentlyOpen = prev.includes(itemId);

      if (mode === 'single') {
        // Single mode: only one item can be open
        if (isCurrentlyOpen && allowToggle) {
          return []; // Close if toggle allowed
        }
        return [itemId]; // Open new item (closes others)
      } else {
        // Multiple mode: multiple items can be open
        if (isCurrentlyOpen) {
          return prev.filter((id) => id !== itemId); // Close item
        }
        return [...prev, itemId]; // Open item
      }
    });
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'bordered':
        return {
          container: 'border border-gray-200 rounded-lg divide-y divide-gray-200',
          item: '',
          header: 'hover:bg-gray-50',
        };
      case 'gradient-crou':
        return {
          container: 'space-y-2',
          item: 'border border-gray-200 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-50 to-orange-50',
          header: 'hover:from-emerald-100 hover:to-orange-100',
        };
      default:
        return {
          container: 'space-y-2',
          item: 'border border-gray-200 rounded-lg overflow-hidden',
          header: 'hover:bg-gray-50',
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={cn('w-full', variantClasses.container, className)}>
      {items.map((item) => {
        const itemIsOpen = isOpen(item.id);

        return (
          <div
            key={item.id}
            className={cn(variantClasses.item)}
          >
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => handleToggle(item.id, item.disabled)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3',
                'text-left transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset',
                variantClasses.header,
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-expanded={itemIsOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                {item.icon && (
                  <div className="flex-shrink-0">
                    <item.icon
                      className={cn(
                        'w-5 h-5',
                        itemIsOpen ? 'text-emerald-600' : 'text-gray-500'
                      )}
                    />
                  </div>
                )}

                {/* Title */}
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    itemIsOpen ? 'text-emerald-600' : 'text-gray-900'
                  )}
                >
                  {item.title}
                </span>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  'w-5 h-5 flex-shrink-0 text-gray-500 transition-transform duration-300',
                  itemIsOpen && 'rotate-180 text-emerald-600'
                )}
              />
            </button>

            {/* Accordion Content */}
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={item.id}
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                itemIsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-4 pb-4 pt-2 text-sm text-gray-600">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModernAccordion;
