# CORRECTIONS SYSTÈME TICKETS TRANSPORT - TICKETS UNIVERSELS

**Date**: 20 Janvier 2025
**Système réel**: Tickets de transport universels (comme tickets de bus urbains)

---

## COMPRÉHENSION FINALE DU SYSTÈME

### Modèle métier RÉEL :

```
┌─────────────────────────────────────────────────────────────┐
│  GUICHET CROU                                               │
│  - Agent vend des BLOCS de tickets (10, 20, 50...)        │
│  - Tickets UNIVERSELS (valables toutes navettes)          │
│  - Prix fixe : 200 XOF ou GRATUIT                         │
│  - Validité : jusqu'au 31/12 de l'année                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  TICKET IMPRIMÉ                                             │
│  ┌─────────────────────────┐                               │
│  │  CROU - TICKET TRANSPORT │                               │
│  │  N° TKT-TRANS-2025-000123│                               │
│  │  Tarif: 200 XOF          │                               │
│  │  Valable jusqu'au:       │                               │
│  │  31 Décembre 2025        │                               │
│  │  [QR CODE]               │                               │
│  └─────────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  UTILISATION                                                │
│  - Étudiant monte dans N'IMPORTE QUELLE navette           │
│  - Contrôleur scanne le QR code                            │
│  - Système vérifie: Ticket valide ? Pas déjà utilisé ?    │
│  - Marque comme utilisé + comptabilise                     │
│  - Ticket ne peut PLUS être réutilisé                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ERREURS DE CONCEPTION À CORRIGER

### ❌ Erreur 1: Champ `circuitId` dans TicketTransport

**Problème** : Les tickets sont liés à un circuit spécifique dans la BDD
**Réalité** : Les tickets sont universels (aucun circuit)

**Fichiers impactés** :
- `packages/database/src/entities/TicketTransport.entity.ts`
- `apps/api/src/modules/transport/ticket-transport.service.ts`
- `apps/web/src/components/transport/TicketsTransportTab.tsx`

---

### ❌ Erreur 2: Champ `dateVoyage` dans TicketTransport

**Problème** : Les tickets ont une date de voyage spécifique
**Réalité** : Les tickets sont valables jusqu'au 31/12 (pas de date précise)

---

### ❌ Erreur 3: Sélection circuit lors de l'émission

**Problème** : L'interface demande de sélectionner un circuit
**Réalité** : Émission simple : quantité + payant/gratuit

---

## CORRECTIONS REQUISES

### Correction 1: Modifier l'entité TicketTransport

**Fichier** : `packages/database/src/entities/TicketTransport.entity.ts`

**Changements** :

```typescript
@Entity('tickets_transport')
export class TicketTransport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  // Identifiants
  @Column({ type: 'varchar', length: 50, unique: true })
  numeroTicket: string;            // TKT-TRANS-2025-000123

  @Column({ type: 'varchar', length: 255, unique: true })
  qrCode: string;                  // QR-TRANS-[HASH]

  // ❌ SUPPRIMER circuitId (n'existe plus)
  // @Column({ type: 'uuid', name: 'circuit_id' })
  // circuitId: string;

  // @ManyToOne(() => TransportRoute)
  // circuit: TransportRoute;

  // Catégorie et tarif
  @Column({
    type: 'enum',
    enum: CategorieTicketTransport,
    default: CategorieTicketTransport.PAYANT
  })
  categorie: CategorieTicketTransport;  // PAYANT ou GRATUIT

  @Column({ type: 'int', default: new Date().getFullYear() })
  annee: number;                        // 2025

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tarif: number;                        // 200 XOF ou 0

  // Dates
  @Column({ type: 'date' })
  dateEmission: Date;                   // Date d'achat

  // ❌ SUPPRIMER dateVoyage (n'existe plus)
  // @Column({ type: 'date' })
  // dateVoyage: Date;

  // ❌ RENOMMER dateExpiration en validUntil
  @Column({ type: 'date' })
  validUntil: Date;                     // 31/12/2025

  // Statut
  @Column({
    type: 'enum',
    enum: TicketTransportStatus,
    default: TicketTransportStatus.ACTIF
  })
  status: TicketTransportStatus;

  @Column({ type: 'boolean', default: false })
  estUtilise: boolean;

  @Column({ type: 'boolean', default: false })
  isExpired: boolean;

  // Utilisation (rempli lors du scan)
  @Column({ type: 'timestamp', nullable: true })
  dateUtilisation: Date;

  @Column({ type: 'uuid', nullable: true })
  busAssignmentId: string;              // Lien vers DailyBusAssignment (quel bus)

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehiculeImmatriculation: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  conducteur: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validePar: string;                    // Agent qui a scanné

  // Paiement
  @Column({ type: 'varchar', length: 50, nullable: true })
  methodePaiement: string;              // ESPECES, MOBILE_MONEY, CARTE

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencePaiement: string;

  // Annulation
  @Column({ type: 'text', nullable: true })
  motifAnnulation: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  annulePar: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montantRembourse: number;

  // Message optionnel
  @Column({ type: 'varchar', length: 500, nullable: true })
  messageIndication: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
```

---

### Correction 2: Migration de la base de données

**Nouvelle migration** : `RemoveCircuitFromTickets.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCircuitFromTickets1737400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer la contrainte FK circuit_id
    await queryRunner.query(`
      ALTER TABLE tickets_transport
      DROP CONSTRAINT IF EXISTS "FK_tickets_transport_circuit"
    `);

    // 2. Supprimer la colonne circuit_id
    await queryRunner.dropColumn('tickets_transport', 'circuit_id');

    // 3. Supprimer la colonne date_voyage
    await queryRunner.dropColumn('tickets_transport', 'date_voyage');

    // 4. Renommer date_expiration en valid_until
    await queryRunner.renameColumn(
      'tickets_transport',
      'date_expiration',
      'valid_until'
    );

    // 5. Ajouter colonne is_expired
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'is_expired',
      type: 'boolean',
      default: false,
      isNullable: false
    }));

    // 6. Ajouter colonne bus_assignment_id (pour lier au bus lors de l'utilisation)
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'bus_assignment_id',
      type: 'uuid',
      isNullable: true
    }));

    // 7. Mettre à jour les tickets existants
    // Tous les tickets actifs non utilisés → validUntil = 31/12/2025
    await queryRunner.query(`
      UPDATE tickets_transport
      SET valid_until = '2025-12-31'
      WHERE est_utilise = false
      AND status = 'actif'
      AND valid_until IS NULL
    `);

    // 8. Supprimer les index liés au circuit
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_transport_circuit_date"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback (revert changes)
    await queryRunner.renameColumn('tickets_transport', 'valid_until', 'date_expiration');

    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'circuit_id',
      type: 'uuid',
      isNullable: true
    }));

    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'date_voyage',
      type: 'date',
      isNullable: true
    }));

    await queryRunner.dropColumn('tickets_transport', 'is_expired');
    await queryRunner.dropColumn('tickets_transport', 'bus_assignment_id');
  }
}
```

---

### Correction 3: Service backend simplifié

**Fichier** : `apps/api/src/modules/transport/ticket-transport.service.ts`

**Nouvelle interface** :

```typescript
export interface CreateTicketTransportDTO {
  categorie: CategorieTicketTransport; // PAYANT ou GRATUIT
  tarif: number;                       // 200 XOF ou 0
  annee?: number;                      // Défaut: année courante
  methodePaiement?: string;            // Si payant
  referencePaiement?: string;
  messageIndication?: string;
}

export interface CreateTicketsTransportBatchDTO {
  quantite: number;                    // Nombre de tickets
  categorie: CategorieTicketTransport;
  tarif: number;
  annee?: number;
}

// ❌ SUPPRIMER UtiliserTicketTransportDTO.trajetId
export interface UtiliserTicketTransportDTO {
  numeroTicket?: string;
  qrCode?: string;
  busAssignmentId?: string;            // ID du bus (DailyBusAssignment)
  vehiculeImmatriculation?: string;
  conducteur?: string;
}
```

**Méthode createTicket simplifiée** :

```typescript
static async createTicket(
  tenantId: string,
  userId: string,
  data: CreateTicketTransportDTO
) {
  try {
    const ticketRepo = AppDataSource.getRepository(TicketTransport);

    // Validation tarif
    if (data.categorie === CategorieTicketTransport.GRATUIT && data.tarif !== 0) {
      throw new Error('Le tarif d\'un ticket gratuit doit être 0');
    }

    if (data.categorie === CategorieTicketTransport.PAYANT && data.tarif <= 0) {
      throw new Error('Le tarif d\'un ticket payant doit être supérieur à 0');
    }

    const annee = data.annee || new Date().getFullYear();

    // Générer identifiants uniques
    const numeroTicket = await this.generateNumeroTicket(tenantId, annee);
    const qrCode = await this.generateQRCode(tenantId);

    // Créer le ticket
    const newTicket = ticketRepo.create({
      tenantId,
      numeroTicket,
      qrCode,
      categorie: data.categorie,
      tarif: data.tarif,
      annee,
      dateEmission: new Date(),
      validUntil: new Date(`${annee}-12-31`), // ✅ Fin d'année
      status: TicketTransportStatus.ACTIF,
      estUtilise: false,
      isExpired: false,
      methodePaiement: data.methodePaiement,
      referencePaiement: data.referencePaiement,
      messageIndication: data.messageIndication,
      createdBy: userId
    });

    return await ticketRepo.save(newTicket);
  } catch (error) {
    logger.error('[TicketTransportService.createTicket] ERREUR:', error);
    throw error;
  }
}
```

**Méthode getTickets simplifiée** :

```typescript
static async getTickets(tenantId: string, filters?: TicketTransportFilters) {
  try {
    const ticketRepo = AppDataSource.getRepository(TicketTransport);
    const queryBuilder = ticketRepo.createQueryBuilder('ticket')
      .where('ticket.tenantId = :tenantId', { tenantId });

    // ❌ SUPPRIMER leftJoinAndSelect circuit (n'existe plus)

    if (filters?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters?.categorie) {
      queryBuilder.andWhere('ticket.categorie = :categorie', { categorie: filters.categorie });
    }

    if (filters?.annee) {
      queryBuilder.andWhere('ticket.annee = :annee', { annee: filters.annee });
    }

    const tickets = await queryBuilder
      .orderBy('ticket.dateEmission', 'DESC')
      .getMany();

    return {
      tickets,
      total: tickets.length,
      actifs: tickets.filter(t => t.status === TicketTransportStatus.ACTIF).length,
      utilises: tickets.filter(t => t.status === TicketTransportStatus.UTILISE).length,
      expires: tickets.filter(t => t.status === TicketTransportStatus.EXPIRE).length,
      montantTotal: tickets.reduce((sum, t) => sum + Number(t.tarif || 0), 0)
    };
  } catch (error) {
    logger.error('[TicketTransportService.getTickets] ERREUR:', error);
    throw error;
  }
}
```

---

### Correction 4: Frontend - Interface d'émission simplifiée

**Fichier** : `apps/web/src/components/transport/TicketsTransportTab.tsx`

**Modal émission SIMPLIFIÉE** :

```typescript
{/* Modal Émission Individuelle */}
<Modal
  isOpen={isEmissionModalOpen}
  onClose={() => {
    setIsEmissionModalOpen(false);
    resetFormData();
  }}
  title="Émettre des Tickets Transport"
  size="md"
>
  <div className="space-y-4">
    {/* ❌ SUPPRIMER: Sélection circuit */}

    {/* Catégorie */}
    <Select
      label="Catégorie"
      value={formData.categorie || ''}
      onChange={(value) =>
        setFormData({
          ...formData,
          categorie: value as CategorieTicketTransport,
          tarif: value === CategorieTicketTransport.GRATUIT ? 0 : 200
        })
      }
      options={[
        { value: CategorieTicketTransport.PAYANT, label: 'Payant (200 XOF)' },
        { value: CategorieTicketTransport.GRATUIT, label: 'Gratuit (Étudiant boursier)' }
      ]}
      required
    />

    {/* Tarif (si payant) */}
    {formData.categorie === CategorieTicketTransport.PAYANT && (
      <Input
        label="Tarif (XOF)"
        type="number"
        placeholder="200"
        value={formData.tarif || 200}
        onChange={(e) => setFormData({ ...formData, tarif: Number(e.target.value) })}
        required
      />
    )}

    {/* Quantité */}
    <Input
      label="Nombre de tickets"
      type="number"
      placeholder="1"
      min={1}
      max={100}
      value={formData.quantite || 1}
      onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
      required
      helpText="Vous pouvez émettre jusqu'à 100 tickets à la fois"
    />

    {/* ❌ SUPPRIMER: Date de voyage */}
    {/* ❌ SUPPRIMER: Date d'expiration (auto = 31/12/année) */}

    {/* Méthode de paiement (si payant) */}
    {formData.categorie === CategorieTicketTransport.PAYANT && (
      <Select
        label="Méthode de paiement"
        value={formData.methodePaiement || ''}
        onChange={(value) => setFormData({ ...formData, methodePaiement: value })}
        options={[
          { value: 'especes', label: 'Espèces' },
          { value: 'mobile_money', label: 'Mobile Money' },
          { value: 'carte', label: 'Carte bancaire' }
        ]}
      />
    )}

    {/* Récapitulatif */}
    {formData.quantite && formData.tarif !== undefined && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Récapitulatif
        </p>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <p><strong>Quantité:</strong> {formData.quantite} ticket(s)</p>
          <p><strong>Prix unitaire:</strong> {formData.tarif} XOF</p>
          <p><strong>Validité:</strong> Jusqu'au 31 décembre {new Date().getFullYear()}</p>
          <p className="text-lg font-bold mt-2">
            <strong>Total:</strong> {(formData.quantite * formData.tarif).toLocaleString()} XOF
          </p>
        </div>
      </div>
    )}

    <div className="flex justify-end gap-3 pt-4">
      <Button
        variant="outline"
        onClick={() => {
          setIsEmissionModalOpen(false);
          resetFormData();
        }}
      >
        Annuler
      </Button>
      <Button variant="primary" onClick={handleEmission}>
        Émettre {formData.quantite || 1} ticket(s)
      </Button>
    </div>
  </div>
</Modal>
```

**Colonnes du tableau SIMPLIFIÉES** :

```typescript
const columns = [
  {
    key: 'numero',
    label: 'Numéro',
    render: (ticket: TicketTransport) => (
      <div>
        <p className="font-mono font-medium text-sm">{ticket.numeroTicket}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {ticket.categorie === 'gratuit' ? 'Gratuit' : `${ticket.tarif} XOF`}
        </p>
      </div>
    )
  },
  // ❌ SUPPRIMER: Colonne Circuit
  {
    key: 'emission',
    label: 'Émission',
    render: (ticket: TicketTransport) => (
      <div>
        <p className="font-medium">{new Date(ticket.dateEmission).toLocaleDateString()}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Valable jusqu'au {new Date(ticket.validUntil).toLocaleDateString()}
        </p>
      </div>
    )
  },
  {
    key: 'utilisation',
    label: 'Utilisation',
    render: (ticket: TicketTransport) => (
      <div>
        {ticket.dateUtilisation ? (
          <>
            <p className="font-medium">{new Date(ticket.dateUtilisation).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ticket.vehiculeImmatriculation || 'Bus inconnu'}
            </p>
          </>
        ) : (
          <Badge variant="warning">Non utilisé</Badge>
        )}
      </div>
    )
  },
  {
    key: 'statut',
    label: 'Statut',
    render: (ticket: TicketTransport) => getStatutBadge(ticket.status)
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (ticket: TicketTransport) => (
      <div className="flex items-center gap-2">
        {ticket.status === TicketTransportStatus.ACTIF && (
          <>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => {
                setSelectedTicket(ticket);
                setIsUtiliserModalOpen(true);
              }}
            >
              Utiliser
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<XCircleIcon className="h-4 w-4" />}
              className="text-red-600"
              onClick={() => handleAnnuler(ticket.id)}
            >
              Annuler
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
          onClick={() => downloadTicketPDF(ticket.id)}
        >
          PDF
        </Button>
      </div>
    )
  }
];
```

---

## TEMPLATE PDF TICKET

**Nouveau design** :

```
╔════════════════════════════════════════════╗
║         CROU - TICKET TRANSPORT            ║
║         Navettes Étudiantes                ║
╠════════════════════════════════════════════╣
║                                            ║
║  N°: TKT-TRANS-2025-000123                ║
║                                            ║
║  Tarif: 200 XOF                           ║
║  (ou "GRATUIT - Étudiant boursier")       ║
║                                            ║
║  Émis le: 20 Janvier 2025                 ║
║                                            ║
║  Valable jusqu'au:                        ║
║  31 Décembre 2025                         ║
║                                            ║
║         ┌─────────────┐                   ║
║         │             │                   ║
║         │  [QR CODE]  │                   ║
║         │             │                   ║
║         └─────────────┘                   ║
║                                            ║
║  ⚠️ Ce ticket est valable pour           ║
║     UN SEUL trajet sur TOUTES             ║
║     les navettes CROU                     ║
║                                            ║
║  ⚠️ Présentez ce QR code au              ║
║     contrôleur lors de la montée          ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## ORDRE D'IMPLÉMENTATION

### Phase 1: Migration BDD (30 minutes)

1. ✅ Créer migration `RemoveCircuitFromTickets`
2. ✅ Tester en local
3. ✅ Exécuter sur production

### Phase 2: Backend (1 heure)

1. ✅ Mettre à jour entité `TicketTransport.entity.ts`
2. ✅ Simplifier `ticket-transport.service.ts`
3. ✅ Mettre à jour DTOs
4. ✅ Tester endpoints API

### Phase 3: Frontend (1 heure)

1. ✅ Simplifier `TicketsTransportTab.tsx`
2. ✅ Supprimer sélection circuit
3. ✅ Supprimer dates voyage/expiration
4. ✅ Simplifier colonnes tableau
5. ✅ Tester interface

### Phase 4: PDF (30 minutes)

1. ✅ Créer nouveau template PDF
2. ✅ Tester génération

**Total: 3 heures**

---

## QUESTIONS RESTANTES

1. **Tarif fixe** : Le tarif est toujours 200 XOF ou peut varier ?
2. **Blocs prédéfinis** : Voulez-vous des boutons rapides (10, 20, 50 tickets) ?
3. **Impression** : Les tickets sont imprimés immédiatement après émission ?
4. **Contrôle** : Qui fait la validation (chauffeur ou contrôleur dédié) ?

---

**Dois-je commencer l'implémentation maintenant ?** 🚀
