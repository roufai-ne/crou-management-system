# STATUT IMPLÉMENTATION - SYSTÈME TICKETS TRANSPORT UNIVERSELS

**Date**: 20 Janvier 2025
**Objectif**: Transformer le système en tickets universels avec tarifs configurables

---

## ✅ FICHIERS CRÉÉS

### 1. Migrations

✅ **`packages/database/src/migrations/1737400000000-RemoveCircuitFromTickets.ts`**
- Supprime `circuit_id` des tickets
- Supprime `date_voyage`
- Renomme `date_expiration` → `valid_until`
- Ajoute `is_expired`
- Ajoute `bus_assignment_id`
- Supprime `trajet_id`

✅ **`packages/database/src/migrations/1737400100000-CreateTransportTicketPrices.ts`**
- Crée table `transport_ticket_prices`
- Insère 2 tarifs par défaut:
  - Tarif Standard: 200 XOF
  - Gratuit - Étudiant Boursier: 0 XOF

### 2. Entités

✅ **`packages/database/src/entities/TransportTicketPrice.entity.ts`** (NOUVEAU)
- Gestion des tarifs configurables
- Catégories: STANDARD, BOURSIER, REDUIT, PERSONNEL, EXTERNE
- Statistiques: totalTicketsIssued, totalRevenue
- Conditions optionnelles (validFrom, validUntil, maxTicketsPerPerson...)

✅ **`packages/database/src/entities/TicketTransport.entity.NOUVELLE-VERSION.ts`** (À REMPLACER)
- Supprime `circuitId` et `circuit` relation
- Supprime `dateVoyage`
- Supprime `CategorieTicketTransport` enum
- Ajoute `priceId` (lien vers TransportTicketPrice)
- Ajoute `priceCategoryName` (historisation)
- Renomme `dateExpiration` → `validUntil`
- Ajoute `isExpired`
- Remplace `trajetId` par `busAssignmentId`

### 3. Documents

✅ **`TRANSPORT-DESIGN-FINAL.md`**
- Design complet du système
- Workflow détaillé
- Questions pour l'utilisateur

✅ **`TRANSPORT-CORRECTIONS-TICKETS-UNIVERSELS.md`**
- Liste complète des corrections
- Plan d'implémentation

✅ **`TRANSPORT-IMPLEMENTATION-STATUS.md`** (CE FICHIER)
- État d'avancement

---

## 🔄 PROCHAINES ÉTAPES

### Étape 1: Remplacer l'entité TicketTransport (5 minutes)

```bash
# Backup de l'ancienne version
mv packages/database/src/entities/TicketTransport.entity.ts packages/database/src/entities/TicketTransport.entity.OLD.ts

# Renommer la nouvelle version
mv packages/database/src/entities/TicketTransport.entity.NOUVELLE-VERSION.ts packages/database/src/entities/TicketTransport.entity.ts
```

### Étape 2: Exporter les nouvelles entités (2 minutes)

**Fichier**: `packages/database/src/index.ts`

Ajouter:
```typescript
export * from './entities/TransportTicketPrice.entity';
```

### Étape 3: Exécuter les migrations (10 minutes)

```bash
cd packages/database

# Générer les migrations si nécessaire
npm run migration:generate -- -n RemoveCircuitFromTickets

# Exécuter les migrations
npm run migration:run
```

⚠️ **IMPORTANT**: Avant d'exécuter sur production:
1. Faire un backup de la BDD
2. Tester en local d'abord
3. Vérifier que les tickets existants sont bien migrés

### Étape 4: Mettre à jour le service backend (30 minutes)

**Fichier**: `apps/api/src/modules/transport/ticket-transport.service.ts`

**Changements requis**:

1. **Interfaces simplifiées**:
```typescript
export interface CreateTicketTransportDTO {
  priceId: string;              // ✅ NOUVEAU: ID du tarif configuré
  quantite?: number;            // ✅ NOUVEAU: Nombre de tickets (défaut 1)
  annee?: number;               // Année (défaut: année courante)
  methodePaiement?: string;
  referencePaiement?: string;
  messageIndication?: string;
}

// ❌ SUPPRIMER: circuitId, dateVoyage, dateExpiration, categorie, tarif
```

2. **Méthode createTicket simplifiée**:
```typescript
static async createTicket(
  tenantId: string,
  userId: string,
  data: CreateTicketTransportDTO
) {
  const priceRepo = AppDataSource.getRepository(TransportTicketPrice);
  const ticketRepo = AppDataSource.getRepository(TicketTransport);

  // 1. Récupérer le tarif configuré
  const price = await priceRepo.findOne({
    where: { id: data.priceId, tenantId, isActive: true }
  });

  if (!price) {
    throw new Error('Tarif introuvable ou inactif');
  }

  if (!price.isCurrentlyValid()) {
    throw new Error('Ce tarif n\'est plus valide');
  }

  const annee = data.annee || new Date().getFullYear();

  // 2. Générer identifiants
  const numeroTicket = await this.generateNumeroTicket(tenantId, annee);
  const qrCode = await this.generateQRCode(tenantId);

  // 3. Créer le ticket
  const ticket = ticketRepo.create({
    tenantId,
    numeroTicket,
    qrCode,
    priceId: price.id,
    tarif: price.amount,
    priceCategoryName: price.name,
    annee,
    dateEmission: new Date(),
    validUntil: new Date(`${annee}-12-31`),
    status: TicketTransportStatus.ACTIF,
    estUtilise: false,
    isExpired: false,
    methodePaiement: data.methodePaiement,
    referencePaiement: data.referencePaiement,
    messageIndication: data.messageIndication,
    createdBy: userId
  });

  const savedTicket = await ticketRepo.save(ticket);

  // 4. Mettre à jour les statistiques du tarif
  await priceRepo.increment({ id: price.id }, 'totalTicketsIssued', 1);
  await priceRepo.increment({ id: price.id }, 'totalRevenue', price.amount);

  return savedTicket;
}
```

3. **Méthode createTicketsBatch simplifiée**:
```typescript
static async createTicketsBatch(
  tenantId: string,
  userId: string,
  data: CreateTicketTransportDTO
) {
  const quantite = data.quantite || 1;

  if (quantite < 1 || quantite > 100) {
    throw new Error('La quantité doit être entre 1 et 100');
  }

  const tickets = [];

  for (let i = 0; i < quantite; i++) {
    const ticket = await this.createTicket(tenantId, userId, {
      ...data,
      quantite: undefined // Enlever pour éviter boucle infinie
    });
    tickets.push(ticket);
  }

  return {
    tickets,
    total: tickets.length,
    montantTotal: tickets.reduce((sum, t) => sum + Number(t.tarif), 0)
  };
}
```

4. **Méthode getTickets simplifiée**:
```typescript
static async getTickets(tenantId: string, filters?: TicketTransportFilters) {
  const ticketRepo = AppDataSource.getRepository(TicketTransport);

  const queryBuilder = ticketRepo.createQueryBuilder('ticket')
    .leftJoinAndSelect('ticket.price', 'price') // ✅ Charger le tarif
    .where('ticket.tenantId = :tenantId', { tenantId });

  // ❌ SUPPRIMER: leftJoinAndSelect('ticket.circuit', 'circuit')

  if (filters?.status) {
    queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
  }

  if (filters?.annee) {
    queryBuilder.andWhere('ticket.annee = :annee', { annee: filters.annee });
  }

  if (filters?.priceId) {
    queryBuilder.andWhere('ticket.priceId = :priceId', { priceId: filters.priceId });
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
}
```

### Étape 5: Créer service de gestion des tarifs (20 minutes)

**Nouveau fichier**: `apps/api/src/modules/transport/transport-price.service.ts`

```typescript
export class TransportPriceService {
  /**
   * Récupérer tous les tarifs actifs
   */
  static async getActivePrices(tenantId: string) {
    const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

    const prices = await priceRepo.find({
      where: { tenantId, isActive: true },
      order: { displayOrder: 'ASC', amount: 'ASC' }
    });

    return prices.filter(p => p.isCurrentlyValid());
  }

  /**
   * Créer un nouveau tarif
   */
  static async createPrice(tenantId: string, userId: string, data: {
    category: TicketPriceCategory;
    name: string;
    description?: string;
    amount: number;
    isDefault?: boolean;
    conditions?: any;
  }) {
    const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

    // Si isDefault, retirer le défaut des autres
    if (data.isDefault) {
      await priceRepo.update(
        { tenantId, isDefault: true },
        { isDefault: false }
      );
    }

    const price = priceRepo.create({
      ...data,
      tenantId,
      isActive: true,
      createdBy: userId
    });

    return await priceRepo.save(price);
  }

  /**
   * Mettre à jour un tarif
   */
  static async updatePrice(
    priceId: string,
    tenantId: string,
    userId: string,
    data: Partial<TransportTicketPrice>
  ) {
    const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

    const price = await priceRepo.findOne({
      where: { id: priceId, tenantId }
    });

    if (!price) {
      throw new Error('Tarif introuvable');
    }

    // Si isDefault, retirer le défaut des autres
    if (data.isDefault) {
      await priceRepo.update(
        { tenantId, isDefault: true, id: Not(priceId) },
        { isDefault: false }
      );
    }

    Object.assign(price, data);
    price.updatedBy = userId;

    return await priceRepo.save(price);
  }

  /**
   * Désactiver un tarif
   */
  static async deactivatePrice(priceId: string, tenantId: string, userId: string) {
    const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

    const price = await priceRepo.findOne({
      where: { id: priceId, tenantId }
    });

    if (!price) {
      throw new Error('Tarif introuvable');
    }

    if (price.isDefault) {
      throw new Error('Impossible de désactiver le tarif par défaut');
    }

    price.isActive = false;
    price.updatedBy = userId;

    return await priceRepo.save(price);
  }
}
```

### Étape 6: Créer les endpoints API (15 minutes)

**Fichier**: `apps/api/src/modules/transport/transport.routes.ts`

Ajouter:
```typescript
// Gestion des tarifs
router.get('/prices', async (req, res) => {
  const tenantId = req.user.tenantId;
  const prices = await TransportPriceService.getActivePrices(tenantId);
  res.json({ success: true, data: prices });
});

router.post('/prices', async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const price = await TransportPriceService.createPrice(tenantId, userId, req.body);
  res.json({ success: true, data: price });
});

router.put('/prices/:id', async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const price = await TransportPriceService.updatePrice(req.params.id, tenantId, userId, req.body);
  res.json({ success: true, data: price });
});

router.delete('/prices/:id', async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  await TransportPriceService.deactivatePrice(req.params.id, tenantId, userId);
  res.json({ success: true, message: 'Tarif désactivé' });
});
```

### Étape 7: Frontend - Interface gestion tarifs (1 heure)

**Nouveau composant**: `apps/web/src/components/transport/TransportPricesTab.tsx`

Interface pour:
- Lister les tarifs actifs
- Créer un nouveau tarif
- Modifier un tarif existant
- Désactiver un tarif
- Définir le tarif par défaut

### Étape 8: Frontend - Simplifier émission tickets (45 minutes)

**Fichier**: `apps/web/src/components/transport/TicketsTransportTab.tsx`

**Changements**:
1. Supprimer sélection circuit
2. Supprimer sélection date voyage/expiration
3. Ajouter sélection tarif (dropdown)
4. Ajouter champ quantité (avec boutons rapides 10/20/50)
5. Simplifier colonnes tableau (supprimer circuit)

### Étape 9: Frontend - Interface émission FINALE (exemple)

```typescript
<Modal title="Émettre des Tickets Transport" isOpen={isEmitModalOpen}>
  <div className="space-y-4">
    {/* Sélection tarif */}
    <Select
      label="Tarif"
      value={formData.priceId}
      onChange={(value) => {
        const selectedPrice = prices.find(p => p.id === value);
        setFormData({
          ...formData,
          priceId: value,
          tarif: selectedPrice?.amount || 0
        });
      }}
      options={prices.map(price => ({
        value: price.id,
        label: price.getLabel() // "Tarif Standard (200 XOF)"
      }))}
      required
    />

    {/* Quantité avec boutons rapides */}
    <div>
      <label>Nombre de tickets</label>
      <div className="flex gap-2 items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFormData({ ...formData, quantite: 10 })}
        >
          10
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFormData({ ...formData, quantite: 20 })}
        >
          20
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFormData({ ...formData, quantite: 50 })}
        >
          50
        </Button>
        <Input
          type="number"
          min={1}
          max={100}
          value={formData.quantite || 1}
          onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
          className="w-24"
        />
      </div>
    </div>

    {/* Méthode paiement si payant */}
    {formData.tarif > 0 && (
      <Select
        label="Méthode de paiement"
        options={[
          { value: 'especes', label: 'Espèces' },
          { value: 'mobile_money', label: 'Mobile Money' },
          { value: 'carte', label: 'Carte bancaire' }
        ]}
      />
    )}

    {/* Récapitulatif */}
    <div className="bg-blue-50 p-4 rounded">
      <p className="font-medium">Récapitulatif</p>
      <p>Quantité: {formData.quantite} ticket(s)</p>
      <p>Prix unitaire: {formData.tarif} XOF</p>
      <p>Validité: Jusqu'au 31 décembre {new Date().getFullYear()}</p>
      <p className="text-xl font-bold mt-2">
        Total: {(formData.quantite * formData.tarif).toLocaleString()} XOF
      </p>
    </div>

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
```

---

## 📋 CHECKLIST COMPLÈTE

### Backend
- [x] Migration RemoveCircuitFromTickets créée
- [x] Migration CreateTransportTicketPrices créée
- [x] Entité TransportTicketPrice créée
- [x] Entité TicketTransport mise à jour (version préparée)
- [ ] Remplacer l'ancienne entité par la nouvelle
- [ ] Exporter TransportTicketPrice dans index.ts
- [ ] Exécuter les migrations
- [ ] Mettre à jour ticket-transport.service.ts
- [ ] Créer transport-price.service.ts
- [ ] Ajouter endpoints /prices dans routes
- [ ] Tester les endpoints

### Frontend
- [ ] Créer TransportPricesTab.tsx (gestion tarifs)
- [ ] Simplifier TicketsTransportTab.tsx
- [ ] Supprimer sélection circuit
- [ ] Ajouter sélection tarif
- [ ] Ajouter boutons rapides quantité
- [ ] Simplifier colonnes tableau
- [ ] Mettre à jour PDF template
- [ ] Tester interface

### Tests
- [ ] Tester création tarifs
- [ ] Tester émission tickets avec différents tarifs
- [ ] Tester validation tickets
- [ ] Tester expiration automatique
- [ ] Tester statistiques

---

## ⏱️ ESTIMATION TEMPS TOTAL

| Phase | Durée |
|-------|-------|
| Remplacer entité + exporter | 10 min |
| Exécuter migrations | 10 min |
| Mettre à jour service backend | 30 min |
| Créer service tarifs | 20 min |
| Créer endpoints API | 15 min |
| Interface gestion tarifs | 1h |
| Simplifier émission tickets | 45 min |
| Tests | 30 min |
| **TOTAL** | **3h 40min** |

---

## 🚀 COMMANDES RAPIDES

```bash
# 1. Remplacer l'entité
mv packages/database/src/entities/TicketTransport.entity.ts packages/database/src/entities/TicketTransport.entity.OLD.ts
mv packages/database/src/entities/TicketTransport.entity.NOUVELLE-VERSION.ts packages/database/src/entities/TicketTransport.entity.ts

# 2. Exécuter migrations
cd packages/database
npm run migration:run

# 3. Rebuild
npm run build

# 4. Redémarrer API
cd ../../apps/api
npm run dev
```

---

**Voulez-vous que je continue avec l'étape suivante ?**
