/**
 * FICHIER: apps\web\src\components\ui\index.ts
 * EXPORTS: Exports centralisés des composants UI
 * 
 * DESCRIPTION:
 * Point d'entrée unique pour tous les composants du design system CROU
 * Facilite les imports et maintient la cohérence
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Composants de base
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Composants de saisie
export { Input } from './Input';
export type { InputProps } from './Input';

export { DateInput } from './DateInput';
export type { DateInputProps, DateFormat } from './DateInput';

export { CurrencyInput } from './CurrencyInput';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

// Composants de sélection
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { CROUSelector, RoleSelector } from './CROUSelector';
export type { CROUSelectorProps, RoleSelectorProps } from './CROUSelector';

// Composants de contrôle de formulaire
export { Checkbox, CheckboxGroup } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Radio, RadioGroup } from './Radio';
export type { RadioProps, RadioOption } from './Radio';

export { Switch, SwitchGroup } from './Switch';
export type { SwitchProps, SwitchIcons, SwitchGroupProps, SwitchGroupOption } from './Switch';

// Composants d'affichage de données
export { Table } from './Table';
export type { TableProps, TableColumn } from './Table';

export { KPICard, KPIGrid, KPIComparison } from './KPICard';
export type { KPICardProps, KPITrend, KPITarget, KPIType } from './KPICard';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  CardActions, 
  CardImage, 
  StatCard, 
  InfoCard, 
  ActionCard,
  CardContent,
  CardTitle
} from './Card';
export type { 
  CardProps, 
  CardHeaderProps, 
  CardBodyProps, 
  CardFooterProps, 
  CardActionsProps,
  CardImageProps,
  StatCardProps,
  InfoCardProps,
  ActionCardProps
} from './Card';

// Composants Modal et Dialog
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalActions,
  ModalContent,
  AlertDialog,
  DrawerModal,
  modalVariants
} from './Modal';
export type {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
  AlertDialogProps,
  DrawerModalProps
} from './Modal';

// Composants de navigation
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem } from './Breadcrumb';

export { Pagination, usePagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

// Composants de visualisation
export {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  GaugeChart,
  ChartTitle,
  ChartLoading,
  ChartError,
  CustomTooltip,
  CHART_COLORS
} from './Charts';
export type {
  ChartDataPoint,
  BaseChartProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  AreaChartProps,
  GaugeChartProps
} from './Charts';

// Composants de mise en page
export {
  Container,
  Grid,
  Stack,
  Section,
  Divider
} from './Layout';
export type {
  ContainerProps,
  GridProps,
  StackProps,
  SectionProps,
  DividerProps
} from './Layout';

// Composants utilitaires
export { ThemeToggle } from './ThemeToggle';

// Composants de chargement
export { LoadingBar, Loading } from './Loading';
export type { LoadingBarProps, LoadingProps } from './Loading';

// Composants de feedback
export { Alert } from './Alert';
export type { AlertProps } from './Alert';

export { LoadingScreen } from './LoadingScreen';

export { Toast, ToastProvider, useToast } from './Toast';
export type { ToastProps, ToastData, ToastPosition } from './Toast';

export { Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPosition, TooltipTrigger } from './Tooltip';

// Types communs
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface FormControlProps extends BaseComponentProps {
    label?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
}

export interface ValidationState {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Constantes du design system
export const DESIGN_TOKENS = {
    colors: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
        },
        success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
        },
        warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
        },
        danger: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
        }
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
    },
    borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
    },
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
    }
} as const;
