# Guide d'Intégration des Services Tiers
## Système de Gestion CROU

**Date**: Janvier 2025
**Version**: 1.0
**Auteur**: Équipe CROU

---

## 📋 Vue d'Ensemble

Ce document détaille l'intégration des services tiers pour le monitoring, l'analytics et le suivi des erreurs en production.

---

## 🔴 Sentry - Monitoring des Erreurs

### 1. Configuration

**Fichier**: `apps/web/src/main.tsx`

**TODOs actuels** (lignes 109, 120):
- Envoi erreurs globales vers Sentry
- Envoi erreurs React ErrorBoundary

### 2. Installation

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 3. Configuration Vite

**Fichier**: `apps/web/vite.config.ts`

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "crou-niger",
      project: "crou-web",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Nécessaire pour Sentry
  },
});
```

### 4. Initialisation Sentry

**Fichier**: `apps/web/src/main.tsx`

```typescript
import * as Sentry from "@sentry/react";

// Initialiser Sentry en production uniquement
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        // Tracer les routes React Router
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        // Enregistrer les sessions avec erreurs
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% des transactions

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur

    // Environnement
    environment: import.meta.env.MODE, // 'production', 'staging', etc.

    // Filtrer les erreurs
    beforeSend(event, hint) {
      // Ne pas envoyer les erreurs de développement
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      // Filtrer les erreurs de réseau connues
      const error = hint.originalException as Error;
      if (error?.message?.includes('Network request failed')) {
        return null;
      }

      return event;
    },
  });
}

// Remplacer ligne 109
window.addEventListener('error', (event) => {
  console.error('Erreur globale capturée:', event.error);

  if (import.meta.env.PROD) {
    Sentry.captureException(event.error, {
      contexts: {
        errorEvent: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      },
    });
  }
});

// Remplacer ligne 120
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejetée non gérée:', event.reason);

  if (import.meta.env.PROD) {
    Sentry.captureException(event.reason, {
      contexts: {
        promiseRejection: {
          reason: String(event.reason),
        },
      },
    });
  }
});
```

### 5. Wrapper ErrorBoundary

**Mise à jour**: Envelopper l'app avec Sentry.ErrorBoundary

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Une erreur est survenue
            </h2>
            <p className="text-gray-700 mb-4">{error.message}</p>
            <button
              onClick={resetError}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
      showDialog
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

### 6. Variables d'Environnement

**Fichier**: `apps/web/.env.production`

```env
VITE_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=your_auth_token_here
```

### 7. Contexte Utilisateur

Ajouter le contexte utilisateur après login :

```typescript
// Dans authStore ou après login réussi
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: `${user.firstName} ${user.lastName}`,
  tenantId: user.tenantId,
});

// Au logout
Sentry.setUser(null);
```

---

## 📊 Google Analytics - Métriques et Analytics

### 1. Configuration

**Fichier**: `apps/web/src/main.tsx`

**TODO actuel** (ligne 187): Envoi vers Google Analytics

### 2. Installation

```bash
npm install react-ga4
```

### 3. Initialisation

**Fichier**: `apps/web/src/utils/analytics.ts`

```typescript
import ReactGA from 'react-ga4';

export const initGA = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID, {
      gaOptions: {
        siteSpeedSampleRate: 100, // Mesurer 100% des performances
      },
    });
  }
};

// Tracer une page vue
export const trackPageView = (path: string, title?: string) => {
  if (import.meta.env.PROD) {
    ReactGA.send({ hitType: 'pageview', page: path, title });
  }
};

// Tracer un événement
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (import.meta.env.PROD) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// Tracer une erreur
export const trackError = (description: string, fatal: boolean = false) => {
  if (import.meta.env.PROD) {
    ReactGA.event({
      category: 'Error',
      action: description,
      label: fatal ? 'Fatal' : 'Non-Fatal',
    });
  }
};

// Définir des propriétés utilisateur
export const setUserProperties = (properties: Record<string, string>) => {
  if (import.meta.env.PROD) {
    ReactGA.set(properties);
  }
};
```

### 4. Intégration dans main.tsx

```typescript
import { initGA, trackPageView } from '@/utils/analytics';

// Initialiser au démarrage
initGA();

// Tracer la page initiale
trackPageView(window.location.pathname + window.location.search);

// Remplacer ligne 187 - Tracer les clics
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const linkElement = target.closest('a');

  if (linkElement) {
    trackEvent(
      'Navigation',
      'Click',
      linkElement.href,
      undefined
    );
  }
}, true);
```

### 5. Intégration React Router

**Fichier**: `apps/web/src/App.tsx`

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

function App() {
  const location = useLocation();

  // Tracer chaque changement de route
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    // ... votre app
  );
}
```

### 6. Événements Personnalisés

**Exemples d'événements à tracer**:

```typescript
// Connexion utilisateur
trackEvent('Auth', 'Login', user.role);

// Création d'entité
trackEvent('Budget', 'Create', budget.category, budget.amount);

// Export de données
trackEvent('Export', 'CSV', 'Transactions', transactions.length);

// Erreur capturée
trackError(`API Error: ${error.message}`, false);

// Validation workflow
trackEvent('Workflow', 'Approve', 'Budget', budgetId);

// Recherche
trackEvent('Search', 'Query', searchTerm);
```

### 7. Variables d'Environnement

**Fichier**: `apps/web/.env.production`

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 8. Configuration GA4

**Dans Google Analytics 4**:

1. Créer une propriété GA4
2. Configurer les événements personnalisés
3. Créer des conversions pour les actions clés:
   - Login réussi
   - Création budget
   - Validation transaction
   - Export rapport

4. Configurer les audiences:
   - Administrateurs
   - Gestionnaires CROU
   - Comptables
   - Par région

5. Créer des rapports personnalisés:
   - Utilisation par module
   - Temps moyen par tâche
   - Taux de conversion workflows
   - Erreurs par page

---

## 🔒 Conformité RGPD

### Consentement Utilisateur

**Créer un composant CookieConsent**:

```typescript
// apps/web/src/components/CookieConsent.tsx

export const CookieConsent = () => {
  const [consent, setConsent] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    const savedConsent = localStorage.getItem('analytics-consent');
    if (savedConsent) {
      setConsent(savedConsent as any);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'accepted');
    setConsent('accepted');

    // Initialiser les services seulement après consentement
    initGA();
  };

  const handleReject = () => {
    localStorage.setItem('analytics-consent', 'rejected');
    setConsent('rejected');
  };

  if (consent !== 'pending') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm">
          Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation.
        </p>
        <div className="flex gap-2">
          <button onClick={handleReject} className="px-4 py-2 bg-gray-700 rounded">
            Refuser
          </button>
          <button onClick={handleAccept} className="px-4 py-2 bg-primary-600 rounded">
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Anonymisation IP

Dans Sentry et GA, activer l'anonymisation des IP :

```typescript
// GA4
ReactGA.initialize(id, {
  gaOptions: {
    anonymize_ip: true,
  },
});

// Sentry
Sentry.init({
  beforeSend(event) {
    // Supprimer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
```

---

## 📝 Checklist de Déploiement

### Avant Production

- [ ] Obtenir clé Sentry DSN
- [ ] Obtenir ID Google Analytics (GA4)
- [ ] Configurer variables d'environnement
- [ ] Tester en staging
- [ ] Configurer alertes Sentry (email, Slack)
- [ ] Créer dashboards GA4
- [ ] Implémenter consentement cookies (RGPD)
- [ ] Documenter procédure réponse incidents
- [ ] Former équipe à l'utilisation dashboards

### Après Production

- [ ] Vérifier réception événements Sentry (1ère semaine)
- [ ] Vérifier données GA4 (1ère semaine)
- [ ] Configurer alertes (erreurs > 10/h)
- [ ] Créer rapport hebdomadaire automatique
- [ ] Ajuster filtres et seuils selon besoin
- [ ] Archiver anciens événements (>90 jours)

---

## 🔗 Ressources

**Sentry**:
- Documentation: https://docs.sentry.io/platforms/javascript/guides/react/
- Dashboard: https://sentry.io/organizations/crou-niger/

**Google Analytics 4**:
- Documentation: https://developers.google.com/analytics/devguides/collection/ga4
- Dashboard: https://analytics.google.com/

**react-ga4**:
- GitHub: https://github.com/codler/react-ga4

---

## 🛠️ Maintenance

### Mise à Jour des Packages

```bash
# Vérifier versions
npm outdated @sentry/react react-ga4

# Mettre à jour
npm update @sentry/react @sentry/vite-plugin react-ga4
```

### Rotation des Clés

**Fréquence recommandée**: Tous les 6 mois

1. Générer nouvelle clé dans Sentry
2. Mettre à jour `.env.production`
3. Redéployer application
4. Vérifier fonctionnement
5. Révoquer ancienne clé après 7 jours

---

**Dernière mise à jour**: Janvier 2025
**Prochain audit**: Juillet 2025
