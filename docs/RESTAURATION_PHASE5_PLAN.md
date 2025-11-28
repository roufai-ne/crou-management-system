# PHASE 5 - COMPOSANTS AVANCÉS & OPTIMISATIONS

**Date**: 11 Janvier 2025
**Module**: Restauration Universitaire - Phase 5
**Statut**: Planification

---

## 📋 OBJECTIFS PHASE 5

La Phase 5 vise à enrichir le module Restauration avec des composants avancés, des optimisations UX et des fonctionnalités supplémentaires pour améliorer l'expérience utilisateur.

---

## 🎯 PRIORITÉS

### Priorité 1 - Composants Formulaires Réutilisables (IMPORTANT)
Ces composants réduiront la duplication de code et amélioreront la maintenabilité.

#### A. RestaurantForm.tsx
**Objectif**: Formulaire réutilisable pour création/modification restaurant
**Utilisation**: Dans RestaurantsTab modals
**Fonctionnalités**:
- Validation avec React Hook Form + Zod
- Champs: nom, type, status, adresse, contact, capacité, responsable
- Sections: Horaires (3 plages), Équipements (liste), Tarifs (3 types)
- Mode: create/edit
- Props: initialData?, onSubmit, onCancel

#### B. MenuForm.tsx
**Objectif**: Formulaire pour création/modification menu
**Utilisation**: Dans MenusTab modal
**Fonctionnalités**:
- Sélection restaurant + date + type repas
- Nombre rationnaires
- Sous-composant: PlatEditor
- Calcul automatique coûts
- Props: initialData?, onSubmit, onCancel

#### C. PlatEditor.tsx
**Objectif**: Éditeur de plat avec ingrédients
**Utilisation**: Dans MenuForm
**Fonctionnalités**:
- Nom plat + description
- Catégorie apport nutritionnel
- Liste ingrédients avec autocomplete depuis Stocks
- Quantité unitaire par ingrédient
- Calcul coût plat automatique
- Props: plat?, onChange, availableStocks

#### D. TicketEmissionForm.tsx
**Objectif**: Formulaire émission tickets (unitaire + batch)
**Utilisation**: Dans TicketsTab modal
**Fonctionnalités**:
- Mode: single/batch
- Type ticket (unitaire, forfait, gratuit)
- Bénéficiaire(s): nom, email, téléphone
- Dates émission/expiration
- Montant
- Batch: upload CSV ou saisie multiple
- Props: mode, onSubmit, onCancel

#### E. ServiceStatsForm.tsx
**Objectif**: Formulaire saisie statistiques post-service
**Utilisation**: Dans RepasTab modal terminaison
**Fonctionnalités**:
- Nombre rationnaires servis
- Recettes totales
- Gaspillage (kg)
- Observations
- Validation: servis ≤ rationnaires prévus
- Props: repas, onSubmit, onCancel

#### F. AllocationDenreeForm.tsx
**Objectif**: Formulaire allocation denrée
**Utilisation**: Dans DenreesTab modal
**Fonctionnalités**:
- Sélection restaurant
- Autocomplete denrée depuis Stocks avec disponibilité
- Quantité + unité (auto depuis stock)
- Date péremption
- Motif allocation
- Validation: quantité ≤ stock disponible
- Props: onSubmit, onCancel

---

### Priorité 2 - Composants Avancés (MOYEN)

#### A. MenuCalendar.tsx
**Objectif**: Vue calendrier des menus planifiés
**Utilisation**: Dans MenusTab (bouton "Calendrier")
**Fonctionnalités**:
- Calendrier mensuel (react-calendar ou full calendar)
- Affichage menus par jour
- Code couleur par status (brouillon, publié, validé)
- Click jour → détail menus du jour
- Navigation mois précédent/suivant
- Filtres: restaurant, type repas

#### B. QRCodeGenerator.tsx
**Objectif**: Génération QR Code pour tickets
**Utilisation**: Dans TicketsTab et exports PDF
**Fonctionnalités**:
- Génération QR Code (librairie: qrcode.react)
- Contenu: numeroTicket + hash sécurisé
- Tailles: sm, md, lg
- Props: ticketNumber, size

#### C. QRCodeScanner.tsx
**Objectif**: Scanner QR Code tickets (mobile)
**Utilisation**: Dans TicketsTab modal utilisation
**Fonctionnalités**:
- Scanner caméra (librairie: react-qr-scanner ou html5-qrcode)
- Décodage QR Code ticket
- Validation automatique après scan
- Fallback: saisie manuelle
- Props: onScan, onError

#### D. BesoinsStockTable.tsx
**Objectif**: Tableau réutilisable besoins en denrées
**Utilisation**: Dans MenusTab détails menu
**Fonctionnalités**:
- Colonnes: Denrée, Quantité nécessaire, Stock dispo, Statut
- Couleur statut: vert (suffisant), rouge (insuffisant)
- Total quantités
- Export Excel
- Props: besoins[]

#### E. StatisticsCards.tsx
**Objectif**: Cartes KPI réutilisables
**Utilisation**: Dans DashboardTab et autres tabs
**Fonctionnalités**:
- Variants: stat, trend, comparison
- Icône + label + valeur + évolution
- Couleurs thématiques
- Loading skeleton
- Props: label, value, icon, change?, color?

---

### Priorité 3 - Optimisations UX (IMPORTANT)

#### A. Skeleton Loaders
**Objectif**: Améliorer perception chargement
**Fichiers à créer**:
- `TableSkeleton.tsx` - Skeleton pour tables
- `CardSkeleton.tsx` - Skeleton pour cards
- `StatsSkeleton.tsx` - Skeleton pour KPIs

**Utilisation**: Remplacer les spinners simples dans tous les tabs

#### B. Toast Notifications
**Objectif**: Feedback utilisateur après actions
**Implémentation**: Utiliser react-hot-toast (déjà installé)
**Actions à notifier**:
- Création/modification/suppression réussie
- Erreurs spécifiques
- Validation workflow (publier, valider)
- Service démarré/terminé
- Allocation denrée réussie

**Exemple**:
```typescript
import toast from 'react-hot-toast';

// Succès
toast.success('Restaurant créé avec succès');

// Erreur
toast.error('Erreur: Stock insuffisant');

// Warning
toast.warning('Attention: Denrée proche péremption');

// Info
toast('Service démarré', { icon: '🍽️' });
```

#### C. Confirmation Modals
**Objectif**: Modals de confirmation personnalisées
**Fichier**: `ConfirmModal.tsx`
**Utilisation**: Remplacer les confirm() natifs
**Fonctionnalités**:
- Titre + message + icône
- Variants: danger, warning, info
- Actions: confirmer/annuler
- Async support

#### D. Pagination Tables
**Objectif**: Paginer les grandes listes
**Implémentation**:
- Hook `usePagination` custom
- Composant `Pagination` réutilisable
- Intégrer dans tous les tableaux
- Par défaut: 20 items/page

#### E. Date Range Filters
**Objectif**: Filtres de dates avancés
**Composant**: `DateRangePicker.tsx`
**Utilisation**: Dans tous les tabs
**Fonctionnalités**:
- Sélection période: Aujourd'hui, Semaine, Mois, Personnalisé
- Preset ranges
- Props: value, onChange

---

### Priorité 4 - Exports & Rapports (MOYEN)

#### A. ExportPDF Component
**Objectif**: Export PDF des données
**Librairie**: jsPDF + jspdf-autotable
**Exports possibles**:
- Liste restaurants
- Menu détaillé (avec composition)
- Ticket repas (avec QR Code)
- Rapport service (statistiques)
- Liste denrées

**Fichier**: `components/restauration/exports/PDFExport.tsx`

#### B. ExportExcel Component
**Objectif**: Export Excel des données
**Librairie**: xlsx ou exceljs
**Exports possibles**:
- Tous les tableaux
- Besoins en denrées
- Statistiques services
- Inventaire denrées

**Fichier**: `components/restauration/exports/ExcelExport.tsx`

#### C. PrintTicket Component
**Objectif**: Impression tickets repas
**Utilisation**: Dans TicketsTab
**Fonctionnalités**:
- Format A6 ou ticket thermique
- Logo CROU
- QR Code
- Infos bénéficiaire
- Date validité
- Print CSS optimisé

---

### Priorité 5 - Graphiques Avancés (OPTIONNEL)

#### A. Graphiques Dashboard Supplémentaires
**Localisation**: DashboardTab.tsx
**Nouveaux graphiques**:
1. **Répartition types tickets** (PieChart)
   - Unitaires, Forfaits, Gratuits
2. **Top 5 plats populaires** (BarChart horizontal)
   - Basé sur fréquence dans menus validés
3. **Évolution stock denrées** (AreaChart)
   - 30 derniers jours
   - Entrées vs Sorties
4. **Taux utilisation restaurants** (RadarChart)
   - Capacité vs fréquentation moyenne

#### B. Filtres Période
**Objectif**: Permettre changement période graphiques
**Options**: 7j, 14j, 30j, 90j, Année, Personnalisé
**Implémentation**: Boutons au-dessus graphiques

---

## 📦 COMPOSANTS À CRÉER - RÉCAPITULATIF

### Formulaires (6 composants)
- [ ] RestaurantForm.tsx
- [ ] MenuForm.tsx
- [ ] PlatEditor.tsx
- [ ] TicketEmissionForm.tsx
- [ ] ServiceStatsForm.tsx
- [ ] AllocationDenreeForm.tsx

### Composants Avancés (5 composants)
- [ ] MenuCalendar.tsx
- [ ] QRCodeGenerator.tsx
- [ ] QRCodeScanner.tsx
- [ ] BesoinsStockTable.tsx
- [ ] StatisticsCards.tsx

### UX/UI (8 composants)
- [ ] TableSkeleton.tsx
- [ ] CardSkeleton.tsx
- [ ] StatsSkeleton.tsx
- [ ] ConfirmModal.tsx
- [ ] Pagination.tsx
- [ ] DateRangePicker.tsx
- [ ] Toast notifications (intégration)
- [ ] Loading states (amélioration)

### Exports (3 composants)
- [ ] PDFExport.tsx
- [ ] ExcelExport.tsx
- [ ] PrintTicket.tsx

### Graphiques (4 ajouts)
- [ ] PieChart types tickets
- [ ] BarChart plats populaires
- [ ] AreaChart évolution stocks
- [ ] RadarChart utilisation restaurants

**TOTAL: 26 composants/améliorations**

---

## 🔧 DÉPENDANCES SUPPLÉMENTAIRES NÉCESSAIRES

```json
{
  "dependencies": {
    "qrcode.react": "^3.1.0",          // QR Code generator
    "html5-qrcode": "^2.3.8",          // QR Code scanner
    "jspdf": "^2.5.1",                 // PDF generation
    "jspdf-autotable": "^3.8.0",       // Tables in PDF
    "xlsx": "^0.18.5",                 // Excel export
    "react-calendar": "^4.8.0",        // Calendar component
    "date-fns": "^2.30.0"              // Date utilities (si pas déjà installé)
  }
}
```

---

## ⏱️ ESTIMATION TEMPS

### Priorité 1 (Formulaires): ~8-10h
- 6 formulaires × 1.5h moyenne

### Priorité 2 (Composants Avancés): ~6-8h
- 5 composants × 1.5h moyenne

### Priorité 3 (UX): ~4-6h
- Optimisations multiples

### Priorité 4 (Exports): ~4-6h
- 3 composants export

### Priorité 5 (Graphiques): ~2-4h
- 4 graphiques supplémentaires

**TOTAL ESTIMÉ: 24-34 heures de développement**

---

## 🎯 PLAN D'EXÉCUTION RECOMMANDÉ

### Sprint 1 (Priorité 1 + 3)
**Focus**: Améliorer expérience utilisateur actuelle
1. Créer les 6 composants formulaires
2. Ajouter Skeleton loaders
3. Intégrer Toast notifications
4. Créer ConfirmModal

**Résultat**: UX grandement améliorée, code plus maintenable

### Sprint 2 (Priorité 2)
**Focus**: Fonctionnalités avancées
1. MenuCalendar
2. QRCodeGenerator + Scanner
3. BesoinsStockTable
4. StatisticsCards

**Résultat**: Fonctionnalités différenciantes

### Sprint 3 (Priorité 4)
**Focus**: Exports et rapports
1. Export PDF
2. Export Excel
3. Impression tickets

**Résultat**: Module complet pour production

### Sprint 4 (Priorité 5 - Optionnel)
**Focus**: Analytics avancés
1. Graphiques supplémentaires
2. Filtres période
3. Dashboard enrichi

**Résultat**: Module premium

---

## 💡 RECOMMANDATIONS

### À Faire En Priorité
1. ✅ **Composants formulaires** - Réduction duplication code
2. ✅ **Toast notifications** - Feedback utilisateur essentiel
3. ✅ **Skeleton loaders** - Amélioration perception performance
4. ✅ **ConfirmModal** - Meilleure UX que confirm() natif

### Peut Attendre
- Graphiques avancés (nice to have)
- Scanner QR Code mobile (nécessite tests device)
- Calendrier (fonctionnalité premium)

### À Discuter Avec Utilisateurs
- Format impression tickets (thermique vs A6)
- Besoins exports spécifiques
- Métriques importantes pour dashboard

---

## 📊 IMPACT ATTENDU

### Qualité Code
- ⬆️ Réduction duplication: ~40%
- ⬆️ Maintenabilité: +60%
- ⬆️ Testabilité: +50%

### Expérience Utilisateur
- ⬆️ Feedback immédiat (toasts)
- ⬆️ Perception vitesse (skeletons)
- ⬆️ Clarté actions (confirm modals)
- ⬆️ Productivité (exports)

### Valeur Business
- ⬆️ Adoption utilisateurs
- ⬆️ Satisfaction
- ⬆️ Différenciation concurrentielle
- ⬆️ Efficacité opérationnelle

---

## ✅ CHECKLIST PHASE 5

### Préparation
- [ ] Installer dépendances npm
- [ ] Créer dossiers structure
- [ ] Définir conventions nommage

### Développement
- [ ] Sprint 1 - Formulaires + UX (Priorité 1+3)
- [ ] Sprint 2 - Composants Avancés (Priorité 2)
- [ ] Sprint 3 - Exports (Priorité 4)
- [ ] Sprint 4 - Graphiques (Priorité 5 - Optionnel)

### Tests
- [ ] Tests unitaires composants
- [ ] Tests intégration formulaires
- [ ] Tests exports (PDF/Excel)
- [ ] Tests scanner QR (devices)

### Documentation
- [ ] Storybook composants
- [ ] Guide utilisation composants
- [ ] Documentation API composants
- [ ] Exemples d'utilisation

---

**Voulez-vous que je commence par les composants formulaires (Priorité 1) ou préférez-vous une autre priorité ?**

---

**Équipe CROU**
*Date: 11 Janvier 2025*
