# Guide d'Utilisation du SecurityService

## Vue d'Ensemble

Le `SecurityService` implémente des mesures de sécurité avancées pour protéger l'application CROU contre les attaques courantes et maintenir la sécurité des données.

## Fonctionnalités Principales

### 1. Rate Limiting

Protection contre les attaques par déni de service (DoS) et les tentatives de force brute.

#### Types de Rate Limiting

- **Par IP** : 100 requêtes/minute
- **Par Utilisateur** : 100 requêtes/minute  
- **Pour Login** : 10 tentatives/heure

#### Utilisation

```typescript
// Vérifier le rate limiting
const result = await securityService.checkRateLimit('192.168.1.1', 'ip', '192.168.1.1');

if (!result.allowed) {
  throw new HttpException('Rate limit exceeded', 429);
}

console.log(`Remaining requests: ${result.remaining}`);
console.log(`Reset time: ${result.resetTime}`);
```

### 2. Gestion des Comptes Bloqués

Système automatique de blocage après échecs de connexion répétés.

#### Configuration

- **Échecs maximum** : 5 tentatives
- **Durée de blocage** : 30 minutes
- **Blocage permanent** : après 10 tentatives

#### Utilisation

```typescript
// Gérer un échec de connexion
const result = await securityService.handleLoginFailure(
  userId, 
  ipAddress, 
  userAgent
);

if (result.locked) {
  console.log(`Account locked for ${result.lockDuration} minutes`);
}

// Gérer une connexion réussie
await securityService.handleLoginSuccess(userId, ipAddress, userAgent);

// Débloquer manuellement un compte
await securityService.unlockAccount(userId, adminUserId);
```

### 3. Chiffrement AES-256-GCM

Chiffrement sécurisé des données sensibles avec authentification.

#### Utilisation

```typescript
// Chiffrer des données
const encrypted = await securityService.encryptSensitiveData(
  'Données sensibles',
  'mot-de-passe-optionnel'
);

console.log('Données chiffrées:', encrypted.encryptedData);
console.log('IV:', encrypted.iv);
console.log('Tag d\'authentification:', encrypted.tag);

// Déchiffrer des données
const decrypted = await securityService.decryptSensitiveData(
  encrypted.encryptedData,
  encrypted.iv,
  encrypted.tag,
  'mot-de-passe-optionnel'
);

console.log('Données déchiffrées:', decrypted);
```

### 4. Détection d'Activités Suspectes

Analyse automatique des requêtes pour détecter les comportements anormaux.

#### Critères de Détection

- **Changements d'IP fréquents** : Plus de 5 IPs différentes en 1 heure
- **User-Agents suspects** : Bots, crawlers, outils automatisés
- **Patterns d'accès anormaux** : Plus de 50 requêtes en 5 minutes
- **Accès aux endpoints sensibles** : Plus de 10 accès en 1 heure

#### Utilisation

```typescript
// Analyser une requête
const analysis = await securityService.analyzeRequest(
  userId,
  ipAddress,
  userAgent,
  endpoint,
  method
);

if (analysis.suspicious) {
  console.log('Activité suspecte détectée:', analysis.reasons);
  // Déclencher des mesures supplémentaires
}
```

### 5. Système d'Alertes

Génération automatique d'alertes de sécurité avec différents niveaux de gravité.

#### Types d'Alertes

- **BRUTE_FORCE** : Tentatives de force brute
- **SUSPICIOUS_ACTIVITY** : Activité suspecte détectée
- **ACCOUNT_LOCKED** : Compte bloqué
- **RATE_LIMIT_EXCEEDED** : Rate limit dépassé
- **UNAUTHORIZED_ACCESS** : Tentative d'accès non autorisé

#### Niveaux de Gravité

- **LOW** : Information
- **MEDIUM** : Attention requise
- **HIGH** : Action recommandée
- **CRITICAL** : Action immédiate requise

#### Utilisation

```typescript
// Déclencher une alerte manuelle
await securityService.triggerSecurityAlert({
  type: 'SUSPICIOUS_ACTIVITY',
  severity: 'HIGH',
  userId: 'user-123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  details: {
    reason: 'Multiple failed login attempts',
    attempts: 5
  },
  timestamp: new Date()
});
```

## Middlewares de Sécurité

### RateLimitMiddleware

Applique automatiquement le rate limiting à toutes les requêtes.

```typescript
// Configuration dans app.module.ts
app.use(new RateLimitMiddleware(securityService));
```

### SuspiciousActivityMiddleware

Analyse automatiquement toutes les requêtes authentifiées.

```typescript
// S'applique automatiquement aux routes protégées
// Ajoute des headers d'avertissement si activité suspecte
```

### SecurityHeadersMiddleware

Ajoute les headers de sécurité standard.

```typescript
// Headers ajoutés automatiquement :
// - X-XSS-Protection
// - X-Content-Type-Options
// - X-Frame-Options
// - Content-Security-Policy
// - Strict-Transport-Security (si HTTPS)
```

### LoginSecurityMiddleware

Protection spéciale pour les routes de connexion.

```typescript
// Rate limiting spécial : 10 tentatives/heure
// Détection de patterns de login suspects
// Headers de sécurité spécialisés
```

## API REST de Sécurité

### Endpoints Disponibles

#### GET /api/security/stats
Statistiques de sécurité en temps réel.

```json
{
  "activeAlerts": 5,
  "lockedAccounts": 2,
  "rateLimitViolations": 15,
  "suspiciousActivities": 8,
  "timestamp": "2024-12-06T10:30:00Z"
}
```

#### GET /api/security/alerts
Liste des alertes de sécurité avec filtrage.

```bash
GET /api/security/alerts?page=1&limit=50&severity=HIGH&type=BRUTE_FORCE
```

#### POST /api/security/unlock-account
Débloquer un compte utilisateur.

```json
{
  "userId": "user-123",
  "reason": "Déblocage administratif après vérification"
}
```

#### GET /api/security/rate-limits
État des rate limits pour un utilisateur/IP.

```bash
GET /api/security/rate-limits?userId=user-123&ipAddress=192.168.1.1
```

#### POST /api/security/encrypt
Chiffrer des données sensibles.

```json
{
  "data": "Données à chiffrer",
  "password": "mot-de-passe-optionnel"
}
```

#### POST /api/security/decrypt
Déchiffrer des données.

```json
{
  "encryptedData": "...",
  "iv": "...",
  "tag": "...",
  "password": "mot-de-passe-optionnel"
}
```

## Configuration

### Variables d'Environnement

```bash
# Redis pour rate limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Chiffrement
ENCRYPTION_KEY=your-32-char-encryption-key-here
ENCRYPTION_SALT=your-encryption-salt-here

# Alertes
SECURITY_WEBHOOK_URL=https://your-webhook-url.com
SECURITY_EMAIL_RECIPIENTS=security@crou.ne,admin@crou.ne
```

### Configuration Personnalisée

```typescript
// Dans le constructeur du SecurityService
private readonly config: SecurityConfig = {
  rateLimiting: {
    maxRequestsPerMinute: 100,
    maxRequestsPerHour: 1000,
    maxLoginAttemptsPerHour: 10,
    blockDurationMinutes: 15
  },
  accountLocking: {
    maxFailedAttempts: 5,
    lockDurationMinutes: 30,
    permanentLockAfterAttempts: 10
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  },
  alerts: {
    enabled: true,
    emailRecipients: ['security@crou.ne']
  }
};
```

## Monitoring et Maintenance

### Statistiques de Performance

```typescript
// Obtenir les métriques de performance
const stats = await securityService.getSecurityStats();

// Nettoyer les données expirées
await securityService.cleanupExpiredData();
```

### Logs et Audit

Toutes les opérations de sécurité sont automatiquement enregistrées dans les logs d'audit :

- Tentatives de connexion (réussies/échouées)
- Déclenchement d'alertes
- Opérations de chiffrement/déchiffrement
- Déblocage de comptes
- Violations de rate limiting

### Tests de Sécurité

```bash
# Exécuter les tests de sécurité
npm run test:security

# Ou directement
ts-node apps/api/src/scripts/test-security-features.ts
```

## Bonnes Pratiques

### 1. Rate Limiting
- Ajustez les limites selon votre charge de trafic
- Surveillez les métriques de rate limiting
- Implémentez des whitelist pour les IPs de confiance

### 2. Chiffrement
- Utilisez toujours des mots de passe forts pour le chiffrement
- Stockez les clés de chiffrement de manière sécurisée
- Effectuez une rotation régulière des clés

### 3. Alertes
- Configurez des notifications en temps réel
- Définissez des procédures de réponse aux incidents
- Analysez régulièrement les patterns d'alertes

### 4. Monitoring
- Surveillez les métriques de sécurité en continu
- Effectuez des audits de sécurité réguliers
- Maintenez les logs d'audit à jour

## Dépannage

### Problèmes Courants

#### Redis Non Disponible
```typescript
// Le service continue de fonctionner en mode dégradé
// Les rate limits sont désactivés mais l'application reste accessible
```

#### Comptes Bloqués en Masse
```typescript
// Débloquer plusieurs comptes
const lockedUsers = await userRepository.find({ 
  where: { lockedUntil: MoreThan(new Date()) } 
});

for (const user of lockedUsers) {
  await securityService.unlockAccount(user.id, adminId);
}
```

#### Performance Lente
```typescript
// Nettoyer les données expirées
await securityService.cleanupExpiredData();

// Vérifier la configuration Redis
// Optimiser les requêtes de base de données
```

## Support et Maintenance

Pour toute question ou problème :

1. Consultez les logs d'application
2. Vérifiez les métriques de sécurité
3. Exécutez les tests de sécurité
4. Contactez l'équipe de développement

---

**Note** : Ce système de sécurité est conçu pour être robuste et performant, mais nécessite une surveillance continue et des mises à jour régulières pour maintenir son efficacité contre les nouvelles menaces.