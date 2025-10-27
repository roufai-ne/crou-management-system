# Design Document - UI Component Library

## Overview

The CROU UI Component Library is a comprehensive React component system built with TypeScript, TailwindCSS, and modern accessibility standards. It provides a unified design language for the entire CROU management application while supporting the complex multi-tenant architecture.

The library follows atomic design principles, starting with basic tokens (colors, typography, spacing) and building up to complex organisms (data tables, dashboard cards). All components are designed mobile-first and support the specific needs of the CROU domain.

## Architecture

### Component Hierarchy

```
Tokens (Design System)
├── Colors (CROU brand palette)
├── Typography (French-optimized fonts)
├── Spacing (8px grid system)
└── Breakpoints (mobile-first)

Atoms (Basic Components)
├── Button, Input, Label
├── Icon, Badge, Avatar
└── Spinner, Divider

Molecules (Composite Components)
├── FormField (Input + Label + Error)
├── SearchBox (Input + Icon + Button)
├── KPICard (Value + Label + Trend)
└── TableCell (Content + Sorting + Actions)

Organisms (Complex Components)
├── DataTable (Headers + Rows + Pagination)
├── DashboardGrid (Multiple KPI Cards)
├── NavigationSidebar (Menu + User + Actions)
└── ChartContainer (Chart + Legend + Controls)

Templates (Layout Patterns)
├── DashboardLayout
├── FormLayout
└── ReportLayout
```

### Technology Stack

- **React 18**: Functional components with hooks
- **TypeScript**: Strict typing for all props and state
- **TailwindCSS**: Utility-first styling with custom CROU theme
- **Headless UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Data visualization with custom theming
- **React Hook Form**: Form state management and validation
- **Storybook**: Component documentation and testing

## Components and Interfaces

### Core Design Tokens

```typescript
// Theme Configuration
export const crouTheme = {
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6", // Main CROU blue
      600: "#2563eb",
      900: "#1e3a8a",
    },
    success: {
      500: "#16a34a", // Green for positive indicators
      100: "#dcfce7",
    },
    warning: {
      500: "#f59e0b", // Orange for warnings
      100: "#fef3c7",
    },
    danger: {
      500: "#dc2626", // Red for errors/alerts
      100: "#fee2e2",
    },
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      500: "#6b7280",
      900: "#111827",
    },
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
    },
  },
  spacing: {
    // 8px grid system
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    12: "3rem", // 48px
    16: "4rem", // 64px
  },
};
```

### Form Components

#### Input Component

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: React.ComponentType;
  rightIcon?: React.ComponentType;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "flushed";
}

// Special variants for CROU domain
interface CurrencyInputProps extends Omit<InputProps, "type"> {
  currency?: "FCFA";
  thousandSeparator?: " " | ",";
  decimalPlaces?: number;
  onValueChange?: (numericValue: number) => void;
}

interface DateInputProps extends Omit<InputProps, "type"> {
  format?: "DD/MM/YYYY" | "MM/YYYY";
  locale?: "fr-NE";
  minDate?: Date;
  maxDate?: Date;
}
```

#### Select Component

```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  size?: "sm" | "md" | "lg";
}

// CROU-specific selectors
interface CROUSelectProps extends Omit<SelectProps, "options"> {
  level?: "all" | "ministry" | "local";
  excludeCROUs?: string[];
}

interface RoleSelectProps extends Omit<SelectProps, "options"> {
  level?: "ministry" | "crou";
  permissions?: Permission[];
}
```

### Data Display Components

#### Table Component

```typescript
interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: (string | number)[];
    onChange: (selectedRowKeys: (string | number)[]) => void;
  };
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
  };
  scroll?: { x?: number; y?: number };
  size?: "sm" | "md" | "lg";
}
```

#### KPI Card Component

```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  format?: "currency" | "percentage" | "number";
  currency?: "FCFA";
  trend?: {
    value: number;
    direction: "up" | "down" | "stable";
    period: string;
  };
  target?: {
    value: number;
    label: string;
  };
  status?: "success" | "warning" | "danger" | "info";
  icon?: React.ComponentType;
  loading?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}
```

### Chart Components

#### Base Chart Configuration

```typescript
interface ChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  loading?: boolean;
  error?: string;
  theme?: "light" | "dark";
  locale?: "fr-NE";
  currency?: "FCFA";
}

interface LineChartProps extends ChartProps {
  xAxisKey: string;
  lines: {
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

interface BarChartProps extends ChartProps {
  xAxisKey: string;
  bars: {
    key: string;
    name: string;
    color?: string;
    stackId?: string;
  }[];
  orientation?: "horizontal" | "vertical";
  stacked?: boolean;
}
```

### Navigation Components

#### Breadcrumb Component

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  size?: "sm" | "md" | "lg";
}
```

#### Pagination Component

```typescript
interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
  onChange?: (page: number, pageSize: number) => void;
  size?: "sm" | "md" | "lg";
}
```

## Data Models

### Component State Management

```typescript
// Global component theme context
interface ThemeContextValue {
  theme: "light" | "dark";
  colors: typeof crouTheme.colors;
  typography: typeof crouTheme.typography;
  spacing: typeof crouTheme.spacing;
  setTheme: (theme: "light" | "dark") => void;
}

// Form validation context
interface FormContextValue {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  values: Record<string, any>;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  validateField: (field: string) => Promise<boolean>;
}

// Table state management
interface TableState<T> {
  data: T[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  sorting: {
    field: keyof T;
    direction: "asc" | "desc";
  } | null;
  filters: Record<string, any>;
  selection: (string | number)[];
}
```

### CROU-Specific Data Types

```typescript
// CROU business entities for components
interface CROUCenter {
  id: string;
  name: string;
  code: string;
  region: string;
  active: boolean;
}

interface UserRole {
  id: string;
  name: string;
  level: "ministry" | "crou";
  permissions: Permission[];
}

interface BudgetData {
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "on-track" | "warning" | "over-budget";
}

interface KPIData {
  value: number;
  target?: number;
  previousValue?: number;
  trend: "up" | "down" | "stable";
  format: "currency" | "percentage" | "number";
}
```

## Error Handling

### Component Error Boundaries

```typescript
interface ComponentErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

// Default error fallback component
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  size?: "sm" | "md" | "lg";
}
```

### Form Validation

```typescript
interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FieldValidation {
  rules: ValidationRule[];
  message: string;
  trigger?: "onChange" | "onBlur" | "onSubmit";
}
```

## Testing Strategy

### Component Testing Approach

1. **Unit Tests**: Each component tested in isolation with React Testing Library
2. **Integration Tests**: Component interactions and form workflows
3. **Visual Regression Tests**: Storybook snapshots for UI consistency
4. **Accessibility Tests**: Automated a11y testing with jest-axe
5. **Performance Tests**: Bundle size and render performance monitoring

### Test Coverage Requirements

- **Minimum 90% code coverage** for all components
- **100% accessibility compliance** for interactive components
- **Cross-browser testing** on Chrome, Firefox, Safari, Edge
- **Mobile responsiveness testing** on various screen sizes

### Testing Utilities

```typescript
// Custom render function for testing
interface RenderOptions {
  theme?: "light" | "dark";
  locale?: "fr-NE";
  user?: Partial<CROUUser>;
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
): RenderResult;

// Mock data generators for testing
function generateMockKPIData(count: number): KPIData[];
function generateMockTableData<T>(schema: T, count: number): T[];
function generateMockChartData(
  type: "line" | "bar" | "pie",
  points: number
): any[];
```

This design provides a comprehensive foundation for building all CROU application interfaces while maintaining consistency, accessibility, and performance standards.
