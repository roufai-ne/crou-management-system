# Évaluation Module Logement (Housing)

**Date**: 19 Janvier 2025
**Statut**: ⚠️ INCOMPLET - Nécessite mise à jour majeure
**Score Global**: **45/100**

---

## 🎯 Résumé Exécutif

Le module Housing dispose d'une **excellente architecture backend** (entités bien conçues, relations claires) mais souffre de **lacunes majeures** dans l'implémentation:

### ✅ Points Forts
1. **Entités DB complètes** (Housing, Room, HousingOccupancy, HousingMaintenance)
2. **Controller CRUD fonctionnel** pour logements et chambres
3. **Architecture multi-tenant** correctement implémentée
4. **Frontend UI structure** bien pensée (tabs, modals, tables)

### ❌ Points Critiques
1. **AUCUNE entité Student** → Demandes/Renouvellements impossibles
2. **CRUD incomplet** → Modals non fonctionnels, pas de validation
3. **Maintenance non implémentée** → Endpoints stubs, pas de workflow
4. **Demandes étudiants absentes** → Aucun système de demande/attribution
5. **Hooks frontend non implémentés** → useHousing* retournent des tableaux vides

---

## 📊 Scoring Détaillé

### 1. Backend (60/100)

| Composant | Score | Commentaire |
|-----------|-------|-------------|
| **Entités DB** | 90/100 | ✅ Excellentes (Housing, Room, Occupancy, Maintenance) |
| **Migrations** | 80/100 | ✅ Entités créées, relations OK |
| **Controller Housing** | 70/100 | ⚠️ CRUD logements OK, mais endpoints incomplets |
| **Controller Rooms** | 60/100 | ⚠️ Stubs basiques, pas de validation |
| **Controller Occupancy** | 20/100 | ❌ Endpoints manquants (POST/PUT/DELETE) |
| **Controller Maintenance** | 10/100 | ❌ Stub retournant `[]`, pas d'implémentation |
| **Service Layer** | 0/100 | ❌ AUCUN service métier (logique dans controllers) |
| **Entité Student** | 0/100 | ❌ ABSENTE - critique pour demandes |
| **Workflow Demandes** | 0/100 | ❌ NON IMPLÉMENTÉ |

**Détails Backend**:

#### ✅ Ce qui existe

**Entités complètes**:
- [Housing.entity.ts](packages/database/src/entities/Housing.entity.ts) - 358 lignes
  - 4 types: CITE_UNIVERSITAIRE, RESIDENCE, FOYER, LOGEMENT_PERSONNEL
  - 5 statuts: ACTIF, INACTIF, EN_CONSTRUCTION, EN_RENOVATION, FERME
  - Capacité, occupation, tarification, équipements
  - Méthodes: `calculateOccupancyRate()`, `isAvailable()`, `isFull()`

- [Room.entity.ts](packages/database/src/entities/Room.entity.ts) - 305 lignes
  - 4 types: SIMPLE, DOUBLE, TRIPLE, QUADRUPLE
  - 4 statuts: DISPONIBLE, OCCUPE, MAINTENANCE, HORS_SERVICE
  - Tarification par chambre, équipements
  - Méthodes: `addOccupant()`, `removeOccupant()`, `isAvailable()`

- [HousingOccupancy.entity.ts](packages/database/src/entities/HousingOccupancy.entity.ts) - 150 lignes
  - Données étudiant: nom, prénom, email, numéroEtudiant, université, filière
  - Dates: dateDebut, dateFin
  - 3 statuts: ACTIVE, TERMINATED, SUSPENDED
  - Tarification: loyerMensuel, caution

- [HousingMaintenance.entity.ts](packages/database/src/entities/HousingMaintenance.entity.ts) - 142 lignes
  - 3 types: PREVENTIVE, CORRECTIVE, URGENTE
  - 4 statuts: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  - Coûts: coutEstime, coutReel
  - Dates, prestataire

**Controller fonctionnel** ([housing.controller.ts](apps/api/src/modules/housing/housing.controller.ts) - 1187 lignes):
- ✅ `GET /api/housing` - Liste logements (filtres, pagination)
- ✅ `GET /api/housing/complexes` - Alias pour frontend
- ✅ `GET /api/housing/:id` - Détail logement
- ✅ `POST /api/housing` - Créer logement
- ✅ `PUT /api/housing/:id` - Modifier logement
- ✅ `DELETE /api/housing/:id` - Supprimer logement
- ✅ `GET /api/housing/:id/stats` - Statistiques logement
- ✅ `GET /api/housing/rooms` - Liste chambres (pagination)
- ✅ `GET /api/housing/rooms/:id` - Détail chambre
- ✅ `POST /api/housing/rooms` - Créer chambre (stub basique)
- ✅ `PUT /api/housing/rooms/:id` - Modifier chambre (stub basique)
- ✅ `DELETE /api/housing/rooms/:id` - Supprimer chambre (stub basique)
- ⚠️ `GET /api/housing/residents` - Liste résidents (retourne occupancies)
- ⚠️ `GET /api/housing/metrics` - Métriques (retourne valeurs par défaut)
- ❌ `GET /api/housing/maintenance` - Stub retournant `[]`
- ❌ `GET /api/housing/payments` - Stub retournant `[]`

#### ❌ Ce qui manque

**Entités manquantes**:
1. **Student.entity.ts** ❌ CRITIQUE
   - Informations étudiant (matricule, université, niveau, filière)
   - Documents (CNI, certificat scolarité, etc.)
   - Historique logement

2. **HousingRequest.entity.ts** ❌ CRITIQUE
   - Demande de logement étudiant
   - Statuts: PENDING, APPROVED, REJECTED, EXPIRED
   - Critères: type chambre souhaité, budget, handicap, etc.
   - Date soumission, date traitement
   - Pièces jointes (certificat scolarité, etc.)

3. **RenewalRequest.entity.ts** ❌ IMPORTANT
   - Demande de renouvellement annuel
   - Référence occupation précédente
   - Statuts: PENDING, APPROVED, REJECTED
   - Date limite soumission

4. **Payment.entity.ts** ❌ IMPORTANT
   - Paiements loyers (mensuel, caution, frais dossier)
   - Méthode paiement, référence transaction
   - Statuts: PENDING, PAID, OVERDUE, CANCELLED

**Controllers manquants**:
1. **HousingRequestController** ❌
   - `POST /api/housing/requests` - Soumettre demande
   - `GET /api/housing/requests` - Liste demandes (filtres: statut, année, CROU)
   - `GET /api/housing/requests/:id` - Détail demande
   - `PATCH /api/housing/requests/:id/approve` - Approuver demande
   - `PATCH /api/housing/requests/:id/reject` - Rejeter demande
   - `PATCH /api/housing/requests/:id/assign` - Attribuer chambre

2. **RenewalController** ❌
   - `POST /api/housing/renewals` - Demande renouvellement
   - `GET /api/housing/renewals` - Liste renouvellements
   - `PATCH /api/housing/renewals/:id/process` - Traiter renouvellement

3. **MaintenanceController complet** ❌
   - `POST /api/housing/maintenance` - Créer demande
   - `PUT /api/housing/maintenance/:id` - Modifier demande
   - `PATCH /api/housing/maintenance/:id/assign` - Assigner technicien
   - `PATCH /api/housing/maintenance/:id/complete` - Marquer terminée

4. **PaymentController** ❌
   - `POST /api/housing/payments` - Enregistrer paiement
   - `GET /api/housing/payments` - Liste paiements
   - `GET /api/housing/payments/:id/receipt` - Générer reçu
   - `PATCH /api/housing/payments/:id/validate` - Valider paiement

**Services métier manquants**:
1. **HousingService** ❌
   - Attribution automatique chambre (algorithme selon critères)
   - Calcul tarifs (selon type chambre, catégorie, réductions)
   - Génération rapports occupation
   - Envoi notifications (rappels paiement, fin bail)

2. **MaintenanceService** ❌
   - Planification maintenance préventive
   - Priorisation demandes urgentes
   - Calcul coûts maintenance
   - Historique maintenance par chambre/logement

---

### 2. Frontend (30/100)

| Composant | Score | Commentaire |
|-----------|-------|-------------|
| **UI Structure** | 80/100 | ✅ Tabs, modals, tables bien pensés |
| **Hooks** | 0/100 | ❌ useHousing* non implémentés (retournent `[]`) |
| **Service API** | 20/100 | ⚠️ Service incomplet |
| **Modals CRUD** | 10/100 | ❌ Modals vides, pas de gestion état |
| **Validation** | 0/100 | ❌ Aucune validation formulaires |
| **Demandes** | 0/100 | ❌ Interface demandes absente |
| **Renouvellements** | 0/100 | ❌ Interface renouvellements absente |

**Détails Frontend**:

#### ✅ Ce qui existe

[HousingPage.tsx](apps/web/src/pages/housing/HousingPage.tsx) - 1011 lignes:
- ✅ Structure 5 tabs: Cités, Chambres, Résidents, Maintenance, Paiements
- ✅ Colonnes tables bien définies
- ✅ Modals création/édition (structure)
- ✅ Statistiques KPIs (header)
- ✅ Filtres et recherche (structure)

#### ❌ Ce qui manque

**Hooks non implémentés** (retournent valeurs par défaut):
```typescript
// apps/web/src/hooks/useHousing.ts - À CRÉER
export const useHousingComplexes = () => {
  // TODO: Implémenter fetch API
  return {
    complexes: [],  // ❌ Toujours vide
    loading: false,
    error: null,
    createComplex: async () => {}, // ❌ Non implémenté
    updateComplex: async () => {}, // ❌ Non implémenté
    // ...
  };
};
```

**Modals non fonctionnels**:
- Pas de gestion état formulaires (useState, react-hook-form)
- Pas de validation (Zod, Yup)
- Pas d'appels API (createComplex, updateComplex)
- Inputs hardcodés (pas dynamiques selon modalType)

**Interfaces demandes/renouvellements absentes**:
- Aucun onglet "Demandes"
- Aucun onglet "Renouvellements"
- Aucun workflow attribution
- Aucune interface calendrier année universitaire

---

### 3. Workflows Critiques Manquants (0/100)

#### ❌ Workflow 1: Demande de Logement Étudiant

**Étapes attendues**:
1. Étudiant soumet demande (en ligne ou agent)
   - Formulaire: données personnelles, université, filière, niveau
   - Pièces jointes: certificat scolarité, CNI/passeport, photo
   - Préférences: type chambre, budget max, besoins spéciaux
2. Validation dossier (Gestionnaire Logement)
   - Vérifier documents
   - Vérifier éligibilité (inscription université confirmée)
3. Mise en file d'attente
   - Priorisation selon critères (boursier, handicap, distance, ancienneté)
4. Attribution chambre
   - Algorithme automatique ou attribution manuelle
   - Notification étudiant (email, SMS)
5. Confirmation étudiant
   - Accepter/Refuser dans délai (7 jours)
6. Signature contrat + Paiement
   - Générer contrat bail
   - Enregistrer paiement caution + 1er mois
7. Remise clés
   - État des lieux entrée
   - Activation occupation (status: ACTIVE)

**État actuel**: ❌ AUCUNE étape implémentée

#### ❌ Workflow 2: Renouvellement Annuel

**Étapes attendues**:
1. Ouverture campagne renouvellement (Juin/Juillet)
   - Notification tous résidents actuels
   - Date limite soumission (ex: 31 Juillet)
2. Soumission demande renouvellement
   - Confirmation volonté rester
   - Mise à jour données (si changement filière, etc.)
   - Paiement anticipé ou engagement
3. Traitement demandes
   - Priorité résidents actuels
   - Vérifier toujours inscrit université
   - Vérifier pas de retards paiement
4. Approbation/Rejet
   - Si approuvé: prolonger occupation (nouvelle dateFin)
   - Si rejeté: notification + date libération chambre
5. Paiement nouveau bail
   - Nouvelle facture année N+1
   - Mise à jour tarifs si changement

**État actuel**: ❌ AUCUNE étape implémentée

#### ❌ Workflow 3: Maintenance Logement

**Étapes attendues**:
1. Création demande maintenance
   - Qui: Résident, Gestionnaire, Technicien
   - Description problème
   - Urgence: FAIBLE, MOYENNE, HAUTE, URGENTE
   - Photo/pièce jointe si possible
2. Validation demande (Gestionnaire Logement)
   - Vérifier pertinence
   - Estimer coût
   - Assigner priorité
3. Planification intervention
   - Assigner technicien/prestataire
   - Définir date intervention
   - Réserver pièces/matériel si besoin
4. Intervention
   - Technicien marque "EN_COURS"
   - Réalise travaux
   - Enregistre temps passé, matériel utilisé
5. Validation fin travaux
   - Gestionnaire vérifie qualité
   - Résident confirme satisfaction
   - Marquer "COMPLETED"
6. Facturation
   - Enregistrer coûts réels
   - Lier à budget maintenance
   - Générer facture prestataire externe

**État actuel**: ⚠️ Endpoint stub uniquement, pas de workflow

---

## 🔍 Analyse Gap Détaillée

### Gap 1: Entité Student Absente

**Impact**: ❌ **CRITIQUE** - Impossible gérer demandes/renouvellements

**Problème actuel**:
- `HousingOccupancy` contient données étudiant (nom, prénom, numeroEtudiant)
- Pas de table `students` séparée
- Duplication données si étudiant change chambre
- Pas d'historique étudiant
- Impossible lier avec autres modules (bourses, restauration, transport)

**Solution requise**:
```typescript
// Student.entity.ts À CRÉER
export class Student {
  id: string;
  matricule: string; // Numéro étudiant unique
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: Date;
  lieuNaissance: string;
  sexe: 'M' | 'F';
  nationalite: string;

  // Université
  universiteId: string; // Relation avec université
  faculte: string;
  filiere: string;
  niveau: string; // L1, L2, L3, M1, M2, D
  anneeInscription: number;

  // Documents
  cniPasseport: string;
  certificatScolarite: string; // URL fichier
  photo: string; // URL photo

  // Statut
  isBoursier: boolean;
  isHandicape: boolean;
  besoinsSpeciaux: string[];

  // Relations
  occupations: HousingOccupancy[]; // Historique
  housingRequests: HousingRequest[]; // Demandes
  renewals: RenewalRequest[]; // Renouvellements
}
```

---

### Gap 2: Workflow Demandes Non Implémenté

**Impact**: ❌ **CRITIQUE** - Processus manuel, erreurs, lenteur

**Solution requise**:
```typescript
// HousingRequest.entity.ts À CRÉER
export enum RequestStatus {
  DRAFT = 'draft',           // Brouillon
  SUBMITTED = 'submitted',   // Soumise
  UNDER_REVIEW = 'under_review', // En cours validation
  APPROVED = 'approved',     // Approuvée
  ASSIGNED = 'assigned',     // Chambre attribuée
  CONFIRMED = 'confirmed',   // Confirmée par étudiant
  REJECTED = 'rejected',     // Rejetée
  EXPIRED = 'expired',       // Expirée (pas de réponse étudiant)
  CANCELLED = 'cancelled'    // Annulée
}

export enum RequestPriority {
  VERY_HIGH = 'very_high',   // Handicap, cas social
  HIGH = 'high',             // Boursier, grande distance
  MEDIUM = 'medium',         // Standard
  LOW = 'low'                // Hors critères prioritaires
}

export class HousingRequest {
  id: string;
  tenantId: string; // CROU concerné
  studentId: string; // Relation Student
  student: Student;

  // Année universitaire
  anneeUniversitaire: string; // "2024-2025"
  semestre: number; // 1 ou 2

  // Préférences
  typeChambresPreferees: RoomType[]; // [SIMPLE, DOUBLE]
  logementPrefere: string; // ID Housing ou null
  budgetMaxMensuel: number;

  // Critères prioritaires
  isBoursier: boolean;
  isHandicape: boolean;
  besoinsSpeciaux: string[];
  distanceUniversite: number; // km

  // Documents
  certificatScolarite: string; // URL
  attestationBourse: string | null; // URL si boursier
  certificatHandicap: string | null; // URL si handicap
  autrePieces: string[]; // URLs

  // Workflow
  status: RequestStatus;
  priority: RequestPriority;
  dateSubmission: Date;
  dateTraitement: Date | null;
  dateExpiration: Date | null;

  // Attribution
  roomAssigned: Room | null;
  dateAttribution: Date | null;
  assignedBy: string | null; // User ID

  // Réponse étudiant
  dateConfirmation: Date | null;
  commentaireRejet: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### Gap 3: Renouvellements Non Gérés

**Impact**: ⚠️ **IMPORTANT** - Risque perte résidents, désorganisation

**Solution requise**:
```typescript
// RenewalRequest.entity.ts À CRÉER
export class RenewalRequest {
  id: string;
  tenantId: string;
  studentId: string;
  student: Student;

  // Occupation actuelle
  currentOccupancyId: string;
  currentOccupancy: HousingOccupancy;

  // Nouvelle période
  anneeUniversitaire: string; // "2025-2026"
  dateDebutSouhaitee: Date;
  dateFinSouhaitee: Date;

  // Changements souhaités
  keepSameRoom: boolean; // Garder même chambre?
  newRoomPreferences: RoomType[] | null; // Si changement

  // Documents
  nouveauCertificatScolarite: string; // URL

  // Workflow
  status: RequestStatus;
  dateSubmission: Date;
  dateTraitement: Date | null;

  // Décision
  isApproved: boolean | null;
  commentaireDecision: string | null;
  newOccupancyId: string | null; // Si approuvé

  createdAt: Date;
  updatedAt: Date;
}
```

---

### Gap 4: Maintenance Workflow Incomplet

**Impact**: ⚠️ **MOYEN** - Maintenance désorganisée, coûts non suivis

**Solution requise**:
- Endpoint complet: POST, PUT, PATCH (assign, complete)
- Service métier: priorisation automatique, notifications
- Planning interventions (calendrier)
- Historique maintenance par chambre
- Reporting coûts vs budget

---

### Gap 5: Frontend Hooks Non Implémentés

**Impact**: ❌ **BLOQUANT** - Interface non fonctionnelle

**Fichiers à créer**:
```bash
apps/web/src/hooks/
├── useHousing.ts              # Hook principal
├── useHousingComplexes.ts     # Gestion cités
├── useHousingRooms.ts         # Gestion chambres
├── useHousingResidents.ts     # Gestion résidents
├── useHousingMaintenance.ts   # Gestion maintenance
├── useHousingPayments.ts      # Gestion paiements
├── useHousingRequests.ts      # ❌ À CRÉER - Demandes
└── useHousingRenewals.ts      # ❌ À CRÉER - Renouvellements
```

---

## ❓ Questions Clarification pour le User

Avant de créer le plan détaillé, j'ai besoin de clarifications:

### 1. Entité Student

**Q1**: Existe-t-il déjà une table/entité `Student` dans le système?
- Si OUI: Où? (autre module, database séparée?)
- Si NON: Faut-il la créer dans le module Housing ou module séparé "Students"?

**Q2**: Quel est l'identifiant unique étudiant?
- Matricule université? (ex: "2024-UNI-001")
- CNI/Passeport?
- ID système CROU?

**Q3**: Intégration avec universités?
- Import automatique listes étudiants inscrits?
- Vérification manuelle certificats scolarité?
- API université pour valider inscription?

### 2. Workflow Demandes

**Q4**: Qui peut soumettre une demande?
- Étudiant lui-même (portail self-service)?
- Agent CROU uniquement (sur dossier papier)?
- Les deux?

**Q5**: Critères de priorisation?
- Ordre: Boursiers > Handicapés > Distance > Date soumission?
- Points attribués par critère?
- Algorithme automatique ou décision manuelle gestionnaire?

**Q6**: Attribution chambre?
- Automatique (algorithme)?
- Semi-automatique (suggestions + validation manuelle)?
- Manuelle complète?

**Q7**: Documents requis obligatoires?
- Certificat scolarité (OUI/NON?)
- CNI/Passeport (OUI/NON?)
- Photo (OUI/NON?)
- Attestation bourse (si boursier)?
- Certificat handicap (si handicap)?
- Autres?

### 3. Workflow Renouvellements

**Q8**: Période renouvellement?
- Date ouverture campagne? (ex: 1er Juin)
- Date limite soumission? (ex: 31 Juillet)
- Date début nouveau bail? (ex: 1er Septembre)

**Q9**: Priorité renouvellement vs nouvelles demandes?
- Résidents actuels prioritaires à 100%?
- Ou compétition avec nouveaux étudiants?

**Q10**: Changement chambre lors renouvellement?
- Autorisé? (étudiant peut demander autre chambre)
- Uniquement si même chambre indisponible?
- Jamais (renouvellement = même chambre obligatoire)?

### 4. Paiements

**Q11**: Tarification?
- Prix fixe par type chambre?
- Prix variable selon CROU?
- Réductions (boursiers, familles nombreuses, etc.)?
- Frais dossier? Caution? Combien?

**Q12**: Paiements?
- Modes acceptés: Espèces, Chèque, Mobile Money, Carte bancaire?
- Fréquence: Mensuel, Trimestriel, Annuel?
- Pénalités retard?

**Q13**: Intégration finance?
- Lien avec module Financial du CROU?
- Génération automatique Transactions?
- Rapports comptables mensuels?

### 5. Calendrier Année Universitaire

**Q14**: Année universitaire?
- Début: Septembre ou Octobre?
- Fin: Juin ou Juillet?
- Gestion 2 semestres séparés?

**Q15**: Périodes clés?
- Ouverture demandes: Quand? (ex: Avril-Mai)
- Fermeture demandes: Quand? (ex: Fin Août)
- Début occupations: Quand? (ex: Septembre)
- Fin occupations: Quand? (ex: Juin)

### 6. Notifications

**Q16**: Notifications automatiques?
- Email?
- SMS?
- Notifications in-app?
- Tous les trois?

**Q17**: Événements à notifier?
- Demande reçue (confirmation étudiant)
- Demande approuvée (notification + attribution chambre)
- Demande rejetée (motif)
- Rappel paiement loyer (J-7, J-3, J-1, J+1, J+7)
- Fin bail proche (J-30, J-15)
- Maintenance programmée
- Autres?

---

## 📝 Prochaines Étapes (Après Réponses)

Une fois les questions répondues, je créerai:

1. **Plan détaillé mise à jour** avec:
   - Phases d'implémentation (1-4 semaines)
   - Entités à créer (Student, HousingRequest, RenewalRequest, Payment)
   - Controllers à implémenter
   - Services métier
   - Hooks frontend
   - Interfaces UI (demandes, renouvellements, calendrier)

2. **Architecture cible** avec:
   - Diagramme entités complet
   - Workflows détaillés (séquences)
   - Matrice permissions

3. **Estimation effort** avec:
   - Temps développement par composant
   - Dépendances entre tâches
   - Jalons (milestones)

---

**Auteur**: Équipe CROU
**Date**: 19 Janvier 2025
**Version**: 1.0 - Évaluation initiale
