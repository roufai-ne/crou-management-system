/**
 * FICHIER: apps\web\src\components\ui\IconFallback.tsx
 * COMPOSANT: IconFallback - Icônes de secours si Heroicons ne se charge pas
 * 
 * DESCRIPTION:
 * Composant de secours pour remplacer les icônes Heroicons
 * Utilise des emojis ou du texte simple comme fallback
 * 
 * USAGE:
 * <IconFallback type="home" className="w-6 h-6" />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface IconFallbackProps {
  type: string;
  className?: string;
  solid?: boolean;
}

const iconMap: Record<string, string> = {
  // Navigation
  'home': '🏠',
  'chart-bar': '📊',
  'banknotes': '💰',
  'exclamation-circle': '⚠️',
  'cube': '📦',
  'home-modern': '🏢',
  'truck': '🚛',
  'document-text': '📋',
  'cog': '⚙️',
  'bell': '🔔',
  'user-circle': '👤',
  'arrow-right-on-rectangle': '🚪',
  
  // Actions
  'bars-3': '☰',
  'x-mark': '✖️',
  'chevron-down': '⬇️',
  'chevron-up': '⬆️',
  'chevron-left': '⬅️',
  'chevron-right': '➡️',
  'plus': '➕',
  'minus': '➖',
  'pencil': '✏️',
  'trash': '🗑️',
  'eye': '👁️',
  'eye-slash': '🙈',
  'magnifying-glass': '🔍',
  'funnel': '🔽',
  'arrow-down-tray': '⬇️',
  'arrow-up-tray': '⬆️',
  'arrow-path': '🔄',
  'check': '✅',
  'x': '❌',
  
  // Status
  'exclamation-triangle': '⚠️',
  'information-circle': 'ℹ️',
  'check-circle': '✅',
  'x-circle': '❌',
  'clock': '🕐',
  'calendar': '📅',
  'calendar-days': '📅',
  
  // Communication
  'envelope': '✉️',
  'phone': '📞',
  'chat-bubble-left': '💬',
  
  // Files
  'folder': '📁',
  'document': '📄',
  'photo': '🖼️',
  'film': '🎬',
  
  // Misc
  'sun': '☀️',
  'moon': '🌙',
  'computer-desktop': '🖥️',
  'wifi': '📶',
  'signal': '📶',
  'battery-100': '🔋',
  'heart': '❤️',
  'star': '⭐',
  'bookmark': '🔖',
  'tag': '🏷️',
  'key': '🔑',
  'lock-closed': '🔒',
  'lock-open': '🔓',
  'shield-check': '🛡️',
  'fire': '🔥',
  'bolt': '⚡',
  'light-bulb': '💡',
  'academic-cap': '🎓',
  'building-office': '🏢',
  'building-storefront': '🏪',
  'map': '🗺️',
  'globe-alt': '🌍',
  'currency-dollar': '💲',
  'credit-card': '💳',
  'gift': '🎁',
  'shopping-cart': '🛒',
  'scale': '⚖️',
  'wrench-screwdriver': '🔧',
  'beaker': '🧪',
  'clipboard': '📋',
  'presentation-chart-line': '📈',
  'presentation-chart-bar': '📊',
  'calculator': '🧮',
  'printer': '🖨️',
  'server': '🖥️',
  'database': '🗄️',
  'cloud': '☁️',
  'rss': '📡',
  'link': '🔗',
  'qr-code': '📱',
  'device-phone-mobile': '📱',
  'device-tablet': '📱',
  'tv': '📺',
  'radio': '📻',
  'speaker-wave': '🔊',
  'microphone': '🎤',
  'video-camera': '📹',
  'camera': '📷'
};

export const IconFallback: React.FC<IconFallbackProps> = ({ 
  type, 
  className = 'w-6 h-6', 
  solid = false 
}) => {
  const iconKey = type.toLowerCase().replace(/icon$/, '');
  const icon = iconMap[iconKey] || '❓';

  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center text-current',
        className
      )}
      style={{ fontSize: '1em', lineHeight: 1 }}
      title={`Icon: ${type}`}
    >
      {icon}
    </span>
  );
};

// Export des icônes individuelles pour compatibilité
export const ChartBarIcon = (props: any) => <IconFallback type="chart-bar" {...props} />;
export const BanknotesIcon = (props: any) => <IconFallback type="banknotes" {...props} />;
export const CubeIcon = (props: any) => <IconFallback type="cube" {...props} />;
export const HomeModernIcon = (props: any) => <IconFallback type="home-modern" {...props} />;
export const TruckIcon = (props: any) => <IconFallback type="truck" {...props} />;
export const DocumentTextIcon = (props: any) => <IconFallback type="document-text" {...props} />;
export const CogIcon = (props: any) => <IconFallback type="cog" {...props} />;
export const Bars3Icon = (props: any) => <IconFallback type="bars-3" {...props} />;
export const XMarkIcon = (props: any) => <IconFallback type="x-mark" {...props} />;
export const BellIcon = (props: any) => <IconFallback type="bell" {...props} />;
export const UserCircleIcon = (props: any) => <IconFallback type="user-circle" {...props} />;
export const ArrowRightOnRectangleIcon = (props: any) => <IconFallback type="arrow-right-on-rectangle" {...props} />;
export const ChevronDownIcon = (props: any) => <IconFallback type="chevron-down" {...props} />;
export const ChevronUpIcon = (props: any) => <IconFallback type="chevron-up" {...props} />;
export const ChevronLeftIcon = (props: any) => <IconFallback type="chevron-left" {...props} />;
export const ChevronRightIcon = (props: any) => <IconFallback type="chevron-right" {...props} />;
export const PlusIcon = (props: any) => <IconFallback type="plus" {...props} />;
export const MinusIcon = (props: any) => <IconFallback type="minus" {...props} />;
export const PencilIcon = (props: any) => <IconFallback type="pencil" {...props} />;
export const TrashIcon = (props: any) => <IconFallback type="trash" {...props} />;
export const EyeIcon = (props: any) => <IconFallback type="eye" {...props} />;
export const EyeSlashIcon = (props: any) => <IconFallback type="eye-slash" {...props} />;
export const KeyIcon = (props: any) => <IconFallback type="key" {...props} />;
export const ExclamationCircleIcon = (props: any) => <IconFallback type="exclamation-circle" {...props} />;
export const MagnifyingGlassIcon = (props: any) => <IconFallback type="magnifying-glass" {...props} />;
export const FunnelIcon = (props: any) => <IconFallback type="funnel" {...props} />;
export const ArrowDownTrayIcon = (props: any) => <IconFallback type="arrow-down-tray" {...props} />;
export const ArrowUpTrayIcon = (props: any) => <IconFallback type="arrow-up-tray" {...props} />;
export const ArrowPathIcon = (props: any) => <IconFallback type="arrow-path" {...props} />;
export const CheckIcon = (props: any) => <IconFallback type="check" {...props} />;
export const XIcon = (props: any) => <IconFallback type="x" {...props} />;
export const ExclamationTriangleIcon = (props: any) => <IconFallback type="exclamation-triangle" {...props} />;
export const InformationCircleIcon = (props: any) => <IconFallback type="information-circle" {...props} />;
export const CheckCircleIcon = (props: any) => <IconFallback type="check-circle" {...props} />;
export const XCircleIcon = (props: any) => <IconFallback type="x-circle" {...props} />;
export const ClockIcon = (props: any) => <IconFallback type="clock" {...props} />;
export const CalendarIcon = (props: any) => <IconFallback type="calendar" {...props} />;
export const CalendarDaysIcon = (props: any) => <IconFallback type="calendar-days" {...props} />;
export const EnvelopeIcon = (props: any) => <IconFallback type="envelope" {...props} />;
export const PhoneIcon = (props: any) => <IconFallback type="phone" {...props} />;
export const ChatBubbleLeftIcon = (props: any) => <IconFallback type="chat-bubble-left" {...props} />;
export const FolderIcon = (props: any) => <IconFallback type="folder" {...props} />;
export const DocumentIcon = (props: any) => <IconFallback type="document" {...props} />;
export const PhotoIcon = (props: any) => <IconFallback type="photo" {...props} />;
export const FilmIcon = (props: any) => <IconFallback type="film" {...props} />;
export const SunIcon = (props: any) => <IconFallback type="sun" {...props} />;
export const MoonIcon = (props: any) => <IconFallback type="moon" {...props} />;
export const ComputerDesktopIcon = (props: any) => <IconFallback type="computer-desktop" {...props} />;

export default IconFallback;
