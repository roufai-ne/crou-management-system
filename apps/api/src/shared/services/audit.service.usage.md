# Service d'Audit Avancé - Guide d'Utilisation

## Vue d'ensemble

Le service d'audit avancé fournit une traçabilité complète des actions utilisateurs dans le système CROU. Il enregistre automatiquement tous les événements importants, détecte les activités suspectes et génère des rapports d'audit détaillés.

## Fonctionnalités Principales

### 1. Enregistrement Automatique des Événements
- **Événements d'authentification** : connexions, déconnexions, échecs de connexion
- **Accès aux ressources** : consultation, modification, suppression de données
- **Opérations CRUD** : création, lecture, mise à jour, suppression
- **Événements de sécurité** : tentatives d'accès non autorisées, alertes

### 2. Détection d'Activités Suspectes
- **Tentatives de connexion multiples** : détection des attaques par force brute
- **Accès cross-tenant** : surveillance des accès entre différents tenants
- **Opérations en lot** : détection des opérations massives suspectes
- **Accès en dehors des heures** : surveillance des accès hors horaires normaux

### 3. Génération de Rapports
- **Rapports d'activité** : synthèse des actions par utilisateur/tenant
- **Analyses de tendances** : évolution de l'activité dans le temps
- **Rapports de sécurité** : activités suspectes et alertes
- **Statistiques d'utilisation** : métriques d'usage du système

## Utilisation du Service

### Initialisation

```typescript
import { AuditService } from '@/shared/services/audit.service';

const auditService = new AuditService();
```

### Enregistrement d'Événements

#### Événement d'authentification
```typescript
// Connexion réussie
await auditService.logAuthEvent(
  'login',
  userId,
  email,
  true, // succès
  ipAddress,
  userAgent,
  { loginMethod: 'password' }
);

// Connexion échouée
await auditService.logAuthEvent(
  'login',
  undefined,
  email,
  false, // échec
  ipAddress,
  userAgent,
  { reason: 'invalid_credentials' }
);
```

#### Accès aux ressources
```typescript
await auditService.logResourceAccess(
  userId,
  'financial_data',
  AuditAction.VIEW,
  'budget_2024',
  tenantId,
  ipAddress,
  { 
    module: 'finances',
    sensitive: true 
  }
);
```

#### Événement personnalisé
```typescript
await auditService.logEvent({
  userId: 'user-123',
  action: AuditAction.CREATE,
  resource: 'budget',
  resourceId: 'budget-456',
  tenantId: 'tenant-789',
  ipAddress: '192.168.1.100',
  newValues: { amount: 50000, category: 'food' },
  metadata: { 
    module: 'financial',
    approved: true 
  }
});
```

### Recherche de Logs

```typescript
const result = await auditService.searchAuditLogs({
  userId: 'user-123',
  tenantId: 'tenant-789',
  action: AuditAction.LOGIN,
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-12-31'),
  limit: 50,
  offset: 0
});

console.log(`Trouvé ${result.total} logs`);
console.log(`Première page: ${result.logs.length} logs`);
console.log(`Plus de résultats: ${result.hasMore}`);
```

### Génération de Rapports

```typescript
const report = await auditService.generateAuditReport(
  'tenant-789', // ID du tenant
  new Date('2024-01-01'), // Date de début
  new Date('2024-12-31')  // Date de fin
);

console.log(`Total événements: ${report.totalEvents}`);
console.log(`Actions par type:`, report.eventsByAction);
console.log(`Activités suspectes: ${report.suspiciousActivities.length}`);
```

### Statistiques du Service

```typescript
const stats = await auditService.getServiceStats();

console.log(`Total logs: ${stats.totalLogs}`);
console.log(`Logs aujourd'hui: ${stats.logsToday}`);
console.log(`Top utilisateurs:`, stats.topUsers);
console.log(`Activités suspectes: ${stats.suspiciousActivitiesCount}`);
```

## Utilisation des Middlewares

### Middleware d'Audit Automatique

```typescript
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';

// Audit basique
app.use('/api/users', auditMiddleware({ enabled: true }));

// Audit pour ressources sensibles
app.use('/api/finances', auditMiddleware({
  enabled: true,
  sensitiveResource: true,
  includeRequestBody: true
}));

// Audit complet (debug)
app.use('/api/admin', auditMiddleware({
  enabled: true,
  logAllRequests: true,
  includeRequestBody: true,
  includeResponseBody: true
}));
```

### Middleware d'Authentification

```typescript
import { auditAuth } from '@/shared/middlewares/audit.middleware';

// Audit automatique des opérations d'auth
app.use('/api/auth', auditAuth);
```

## Utilisation des Décorateurs

### Décorateur @Auditable

```typescript
import { Auditable } from '@/shared/decorators/audit.decorator';

class UserController {
  @Auditable({
    action: AuditAction.CREATE,
    tableName: 'users',
    description: 'Création d\'utilisateur'
  })
  async createUser(req: Request, res: Response) {
    // Logique de création
    // L'audit sera automatiquement enregistré
  }
}
```

### Décorateur @AuditSensitive

```typescript
import { AuditSensitive } from '@/shared/decorators/audit.decorator';

class FinancialController {
  @AuditSensitive('Accès aux données financières sensibles')
  async getBudgetDetails(req: Request, res: Response) {
    // Logique d'accès aux données sensibles
    // Audit renforcé automatique
  }
}
```

## API REST

### Endpoints Disponibles

#### GET /api/audit/logs
Rechercher les logs d'audit avec filtres
```bash
curl -X GET "/api/audit/logs?userId=123&dateFrom=2024-01-01&limit=50" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/audit/reports
Générer un rapport d'audit
```bash
curl -X GET "/api/audit/reports?tenantId=789&dateFrom=2024-01-01" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/audit/suspicious
Obtenir les activités suspectes
```bash
curl -X GET "/api/audit/suspicious?severity=high,critical" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/audit/stats
Statistiques du service d'audit
```bash
curl -X GET "/api/audit/stats" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/audit/user/:userId
Activité d'un utilisateur spécifique
```bash
curl -X GET "/api/audit/user/123?limit=100" \
  -H "Authorization: Bearer <token>"
```

#### POST /api/audit/archive
Archiver les anciens logs
```bash
curl -X POST "/api/audit/archive" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"retentionDays": 365}'
```

## Configuration

### Seuils de Détection d'Anomalies

Les seuils par défaut peuvent être ajustés dans le service :

```typescript
private readonly SUSPICIOUS_THRESHOLDS = {
  FAILED_LOGINS_PER_HOUR: 5,        // Tentatives échouées par heure
  FAILED_LOGINS_PER_DAY: 20,        // Tentatives échouées par jour
  REQUESTS_PER_MINUTE: 100,         // Requêtes par minute
  BULK_OPERATIONS_THRESHOLD: 50,    // Opérations en lot
  CROSS_TENANT_ACCESS_THRESHOLD: 10 // Accès cross-tenant
};
```

### Archivage Automatique

```typescript
// Archiver les logs de plus de 365 jours
const archivedCount = await auditService.archiveOldLogs(365);
```

## Bonnes Pratiques

### 1. Utilisation des Niveaux d'Audit
- **Basique** : Actions importantes uniquement
- **Complet** : Toutes les requêtes (debug/développement)
- **Sensible** : Ressources critiques avec audit renforcé

### 2. Gestion des Performances
- Utiliser la pagination pour les grandes recherches
- Archiver régulièrement les anciens logs
- Monitorer la taille de la base de données

### 3. Sécurité
- Ne jamais logger les mots de passe ou tokens
- Utiliser les champs `sensitiveFields` pour masquer les données
- Restreindre l'accès aux logs selon les permissions

### 4. Monitoring
- Surveiller les activités suspectes régulièrement
- Configurer des alertes pour les événements critiques
- Analyser les tendances d'utilisation

## Tests

### Exécution des Tests

```bash
# Test complet du service d'audit
npm run test:audit

# Ou directement
npx ts-node apps/api/src/scripts/test-audit-service.ts
```

### Tests Inclus
- Enregistrement d'événements basiques
- Logging d'authentification
- Recherche avec filtres
- Génération de rapports
- Détection d'activités suspectes
- Tests de performance
- Archivage des logs

## Dépannage

### Problèmes Courants

1. **Logs non enregistrés**
   - Vérifier la connexion à la base de données
   - Contrôler les permissions d'écriture
   - Examiner les logs d'erreur

2. **Performance dégradée**
   - Vérifier la taille de la table audit_logs
   - Archiver les anciens logs
   - Optimiser les index de base de données

3. **Activités suspectes non détectées**
   - Ajuster les seuils de détection
   - Vérifier la configuration des alertes
   - Contrôler les logs d'erreur du service

### Logs de Debug

```typescript
import { logger } from '@/shared/utils/logger';

// Activer les logs de debug
logger.level = 'debug';
```

## Support

Pour toute question ou problème :
- Consulter les logs d'erreur dans `/var/log/crou/audit.log`
- Vérifier la documentation technique dans le code
- Contacter l'équipe de développement CROU