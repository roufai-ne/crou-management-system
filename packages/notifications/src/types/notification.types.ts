/**
 * FICHIER: packages\notifications\src\types\notification.types.ts
 * TYPES: Types pour le système de notifications
 * 
 * DESCRIPTION:
 * Définit tous les types et interfaces
 * pour le système de notifications temps réel
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Types de notifications
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum NotificationCategory {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum DeliveryMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBSOCKET = 'websocket',
  SSE = 'sse'
}

// Interface pour les notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  tenantId: string;
  userId?: string;
  role?: string;
  data?: any;
  metadata?: NotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

export interface NotificationMetadata {
  source: string;
  action?: string;
  entityId?: string;
  entityType?: string;
  url?: string;
  icon?: string;
  color?: string;
  sound?: boolean;
  vibration?: boolean;
  persistent?: boolean;
  autoClose?: boolean;
  duration?: number;
}

// Interface pour les alertes
export interface Alert {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface AlertAction {
  id: string;
  type: 'notification' | 'email' | 'sms' | 'webhook' | 'workflow';
  config: any;
  delay?: number;
  retryCount?: number;
  maxRetries?: number;
}

// Interface pour les canaux de notification
export interface NotificationChannel {
  id: string;
  name: string;
  type: DeliveryMethod;
  config: any;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les préférences utilisateur
export interface NotificationPreferences {
  userId: string;
  tenantId: string;
  channels: {
    [key in DeliveryMethod]: boolean;
  };
  categories: {
    [key in NotificationCategory]: boolean;
  };
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    digestFrequency: 'hourly' | 'daily' | 'weekly';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les templates
export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  template: string;
  variables: string[];
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les statistiques
export interface NotificationStats {
  total: number;
  byType: { [key in NotificationType]: number };
  byCategory: { [key in NotificationCategory]: number };
  byStatus: { [key in NotificationStatus]: number };
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
  averageReadTime: number;
}

// Interface pour les événements WebSocket
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: Date;
  tenantId: string;
  userId?: string;
}

// Interface pour les événements Server-Sent Events
export interface SSEEvent {
  id: string;
  event: string;
  data: any;
  retry?: number;
}

// Interface pour les KPIs critiques
export interface CriticalKPI {
  id: string;
  name: string;
  description: string;
  category: NotificationCategory;
  threshold: {
    warning: number;
    critical: number;
  };
  currentValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  tenantId: string;
}

// Interface pour les règles de notification
export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les groupes de notification
export interface NotificationGroup {
  id: string;
  name: string;
  description: string;
  userIds: string[];
  roles: string[];
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les rapports de notification
export interface NotificationReport {
  id: string;
  name: string;
  description: string;
  filters: {
    dateRange: {
      start: Date;
      end: Date;
    };
    types?: NotificationType[];
    categories?: NotificationCategory[];
    statuses?: NotificationStatus[];
    userIds?: string[];
  };
  format: 'json' | 'csv' | 'pdf';
  isScheduled: boolean;
  schedule?: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les callbacks
export type NotificationCallback = (notification: Notification) => void;
export type AlertCallback = (alert: Alert) => void;
export type KPICallback = (kpi: CriticalKPI) => void;

// Interface pour les options de configuration
export interface NotificationConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  channels: {
    websocket: boolean;
    sse: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  limits: {
    maxNotificationsPerUser: number;
    maxNotificationsPerTenant: number;
    notificationTTL: number;
    alertCheckInterval: number;
  };
  security: {
    jwtSecret: string;
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
}
