# 📊 MODULE LOGEMENT (HOUSING) - SYNTHÈSE COMPLÈTE

## 🎯 Vue d'ensemble

Le module Housing du système CROU est maintenant **centré sur les LITS** (bed-centered), et non sur les chambres. Chaque lit est l'unité centrale d'attribution et de gestion.

---

## 🏗️ Architecture du Système

### Philosophie de conception

> **TOUT TOURNE AUTOUR DES LITS** 🛏️

- ✅ Une chambre peut avoir **1 à 10+ lits** (paramétrable)
- ✅ Chaque lit est **attribué individuellement** à un étudiant
- ✅ **4 statuts seulement** : AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_SERVICE
- ❌ **PAS de statut RESERVED** (pas de système de réservation)
- ✅ **Synchronisation automatique** : statut lit ↔ count occupation chambre

---

## 📋 Structure de la Base de Données

### Table `beds` (🆕 Créée)

**Entité centrale du système**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique du lit |
| `room_id` | UUID | FK vers `rooms` (CASCADE) |
| `number` | VARCHAR(10) | Numéro du lit (A, B, C, D... ou 1, 2, 3...) |
| `description` | TEXT | Description (ex: "Lit supérieur près de la fenêtre") |
| `notes` | TEXT | Notes internes de maintenance/gestion |
| `status` | ENUM | **Statut du lit** (voir ci-dessous) |
| `is_active` | BOOLEAN | Lit actif ou désactivé |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de modification |
| `created_by` | VARCHAR(255) | Créateur |
| `updated_by` | VARCHAR(255) | Modificateur |

**Contraintes :**
- `UNIQUE(room_id, number)` - Pas de doublons de numéro dans une chambre
- `FK room_id → rooms(id)` ON DELETE CASCADE

**Index :**
- `idx_beds_room_status` - (room_id, status) pour requêtes par chambre
- `idx_beds_room_number` - (room_id, number) pour recherche rapide
- `idx_beds_status` - (status) pour statistiques globales

### Enum `bed_status_enum`

```sql
CREATE TYPE bed_status_enum AS ENUM (
    'available',      -- 🟢 Disponible (libre)
    'occupied',       -- 🔴 Occupé (attribué à un étudiant)
    'maintenance',    -- 🟠 En maintenance
    'out_of_service'  -- ⚫ Hors service (inutilisable)
);
```

**Pas de statut "reserved" !** Les attributions sont immédiates.

### Table `housing_occupancies` (✏️ Modifiée)

**Ajout de la colonne `bed_id`**

| Nouvelle Colonne | Type | Description |
|-----------------|------|-------------|
| `bed_id` | UUID NOT NULL | FK vers `beds` - **Le lit spécifique attribué** |

**Contraintes ajoutées :**
- `FK bed_id → beds(id)` ON DELETE CASCADE
- `INDEX(bed_id, status)` pour requêtes rapides

**Relations :**
- `ManyToOne` → Student (étudiant occupant)
- `ManyToOne` → Bed (🆕 **lit attribué**)
- `ManyToOne` → Room (chambre - conservé pour query convenience)
- `ManyToOne` → HousingRequest (demande d'origine, optionnel)

---

## 🔄 Workflow d'Attribution

### 1️⃣ Création d'une occupation

```typescript
// Service: HousingOccupancyService.create()

1. Vérifier que le lit est disponible (status = AVAILABLE)
2. Créer l'occupation avec bedId
3. Mettre à jour le lit → status = OCCUPIED
4. Compter les lits occupés dans la chambre
5. Mettre à jour la chambre (occupation count, status)
```

### 2️⃣ Libération d'un lit

```typescript
// Service: HousingOccupancyService.release()

1. Terminer l'occupation (status = ENDED)
2. Libérer le lit → status = AVAILABLE
3. Recompter les lits occupés dans la chambre
4. Mettre à jour la chambre
```

### 3️⃣ Maintenance d'un lit

```typescript
// Service: BedService.setMaintenance()

1. Vérifier qu'aucune occupation active n'existe
2. Changer le statut → MAINTENANCE
3. Optionnel: ajouter des notes
4. Le lit devient indisponible pour attribution
```

---

## 🛠️ Services Backend

### `BedService` (🆕 Créé)

**Fichier :** `apps/api/src/modules/housing/services/BedService.ts`

**Méthodes principales :**

#### Gestion CRUD

- `create(data)` - Créer un lit
- `getAll(filters)` - Lister les lits avec filtres
- `getById(id)` - Obtenir un lit par ID
- `update(id, data)` - Modifier un lit
- `delete(id)` - Supprimer un lit

#### Gestion par chambre

- `getByRoom(roomId)` - Tous les lits d'une chambre
- `getAvailableByRoom(roomId)` - Lits disponibles dans une chambre
- `generateBedsForRoom(roomId, capacity)` - **Auto-génération de lits**

#### Changement de statut

- `setMaintenance(id, notes?)` - Mettre en maintenance
- `setAvailable(id)` - Rendre disponible
- `setOutOfService(id, reason?)` - Mettre hors service

#### Statistiques

- `getGlobalStats(tenantId?)` - Statistiques globales
- `getStatsByComplex(complexId)` - Stats par complexe
- `getStatsByRoom(roomId)` - Stats par chambre

**Exemple de stats :**
```typescript
{
  total: 450,           // Total de lits
  available: 120,       // Disponibles
  occupied: 300,        // Occupés
  maintenance: 20,      // En maintenance
  outOfService: 10,     // Hors service
  occupancyRate: "66.7" // Taux d'occupation
}
```

### `HousingOccupancyService` (✏️ Modifié)

**Fichier :** `apps/api/src/modules/housing/services/HousingOccupancyService.ts`

**Changements clés :**

- ✅ Attribution par `bedId` (plus seulement `roomId`)
- ✅ Vérification automatique de la disponibilité du lit
- ✅ Synchronisation automatique des statuts
- ✅ Mise à jour automatique du count d'occupation de la chambre

---

## 🌐 API REST Endpoints

### Routes `/api/housing/beds` (🆕 Créées)

**Controller :** `apps/api/src/modules/housing/bed.controller.ts`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/housing/beds` | Liste tous les lits (avec filtres) |
| GET | `/api/housing/beds/stats` | Statistiques globales |
| GET | `/api/housing/beds/:id` | Détails d'un lit |
| GET | `/api/housing/beds/room/:roomId` | Lits d'une chambre |
| GET | `/api/housing/beds/room/:roomId/available` | Lits disponibles d'une chambre |
| GET | `/api/housing/beds/complex/:complexId` | Lits d'un complexe |
| GET | `/api/housing/beds/complex/:complexId/stats` | Stats par complexe |
| GET | `/api/housing/beds/room/:roomId/stats` | Stats par chambre |
| POST | `/api/housing/beds` | Créer un lit |
| POST | `/api/housing/beds/room/:roomId/generate` | **Auto-générer lits** |
| PATCH | `/api/housing/beds/:id` | Modifier un lit |
| DELETE | `/api/housing/beds/:id` | Supprimer un lit |
| POST | `/api/housing/beds/:id/maintenance` | Mettre en maintenance |
| POST | `/api/housing/beds/:id/available` | Rendre disponible |
| POST | `/api/housing/beds/:id/out-of-service` | Mettre hors service |

**Exemple d'auto-génération :**

```bash
POST /api/housing/beds/room/{roomId}/generate
Body: { "capacity": 4 }

Résultat: Crée 4 lits (A, B, C, D) dans la chambre
```

### Routes `/api/housing/occupancies` (✏️ Modifiées)

**Controller :** `apps/api/src/modules/housing/occupancy.controller.ts`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/housing/occupancies` | Créer occupation (avec `bedId`) |
| GET | `/api/housing/occupancies/:id` | Détails occupation |
| POST | `/api/housing/occupancies/:id/release` | Libérer le lit |
| POST | `/api/housing/occupancies/:id/cancel` | Annuler occupation |

**Body création occupation :**
```json
{
  "studentId": "uuid",
  "bedId": "uuid",       // 🆕 Requis
  "roomId": "uuid",      // Conservé pour convenience
  "startDate": "2025-01-15",
  "endDate": "2025-06-30",
  "monthlyRent": 15000
}
```

---

## 💻 Frontend Services

### `bedService.ts` (🆕 Créé)

**Fichier :** `apps/web/src/services/api/bedService.ts`

**Méthodes disponibles :**

```typescript
export const bedService = {
  // CRUD
  getAll(filters?: BedFilters): Promise<{ data: Bed[]; total: number }>,
  getById(id: string): Promise<Bed>,
  create(data: CreateBedDTO): Promise<Bed>,
  update(id: string, data: UpdateBedDTO): Promise<Bed>,
  delete(id: string): Promise<void>,

  // Par chambre
  getByRoom(roomId: string): Promise<Bed[]>,
  getAvailableByRoom(roomId: string): Promise<Bed[]>,
  generateForRoom(roomId: string, capacity: number): Promise<Bed[]>,

  // Par complexe
  getByComplex(complexId: string): Promise<Bed[]>,

  // Statistiques
  getGlobalStats(): Promise<BedStats>,
  getStatsByComplex(complexId: string): Promise<BedStats>,
  getStatsByRoom(roomId: string): Promise<BedStats>,

  // Statuts
  setMaintenance(id: string, notes?: string): Promise<Bed>,
  setAvailable(id: string): Promise<Bed>,
  setOutOfService(id: string, reason?: string): Promise<Bed>,

  // Helpers UI
  getStatusLabel(status: BedStatus): string,
  getStatusIcon(status: BedStatus): string,
  getStatusBadgeClass(status: BedStatus): string
};
```

**Helpers de statut :**

```typescript
getStatusIcon('available')     // → '🟢'
getStatusIcon('occupied')      // → '🔴'
getStatusIcon('maintenance')   // → '🟠'
getStatusIcon('out_of_service') // → '⚫'

getStatusLabel('available')    // → 'Disponible'
getStatusBadgeClass('occupied') // → 'badge-error'
```

---

## 📊 Composants Frontend (À créer)

### `BedsTab.tsx` (❌ Non créé)

**À implémenter :** Onglet de gestion des lits dans `HousingPage.tsx`

**Fonctionnalités attendues :**
- Liste des lits avec filtres (par chambre, par statut)
- Carte visuelle de chaque lit avec icône de statut
- Actions : Maintenance, Disponible, Hors service
- Génération automatique de lits pour une chambre
- Statistiques en temps réel

### `BedSelector.tsx` (❌ Non créé)

**À implémenter :** Composant de sélection de lit lors d'une attribution

**Fonctionnalités attendues :**
- Affichage des lits disponibles d'une chambre
- Vue en grille avec numéros et statuts visuels
- Filtrage par étage, bâtiment
- Sélection interactive

---

## 🔧 Migration et Déploiement

### Migration `1763100000000-BedCenteredHousing.ts`

**Fichier :** `packages/database/src/migrations/1763100000000-BedCenteredHousing.ts`

**Actions de la migration :**

1. ✅ Création de l'enum `bed_status_enum`
2. ✅ Création de la table `beds`
3. ✅ Ajout des index pour performances
4. ✅ Foreign key `beds.room_id → rooms.id`
5. ✅ **Auto-génération des lits pour toutes les chambres existantes**
6. ✅ Ajout de la colonne `bed_id` dans `housing_occupancies`
7. ✅ **Attribution automatique des lits aux occupations actives**
8. ✅ Configuration `bed_id` comme NOT NULL
9. ✅ Foreign key `housing_occupancies.bed_id → beds.id`
10. ✅ Synchronisation des statuts de lits

**Script SQL alternatif :** `apply-bed-migration.sql` (pour exécution manuelle)

### Statut de la migration

✅ **Migration appliquée avec succès**

```sql
-- Vérification
SELECT * FROM _migrations_history
WHERE name = 'BedCenteredHousing1763100000000';

-- Résultat : Migration enregistrée
```

### Commandes de migration

```bash
# Appliquer toutes les migrations
cd packages/database
npm run migration:run

# Appliquer via SQL (si erreurs TypeScript)
psql -h localhost -U crou_user -d crou_database -f src/migrations/apply-bed-migration.sql

# Vérifier les migrations
npm run migration:show
```

---

## 📈 Statistiques et Monitoring

### Requêtes SQL utiles

#### Statistiques globales

```sql
SELECT
    COUNT(*) as total_lits,
    COUNT(*) FILTER (WHERE status = 'available') as disponibles,
    COUNT(*) FILTER (WHERE status = 'occupied') as occupes,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
    COUNT(*) FILTER (WHERE status = 'out_of_service') as hors_service,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'occupied')::decimal /
        NULLIF(COUNT(*), 0) * 100,
        1
    ) as taux_occupation
FROM beds
WHERE is_active = true;
```

#### Lits par chambre

```sql
SELECT
    r.numero as chambre,
    r.capacite,
    COUNT(b.id) as lits_crees,
    COUNT(b.id) FILTER (WHERE b.status = 'available') as disponibles,
    COUNT(b.id) FILTER (WHERE b.status = 'occupied') as occupes
FROM rooms r
LEFT JOIN beds b ON b.room_id = r.id
GROUP BY r.id, r.numero, r.capacite
ORDER BY r.numero;
```

#### Occupations avec détails de lits

```sql
SELECT
    s.nom || ' ' || s.prenom as etudiant,
    r.numero as chambre,
    b.number as lit,
    b.status as statut_lit,
    o.status as statut_occupation,
    o."startDate" as debut,
    o."endDate" as fin
FROM housing_occupancies o
JOIN students s ON s.id = o.student_id
JOIN beds b ON b.id = o.bed_id
JOIN rooms r ON r.id = o.room_id
WHERE o.status = 'active'
ORDER BY r.numero, b.number;
```

---

## 🚀 Prochaines Étapes

### Fonctionnalités à implémenter

#### Backend
- [ ] Endpoint de recherche avancée de lits
- [ ] API de génération de rapports bed-occupancy
- [ ] Webhook/notifications lors de changements de statut
- [ ] Historique des changements de statut de lit

#### Frontend
- [ ] **BedsTab** - Gestion des lits
- [ ] **BedSelector** - Sélecteur de lit pour attribution
- [ ] **BedCard** - Carte visuelle d'un lit
- [ ] **RoomBedLayout** - Vue en plan d'une chambre
- [ ] **BedStatsDashboard** - Dashboard de statistiques

#### Features avancées
- [ ] Système de préférences de lits (fenêtre, étage, etc.)
- [ ] Attribution automatique intelligente (algorithme)
- [ ] Planning de maintenance préventive des lits
- [ ] Export Excel des lits et occupations

---

## 📚 Documentation Technique

### Entités TypeORM

**Bed.entity.ts**
```typescript
@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, room => room.beds, { onDelete: 'CASCADE' })
  room: Room;

  @Column({ type: 'varchar', length: 10 })
  number: string; // A, B, C, D...

  @Column({ type: 'enum', enum: BedStatus, default: BedStatus.AVAILABLE })
  status: BedStatus;

  @OneToMany(() => HousingOccupancy, occupancy => occupancy.bed)
  occupancies: HousingOccupancy[];

  // Méthodes utiles
  isAvailable(): boolean;
  isOccupied(): boolean;
  getStatusLabel(): string;
  getStatusIcon(): string;
  getFullNumber(room?: Room): string; // Ex: "201-A"
}
```

**HousingOccupancy.entity.ts (extrait)**
```typescript
@Entity('housing_occupancies')
export class HousingOccupancy {
  // Relation principale avec le lit
  @Column({ name: 'bed_id', type: 'uuid' })
  bedId: string;

  @ManyToOne(() => Bed, bed => bed.occupancies, { onDelete: 'CASCADE' })
  bed: Bed;

  // Relation avec la chambre (conservée pour queries)
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  room: Room;

  // Relation avec l'étudiant
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student: Student;
}
```

### DTOs

**CreateBedDTO**
```typescript
{
  roomId: string;           // UUID de la chambre
  number: string;           // A, B, C, D...
  description?: string;     // Description optionnelle
  notes?: string;           // Notes internes
  createdBy: string;        // User ID du créateur
}
```

**CreateOccupancyDTO (modifié)**
```typescript
{
  tenantId: string;
  studentId: string;
  bedId: string;            // 🆕 Requis
  roomId: string;           // Conservé
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  createdBy: string;
}
```

---

## ⚠️ Points d'Attention

### Sécurité
- ✅ Toutes les routes `/api/housing/beds` sont protégées par `authenticateJWT`
- ✅ Vérification du `tenantId` pour isolation multi-tenant
- ✅ Validation des permissions utilisateur (créer, modifier, supprimer)

### Performance
- ✅ Index sur `(room_id, status)` pour requêtes fréquentes
- ✅ Index sur `bed_id` dans `housing_occupancies`
- ⚠️ Attention aux requêtes N+1 : utiliser `relations` dans TypeORM

### Intégrité des données
- ✅ `ON DELETE CASCADE` : supprimer chambre → supprimer lits → libérer occupations
- ✅ Contrainte `UNIQUE(room_id, number)` : pas de doublons
- ✅ Synchronisation automatique des statuts lors des attributions/libérations

### Migrations futures
- Si ajout de nouveaux champs à `beds`, créer une nouvelle migration
- Ne JAMAIS modifier `1763100000000-BedCenteredHousing.ts` après application
- Toujours tester les migrations sur une copie de la base de données

---

## 📞 Contact et Support

**Équipe CROU - Module Housing**

Pour toute question sur le système bed-centered :
- Consulter ce document
- Vérifier les commentaires dans le code
- Examiner les tests unitaires (à créer)

---

## 📝 Changelog

### v1.0.0 - Janvier 2025
- ✅ Création du système bed-centered
- ✅ Migration `1763100000000-BedCenteredHousing`
- ✅ Entité `Bed` avec 4 statuts
- ✅ Services backend complets (BedService, HousingOccupancyService)
- ✅ API REST avec 15+ endpoints
- ✅ Frontend service `bedService.ts`
- ✅ Documentation complète

### Prochaine version (v1.1.0)
- [ ] Composants React (BedsTab, BedSelector)
- [ ] Tests unitaires et d'intégration
- [ ] Attribution automatique intelligente

---

## 🎉 Conclusion

Le module Housing est maintenant **100% bed-centered**. Toutes les fondations techniques sont en place :

✅ Base de données migrée et structurée
✅ Backend complet avec services et API
✅ Frontend service prêt à l'emploi
✅ Documentation exhaustive

**Prochaine étape :** Implémenter les composants frontend pour exploiter pleinement ce système ! 🚀
