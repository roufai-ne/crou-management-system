# DESIGN FINAL - SYSTÈME TRANSPORT NAVETTES ÉTUDIANTES CROU

**Date**: 20 Janvier 2025
**Système**: Navettes urbaines étudiantes avec tickets annuels prépayés

---

## COMPRÉHENSION DU SYSTÈME RÉEL

### Modèle métier clarifié :

```
┌─────────────────────────────────────────────────────────────┐
│  CIRCUITS (TransportRoute)                                  │
│  - Banlieue Nord ↔ Campus (12 km, 200 XOF)                │
│  - Quartier Sud ↔ Campus (8 km, 150 XOF)                  │
│  - Centre Ville ↔ Campus (5 km, 100 XOF)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NAVETTES (ScheduledTrip)                                   │
│  - Tous les bus disponibles circulent en continu           │
│  - Pas d'horaires fixes stricts                            │
│  - Service actif 7j/7 (sauf périodes de fermeture)        │
│  - Exemple: 5 bus sur "Banlieue Nord" toute la journée    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  TICKETS (TicketTransport)                                  │
│  - Achetés au guichet par un agent CROU                    │
│  - Valables TOUTE L'ANNÉE tant que non utilisés           │
│  - 1 ticket = 1 trajet sur 1 circuit spécifique           │
│  - Pas de date d'expiration (sauf si ticket périmé)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  UTILISATION                                                │
│  - Étudiant monte dans une navette du circuit              │
│  - Contrôleur scanne le QR code                            │
│  - Ticket marqué comme utilisé (date/heure/bus)            │
│  - Ne peut plus être réutilisé                             │
└─────────────────────────────────────────────────────────────┘
```

---

## CHANGEMENTS DE MODÈLE REQUIS

### 1. TicketTransport - Tickets valables toute l'année

**Problème actuel** :
```typescript
@Column({ type: 'date' })
dateVoyage: Date;  // ❌ Ne fait plus sens si valable toute l'année

@Column({ type: 'date' })
dateExpiration: Date;  // ❌ Idem
```

**Nouveau modèle proposé** :

```typescript
@Entity('tickets_transport')
export class TicketTransport {
  // Identifiants
  numeroTicket: string;            // TKT-TRANS-2025-000001
  qrCode: string;                  // QR-TRANS-[HASH]

  // ✅ Circuit fixe (ne peut être utilisé que sur ce circuit)
  @Column({ type: 'uuid', name: 'circuit_id' })
  circuitId: string;

  @ManyToOne(() => TransportRoute)
  @JoinColumn({ name: 'circuit_id' })
  circuit: TransportRoute;

  // Tarification
  categorie: CategorieTicketTransport;  // PAYANT ou GRATUIT
  tarif: number;                        // 200 XOF par exemple
  annee: number;                        // 2025

  // Émission
  dateEmission: Date;                   // Date d'achat au guichet

  // ✅ NOUVEAU: Validité annuelle
  @Column({ type: 'date', nullable: true })
  validUntil: Date;                     // 31 décembre 2025 (fin d'année académique)

  @Column({ type: 'boolean', default: false })
  isExpired: boolean;                   // Marqué expiré en fin d'année

  // Statut
  status: TicketTransportStatus;        // ACTIF, UTILISE, EXPIRE, ANNULE
  estUtilise: boolean;

  // ✅ Utilisation (rempli lors du scan QR)
  @Column({ type: 'timestamp', nullable: true })
  dateUtilisation: Date;                // Quand le ticket a été utilisé

  @Column({ type: 'uuid', nullable: true })
  trajetId: string;                     // Quel ScheduledTrip (pour stats)

  @Column({ type: 'varchar', nullable: true })
  vehiculeImmatriculation: string;      // Quel bus

  @Column({ type: 'varchar', nullable: true })
  conducteur: string;                   // Quel chauffeur

  @Column({ type: 'varchar', nullable: true })
  validePar: string;                    // Agent qui a scanné

  // Paiement
  methodePaiement: string;              // Espèces, Mobile Money
  referencePaiement: string;

  // Annulation
  motifAnnulation: string;
  annulePar: string;

  // Métadonnées
  createdBy: string;                    // Agent qui a émis
  createdAt: Date;
  updatedAt: Date;
}
```

**Migration requise** :

```typescript
// Migration: RenameTicketTransportFields
export class RenameTicketTransportFields implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Renommer dateExpiration en validUntil
    await queryRunner.renameColumn('tickets_transport', 'date_expiration', 'valid_until');

    // 2. Supprimer la colonne dateVoyage (ne fait plus sens)
    await queryRunner.dropColumn('tickets_transport', 'date_voyage');

    // 3. Ajouter colonne isExpired
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'is_expired',
      type: 'boolean',
      default: false
    }));

    // 4. Mettre à jour les tickets existants
    // Tickets non utilisés → validUntil = 31 décembre 2025
    await queryRunner.query(`
      UPDATE tickets_transport
      SET valid_until = '2025-12-31'
      WHERE est_utilise = false AND status = 'actif'
    `);

    // Tickets utilisés → validUntil = date d'utilisation
    await queryRunner.query(`
      UPDATE tickets_transport
      SET valid_until = date_utilisation
      WHERE est_utilise = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('tickets_transport', 'valid_until', 'date_expiration');
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'date_voyage',
      type: 'date',
      isNullable: true
    }));
    await queryRunner.dropColumn('tickets_transport', 'is_expired');
  }
}
```

---

### 2. ScheduledTrip - Service continu sans horaires fixes stricts

**Problème actuel** :
Le modèle suppose des trajets programmés à des heures précises (7h, 8h, 9h...).

**Réalité** :
- 5 bus circulent en continu sur "Banlieue Nord"
- Pas d'horaires fixes, juste "service actif de 6h à 20h"
- Le nombre de bus varie selon disponibilité

**Nouveau modèle proposé** :

**Option A** : Garder ScheduledTrip mais adapter l'usage

```typescript
@Entity('scheduled_trips')
export class ScheduledTrip {
  // Au lieu de créer 50 trajets individuels (7h00, 7h30, 8h00...),
  // Créer 1 trajet "journée complète" par bus

  tripNumber: string;              // "BUS-001-20250120" (Bus 001, date 20/01/2025)

  @ManyToOne(() => TransportRoute)
  route: TransportRoute;           // Circuit affecté

  @ManyToOne(() => Vehicle)
  vehicle: Vehicle;                // Bus affecté pour la journée

  @ManyToOne(() => Driver)
  driver: Driver;                  // Chauffeur affecté pour la journée

  // ✅ Nouveau: Journée de service au lieu d'horaire précis
  @Column({ type: 'date' })
  serviceDate: Date;               // 2025-01-20

  @Column({ type: 'time' })
  serviceStartTime: string;        // "06:00" (début service)

  @Column({ type: 'time' })
  serviceEndTime: string;          // "20:00" (fin service)

  // ✅ Statut simplifié
  status: TripStatus;              // SCHEDULED, ACTIVE, COMPLETED, CANCELLED

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;           // Quand le bus a démarré (scan début service)

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;             // Quand le bus a terminé (scan fin service)

  // ✅ Compteurs de passagers
  @Column({ type: 'int', default: 0 })
  totalPassengers: number;         // Combien de tickets ont été utilisés dans ce bus aujourd'hui

  @Column({ type: 'int', default: 0 })
  totalTripsCompleted: number;     // Nombre d'allers-retours effectués

  // Kilométrage
  startKilometers: number;
  endKilometers: number;
  distanceCovered: number;

  // Coûts
  fuelCost: number;
  tollCost: number;
  revenue: number;                 // Calculé à partir des tickets utilisés

  // Notes
  driverNotes: string;
  hasIncident: boolean;
  incidentDescription: string;
}
```

**Option B** : Nouveau modèle "DailyBusAssignment"

```typescript
@Entity('daily_bus_assignments')
export class DailyBusAssignment {
  id: string;

  // Affectation
  @ManyToOne(() => TransportRoute)
  route: TransportRoute;           // Circuit: Banlieue Nord

  @ManyToOne(() => Vehicle)
  vehicle: Vehicle;                // Bus: BUS-001

  @ManyToOne(() => Driver)
  driver: Driver;                  // Chauffeur: Jean Dupont

  // Date
  @Column({ type: 'date' })
  assignmentDate: Date;            // 2025-01-20

  // Service
  status: 'planned' | 'active' | 'completed' | 'cancelled';

  serviceStartTime: string;        // "06:00"
  serviceEndTime: string;          // "20:00"

  actualStartTime: Date;
  actualEndTime: Date;

  // Statistiques
  totalPassengers: number;         // Tickets scannés dans ce bus
  totalKilometers: number;
  fuelConsumed: number;
  revenue: number;

  // OneToMany avec tickets utilisés
  @OneToMany(() => TicketTransport, ticket => ticket.assignment)
  ticketsUsed: TicketTransport[];
}
```

**Recommandation** : **Option B** (plus simple et adapté au besoin)

---

### 3. TransportRoute - Circuits sans horaires fixes

**Modifications** :

```typescript
@Entity('transport_routes')
export class TransportRoute {
  code: string;                    // "RT-BN" (Route Banlieue Nord)
  name: string;                    // "Banlieue Nord ↔ Campus"
  type: RouteType;                 // CITY (transport urbain)

  // Itinéraire
  startLocation: string;           // "Banlieue Nord - Terminus"
  endLocation: string;             // "Campus Universitaire - Entrée Principale"
  stops: RouteStop[];              // Arrêts intermédiaires (JSON)

  distance: number;                // 12 km (aller simple)
  estimatedDuration: number;       // 25 minutes

  // ✅ Tarification fixe
  ticketPrice: number;             // 200 XOF

  // ✅ Service quotidien (au lieu de jours opérationnels)
  @Column({ type: 'boolean', default: true })
  isOperatingDaily: boolean;       // true = service tous les jours

  @Column({ type: 'time' })
  defaultServiceStart: string;     // "06:00" (ouverture service)

  @Column({ type: 'time' })
  defaultServiceEnd: string;       // "20:00" (fermeture service)

  // ✅ Périodes de fermeture (vacances, etc.)
  @Column({ type: 'json', nullable: true })
  closurePeriods: ClosurePeriod[]; // [{ start: "2025-07-01", end: "2025-08-31", reason: "Vacances d'été" }]

  // ✅ Capacité théorique
  @Column({ type: 'int', nullable: true })
  estimatedDailyCapacity: number;  // 500 passagers/jour (estimé)

  // Statistiques
  totalTripsCompleted: number;
  totalPassengersTransported: number;
  averageDailyPassengers: number;

  // Relations
  @OneToMany(() => DailyBusAssignment, assignment => assignment.route)
  dailyAssignments: DailyBusAssignment[];
}

interface ClosurePeriod {
  startDate: string;               // "2025-07-01"
  endDate: string;                 // "2025-08-31"
  reason: string;                  // "Vacances d'été"
  isRecurring: boolean;            // true si tous les ans
}
```

---

## WORKFLOW COMPLET REDESIGNÉ

### Workflow 1: Planification quotidienne

```typescript
/**
 * Chaque matin, le responsable transport affecte les bus disponibles aux circuits
 */

// Frontend: Nouveau composant "Planning Journalier"
interface DailyPlanningView {
  date: Date;                      // 20/01/2025

  routes: Array<{
    routeId: string;
    routeName: string;
    assignedBuses: Array<{
      vehicleId: string;
      vehiclePlate: string;
      driverId: string;
      driverName: string;
      status: 'planned' | 'active' | 'completed';
    }>;
  }>;
}

// Backend: Service de planification
class DailyPlanningService {
  /**
   * Créer les affectations quotidiennes
   */
  async createDailyAssignments(date: Date, assignments: CreateAssignmentDto[]) {
    // Exemple: assignments = [
    //   { routeId: "route-bn", vehicleId: "bus-001", driverId: "driver-1" },
    //   { routeId: "route-bn", vehicleId: "bus-002", driverId: "driver-2" },
    //   { routeId: "route-sud", vehicleId: "bus-003", driverId: "driver-3" },
    // ]

    for (const assignment of assignments) {
      // Vérifier que le chauffeur n'est pas déjà affecté
      // Vérifier que le bus est disponible (pas en maintenance)
      // Créer DailyBusAssignment
    }
  }

  /**
   * Démarrer le service d'un bus (scan début de journée)
   */
  async startService(assignmentId: string) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId }});
    assignment.status = 'active';
    assignment.actualStartTime = new Date();
    await this.assignmentRepo.save(assignment);
  }

  /**
   * Terminer le service d'un bus (scan fin de journée)
   */
  async endService(assignmentId: string, endData: {
    endKilometers: number;
    fuelConsumed: number;
    notes: string;
  }) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ['ticketsUsed']
    });

    assignment.status = 'completed';
    assignment.actualEndTime = new Date();
    assignment.totalKilometers = endData.endKilometers - assignment.startKilometers;
    assignment.fuelConsumed = endData.fuelConsumed;
    assignment.totalPassengers = assignment.ticketsUsed.length;
    assignment.revenue = assignment.ticketsUsed.reduce((sum, t) => sum + t.tarif, 0);

    await this.assignmentRepo.save(assignment);
  }
}
```

---

### Workflow 2: Émission de tickets (au guichet)

```typescript
/**
 * Agent CROU au guichet émet des tickets
 */

// Frontend: Interface guichet
interface TicketEmissionForm {
  circuitId: string;               // Sélection du circuit
  categorie: 'payant' | 'gratuit';
  quantite: number;                // Combien de tickets émettre
  methodePaiement?: string;        // Si payant
  referencePaiement?: string;
}

// Backend: Service d'émission
class TicketEmissionService {
  async emitTickets(data: TicketEmissionForm, agentId: string) {
    const route = await this.routeRepo.findOne({ where: { id: data.circuitId }});

    // ✅ Pas de vérification de capacité (tickets valables toute l'année)
    // ✅ Pas de date de voyage spécifique

    const tickets: TicketTransport[] = [];

    for (let i = 0; i < data.quantite; i++) {
      const ticket = this.ticketRepo.create({
        numeroTicket: await this.generateNumeroTicket(),
        qrCode: await this.generateQRCode(),
        circuitId: data.circuitId,
        categorie: data.categorie,
        tarif: data.categorie === 'gratuit' ? 0 : route.ticketPrice,
        annee: new Date().getFullYear(),
        dateEmission: new Date(),
        validUntil: new Date(`${new Date().getFullYear()}-12-31`), // ✅ Fin d'année
        status: TicketTransportStatus.ACTIF,
        estUtilise: false,
        methodePaiement: data.methodePaiement,
        referencePaiement: data.referencePaiement,
        createdBy: agentId
      });

      tickets.push(ticket);
    }

    await this.ticketRepo.save(tickets);

    return {
      tickets,
      total: tickets.length,
      montantTotal: tickets.reduce((sum, t) => sum + t.tarif, 0)
    };
  }
}
```

---

### Workflow 3: Utilisation de ticket (scan QR dans le bus)

```typescript
/**
 * Contrôleur/Chauffeur scanne le QR code de l'étudiant
 */

// Frontend: Application mobile contrôleur (ou interface web)
interface TicketScannerView {
  assignmentId: string;            // ID de l'affectation journalière du bus
  scanInput: string;               // QR code scanné

  onScan: (qrCode: string) => void;
}

// Backend: Service de validation
class TicketValidationService {
  async validateAndUseTicket(
    qrCode: string,
    assignmentId: string,
    validatedBy: string
  ) {
    // 1. Trouver le ticket
    const ticket = await this.ticketRepo.findOne({
      where: { qrCode },
      relations: ['circuit']
    });

    if (!ticket) {
      throw new NotFoundException('Ticket introuvable');
    }

    // 2. Vérifications
    if (ticket.estUtilise) {
      throw new BadRequestException(
        `Ticket déjà utilisé le ${ticket.dateUtilisation.toLocaleDateString()} ` +
        `dans le bus ${ticket.vehiculeImmatriculation}`
      );
    }

    if (ticket.status === TicketTransportStatus.ANNULE) {
      throw new BadRequestException('Ticket annulé');
    }

    if (ticket.status === TicketTransportStatus.EXPIRE || ticket.isExpired) {
      throw new BadRequestException('Ticket expiré');
    }

    // 3. Vérifier que le bus correspond au circuit du ticket
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ['route', 'vehicle', 'driver']
    });

    if (assignment.route.id !== ticket.circuitId) {
      throw new BadRequestException(
        `Ce ticket est valable uniquement sur le circuit "${ticket.circuit.name}". ` +
        `Ce bus circule sur "${assignment.route.name}".`
      );
    }

    if (assignment.status !== 'active') {
      throw new BadRequestException('Ce bus n\'est pas en service actuellement');
    }

    // 4. Marquer le ticket comme utilisé
    ticket.estUtilise = true;
    ticket.dateUtilisation = new Date();
    ticket.status = TicketTransportStatus.UTILISE;
    ticket.trajetId = assignmentId;
    ticket.vehiculeImmatriculation = assignment.vehicle.plateNumber;
    ticket.conducteur = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
    ticket.validePar = validatedBy;

    await this.ticketRepo.save(ticket);

    // 5. Incrémenter le compteur du bus
    await this.assignmentRepo.increment(
      { id: assignmentId },
      'totalPassengers',
      1
    );

    return {
      success: true,
      message: 'Ticket validé avec succès',
      ticket: {
        numero: ticket.numeroTicket,
        circuit: ticket.circuit.name,
        tarif: ticket.tarif,
        passager: ticket.categorie === 'gratuit' ? 'Étudiant boursier' : 'Passager standard'
      }
    };
  }
}
```

---

## INTERFACE FRONTEND REPENSÉE

### 1. Onglet "Circuits" - Gestion des itinéraires

```typescript
// Composant: CircuitsManagementTab.tsx
<Card>
  <Card.Header>
    <Card.Title>Circuits de navettes</Card.Title>
    <Button onClick={() => setCreateModalOpen(true)}>
      <PlusIcon /> Nouveau circuit
    </Button>
  </Card.Header>

  <Card.Content>
    <Table
      data={routes}
      columns={[
        {
          key: 'circuit',
          label: 'Circuit',
          render: (route) => (
            <div>
              <p className="font-medium">{route.code} - {route.name}</p>
              <p className="text-sm text-gray-500">
                {route.startLocation} ↔ {route.endLocation}
              </p>
            </div>
          )
        },
        {
          key: 'distance',
          label: 'Distance',
          render: (route) => `${route.distance} km`
        },
        {
          key: 'tarif',
          label: 'Tarif',
          render: (route) => `${route.ticketPrice} XOF`
        },
        {
          key: 'service',
          label: 'Service',
          render: (route) => (
            <div>
              <p>{route.defaultServiceStart} - {route.defaultServiceEnd}</p>
              <Badge variant={route.isOperatingDaily ? 'success' : 'warning'}>
                {route.isOperatingDaily ? 'Quotidien' : 'Horaires limités'}
              </Badge>
            </div>
          )
        },
        {
          key: 'stats',
          label: 'Passagers',
          render: (route) => (
            <div>
              <p className="font-medium">{route.totalPassengersTransported.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                Moy: {route.averageDailyPassengers}/jour
              </p>
            </div>
          )
        }
      ]}
    />
  </Card.Content>
</Card>

{/* Modal: Périodes de fermeture */}
<Modal title="Périodes de fermeture - Banlieue Nord">
  <div className="space-y-4">
    {route.closurePeriods?.map(period => (
      <div key={period.id} className="border p-3 rounded">
        <p className="font-medium">{period.reason}</p>
        <p className="text-sm text-gray-500">
          Du {new Date(period.startDate).toLocaleDateString()}
          au {new Date(period.endDate).toLocaleDateString()}
        </p>
        {period.isRecurring && (
          <Badge variant="info">Récurrent chaque année</Badge>
        )}
      </div>
    ))}

    <Button onClick={() => setAddClosurePeriodOpen(true)}>
      Ajouter période de fermeture
    </Button>
  </div>
</Modal>
```

---

### 2. Onglet "Planning Journalier" - Affectation des bus

```typescript
// Composant: DailyPlanningTab.tsx
<div className="space-y-6">
  {/* Sélection de date */}
  <Card>
    <Card.Content className="flex items-center gap-4">
      <DateInput
        label="Date"
        value={selectedDate}
        onChange={setSelectedDate}
      />

      <Button
        variant="outline"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
      >
        ← Jour précédent
      </Button>

      <Button
        variant="outline"
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
      >
        Jour suivant →
      </Button>

      <Button
        variant="primary"
        onClick={() => setQuickAssignModalOpen(true)}
      >
        Affectation rapide
      </Button>
    </Card.Content>
  </Card>

  {/* Tableau des circuits */}
  {routes.map(route => (
    <Card key={route.id}>
      <Card.Header>
        <div className="flex justify-between items-center">
          <div>
            <Card.Title>{route.name}</Card.Title>
            <p className="text-sm text-gray-500">
              Service: {route.defaultServiceStart} - {route.defaultServiceEnd}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => openAssignBusModal(route.id)}
          >
            <PlusIcon className="h-4 w-4" /> Ajouter un bus
          </Button>
        </div>
      </Card.Header>

      <Card.Content>
        {/* Liste des bus affectés à ce circuit aujourd'hui */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {route.todayAssignments?.map(assignment => (
            <div
              key={assignment.id}
              className="border rounded-lg p-4 space-y-2"
            >
              {/* Véhicule */}
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{assignment.vehicle.plateNumber}</p>
                  <p className="text-sm text-gray-500">
                    {assignment.vehicle.make} {assignment.vehicle.model}
                  </p>
                </div>
              </div>

              {/* Chauffeur */}
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{assignment.driver.fullName}</p>
                  <p className="text-sm text-gray-500">{assignment.driver.phone}</p>
                </div>
              </div>

              {/* Statut */}
              <div>
                {assignment.status === 'planned' && (
                  <Badge variant="secondary">Planifié</Badge>
                )}
                {assignment.status === 'active' && (
                  <Badge variant="success">En service</Badge>
                )}
                {assignment.status === 'completed' && (
                  <Badge variant="info">Terminé</Badge>
                )}
              </div>

              {/* Statistiques (si service actif ou terminé) */}
              {(assignment.status === 'active' || assignment.status === 'completed') && (
                <div className="text-sm">
                  <p>Passagers: <strong>{assignment.totalPassagers}</strong></p>
                  <p>Recette: <strong>{assignment.revenue.toLocaleString()} XOF</strong></p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {assignment.status === 'planned' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => startService(assignment.id)}
                  >
                    Démarrer service
                  </Button>
                )}

                {assignment.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEndServiceModal(assignment.id)}
                  >
                    Terminer service
                  </Button>
                )}

                {assignment.status === 'planned' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeAssignment(assignment.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Placeholder si aucun bus */}
          {(!route.todayAssignments || route.todayAssignments.length === 0) && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Aucun bus affecté à ce circuit aujourd'hui
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  ))}
</div>
```

---

### 3. Onglet "Tickets" - Émission et gestion

```typescript
// Composant: TicketsManagementTab.tsx (SIMPLIFIÉ)

{/* Modal émission SIMPLIFIÉE */}
<Modal title="Émettre des tickets" isOpen={isEmitModalOpen}>
  <div className="space-y-4">
    {/* ✅ Sélection circuit avec infos claires */}
    <Select
      label="Circuit"
      value={formData.circuitId}
      onChange={(value) => {
        const route = routes.find(r => r.id === value);
        setFormData({
          ...formData,
          circuitId: value,
          tarif: route?.ticketPrice || 0
        });
      }}
      options={routes.map(route => ({
        value: route.id,
        label: `${route.code} - ${route.name} (${route.distance} km, ${route.ticketPrice} XOF)`
      }))}
      required
    />

    {/* ✅ Catégorie */}
    <Select
      label="Catégorie"
      value={formData.categorie}
      onChange={(value) => setFormData({
        ...formData,
        categorie: value,
        tarif: value === 'gratuit' ? 0 : formData.tarif
      })}
      options={[
        { value: 'payant', label: 'Payant' },
        { value: 'gratuit', label: 'Gratuit (Boursier)' }
      ]}
      required
    />

    {/* ✅ Quantité */}
    <Input
      label="Nombre de tickets à émettre"
      type="number"
      min={1}
      max={100}
      value={formData.quantite}
      onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
      required
    />

    {/* ⛔ SUPPRIMÉ: Plus de sélection de date (valable toute l'année) */}

    {/* ✅ Paiement (si payant) */}
    {formData.categorie === 'payant' && (
      <>
        <Select
          label="Méthode de paiement"
          options={[
            { value: 'especes', label: 'Espèces' },
            { value: 'mobile_money', label: 'Mobile Money' },
            { value: 'carte', label: 'Carte bancaire' }
          ]}
        />

        {/* Montant total */}
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Montant total</p>
          <p className="text-2xl font-bold text-blue-600">
            {(formData.quantite * formData.tarif).toLocaleString()} XOF
          </p>
        </div>
      </>
    )}

    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={() => setIsEmitModalOpen(false)}>
        Annuler
      </Button>
      <Button variant="primary" onClick={handleEmit}>
        Émettre {formData.quantite} ticket(s)
      </Button>
    </div>
  </div>
</Modal>

{/* Tableau tickets AMÉLIORÉ */}
<Table
  data={tickets}
  columns={[
    {
      key: 'numero',
      label: 'Numéro',
      render: (ticket) => (
        <div>
          <p className="font-mono font-medium">{ticket.numeroTicket}</p>
          <p className="text-sm text-gray-500">
            {ticket.categorie === 'gratuit' ? 'Gratuit' : `${ticket.tarif} XOF`}
          </p>
        </div>
      )
    },
    {
      key: 'circuit',
      label: 'Circuit',
      render: (ticket) => (
        <div>
          {/* ✅ Afficher le nom du circuit (correction appliquée) */}
          <p className="font-medium">{ticket.circuit?.name || 'Chargement...'}</p>
          <p className="text-sm text-gray-500">
            {ticket.circuit?.code} - {ticket.circuit?.distance} km
          </p>
        </div>
      )
    },
    {
      key: 'emission',
      label: 'Émission',
      render: (ticket) => (
        <div>
          <p>{new Date(ticket.dateEmission).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">
            Valable jusqu'au {new Date(ticket.validUntil).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'utilisation',
      label: 'Utilisation',
      render: (ticket) => (
        <div>
          {ticket.estUtilise ? (
            <>
              <p className="font-medium text-green-600">
                {new Date(ticket.dateUtilisation).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {ticket.vehiculeImmatriculation}
              </p>
            </>
          ) : (
            <Badge variant="warning">Non utilisé</Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ticket) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadTicketPDF(ticket.id)}
          >
            <DocumentIcon className="h-4 w-4" /> PDF
          </Button>

          {!ticket.estUtilise && ticket.status === 'actif' && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => handleAnnuler(ticket.id)}
            >
              <XIcon className="h-4 w-4" /> Annuler
            </Button>
          )}
        </div>
      )
    }
  ]}
/>
```

---

### 4. Onglet "Scanner" - Validation tickets (contrôleur)

```typescript
// Composant: TicketScannerTab.tsx
<div className="space-y-6">
  {/* Sélection du bus actuel */}
  <Card>
    <Card.Header>
      <Card.Title>Contrôle des tickets</Card.Title>
    </Card.Header>
    <Card.Content>
      <Select
        label="Bus en service"
        value={selectedAssignment}
        onChange={setSelectedAssignment}
        options={activeAssignments.map(a => ({
          value: a.id,
          label: `${a.vehicle.plateNumber} - ${a.route.name} (${a.totalPassengers} passagers)`
        }))}
        required
      />
    </Card.Content>
  </Card>

  {/* Scanner QR */}
  <Card>
    <Card.Content className="text-center py-12">
      <QrCodeIcon className="h-24 w-24 mx-auto text-gray-400 mb-4" />

      <Input
        placeholder="Scanner le QR code du ticket"
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleScan();
          }
        }}
        autoFocus
        className="text-center text-lg font-mono"
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleScan}
        className="mt-4"
      >
        Valider le ticket
      </Button>
    </Card.Content>
  </Card>

  {/* Résultat du scan */}
  {scanResult && (
    <Card>
      <Card.Content>
        {scanResult.success ? (
          <div className="text-center py-6">
            <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Ticket valide ✓
            </h3>
            <div className="text-left max-w-md mx-auto space-y-2">
              <p><strong>Numéro:</strong> {scanResult.ticket.numero}</p>
              <p><strong>Circuit:</strong> {scanResult.ticket.circuit}</p>
              <p><strong>Tarif:</strong> {scanResult.ticket.tarif} XOF</p>
              <p><strong>Passager:</strong> {scanResult.ticket.passager}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <XCircleIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Ticket invalide ✗
            </h3>
            <p className="text-gray-600">{scanResult.message}</p>
          </div>
        )}
      </Card.Content>
    </Card>
  )}

  {/* Statistiques temps réel */}
  <Card>
    <Card.Header>
      <Card.Title>Statistiques du trajet</Card.Title>
    </Card.Header>
    <Card.Content>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">
            {currentAssignmentStats.totalPassengers}
          </p>
          <p className="text-sm text-gray-500">Passagers</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {currentAssignmentStats.revenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Recettes (XOF)</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">
            {currentAssignmentStats.duration}
          </p>
          <p className="text-sm text-gray-500">Durée</p>
        </div>
      </div>
    </Card.Content>
  </Card>
</div>
```

---

## STATISTIQUES ET RAPPORTS

### Nouveau service: TransportStatisticsService

```typescript
class TransportStatisticsService {
  /**
   * Statistiques par circuit
   */
  async getRouteStatistics(routeId: string, startDate: Date, endDate: Date) {
    const assignments = await this.assignmentRepo.find({
      where: {
        routeId,
        assignmentDate: Between(startDate, endDate)
      },
      relations: ['ticketsUsed']
    });

    return {
      routeId,
      period: { startDate, endDate },
      totalDays: assignments.map(a => a.assignmentDate).filter((v, i, arr) => arr.indexOf(v) === i).length,
      totalBusesUsed: assignments.length,
      averageBusesPerDay: assignments.length / totalDays,
      totalPassengers: assignments.reduce((sum, a) => sum + a.totalPassengers, 0),
      averagePassengersPerDay: totalPassengers / totalDays,
      totalRevenue: assignments.reduce((sum, a) => sum + a.revenue, 0),
      totalDistance: assignments.reduce((sum, a) => sum + a.totalKilometers, 0),
      totalFuelCost: assignments.reduce((sum, a) => sum + a.fuelConsumed * fuelPricePerLiter, 0),
      profit: totalRevenue - totalFuelCost
    };
  }

  /**
   * Statistiques globales
   */
  async getGlobalStatistics(tenantId: string, period: 'week' | 'month' | 'year') {
    // Agrégations par jour, circuit, véhicule, chauffeur
    // Tendances, pics de fréquentation
    // Rentabilité par circuit
  }

  /**
   * Rapport tickets
   */
  async getTicketReport(filters: {
    routeId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: TicketTransportStatus;
  }) {
    return {
      totalEmis: ...,
      totalUtilises: ...,
      totalExpires: ...,
      tauxUtilisation: ...,
      recettes: ...,
      ticketsParJour: [...],
      ticketsParCircuit: [...]
    };
  }
}
```

---

## TÂCHES DE MAINTENANCE AUTOMATIQUES

### CRON Job: Expirer les tickets en fin d'année

```typescript
// Backend: transport-cron.service.ts
@Injectable()
export class TransportCronService {
  constructor(
    @InjectRepository(TicketTransport)
    private ticketRepo: Repository<TicketTransport>
  ) {}

  /**
   * Tous les jours à minuit: Vérifier tickets expirés
   */
  @Cron('0 0 * * *')
  async expireOldTickets() {
    const today = new Date();

    // Marquer comme expirés les tickets non utilisés dont validUntil est dépassé
    const expiredCount = await this.ticketRepo
      .createQueryBuilder()
      .update(TicketTransport)
      .set({
        status: TicketTransportStatus.EXPIRE,
        isExpired: true
      })
      .where('est_utilise = false')
      .andWhere('status = :status', { status: TicketTransportStatus.ACTIF })
      .andWhere('valid_until < :today', { today })
      .execute();

    console.log(`[CRON] ${expiredCount.affected} tickets expirés`);
  }

  /**
   * Tous les jours à 22h: Clôturer les affectations non terminées
   */
  @Cron('0 22 * * *')
  async autoCloseAssignments() {
    const today = format(new Date(), 'yyyy-MM-dd');

    const unclosedAssignments = await this.assignmentRepo.find({
      where: {
        assignmentDate: today,
        status: In(['planned', 'active'])
      }
    });

    for (const assignment of unclosedAssignments) {
      assignment.status = 'completed';
      assignment.actualEndTime = new Date();
      // Calculer stats...
    }

    await this.assignmentRepo.save(unclosedAssignments);
  }
}
```

---

## PLAN D'IMPLÉMENTATION

### Phase 1: Corrections données existantes (1 jour)

1. ✅ Migration pour renommer `dateVoyage` → supprimé
2. ✅ Migration pour renommer `dateExpiration` → `validUntil`
3. ✅ Ajouter colonne `isExpired`
4. ✅ Mettre à jour tickets existants: `validUntil = 31/12/2025`
5. ✅ Backend: Charger relation `circuit` dans getTickets()
6. ✅ Frontend: Afficher `ticket.circuit.name` au lieu de UUID

### Phase 2: Nouveau modèle DailyBusAssignment (2 jours)

1. ✅ Créer entité `DailyBusAssignment`
2. ✅ Créer migration
3. ✅ Créer service `DailyPlanningService`
4. ✅ Créer endpoints API
5. ✅ Mettre à jour `TransportRoute` (ajouter `closurePeriods`, `defaultServiceStart/End`)

### Phase 3: Interfaces frontend (3 jours)

1. ✅ Refactoriser `TicketsTransportTab` (supprimer sélection dateVoyage)
2. ✅ Créer `CircuitsManagementTab` (avec périodes fermeture)
3. ✅ Créer `DailyPlanningTab` (affectation bus quotidienne)
4. ✅ Créer `TicketScannerTab` (validation contrôleur)

### Phase 4: Services et validation (2 jours)

1. ✅ `TicketValidationService.validateAndUseTicket()`
2. ✅ `DailyPlanningService.startService()` / `endService()`
3. ✅ Validation circuit lors du scan
4. ✅ CRON jobs (expiration automatique)

### Phase 5: Statistiques (2 jours)

1. ✅ `TransportStatisticsService.getRouteStatistics()`
2. ✅ `TransportStatisticsService.getGlobalStatistics()`
3. ✅ Composant `StatisticsTab` avec graphiques

### Phase 6: PDF et exports (1 jour)

1. ✅ Améliorer template PDF ticket (afficher circuit complet)
2. ✅ Export rapports statistiques

**Total: 11 jours ouvrables**

---

## QUESTIONS FINALES AVANT IMPLÉMENTATION

### 1. Validation du modèle

✅ **Confirmer** : Les tickets sont bien valables toute l'année (jusqu'au 31/12) tant que non utilisés ?

✅ **Confirmer** : 1 ticket = 1 trajet (ne peut pas être réutilisé) ?

✅ **Confirmer** : Pas de réservation, c'est premier arrivé premier servi ?

### 2. Gestion des bus

🤔 **Question** : Comment affectez-vous les bus aux circuits actuellement ?
   - Manuellement chaque matin ?
   - Affectation fixe (Bus 001 toujours sur Banlieue Nord) ?
   - Rotation flexible ?

🤔 **Question** : Nombre moyen de bus par circuit par jour ?
   - Exemple: 3 bus sur "Banlieue Nord", 2 sur "Quartier Sud" ?

### 3. Contrôle et validation

🤔 **Question** : Qui scanne les QR codes ?
   - Chauffeurs ?
   - Contrôleurs dédiés ?
   - Les deux ?

🤔 **Question** : Moment du scan ?
   - À la montée dans le bus ?
   - À la descente ?
   - Les deux ?

### 4. Tarification et gratuité

✅ **Confirmer** : Tickets gratuits pour boursiers uniquement ?

🤔 **Question** : Le tarif varie-t-il selon le circuit (distance) ?
   - Exemple: Banlieue Nord 200 XOF, Quartier Sud 150 XOF ?
   - Ou tarif unique tous circuits ?

### 5. Périodes de fermeture

🤔 **Question** : Périodes de vacances récurrentes ?
   - Exemple: Juillet-Août chaque année ?
   - Vacances de Noël ?

🤔 **Question** : Comment avertir les étudiants des fermetures ?
   - Affichage physique ?
   - SMS/notification ?

---

## DÉCISIONS À PRENDRE MAINTENANT

Pour que je puisse commencer l'implémentation, j'ai besoin de vos décisions sur :

### Décision 1: Modèle de données ✅ CRITIQUE

**Choix A** : DailyBusAssignment (recommandé)
- Bus affectés quotidiennement de manière flexible
- Statistiques par affectation journalière
- Plus simple à gérer

**Choix B** : Garder ScheduledTrip
- Plus granulaire (un trajet = un aller-retour)
- Plus complexe à gérer

**Votre choix** : A ou B ?

### Décision 2: Workflow quotidien ✅ IMPORTANTE

**Scénario du matin** :
1. Responsable transport ouvre l'interface "Planning Journalier"
2. Sélectionne la date (aujourd'hui)
3. Pour chaque circuit, affecte les bus disponibles
4. Clique "Sauvegarder planning"

**OU**

**Affectation fixe** :
- Bus 001, 002, 003 toujours sur Banlieue Nord
- Bus 004, 005 toujours sur Quartier Sud
- Juste activer/désactiver selon disponibilité

**Votre préférence** : Flexible ou Fixe ?

### Décision 3: Interface prioritaire ✅ URGENTE

Quel onglet développer en priorité ?

1. **Circuits** (créer/modifier itinéraires, périodes fermeture)
2. **Planning Journalier** (affecter bus quotidiennement)
3. **Tickets** (corriger affichage circuit, simplifier émission)
4. **Scanner** (valider tickets dans le bus)
5. **Statistiques** (rapports et analyses)

**Votre ordre de priorité** : 3 > 2 > 1 > 4 > 5 ?

---

**Je suis prêt à commencer dès que vous validez ces choix !** 🚀
