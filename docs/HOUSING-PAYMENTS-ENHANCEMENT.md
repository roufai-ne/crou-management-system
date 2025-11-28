# Module Logement - Amélioration Système Paiements

## État Actuel

### ✅ Ce qui fonctionne
1. **Montants définis**: Loyer mensuel + caution dans Housing/HousingOccupancy
2. **Vérification renouvellement**: `hasPendingPayments` bloque auto-renouvellement
3. **Documents justificatifs**: Upload quittance loyer (RENT_RECEIPT)
4. **Rapports financiers**: Total loyers collectés dans rapports annuels

### ⚠️ Limitations
1. **Pas d'historique paiements**: Impossible de voir tous les paiements d'un étudiant
2. **Pas d'échéancier**: Pas de rappels automatiques
3. **Pas d'intégration financière**: Non lié au module Transactions/Budgets
4. **Calcul manuel**: `hasPendingPayments` doit être mis à jour manuellement

---

## Option 1: Entité RentPayment Dédiée (Recommandée)

### Nouvelle entité: `RentPayment.entity.ts`

```typescript
@Entity('rent_payments')
export class RentPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  // Relations
  @Column({ type: 'uuid' })
  occupancyId: string;

  @ManyToOne(() => HousingOccupancy)
  @JoinColumn({ name: 'occupancyId' })
  occupancy: HousingOccupancy;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  // Détails paiement
  @Column({ type: 'varchar', length: 50 })
  periodMonth: string; // "2025-09" (année-mois)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Montant payé

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountDue: number; // Montant dû

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus; // paid, pending, overdue, partial

  @Column({ type: 'date' })
  dueDate: Date; // Date échéance

  @Column({ type: 'date', nullable: true })
  paymentDate: Date; // Date paiement effectif

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // cash, bank_transfer, mobile_money

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionReference: string; // Référence bancaire

  @Column({ type: 'uuid', nullable: true })
  receiptDocumentId: string; // Lien vers HousingDocument

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  // Méthodes utilitaires
  isOverdue(): boolean {
    return this.status === PaymentStatus.PENDING &&
           new Date() > this.dueDate;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const diff = new Date().getTime() - this.dueDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  calculatePenalty(penaltyRatePerDay: number = 0.001): number {
    if (!this.isOverdue()) return 0;
    const daysOverdue = this.getDaysOverdue();
    return this.amountDue * penaltyRatePerDay * daysOverdue;
  }
}

export enum PaymentStatus {
  PENDING = 'pending',     // En attente
  PAID = 'paid',           // Payé
  PARTIAL = 'partial',     // Paiement partiel
  OVERDUE = 'overdue',     // En retard
  CANCELLED = 'cancelled'  // Annulé
}
```

### Avantages
- ✅ **Historique complet** de tous les paiements
- ✅ **Calcul automatique** de `hasPendingPayments` via requête SQL
- ✅ **Pénalités retard** calculées automatiquement
- ✅ **Traçabilité** (transaction_reference, receipt_document_id)
- ✅ **Rapports précis** (loyers collectés par période)

### Migration nécessaire
```typescript
// Migration: CreateRentPaymentsTable
export class CreateRentPaymentsTable1763100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer enum payment_status
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM(
        'pending', 'paid', 'partial', 'overdue', 'cancelled'
      )
    `);

    // 2. Créer table rent_payments
    await queryRunner.query(`
      CREATE TABLE "rent_payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "occupancy_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "period_month" varchar(50) NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "amount_due" decimal(10,2) NOT NULL,
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "due_date" date NOT NULL,
        "payment_date" date,
        "payment_method" varchar(50),
        "transaction_reference" varchar(255),
        "receipt_document_id" uuid,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "created_by" varchar(255) NOT NULL,
        CONSTRAINT "FK_rent_payments_occupancy"
          FOREIGN KEY ("occupancy_id")
          REFERENCES "housing_occupancies"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_rent_payments_student"
          FOREIGN KEY ("student_id")
          REFERENCES "students"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_rent_payments_tenant"
          FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_rent_payments_receipt"
          FOREIGN KEY ("receipt_document_id")
          REFERENCES "housing_documents"("id")
          ON DELETE SET NULL
      )
    `);

    // 3. Index pour recherches rapides
    await queryRunner.query(`
      CREATE INDEX "IDX_rent_payments_student_status"
      ON "rent_payments" ("student_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rent_payments_occupancy_period"
      ON "rent_payments" ("occupancy_id", "period_month")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rent_payments_due_date_status"
      ON "rent_payments" ("due_date", "status")
    `);

    // 4. Vue matérialisée pour impayés
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW "student_pending_payments" AS
      SELECT
        s.id as student_id,
        s.matricule,
        COUNT(rp.id) as pending_count,
        SUM(rp.amount_due - rp.amount) as total_pending_amount,
        MAX(rp.due_date) as latest_due_date,
        MAX(CASE WHEN rp.status = 'overdue' THEN 1 ELSE 0 END) as has_overdue
      FROM students s
      LEFT JOIN rent_payments rp ON rp.student_id = s.id
      WHERE rp.status IN ('pending', 'overdue', 'partial')
      GROUP BY s.id, s.matricule
    `);

    // 5. Index sur vue matérialisée
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_student_pending_payments_student"
      ON "student_pending_payments" ("student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP MATERIALIZED VIEW "student_pending_payments"`);
    await queryRunner.query(`DROP TABLE "rent_payments"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
  }
}
```

### Service: `RentPaymentService`

```typescript
export class RentPaymentService {
  /**
   * Générer échéancier automatique pour nouvelle occupation
   */
  async generatePaymentSchedule(occupancy: HousingOccupancy): Promise<RentPayment[]> {
    const payments: RentPayment[] = [];
    const startDate = new Date(occupancy.dateDebut);
    const endDate = new Date(occupancy.dateFin);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const payment = new RentPayment();
      payment.occupancyId = occupancy.id;
      payment.studentId = occupancy.studentId;
      payment.tenantId = occupancy.tenantId;
      payment.periodMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      payment.amountDue = occupancy.loyerMensuel;
      payment.amount = 0;
      payment.status = PaymentStatus.PENDING;
      payment.dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 5); // 5 du mois
      payment.createdBy = 'system';

      payments.push(payment);

      // Mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return await this.rentPaymentRepository.save(payments);
  }

  /**
   * Vérifier si un étudiant a des impayés
   */
  async hasPendingPayments(studentId: string): Promise<boolean> {
    const count = await this.rentPaymentRepository.count({
      where: {
        studentId,
        status: In([PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL])
      }
    });
    return count > 0;
  }

  /**
   * Obtenir total impayés étudiant
   */
  async getPendingAmount(studentId: string): Promise<number> {
    const result = await this.rentPaymentRepository
      .createQueryBuilder('rp')
      .select('SUM(rp.amountDue - rp.amount)', 'total')
      .where('rp.studentId = :studentId', { studentId })
      .andWhere('rp.status IN (:...statuses)', {
        statuses: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL]
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Enregistrer paiement
   */
  async recordPayment(
    paymentId: string,
    amount: number,
    method: string,
    reference?: string
  ): Promise<RentPayment> {
    const payment = await this.rentPaymentRepository.findOne({
      where: { id: paymentId }
    });

    if (!payment) throw new NotFoundException('Payment not found');

    payment.amount += amount;
    payment.paymentDate = new Date();
    payment.paymentMethod = method;
    payment.transactionReference = reference;

    // Mettre à jour statut
    if (payment.amount >= payment.amountDue) {
      payment.status = PaymentStatus.PAID;
    } else if (payment.amount > 0) {
      payment.status = PaymentStatus.PARTIAL;
    }

    return await this.rentPaymentRepository.save(payment);
  }

  /**
   * Marquer paiements en retard (CRON job quotidien)
   */
  async markOverduePayments(): Promise<number> {
    const result = await this.rentPaymentRepository
      .createQueryBuilder()
      .update(RentPayment)
      .set({ status: PaymentStatus.OVERDUE })
      .where('status = :status', { status: PaymentStatus.PENDING })
      .andWhere('due_date < :today', { today: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Rafraîchir vue matérialisée impayés (CRON job quotidien)
   */
  async refreshPendingPaymentsView(): Promise<void> {
    await this.dataSource.query(`REFRESH MATERIALIZED VIEW student_pending_payments`);
  }
}
```

### Routes API

```typescript
// POST /api/housing/rent-payments
// Enregistrer paiement loyer
router.post('/rent-payments',
  authenticate,
  authorize('housing:payments:create'),
  async (req, res) => {
    const { occupancyId, amount, paymentMethod, reference } = req.body;
    const payment = await rentPaymentService.recordPayment(
      occupancyId,
      amount,
      paymentMethod,
      reference
    );
    res.json(payment);
  }
);

// GET /api/housing/students/:id/payments
// Historique paiements étudiant
router.get('/students/:id/payments',
  authenticate,
  authorize('housing:payments:read'),
  async (req, res) => {
    const payments = await rentPaymentService.getStudentPayments(req.params.id);
    res.json(payments);
  }
);

// GET /api/housing/students/:id/pending-amount
// Montant impayé étudiant
router.get('/students/:id/pending-amount',
  authenticate,
  authorize('housing:payments:read'),
  async (req, res) => {
    const amount = await rentPaymentService.getPendingAmount(req.params.id);
    res.json({ amount });
  }
);

// POST /api/housing/occupancies/:id/generate-schedule
// Générer échéancier automatique
router.post('/occupancies/:id/generate-schedule',
  authenticate,
  authorize('housing:payments:create'),
  async (req, res) => {
    const occupancy = await occupancyService.findOne(req.params.id);
    const schedule = await rentPaymentService.generatePaymentSchedule(occupancy);
    res.json(schedule);
  }
);
```

### Frontend: Composant `RentPaymentsTab`

```typescript
const RentPaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div>
      <h3>Paiements Loyers</h3>

      {/* Tableau paiements */}
      <Table>
        <thead>
          <tr>
            <th>Étudiant</th>
            <th>Période</th>
            <th>Montant Dû</th>
            <th>Montant Payé</th>
            <th>Statut</th>
            <th>Date Échéance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>{payment.student.getFullName()}</td>
              <td>{payment.periodMonth}</td>
              <td>{payment.amountDue} XOF</td>
              <td>{payment.amount} XOF</td>
              <td>
                <Badge variant={getStatusVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </td>
              <td>
                {format(payment.dueDate, 'dd/MM/yyyy')}
                {payment.isOverdue() && (
                  <span className="text-red-500">
                    ({payment.getDaysOverdue()} jours de retard)
                  </span>
                )}
              </td>
              <td>
                <Button onClick={() => handleRecordPayment(payment)}>
                  Enregistrer Paiement
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal enregistrement paiement */}
      {showPaymentModal && (
        <PaymentModal
          payment={selectedPayment}
          onSubmit={async (data) => {
            await recordPayment(data);
            refreshPayments();
          }}
        />
      )}
    </div>
  );
};
```

---

## Option 2: Intégration avec Module Financier (Alternative)

### Utiliser table `transactions` existante

**Avantages:**
- ✅ Réutilise infrastructure existante
- ✅ Un seul module financier centralisé
- ✅ Workflow validation déjà en place

**Inconvénients:**
- ❌ Moins spécifique au logement
- ❌ Complexité accrue (budget_id obligatoire)
- ❌ Pas d'échéancier automatique

### Implémentation

```typescript
// Service: créer transaction loyer
async createRentTransaction(
  occupancy: HousingOccupancy,
  periodMonth: string
): Promise<Transaction> {
  const transaction = new Transaction();
  transaction.tenantId = occupancy.tenantId;
  transaction.budgetId = await this.getHousingBudget(occupancy.tenantId);
  transaction.libelle = `Loyer ${periodMonth} - ${occupancy.student.getFullName()}`;
  transaction.type = TransactionType.RECETTE;
  transaction.category = TransactionCategory.LOYER; // Nouvelle catégorie
  transaction.montant = occupancy.loyerMensuel;
  transaction.status = TransactionStatus.PENDING;
  transaction.date = new Date();

  // Métadonnées spécifiques logement
  transaction.metadata = {
    occupancyId: occupancy.id,
    studentId: occupancy.studentId,
    periodMonth,
    type: 'rent'
  };

  return await this.transactionRepository.save(transaction);
}
```

---

## Recommandation Finale

**Pour CROU, je recommande OPTION 1** (table dédiée `rent_payments`):

### Raisons:
1. ✅ **Simplicité**: Logique métier claire et isolée
2. ✅ **Performance**: Requêtes optimisées pour paiements loyers
3. ✅ **Évolutivité**: Facile d'ajouter pénalités retard, remises
4. ✅ **Autonomie**: Pas de dépendance au module budgets
5. ✅ **Échéanciers**: Génération automatique possible
6. ✅ **Rapports**: Statistiques dédiées (taux recouvrement, etc.)

### Effort Développement:
- Migration: 1 heure
- Service: 2 heures
- Routes API: 1 heure
- Frontend: 3 heures
- Tests: 2 heures
**TOTAL: ~1 journée développement**

---

## Permissions Nécessaires

Ajouter au seed:
```typescript
const housingPayments = await permissionRepository.save({
  resource: 'housing',
  actions: ['create', 'update', 'read', 'validate'],
  description: 'Gérer les paiements de loyers'
});
```

Attribuer à:
- Super Admin
- Directeur CROU
- Gestionnaire Logement
- Comptable (lecture seule)
