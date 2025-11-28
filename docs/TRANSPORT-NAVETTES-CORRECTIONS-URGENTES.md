# CORRECTIONS URGENTES - MODULE TRANSPORT NAVETTES ÉTUDIANTES

**Date**: 20 Janvier 2025
**Contexte**: Système de navettes étudiantes avec tickets à l'unité par circuit

---

## PROBLÈME 1: Circuit non affiché sur les tickets ⚠️ CRITIQUE

### État actuel (CASSÉ)

**Fichier**: [apps/web/src/components/transport/TicketsTransportTab.tsx:286](apps/web/src/components/transport/TicketsTransportTab.tsx#L286)

```typescript
{
  key: 'circuit',
  label: 'Circuit',
  render: (ticket: TicketTransport) => (
    <div>
      <p className="font-medium">{ticket.circuitNom || ticket.circuitId}</p>
      {/* ❌ Affiche: "a3f2b9c8-1234-5678-90ab-cdef12345678" */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {new Date(ticket.dateVoyage).toLocaleDateString()}
      </p>
    </div>
  )
}
```

**Pourquoi ça ne marche pas** :
- Le champ `ticket.circuitNom` n'existe PAS dans la réponse API
- Le backend retourne seulement `circuitId` (UUID)
- La relation `circuit` n'est pas chargée

---

### CORRECTION (Backend + Frontend)

#### Étape 1: Backend - Charger la relation circuit

**Fichier**: `apps/api/src/modules/transport/ticket-transport.service.ts`

Trouver la méthode `getTickets()` et ajouter `relations: ['circuit']` :

```typescript
async getTickets(
  tenantId: string,
  filters?: TicketTransportFilters
): Promise<{ data: TicketTransport[]; total: number }> {
  const where: any = { tenantId };

  if (filters?.status) where.status = filters.status;
  if (filters?.categorie) where.categorie = filters.categorie;
  if (filters?.circuitId) where.circuitId = filters.circuitId;

  const [data, total] = await this.ticketRepo.findAndCount({
    where,
    relations: ['circuit'], // ✅ AJOUTER CETTE LIGNE
    order: { createdAt: 'DESC' },
    take: filters?.limit || 50,
    skip: filters?.page ? (filters.page - 1) * (filters?.limit || 50) : 0
  });

  return { data, total };
}
```

**Faire pareil pour** :
- `getTicketById(id)` - ajouter `relations: ['circuit']`
- `getTicketByNumero(numero)` - ajouter `relations: ['circuit']`
- `getTicketByQRCode(qrCode)` - ajouter `relations: ['circuit']`

---

#### Étape 2: Frontend - Afficher le nom du circuit

**Fichier**: [apps/web/src/components/transport/TicketsTransportTab.tsx:282](apps/web/src/components/transport/TicketsTransportTab.tsx#L282)

```typescript
{
  key: 'circuit',
  label: 'Circuit',
  render: (ticket: TicketTransport) => (
    <div>
      {/* ✅ Afficher le nom du circuit */}
      <p className="font-medium">
        {ticket.circuit?.name || 'Circuit inconnu'}
      </p>

      {/* ✅ Afficher le code et la distance */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {ticket.circuit?.code} - {ticket.circuit?.distance} km
      </p>

      {/* ✅ Date du voyage */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Voyage: {new Date(ticket.dateVoyage).toLocaleDateString()}
      </p>
    </div>
  )
}
```

---

#### Étape 3: Améliorer le sélecteur de circuit lors de l'émission

**Fichier**: [apps/web/src/components/transport/TicketsTransportTab.tsx:550](apps/web/src/components/transport/TicketsTransportTab.tsx#L550)

```typescript
<Select
  label="Circuit de transport"
  value={formData.circuitId || ''}
  onChange={(value) => {
    const selectedRoute = routes.find(r => r.id === value);
    setFormData({
      ...formData,
      circuitId: String(value),
      // ✅ Auto-remplir le tarif suggéré
      tarif: selectedRoute?.ticketPrice || formData.tarif
    });
  }}
  options={[
    { value: '', label: 'Sélectionner un circuit' },
    ...routes.map((route) => ({
      value: route.id,
      // ✅ Afficher plus d'informations
      label: `${route.code} - ${route.name} (${route.distance} km, ${route.ticketPrice} XOF)`
    }))
  ]}
  required
/>
```

---

## PROBLÈME 2: Pas de validation de capacité des navettes

### État actuel (DANGEREUX)

**Fichier**: [apps/web/src/components/transport/TicketsTransportTab.tsx:115](apps/web/src/components/transport/TicketsTransportTab.tsx#L115)

```typescript
const handleBatchEmission = async () => {
  if (batchFormData.quantite > 1000) {
    toast.error('Quantité max: 1000');
    return;
  }

  // ❌ AUCUNE vérification de capacité !
  // On peut émettre 1000 tickets pour un circuit qui n'a que 200 places/jour
  await createTicketsBatch(batchFormData);
};
```

---

### CORRECTION (Backend)

**Fichier**: `apps/api/src/modules/transport/ticket-transport.service.ts`

Ajouter validation dans `createTicketsBatch()` :

```typescript
async createTicketsBatch(
  tenantId: string,
  data: CreateTicketsTransportBatchRequest,
  userId: string
): Promise<BatchCreateResult> {

  // ✅ 1. Vérifier que le circuit existe
  const route = await this.routeRepo.findOne({
    where: { id: data.circuitId, tenantId }
  });

  if (!route) {
    throw new BadRequestException('Circuit introuvable');
  }

  // ✅ 2. Calculer la capacité totale disponible pour cette date
  const scheduledTrips = await this.scheduledTripRepo.find({
    where: {
      routeId: data.circuitId,
      scheduledDate: data.dateVoyage,
      status: Not(TripStatus.CANCELLED)
    },
    relations: ['vehicle']
  });

  if (scheduledTrips.length === 0) {
    throw new BadRequestException(
      `Aucune navette programmée le ${new Date(data.dateVoyage).toLocaleDateString()} sur ce circuit. ` +
      `Veuillez d'abord créer les trajets programmés.`
    );
  }

  // ✅ 3. Calculer places totales et déjà vendues
  const totalCapacity = scheduledTrips.reduce(
    (sum, trip) => sum + (trip.vehicle?.capacity || 0),
    0
  );

  const soldTickets = await this.ticketRepo.count({
    where: {
      circuitId: data.circuitId,
      dateVoyage: data.dateVoyage,
      status: In([TicketTransportStatus.ACTIF, TicketTransportStatus.UTILISE])
    }
  });

  const availableSeats = totalCapacity - soldTickets;

  // ✅ 4. Vérifier si assez de places
  if (data.quantite > availableSeats) {
    throw new BadRequestException(
      `Capacité insuffisante. ` +
      `Demandé: ${data.quantite} tickets | ` +
      `Disponible: ${availableSeats}/${totalCapacity} places ` +
      `(${soldTickets} tickets déjà vendus)`
    );
  }

  // ✅ 5. Créer les tickets (code existant)
  const tickets: TicketTransport[] = [];

  for (let i = 0; i < data.quantite; i++) {
    const ticket = this.ticketRepo.create({
      tenantId,
      circuitId: data.circuitId,
      categorie: data.categorie,
      tarif: data.categorie === CategorieTicketTransport.GRATUIT ? 0 : data.tarif,
      annee: data.annee || new Date().getFullYear(),
      dateVoyage: new Date(data.dateVoyage),
      dateExpiration: new Date(data.dateExpiration),
      dateEmission: new Date(),
      numeroTicket: await this.generateNumeroTicket(tenantId),
      qrCode: await this.generateQRCode(tenantId),
      status: TicketTransportStatus.ACTIF,
      estUtilise: false,
      createdBy: userId
    });

    tickets.push(ticket);
  }

  await this.ticketRepo.save(tickets);

  return {
    tickets,
    total: tickets.length,
    montantTotal: tickets.reduce((sum, t) => sum + t.tarif, 0),
    payants: tickets.filter(t => t.categorie === CategorieTicketTransport.PAYANT).length,
    gratuits: tickets.filter(t => t.categorie === CategorieTicketTransport.GRATUIT).length
  };
}
```

---

## PROBLÈME 3: Pas de lien entre tickets et trajets programmés

### Contexte

Actuellement :
- Les **circuits** (TransportRoute) définissent les itinéraires
- Les **trajets programmés** (ScheduledTrip) définissent les départs réels (ex: Départ 7h, 8h, 9h)
- Les **tickets** sont émis mais **pas liés** à un trajet précis

**Conséquence** : On ne sait pas combien de passagers monteront à 7h vs 8h vs 9h

---

### DÉCISION MÉTIER REQUISE

**Option A** : Tickets **anonymes par circuit/jour** (actuel)
```
Ticket valable toute la journée du 21/01/2025 sur Circuit Banlieue Nord
L'étudiant peut monter à n'importe quel départ (7h, 8h, 9h...)
```

**Option B** : Tickets **par trajet précis**
```
Ticket pour départ 8h00 du 21/01/2025 - Circuit Banlieue Nord
L'étudiant doit monter dans la navette de 8h spécifiquement
```

#### Si vous choisissez Option A (recommandé pour navettes urbaines) :

**Modification mineure** :
```typescript
// Lors de l'utilisation du ticket (scan QR)
async utiliserTicket(ticketId: string, data: UtiliserTicketTransportRequest) {
  const ticket = await this.ticketRepo.findOne({
    where: { id: ticketId },
    relations: ['circuit']
  });

  // Validations...

  // ✅ Enregistrer quel trajet a été utilisé (pour stats)
  ticket.trajetId = data.trajetId; // ID du ScheduledTrip où il est monté
  ticket.vehiculeImmatriculation = data.vehiculeImmatriculation;
  ticket.conducteur = data.conducteur;
  ticket.dateUtilisation = new Date();
  ticket.estUtilise = true;
  ticket.status = TicketTransportStatus.UTILISE;

  await this.ticketRepo.save(ticket);

  // ✅ Incrémenter le compteur du trajet
  if (data.trajetId) {
    await this.scheduledTripRepo.increment(
      { id: data.trajetId },
      'passengersCount',
      1
    );
  }

  return ticket;
}
```

#### Si vous choisissez Option B :

**Modification majeure** - Sélection de l'heure lors de l'achat :
```typescript
// Frontend: Ajouter sélecteur d'heure après sélection du circuit
<Select
  label="Heure de départ souhaitée"
  value={formData.scheduledTripId || ''}
  onChange={(value) => setFormData({ ...formData, scheduledTripId: value })}
  options={availableTrips.map(trip => ({
    value: trip.id,
    label: `${trip.scheduledDepartureTime} - ${trip.seatsAvailable} places restantes`
  }))}
  required
/>

// Backend: Lier ticket au trajet
const ticket = this.ticketRepo.create({
  ...data,
  trajetId: data.scheduledTripId, // ✅ Lien direct
});

// Décrémenter places disponibles immédiatement
await this.scheduledTripRepo.decrement(
  { id: data.scheduledTripId },
  'seatsAvailable',
  1
);
```

---

## PROBLÈME 4: Pas d'interface pour gérer les circuits et horaires

### Besoin identifié

Pour émettre des tickets, il faut d'abord :
1. ✅ Créer un circuit (TransportRoute) - **Interface existe mais basique**
2. ❌ Programmer les départs (ScheduledTrip) - **PAS d'interface dédiée**

---

### CORRECTION : Interface de planification hebdomadaire

**Nouveau composant** : `apps/web/src/components/transport/CircuitPlanningTab.tsx`

```typescript
/**
 * Interface pour planifier les navettes d'une semaine
 */
export const CircuitPlanningTab: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));

  return (
    <div className="space-y-6">
      {/* Sélection circuit */}
      <Card>
        <Card.Header>
          <Card.Title>Planification Navettes Étudiantes</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Circuit"
              value={selectedRoute}
              onChange={setSelectedRoute}
              options={routes.map(r => ({
                value: r.id,
                label: `${r.code} - ${r.name}`
              }))}
            />

            <DateInput
              label="Semaine du"
              value={weekStart}
              onChange={setWeekStart}
            />
          </div>

          {/* ✅ Génération automatique */}
          <Button
            onClick={() => generateWeekSchedule(selectedRoute, weekStart)}
            className="mt-4"
          >
            Générer planning automatique
          </Button>
        </Card.Content>
      </Card>

      {/* Calendrier des départs */}
      <Card>
        <Card.Header>
          <Card.Title>Départs programmés</Card.Title>
        </Card.Header>
        <Card.Content>
          <table className="w-full">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Lun</th>
                <th>Mar</th>
                <th>Mer</th>
                <th>Jeu</th>
                <th>Ven</th>
                <th>Sam</th>
                <th>Dim</th>
              </tr>
            </thead>
            <tbody>
              {/* Afficher les créneaux horaires */}
              {timeSlots.map(time => (
                <tr key={time}>
                  <td>{time}</td>
                  {weekDays.map(day => (
                    <td key={day}>
                      {/* Badge avec statut du trajet */}
                      <TripSlot
                        date={day}
                        time={time}
                        routeId={selectedRoute}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Content>
      </Card>
    </div>
  );
};
```

---

## PROBLÈME 5: Statistiques manquantes

### Nouveau endpoint backend

**Fichier** : `apps/api/src/modules/transport/ticket-transport.controller.ts`

```typescript
@Get('statistics/by-circuit')
async getStatisticsByCircuit(
  @CurrentTenant() tenantId: string,
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string
) {
  return this.ticketService.getStatisticsByCircuit(tenantId, startDate, endDate);
}
```

**Service** :
```typescript
async getStatisticsByCircuit(
  tenantId: string,
  startDate: string,
  endDate: string
) {
  const stats = await this.ticketRepo
    .createQueryBuilder('ticket')
    .leftJoin('ticket.circuit', 'circuit')
    .select('circuit.id', 'circuitId')
    .addSelect('circuit.name', 'circuitNom')
    .addSelect('circuit.code', 'circuitCode')
    .addSelect('COUNT(*)', 'totalTickets')
    .addSelect('SUM(CASE WHEN ticket.estUtilise = true THEN 1 ELSE 0 END)', 'ticketsUtilises')
    .addSelect('SUM(ticket.tarif)', 'recetteTotale')
    .where('ticket.tenantId = :tenantId', { tenantId })
    .andWhere('ticket.dateVoyage BETWEEN :startDate AND :endDate', {
      startDate,
      endDate
    })
    .groupBy('circuit.id, circuit.name, circuit.code')
    .getRawMany();

  return stats.map(s => ({
    circuitId: s.circuitId,
    circuitNom: s.circuitNom,
    circuitCode: s.circuitCode,
    totalTickets: parseInt(s.totalTickets),
    ticketsUtilises: parseInt(s.ticketsUtilises),
    tauxUtilisation: (parseInt(s.ticketsUtilises) / parseInt(s.totalTickets)) * 100,
    recetteTotale: parseFloat(s.recetteTotale) || 0
  }));
}
```

---

## RÉSUMÉ DES CORRECTIONS À APPLIQUER

| # | Problème | Fichier | Temps | Priorité |
|---|----------|---------|-------|----------|
| 1 | Charger relation circuit | `ticket-transport.service.ts` | 10 min | 🔴 CRITIQUE |
| 2 | Afficher nom circuit | `TicketsTransportTab.tsx:286` | 5 min | 🔴 CRITIQUE |
| 3 | Améliorer sélecteur | `TicketsTransportTab.tsx:550` | 15 min | 🟠 HAUTE |
| 4 | Valider capacité | `ticket-transport.service.ts` | 30 min | 🔴 CRITIQUE |
| 5 | Lier ticket/trajet | `ticket-transport.service.ts` | 20 min | 🟡 MOYENNE |
| 6 | Interface planning | Nouveau composant | 2h | 🟡 MOYENNE |
| 7 | Stats par circuit | `ticket-transport.service.ts` | 45 min | 🟢 BASSE |

**Total temps corrections critiques (1-4)** : **1 heure**

---

## PROCHAINES ÉTAPES

1. **Appliquer corrections 1-4** (1 heure)
2. **Tester** :
   - Créer un circuit "Banlieue Nord"
   - Programmer 3 départs (7h, 9h, 17h)
   - Émettre 50 tickets
   - Vérifier que le nom du circuit s'affiche
   - Essayer d'émettre plus que la capacité → Doit bloquer

3. **Décider Option A ou B** pour liaison tickets/trajets
4. **Créer interface planning** (correction 6)

---

**Questions restantes pour vous** :
1. Les navettes circulent tous les jours ou seulement jours de cours ?
2. Combien de départs par jour en moyenne par circuit ?
3. Les tickets sont-ils valables uniquement le jour indiqué ou plusieurs jours ?
4. Y a-t-il des tarifs différents selon le circuit (distance) ?
