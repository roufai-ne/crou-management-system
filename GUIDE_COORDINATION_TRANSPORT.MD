# 🤖 GUIDE DE COORDINATION POUR AGENTS IA
## Ajout Tickets de Transport + Situations Journalières CROU

---

## 📋 CONTEXTE EXÉCUTIF

**Projet** : Ajout gestion tickets + situations journalières au module Transport CROU (existant)
**Client** : Roufai (MESRIT - Niger)
**Scope** : Petit ajout (pas complet refactor) - Focus: Tickets + Reports journaliers
**Budget Temps** : ~4-5 semaines (phases courtes)
**Priorité** : Moyenne-Haute - Améliore tracking financier + opérationnel

---

## 🎯 OBJECTIFS

1. ✅ Permettre émission de **tickets de transport** (batch ou unitaire)
2. ✅ Tracker les **recettes** par type de ticket
3. ✅ Générer **situation journalière** consolidée (navettes + tickets + KPI)
4. ✅ Exporter rapports (PDF/Excel)
5. ✅ Intégrer fluide avec **module Transport existant** (parc, navettes, carburant)

---

## 🧩 MODULES À IMPLÉMENTER (Ordre Recommandé)

### MODULE 1 : Base de Données (0.5 sem)
**Responsabilité** : Ajouter tables pour tickets + situations

**Livrables** :
- [ ] Table `circuits_transport` (routes/parcours)
- [ ] Table `tarifs_transport` (prix par circuit + type)
- [ ] Table `categories_tickets_transport` (types tickets)
- [ ] Table `tickets_transport` (tickets émis)
- [ ] Table `situations_journalieres_transport` (agrégation jour)

**Files** :
```
src/migrations/
├── 2025-04-24-001-add-circuits.sql
├── 2025-04-24-002-add-tarifs.sql
├── 2025-04-24-003-add-tickets.sql
└── 2025-04-24-004-add-situations.sql

src/models/
├── Circuit.js
├── Tarif.js
├── CategorieTicket.js
├── Ticket.js
└── SituationJournaliere.js
```

**Acceptance** :
- ✅ Toutes tables créées avec FK correct
- ✅ Seed data : tarifs CROU + circuits (paramétrage initial)

---

### MODULE 2 : API Circuits & Tarifs (0.5 sem)
**Responsabilité** : CRUD pour paramétrage

**Endpoints** :
```javascript
// Circuits
GET    /api/transport/circuits
POST   /api/transport/circuits
PUT    /api/transport/circuits/:id
DELETE /api/transport/circuits/:id

// Tarifs
GET    /api/transport/tarifs?circuit_id=xxx
POST   /api/transport/tarifs
PUT    /api/transport/tarifs/:id
DELETE /api/transport/tarifs/:id

// Catégories Tickets
GET    /api/transport/categories-tickets
POST   /api/transport/categories-tickets
```

**Logique** :
- Circuits = routes (Centre → Campus, Campus A → B, etc.)
- Tarifs = prix par circuit + type ticket
- Catégories = Régulier, Étudiant, Personnel, Gratuit, etc.

**Tests** :
```javascript
test('CRUD circuits avec validation');
test('Tarifs CRUD avec FK vers circuit');
test('Catégories CRUD avec prix');
```

**Acceptance** :
- ✅ API 100% fonctionnelle
- ✅ Validation stricte (prix > 0, dates valides)
- ✅ Retours d'erreur explicites

---

### MODULE 3 : API Émission de Tickets (1 sem)
**Responsabilité** : Logique émission tickets avec validation

**Endpoints** :
```javascript
GET    /api/transport/tickets?date_from=&date_to=&circuit=&statut=
POST   /api/transport/tickets                    // Émettre tickets
GET    /api/transport/tickets/:ticket_id
PATCH  /api/transport/tickets/:ticket_id/valider
PATCH  /api/transport/tickets/:ticket_id/encaisser
DELETE /api/transport/tickets/:ticket_id        // Soft-delete (annulation)
```

**Logique d'émission** :
```javascript
// POST /api/transport/tickets
1. Valider input :
   - circuit_id exists
   - date_transport valide
   - categorie_id exists
   - quantite > 0
   
2. Récupérer tarif :
   - SELECT prix_unitaire FROM tarifs
     WHERE circuit_id = ? AND type_ticket = ?
   
3. Calculer montant_total = quantite × prix
   
4. Générer numéros de série :
   - numero_serie_debut = MAX(numero_serie_fin) + 1
   - numero_serie_fin = inicio + quantite - 1
   
5. Créer record Ticket :
   - INSERT INTO tickets_transport
     (..., numero_serie_debut, numero_serie_fin, statut='Émis')
   
6. Retourner succès + détails
```

**Validations** :
- Circuit doit exister
- Type ticket doit exister
- Quantité > 0 et < 10000 (limit raisonnable)
- Pas deux tickets même circuit + date + cat (business rule ?)

**Tests** :
```javascript
describe('TicketAPI - Émission', () => {
  test('Émettre 50 tickets réguliers');
  test('Calcul montant correct');
  test('Numérotation série continue');
  test('Reject quantité invalide');
  test('Reject circuit inexistant');
});
```

**Acceptance** :
- ✅ Émission batch simple & fiable
- ✅ Numérotation automatique
- ✅ Montants calculés correctement
- ✅ Validation stricte

---

### MODULE 4 : API Situations Journalières (1 sem)
**Responsabilité** : Génération + agrégation données

**Endpoints** :
```javascript
GET    /api/transport/situations?date=&mois=&annee=
POST   /api/transport/situations/{date}/generer
GET    /api/transport/situations/:situation_id
PATCH  /api/transport/situations/:situation_id/valider
```

**Logique génération** :

```javascript
// POST /api/transport/situations/2025-04-24/generer
async function generateSituation(date) {
  //1️⃣ NAVETTES DU JOUR
  const navettes = await DB.navettes.where({ date_navette: date });
  
  const stats_navettes = {
    nombre: navettes.length,
    vehicules: new Set(navettes.map(n => n.vehicule_id)).size,
    passagers: navettes.reduce((sum, n) => sum + n.nombre_passagers, 0),
    km_total: navettes.reduce((sum, n) => sum + n.distance_km, 0),
    carburant: navettes.reduce((sum, n) => sum + n.carburant_consomme, 0)
  };
  
  // 2️⃣ TICKETS DU JOUR
  const tickets = await DB.tickets.where({ date_transport: date });
  
  const stats_tickets = {
    emis: tickets.length,
    par_type: groupBy(tickets, 'categorie_id'),
    montant_total: tickets.reduce((sum, t) => sum + t.montant_total, 0)
  };
  
  // 3️⃣ CALCUL KPI
  const kpi = {
    remplissage: calculateRemplissage(navettes),
    disponibilite: await calculateDisponibilite(date),
    carburant_cost: stats_navettes.carburant * 155.5,  // Prix unitaire
    ponctualite: calculatePonctualite(navettes),
    rendement: stats_navettes.passagers / stats_navettes.km_total
  };
  
  // 4️⃣ DÉTECTION ANOMALIES
  const anomalies = detectAnomalies(kpi, stats_navettes);
  
  // 5️⃣ SAUVEGARDE
  const situation = await DB.situations.create({
    date_situation: date,
    nombre_navettes: stats_navettes.nombre,
    nombre_vehicules_utilises: stats_navettes.vehicules,
    total_passagers: stats_navettes.passagers,
    total_km: stats_navettes.km_total,
    total_carburant: stats_navettes.carburant,
    tickets_emis: stats_tickets.emis,
    montant_recettes: stats_tickets.montant_total,
    taux_remplissage_moyen: kpi.remplissage,
    taux_disponibilite_flotte: kpi.disponibilite,
    cout_carburant_journalier: kpi.carburant_cost,
    ponctualite_moyenne: kpi.ponctualite,
    nb_anomalies: anomalies.length,
    anomalies_detail: anomalies,
    statut: 'Validé'
  });
  
  return situation;
}
```

**Tests** :
```javascript
describe('SituationAPI - Génération', () => {
  test('Agrège navettes correctement');
  test('Agrège tickets correctement');
  test('Calcule KPI exactement');
  test('Détecte anomalies');
  test('Persiste en BD');
});
```

**Acceptance** :
- ✅ Données agrégées exactes
- ✅ KPI calculés correctement (voir formules architecture doc)
- ✅ Anomalies détectées OK
- ✅ Situation persiste en BD

---

### MODULE 5 : Frontend - Interfaces (1 sem)
**Responsabilité** : Pages React/Next.js

**Pages à créer** :

```
src/pages/transport/
├── tickets/
│  ├── emettre.js        // Formulaire émission
│  └── historique.js     // Tableau + filtres
├── situations/
│  ├── index.js          // Liste situations
│  └── [date].js         // Détail situation
└── parametres/
   ├── circuits.js       // CRUD circuits
   ├── tarifs.js         // CRUD tarifs
   └── categories.js     // CRUD catégories
```

**Composants clés** :

#### 1. TicketEmissionForm.jsx
```jsx
export const TicketEmissionForm = () => {
  const [circuit, setCircuit] = useState();
  const [date, setDate] = useState(new Date());
  const [categorie, setCategorie] = useState('Régulier');
  const [quantite, setQuantite] = useState(50);
  const [prix, setPrix] = useState();

  // Charger tarif quand circuit change
  useEffect(() => {
    if (!circuit || !categorie) return;
    API.get(`/tarifs?circuit=${circuit}&type=${categorie}`)
      .then(data => setPrix(data.prix_unitaire))
      .catch(err => showError(err.message));
  }, [circuit, categorie]);

  const montant_total = (quantite || 0) * (prix || 0);

  const handleEmettre = async () => {
    if (!confirm(`Émettre ${quantite} tickets pour ${montant_total} FCFA ?`)) return;

    try {
      const response = await API.post('/tickets', {
        circuit_id: circuit,
        date_transport: date,
        categorie_id: categorie,
        quantite
      });

      showSuccess(`✓ ${response.data.quantite} tickets émis (#${response.data.numero_serie_debut}-${response.data.numero_serie_fin})`);
      // Reset form
      setQuantite(50);
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <form>
      <label>Circuit</label>
      <select value={circuit} onChange={(e) => setCircuit(e.target.value)}>
        <option>Sélectionner circuit</option>
        {/* Options */}
      </select>

      <label>Date transport</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label>Type ticket</label>
      <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
        <option value="Régulier">Régulier</option>
        <option value="Étudiant">Étudiant</option>
        <option value="Personnel">Personnel</option>
      </select>

      <label>Prix unitaire</label>
      <input type="number" disabled value={prix || 0} />

      <label>Quantité</label>
      <input type="number" value={quantite} onChange={(e) => setQuantite(parseInt(e.target.value))} />

      <div className="total">
        <strong>Montant total: {montant_total} FCFA</strong>
      </div>

      <button type="button" onClick={handleEmettre}>
        Émettre Tickets
      </button>
    </form>
  );
};
```

#### 2. SituationDisplay.jsx
```jsx
export const SituationDisplay = ({ date }) => {
  const [situation, setSituation] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/situations?date=${date}`)
      .then(data => setSituation(data))
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) return <Spinner />;
  if (!situation) return <p>Aucune situation pour cette date</p>;

  return (
    <div className="situation-display">
      <h2>Situation du {date}</h2>

      <Section title="📊 Navettes">
        <Metric label="Navettes réalisées" value={situation.nombre_navettes} />
        <Metric label="Véhicules utilisés" value={situation.nombre_vehicules_utilises} />
        <Metric label="Passagers" value={situation.total_passagers} />
        <Metric label="Distance" value={situation.total_km + ' km'} />
        <Metric label="Carburant" value={situation.total_carburant + ' L'} />
      </Section>

      <Section title="💰 Tickets & Recettes">
        <Metric label="Tickets émis" value={situation.tickets_emis} />
        <Metric label="Montant total" value={situation.montant_recettes + ' FCFA'} />
      </Section>

      <Section title="📈 KPI">
        <Metric label="Remplissage moyen" value={situation.taux_remplissage_moyen + '%'} />
        <Metric label="Disponibilité flotte" value={situation.taux_disponibilite_flotte + '%'} />
        <Metric label="Ponctualité" value={situation.ponctualite_moyenne + '%'} />
        <Metric label="Coût carburant" value={situation.cout_carburant_journalier + ' FCFA'} />
      </Section>

      {situation.anomalies.length > 0 && (
        <Section title="⚠️ Anomalies">
          {situation.anomalies.map((a, i) => (
            <Alert key={i} type={a.severity} message={a.message} />
          ))}
        </Section>
      )}

      <div className="actions">
        <button onClick={() => exportPDF(situation)}>📄 PDF</button>
        <button onClick={() => exportExcel(situation)}>📊 Excel</button>
        <button onClick={() => window.print()}>🖨️ Imprimer</button>
      </div>
    </div>
  );
};
```

#### 3. Dashboard Widget
```jsx
export const TransportWidget = () => {
  const [today, setToday] = useState();
  
  useEffect(() => {
    API.get(`/situations?date=${new Date().toISOString().split('T')[0]}`)
      .then(data => setToday(data))
      .catch(() => {});
  }, []);

  if (!today) return null;

  return (
    <div className="widget-transport">
      <h3>🚌 Transport Aujourd'hui</h3>
      <div className="metrics">
        <div>
          <span className="label">Navettes</span>
          <span className="value">{today.nombre_navettes}</span>
        </div>
        <div>
          <span className="label">Passagers</span>
          <span className="value">{today.total_passagers}</span>
        </div>
        <div>
          <span className="label">Recettes</span>
          <span className="value">{today.montant_recettes} FCFA</span>
        </div>
        <div>
          <span className="label">État</span>
          <span className="value" style={{color: today.nb_anomalies === 0 ? 'green' : 'red'}}>
            {today.nb_anomalies === 0 ? '✓ Normal' : '⚠️ Alertes'}
          </span>
        </div>
      </div>
    </div>
  );
};
```

**Acceptance** :
- ✅ Formulaires fonctionnels
- ✅ Tableaux affichent données exactes
- ✅ Exports générés correctement

---

### MODULE 6 : Exports PDF & Excel (0.5 sem)
**Responsabilité** : Génération rapports

**Endpoints** :
```javascript
POST   /api/transport/situations/:situation_id/export-pdf
POST   /api/transport/situations/:situation_id/export-excel
```

**PDF (jsPDF)** :
```javascript
export async function generateSituationPDF(situation) {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(16);
  doc.text('SITUATION JOURNALIÈRE TRANSPORT', 20, 20);
  doc.setFontSize(10);
  doc.text(`Date: ${situation.date_situation}`, 20, 30);
  
  // Sections
  let y = 40;
  
  // Navettes
  doc.setFont(undefined, 'bold');
  doc.text('NAVETTES DU JOUR', 20, y);
  y += 8;
  doc.setFont(undefined, 'normal');
  doc.text(`Navettes réalisées: ${situation.nombre_navettes}`, 25, y);
  y += 6;
  doc.text(`Passagers: ${situation.total_passagers}`, 25, y);
  y += 6;
  doc.text(`Distance: ${situation.total_km} km`, 25, y);
  y += 10;
  
  // Tickets
  doc.setFont(undefined, 'bold');
  doc.text('TICKETS & RECETTES', 20, y);
  y += 8;
  doc.setFont(undefined, 'normal');
  doc.text(`Tickets émis: ${situation.tickets_emis}`, 25, y);
  y += 6;
  doc.text(`Montant total: ${situation.montant_recettes} FCFA`, 25, y);
  y += 10;
  
  // KPI
  doc.setFont(undefined, 'bold');
  doc.text('INDICATEURS', 20, y);
  y += 8;
  doc.setFont(undefined, 'normal');
  const kpis = [
    `Remplissage: ${situation.taux_remplissage_moyen}%`,
    `Disponibilité: ${situation.taux_disponibilite_flotte}%`,
    `Ponctualité: ${situation.ponctualite_moyenne}%`,
    `Coût carburant: ${situation.cout_carburant_journalier} FCFA`
  ];
  kpis.forEach(kpi => {
    doc.text(kpi, 25, y);
    y += 6;
  });
  
  // Signature
  y += 10;
  doc.text('Généré le: ' + new Date().toLocaleString('fr-FR'), 20, y);
  
  return doc.output('blob');
}
```

**Excel (SheetJS)** :
```javascript
export async function generateSituationExcel(situation) {
  const workbook = XLSX.utils.book_new();
  
  // Feuille 1: Données
  const data = [
    ['SITUATION JOURNALIÈRE TRANSPORT', '', situation.date_situation],
    [],
    ['Métrique', 'Valeur'],
    ['Navettes réalisées', situation.nombre_navettes],
    ['Véhicules utilisés', situation.nombre_vehicules_utilises],
    ['Passagers', situation.total_passagers],
    ['Distance (km)', situation.total_km],
    ['Carburant (L)', situation.total_carburant],
    [],
    ['Tickets émis', situation.tickets_emis],
    ['Montant recettes (FCFA)', situation.montant_recettes],
    [],
    ['Taux remplissage (%)', situation.taux_remplissage_moyen],
    ['Disponibilité (%)', situation.taux_disponibilite_flotte],
    ['Ponctualité (%)', situation.ponctualite_moyenne],
    ['Coût carburant (FCFA)', situation.cout_carburant_journalier]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, ws, 'Situation');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'blob' });
}
```

**Acceptance** :
- ✅ PDF généré avec mise en forme
- ✅ Excel avec données brutes + formattage
- ✅ Fichiers téléchargeables

---

### MODULE 7 : Intégration & Dashboard (0.5 sem)
**Responsabilité** : Mise ensemble + widget dashboard

**Livrables** :
- [ ] Widget transport ajouté au dashboard principal
- [ ] Liens navettes ↔ situations OK
- [ ] API stock existante testée + intégrée
- [ ] Permissions/rôles configurés
- [ ] Monitoring logs activé

**Acceptance** :
- ✅ Dashboard affiche widget transport
- ✅ Situations générées automatiquement (minuit)
- ✅ Toutes intégrations testées
- ✅ Pas de données orphelines

---

## 🧪 STRATÉGIE DE TEST

### Tests Unitaires (60% du temps)
```javascript
// Calculs
test('Taux remplissage = (passagers/capacité)*100');
test('Coût carburant = litres × prix');
test('Ponctualité = (ponctuelles/total)*100');

// Validations
test('Quantité ticket > 0');
test('Prix > 0');
test('Dates valides');

// Logique métier
test('Numérotation série continue');
test('Statut transition : Émis → Validé → Encaissé');
```

### Tests Intégration (30%)
```javascript
// Workflows
test('Émettre tickets → vérif DB');
test('Générer situation → agrég OK');
test('Export PDF → fichier généré');

// Avec module existant
test('Fetch navettes → calculs corrects');
test('Fetch parc → disponibilité OK');
```

### Tests Manuels (10% - UAT avec Roufai)
```
- Émettre 50 tickets, vérifier montant
- Générer situation, vérifier KPI exactitude
- Export PDF/Excel, vérifier format
- Dashboard affiche données jour
```

---

## 📅 TIMELINE FINALE

| Phase | Durée | Modules | 
|-------|-------|---------|
| **1: BD + API Base** | 1 sem | Modules 1-2 |
| **2: Tickets** | 1 sem | Module 3 |
| **3: Situations** | 1 sem | Module 4 |
| **4: Frontend** | 1 sem | Module 5 |
| **5: Exports + Polish** | 0.5 sem | Module 6-7 |
| **6: Tests & UAT** | 0.5 sem | All |

**Total: ~4.5 semaines**

---

## 🚨 RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| API navettes indispo | Bas | Moyen | Mock data early, tests indep. |
| Calculs KPI inexacts | Moyen | Élevé | Double-vérif formules, tests |
| Performance agrég grosse volume | Bas | Moyen | Index BD, pagination, caching |
| Export timeout (gros PDF) | Bas | Bas | Générer en background |

---

## 🎁 DELIVERABLES FINAUX

```
├─ Code (GitHub)
│  ├─ API (Express/FastAPI)
│  ├─ Frontend (React/Next.js)
│  └─ Tests
├─ Documentation
│  ├─ README
│  ├─ API Swagger
│  └─ Diagrammes
├─ Database
│  ├─ Migrations
│  └─ Seed data
└─ Rapports
   ├─ Templates PDF
   └─ Export Excel
```

---

## ✅ CHECKLIST PRE-LANCEMENT

- [ ] Accès API navettes testé
- [ ] Tarifs CROU confirmés + seed data
- [ ] Stack tech décidée
- [ ] Repo créé
- [ ] BD dev setup OK
- [ ] Design UI approuvé
- [ ] Team familiarisée
- [ ] Plan backup en place

---

**Prêt à implémenter ! 🚀**

*Document généré le : 2025-04-24*
*Version : 1.0*
*Scope : Ajout Tickets + Situations (Module Transport)*