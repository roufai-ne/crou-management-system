import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { ChevronRightIcon, HomeIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
    ? Parameters<T>[0]
    : never;

// Fonction de variantes personnalisée pour le breadcrumb
const breadcrumbVariants = (props: {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal';
}) => {
    const baseClasses = 'flex items-center space-x-1 text-sm';

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const variantClasses = {
        default: '',
        minimal: 'space-x-2'
    };

    return cn(
        baseClasses,
        sizeClasses[props.size || 'md'],
        variantClasses[props.variant || 'default']
    );
};

// Fonction de variantes pour les éléments
const breadcrumbItemVariants = (props: {
    isActive?: boolean;
    isClickable?: boolean;
}) => {
    const baseClasses = 'inline-flex items-center gap-1 transition-colors duration-200';

    if (props.isActive) {
        return cn(baseClasses, 'text-gray-900 font-medium');
    }

    if (props.isClickable) {
        return cn(baseClasses, 'text-gray-500 hover:text-gray-700 cursor-pointer');
    }

    return cn(baseClasses, 'text-gray-500');
};

// Interface pour un élément de breadcrumb
export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}

// Interface des props
interface BreadcrumbProps extends React.HTMLAttributes<HTMLNavElement> {
    items: BreadcrumbItem[];
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal';
    separator?: React.ReactNode;
    maxItems?: number;
    showHome?: boolean;
    homeHref?: string;
    onHomeClick?: () => void;
}

// Composant Breadcrumb
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
    items,
    size = 'md',
    variant = 'default',
    separator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />,
    maxItems = 5,
    showHome = true,
    homeHref = '/',
    onHomeClick,
    className,
    ...props
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    // Gérer l'affichage des éléments selon maxItems
    const displayItems = React.useMemo(() => {
        if (items.length <= maxItems) {
            return items;
        }

        // Si trop d'éléments, afficher les premiers, "...", et les derniers
        const firstItems = items.slice(0, 1);
        const lastItems = items.slice(-2);

        return [
            ...firstItems,
            { label: '...', isEllipsis: true } as BreadcrumbItem & { isEllipsis: boolean },
            ...lastItems
        ];
    }, [items, maxItems]);

    const handleItemClick = (item: BreadcrumbItem) => {
        if (item.onClick) {
            item.onClick();
        } else if (item.href) {
            window.location.href = item.href;
        }
    };

    const handleHomeClick = () => {
        if (onHomeClick) {
            onHomeClick();
        } else if (homeHref) {
            window.location.href = homeHref;
        }
    };

    return (
        <nav
            ref={containerRef}
            className={cn(breadcrumbVariants({ size, variant }), className)}
            aria-label="Breadcrumb"
            {...props}
        >
            <ol className="flex items-center space-x-1">
                {/* Élément Home */}
                {showHome && (
                    <>
                        <li>
                            <button
                                type="button"
                                onClick={handleHomeClick}
                                className={breadcrumbItemVariants({ isClickable: true })}
                                aria-label="Accueil"
                            >
                                <HomeIcon className="w-4 h-4" />
                                <span className="sr-only">Accueil</span>
                            </button>
                        </li>
                        {displayItems.length > 0 && (
                            <li aria-hidden="true">
                                {separator}
                            </li>
                        )}
                    </>
                )}

                {/* Éléments du breadcrumb */}
                {displayItems.map((item, index) => {
                    const isLast = index === displayItems.length - 1;
                    const isClickable = !isLast && (item.href || item.onClick);
                    const isEllipsis = 'isEllipsis' in item && item.isEllipsis;

                    return (
                        <React.Fragment key={`${item.label}-${index}`}>
                            <li>
                                {isEllipsis ? (
                                    <button
                                        type="button"
                                        className={breadcrumbItemVariants({ isClickable: true })}
                                        onClick={() => setIsCollapsed(!isCollapsed)}
                                        aria-label="Afficher plus d'éléments"
                                    >
                                        <EllipsisHorizontalIcon className="w-4 h-4" />
                                    </button>
                                ) : isClickable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleItemClick(item)}
                                        className={breadcrumbItemVariants({ isClickable: true })}
                                    >
                                        {item.icon && (
                                            <span className="w-4 h-4 flex-shrink-0">
                                                {item.icon}
                                            </span>
                                        )}
                                        <span>{item.label}</span>
                                    </button>
                                ) : (
                                    <span
                                        className={breadcrumbItemVariants({ isActive: isLast })}
                                        aria-current={isLast ? 'page' : undefined}
                                    >
                                        {item.icon && (
                                            <span className="w-4 h-4 flex-shrink-0">
                                                {item.icon}
                                            </span>
                                        )}
                                        <span>{item.label}</span>
                                    </span>
                                )}
                            </li>

                            {/* Séparateur */}
                            {!isLast && (
                                <li aria-hidden="true">
                                    {separator}
                                </li>
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;