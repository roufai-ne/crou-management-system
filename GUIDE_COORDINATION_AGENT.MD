# 🤖 GUIDE DE COORDINATION POUR AGENTS AI
## Implémentation Module Gestion de Restauration CROU

---

## 📋 CONTEXTE EXÉCUTIF

**Projet** : Intégration module Gestion de Restauration dans plateforme CROU MESRIT (Niger)
**Client** : Roufai (MESRIT - Ministry of Higher Education, Research and Technological Innovation)
**Technologie Stack** : À confirmer (Next.js/React, Node.js/Python Backend, PostgreSQL)
**Budget Temps** : ~6-8 semaines (phases itératives)
**Priorité** : Haute - Impact direct sur gestion académique

---

## 🎯 OBJECTIF PRINCIPAL

Créer un système modulaire et intégré permettant de :
1. ✅ Gérer les menus variés du CROU avec composition produits
2. ✅ Émettre & tracker les tickets de restauration par catégories
3. ✅ Enregistrer les besoins quotidiens avec déduction du stock (validation manuelle)
4. ✅ Tracker les pertes/gaspillage
5. ✅ Générer des rapports journaliers/mensuels/annuels
6. ✅ Exporter en PDF et Excel
7. ✅ Synchroniser avec module Stock existant (API)
8. ✅ Intégrer données financières (module Comptabilité existant)

---

## 📊 VUE D'ENSEMBLE ARCHITECTURE

```
┌─────────────────────────────┐
│   FRONTEND (Next.js/React)  │
├─────────────────────────────┤
│ • Pages: Menus, Tickets,    │
│ • Besoins, Pertes, Rapports │
│ • Dashboards                │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
    [API REST]    [WebSockets pour
    Restauration  notifications]
       │                │
       ▼                │
┌──────────────────────────────────┐
│   BACKEND (Express/FastAPI/etc)  │
├──────────────────────────────────┤
│ Controllers:                     │
│ • MenuController                 │
│ • TicketController               │
│ • BesoinsController              │
│ • PertesController               │
│ • RapportsController             │
│ • IntégrationController (Stock)  │
└──────────────┬───────────────────┘
               │
       ┌───────┼───────┐
       │       │       │
       ▼       ▼       ▼
    [BD Local] [API Stock] [API Finances]
       │           │           │
   Postgres    Existante   Existante
```

---

## 🧩 MODULES À IMPLÉMENTER (Ordre Recommandé)

### MODULE 1 : Base de Données & ORM
**Responsabilité** : Créer le schéma BD + migrations

**Livrables** :
- [ ] 6 tables : Menus, Détails_Menus, Catégories_Tickets, Tickets, Besoins, Détails_Besoins, Consommation, Pertes
- [ ] Migrations (`2025-04-24-001-create-menus.sql` etc)
- [ ] Modèles ORM (Django/SQLAlchemy/Sequelize)
- [ ] Index sur clés étrangères + dates (perfs)
- [ ] Soft-delete pour audit trail

**Fichiers à créer** :
```
src/models/
├── Menu.js
├── CategorieTicket.js
├── Ticket.js
├── Besoin.js
├── DetailBesoin.js
├── Consommation.js
├── Perte.js
└── index.js (exports)

src/migrations/
├── 2025-04-24-001-init-restauration.js
├── 2025-04-24-002-add-pertes.js
└── 2025-04-24-003-add-consommation.js
```

**Acceptance Criteria** :
- ✅ Toutes tables créées et testées
- ✅ Relations FK valides
- ✅ Seed data : Tarifs CROU (150/350/350 FCFA)

---

### MODULE 2 : API CRUD - Menus
**Responsabilité** : CRUD complet pour menus

**Livrables** :
- [ ] Endpoints : GET (list + detail), POST (create), PUT (edit), DELETE (inactiver)
- [ ] Validation : nom_menu obligatoire, type_service ENUM, date_application valide
- [ ] Filtrage : date_from/to, type_service, statut
- [ ] Détails menus : Gestion tableau produits dynamique

**Endpoints à créer** :
```javascript
GET    /api/restauration/menus                    // Liste avec filtres
POST   /api/restauration/menus                    // Créer menu
GET    /api/restauration/menus/:menu_id           // Détail
PUT    /api/restauration/menus/:menu_id           // Éditer
DELETE /api/restauration/menus/:menu_id           // Inactiver
GET    /api/restauration/menus/:menu_id/details   // Produits du menu
POST   /api/restauration/menus/:menu_id/details   // Ajouter produit
DELETE /api/restauration/menus/:menu_id/details/:detail_id // Enlever produit
```

**Tests** :
```javascript
describe('MenuAPI', () => {
  test('CREATE menu avec composition');
  test('GET menu calcule coût total');
  test('EDIT menu met à jour détails');
  test('FILTER par date + type_service');
  test('DELETE inactif menu');
});
```

**Acceptance Criteria** :
- ✅ CRUD 100% fonctionnel
- ✅ Validation stricte
- ✅ Retours d'erreur explicites

---

### MODULE 3 : API CRUD - Tickets & Catégories
**Responsabilité** : Gestion tickets (émission + catégories)

**Livrables** :
- [ ] Catégories CRUD
- [ ] Ticket CRUD
- [ ] Émission batch de tickets
- [ ] Validation statuts (Non_Validé → Validé → Encaissé)

**Endpoints** :
```javascript
// Catégories
GET    /api/restauration/categories-tickets
POST   /api/restauration/categories-tickets
PUT    /api/restauration/categories-tickets/:id
DELETE /api/restauration/categories-tickets/:id

// Tickets
GET    /api/restauration/tickets?date_from=&date_to=&statut=
POST   /api/restauration/tickets                  // Émettre 1+ tickets
GET    /api/restauration/tickets/:ticket_id
PATCH  /api/restauration/tickets/:ticket_id/valider
PATCH  /api/restauration/tickets/:ticket_id/encaisser
```

**Règles métier** :
- Ticket.montant_total = quantité × prix_unitaire (calculé, pas saisi)
- Type_service doit matcher avec catégorie_ticket
- Gratuités = catégorie spéciale avec prix = 0
- Validation = débloquer pour encaissement

**Tests** :
```javascript
describe('TicketAPI', () => {
  test('Émettre 50 tickets réguliers');
  test('Tarifs varient par type_service');
  test('Gratuités montant = 0');
  test('Status flow: Non_Validé → Validé → Encaissé');
});
```

---

### MODULE 4 : API CRUD - Besoins Quotidiens
**Responsabilité** : Gestion besoins journaliers + calcul automatique

**Livrables** :
- [ ] Création fiche besoins (sélection date, type_service, menu)
- [ ] Calcul automatique produits requis
- [ ] Affichage stock disponible
- [ ] Bouton "Valider & Déduire du Stock"

**Endpoints** :
```javascript
GET    /api/restauration/besoins?date=&type_service=
POST   /api/restauration/besoins                  // Créer fiche
GET    /api/restauration/besoins/:besoin_id
PUT    /api/restauration/besoins/:besoin_id      // Éditer (avant validation)
POST   /api/restauration/besoins/:besoin_id/deduire-stock  // ⭐ CLÉE
PATCH  /api/restauration/besoins/:besoin_id/valider
```

**Logique critique** :
```javascript
// POST /api/restauration/besoins
1. Créer record Besoin (statut = Brouillon)
2. Récupérer menu_id
3. Fetch détails menu → liste produits + quantité_unitaire
4. Calculer : quantite_totale = nombre_rationnaires × quantité_unitaire
5. Pour chaque produit :
   a. GET /api/stock/produits/{id}/disponibilite
   b. Créer DetailBesoin avec stock_disponible
   c. Calculer suffisance : stock_disponible >= quantite_totale
6. Retourner tableau détails avec statuts

// POST /api/restauration/besoins/:besoin_id/deduire-stock
1. Récupérer tous les DetailBesoins
2. Vérifier tous les produits ont statut OK (sinon rejeter)
3. Construire payload pour API Stock :
   {
     "type_mouvement": "Consommation_Restauration",
     "reference_restauration": besoin_id,
     "date": date_besoin,
     "mouvements": [
       { produit_id, quantite, motif: "Besoins quotidiens" }, ...
     ]
   }
4. Appel POST /api/stock/mouvements
5. Si OK :
   - Mettre à jour Besoin.statut = Stock_Déduit
   - Loger succès
   - Retourner confirmation
6. Si ERREUR :
   - Mettre à jour Besoin.statut = Erreur_Déduction
   - Retourner détail erreur (produit, stock_insuffisant, etc)
7. Pas de rollback partiel (tout ou rien)
```

**Tests** :
```javascript
describe('BesoinsAPI', () => {
  test('Création calcule automatiquement produits requis');
  test('Stock insuffisant affiche ⚠️');
  test('Bouton déduction appelle API Stock correctement');
  test('Succès : Statut passe à Stock_Déduit');
  test('Erreur : Permet corriger menu ou qty');
});
```

---

### MODULE 5 : API CRUD - Consommation
**Responsabilité** : Tracker consommation réelle post-service

**Livrables** :
- [ ] Fiche de consommation (après service)
- [ ] Nombre rationnaires effectivement servis
- [ ] Détection anomalies

**Endpoints** :
```javascript
POST   /api/restauration/consommation
GET    /api/restauration/consommation?date=&type_service=
PATCH  /api/restauration/consommation/:id
```

**Champs** :
- besoin_id (FK)
- nombre_rationnaires_servis (INT)
- statut (Servi, Non_Servi, Partiellement_Servi)
- notes (anomalies)

---

### MODULE 6 : API CRUD - Pertes/Gaspillage
**Responsabilité** : Enregistrer & synchroniser pertes vers Stock

**Livrables** :
- [ ] Interface saisie pertes
- [ ] Calcul valeur FCFA automatique
- [ ] API appel Stock pour mouvement
- [ ] Statistiques gaspillage

**Endpoints** :
```javascript
POST   /api/restauration/pertes                  // Enregistrer perte
GET    /api/restauration/pertes?date_from=&motif=
GET    /api/restauration/pertes/statistiques?mois=
DELETE /api/restauration/pertes/:id              // Soft-delete
```

**Logique critique** :
```javascript
// POST /api/restauration/pertes
1. Valider produit_id, quantite_perdue, motif
2. GET /api/stock/produits/{id} → prix_unitaire
3. Calculer value_fcfa = quantite_perdue × prix_unitaire
4. Créer record Perte
5. POST /api/stock/mouvements
   {
     "type_mouvement": "Perte_Gaspillage",
     "produit_id": id,
     "quantite": quantite_perdue,
     "motif": motif,
     "date_peremption": date_peremption (si applicable),
     "value_fcfa": value_fcfa,
     "reference_restauration": perte_id
   }
6. Log succès/erreur
7. Retourner perte créée
```

**Statistiques** :
```javascript
// GET /api/restauration/pertes/statistiques?mois=2025-04
1. Fetch toutes pertes du mois
2. Calculer :
   - Total pertes FCFA
   - Taux gaspillage = (Σ pertes value) / (Σ stock consommé value) × 100
   - Produit le plus gaspillé
   - Distribution par motif
3. Retourner objets stats
```

---

### MODULE 7 : API Rapports & Exports
**Responsabilité** : Agrégation données + génération rapports PDF/Excel

**Livrables** :
- [ ] Rapports journalier/mensuel/annuel
- [ ] Graphiques (Recharts/Chart.js)
- [ ] Export PDF (jsPDF)
- [ ] Export Excel (SheetJS)

**Endpoints** :
```javascript
GET    /api/restauration/rapports/journalier?date=YYYY-MM-DD
GET    /api/restauration/rapports/mensuel?mois=YYYY-MM
GET    /api/restauration/rapports/annuel?annee=YYYY
POST   /api/restauration/rapports/export-pdf     // Génère background
POST   /api/restauration/rapports/export-excel
GET    /api/restauration/rapports/export-status/:task_id  // Check status
```

**Rapport Journalier (JSON)** :
```javascript
{
  "date": "2025-04-24",
  "crou": "CROU Niamey",
  "services": {
    "petit_dejeuner": {
      "menu": "Thé + Pain",
      "tickets_payants": 100,
      "tickets_gratuits": 20,
      "total_consommateurs": 120,
      "recettes_fcfa": 18000,
      "pertes": []
    },
    "dejeuner": { ... },
    "diner": { ... }
  },
  "totaux": {
    "total_consommateurs": 550,
    "recettes_total": 192500,
    "pertes_total_fcfa": 1200
  }
}
```

**Rapport Mensuel** :
```javascript
{
  "mois": "2025-04",
  "synthese_semaines": [
    {
      "semaine": 1,
      "total_consommateurs": 0,
      "recettes": 0
    },
    ...
  ],
  "moyennes": {
    "consommateurs_par_jour": 43.3,
    "recettes_par_jour": 13366
  },
  "evolution_vs_mois_precedent": "+15%"
}
```

**Export PDF** :
- Utiliser jsPDF + html2canvas
- Branding MESRIT/CROU
- Tableaux + Graphiques
- 1-2 pages max

**Export Excel** :
- SheetJS (xlsx)
- Feuilles : Données brutes, Graphiques, Synthèse
- Formules pour calculs additionnels
- Mise en forme professionnelle

---

### MODULE 8 : Frontend - Interfaces Utilisateur
**Responsabilité** : Pages React / Next.js pour chaque fonctionnalité

**Pages à créer** :
```
src/pages/restauration/
├── dashboard.js          // Tableau de bord main
├── menus/
│  ├── index.js          // Liste menus
│  ├── [id].js           // Détail menu
│  └── nouveau.js        // Créer menu
├── tickets/
│  ├── index.js          // Historique tickets
│  └── emettre.js        // Émettre tickets
├── besoins/
│  ├── index.js          // Historique besoins
│  └── nouveau.js        // Créer fiche besoin
├── pertes/
│  ├── index.js          // Historique pertes
│  └── nouveau.js        // Enregistrer perte
├── rapports/
│  ├── index.js          // Page rapports
│  └── [type].js         // Rapport détail
└── parametres.js        // Config tarifs
```

**Composants partagés** :
```
src/components/restauration/
├── MenuForm.jsx         // Formulaire + tableau produits
├── TicketEmission.jsx   // Interface émission
├── BesoinsForm.jsx      // Fiche besoins
├── PertesForm.jsx       // Formulaire pertes
├── RapportTable.jsx     // Affichage rapports
├── RapportCharts.jsx    // Graphiques
├── StockStatus.jsx      // Affichage stock dispo
└── ConfirmationModals.jsx // Modales validation
```

**Détail interface clée : BesoinsForm**
```jsx
const BesoinsForm = () => {
  const [date, setDate] = useState();
  const [typeService, setTypeService] = useState('Déjeuner');
  const [menuId, setMenuId] = useState();
  const [rationnaires, setRationnaires] = useState(2000);
  const [besoins, setBesoins] = useState([]);  // Tableau produits
  const [loading, setLoading] = useState(false);

  // Loader : quand menu change, calculer besoins
  useEffect(() => {
    if (!menuId) return;
    (async () => {
      const détailsMenu = await API.get(`/menus/${menuId}/details`);
      const besoinsCalculés = détailsMenu.map(detail => ({
        produit_id: detail.produit_id,
        produit_nom: detail.produit.nom,
        ration_unitaire: detail.ration_unitaire,
        quantite_totale: rationnaires * detail.ration_unitaire,
        stock_disponible: await API.get(`/stock/${detail.produit_id}/dispo`),
        suffisant: stock >= (rationnaires * detail.ration_unitaire)
      }));
      setBesoins(besoinsCalculés);
    })();
  }, [menuId, rationnaires]);

  // Bouton déduction
  const handleDeduireStock = async () => {
    // Popup confirmation
    if (!confirm("Confirmer déduction du stock ?")) return;

    try {
      const response = await API.post(
        `/besoins/${besoins.id}/deduire-stock`
      );
      if (response.success) {
        showSuccess("✓ Stock déduit avec succès !");
        // Refresh besoins état
      } else {
        showError(response.erreur);  // Ex: "Riz insuffisant (30 vs 50)"
      }
    } catch (error) {
      showError("Erreur déduction: " + error.message);
    }
  };

  return (
    <form>
      <DatePicker value={date} onChange={setDate} />
      <Select value={typeService} onChange={setTypeService}>
        <option>Petit déjeuner</option>
        <option>Déjeuner</option>
        <option>Dîner</option>
      </Select>
      <MenuSelector value={menuId} onChange={setMenuId} type={typeService} />
      <Input value={rationnaires} onChange={setRationnaires} label="Rationnaires" />

      <Table>
        <TableHeader>
          <th>Produit</th>
          <th>Ration/unit</th>
          <th>Quantité totale</th>
          <th>Stock dispo</th>
          <th>Statut</th>
        </TableHeader>
        <TableBody>
          {besoins.map(b => (
            <tr key={b.produit_id}>
              <td>{b.produit_nom}</td>
              <td>{b.ration_unitaire}</td>
              <td>{b.quantite_totale}</td>
              <td>{b.stock_disponible}</td>
              <td>
                {b.suffisant ? (
                  <span className="badge-ok">✓ OK</span>
                ) : (
                  <span className="badge-alert">⚠️ Insuffisant</span>
                )}
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>

      <Button 
        onClick={handleDeduireStock} 
        className="btn-primary-lg"
        style={{ backgroundColor: '#dc3545' }}
      >
        🔴 Valider & Déduire du Stock
      </Button>
    </form>
  );
};
```

---

### MODULE 9 : Intégration API Stock
**Responsabilité** : Wrapper + tester appels vers API Stock existante

**Fichiers** :
```
src/services/
├── stockAPI.js          // Wrapper pour appels Stock
└── restaurationAPI.js   // Appels Restauration
```

**StockAPI (exemple)** :
```javascript
// src/services/stockAPI.js
export const stockAPI = {
  // Récupérer produits alimentaires
  async getProduits(type = 'Alimentaire') {
    return fetch('/api/stock/produits?type=' + type)
      .then(r => r.json())
      .catch(e => {
        logger.error('StockAPI.getProduits failed:', e);
        throw new Error('Impossible récupérer produits');
      });
  },

  // Vérifier disponibilité 1 produit
  async getDisponibilite(produit_id) {
    return fetch(`/api/stock/produits/${produit_id}/disponibilite`)
      .then(r => r.json())
      .catch(e => {
        logger.error(`StockAPI.getDisponibilite(${produit_id}) failed:`, e);
        throw new Error('Impossible vérifier stock');
      });
  },

  // ⭐ Créer mouvement de déduction
  async createMouvement(payload) {
    // payload = {
    //   type_mouvement: "Consommation_Restauration",
    //   reference_restauration: besoin_id,
    //   date: YYYY-MM-DD,
    //   mouvements: [{produit_id, quantite, motif}, ...]
    // }

    const response = await fetch('/api/stock/mouvements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // Erreur détaillée du Stock
      logger.error('StockAPI.createMouvement failed:', data);
      throw new Error(data.erreur || 'Erreur créer mouvement stock');
    }

    return data;
  }
};
```

---

### MODULE 10 : Dashboard & Notifications
**Responsabilité** : Widget restauration + alertes temps réel

**Dashboard Widget** :
```jsx
<DashboardWidget title="Restauration">
  <Metric label="Fréquentation aujourd'hui" value={550} />
  <Metric label="Recettes" value="192,500 FCFA" />
  <Metric label="Pertes" value="1,200 FCFA" />
  <StatusIndicator 
    label="État stock"
    value={numberOfAlerts > 0 ? "Alertes" : "Normal"}
    color={numberOfAlerts > 0 ? "red" : "green"}
  />
</DashboardWidget>
```

**Notifications** :
- WebSocket pour ruptures stock (temps réel)
- Toast pour confirmations actions
- Email digest (optionnel)

---

## 🧪 STRATÉGIE DE TEST

### Tests Unitaires
```
coverage: 80%+ pour logique critique

Des tests pour:
├─ Calculs (besoins, recettes, gaspillage)
├─ Validations (montants positifs, dates valides)
├─ Transitions statuts (Brouillon → Validé → Stock_Déduit)
└─ Appels API (mocks Stock)
```

### Tests Intégration
```
des tests pour:
├─ Workflow complet menu → besoin → déduction
├─ Erreur déduction → rollback
├─ Pertes → sync Stock
├─ Export PDF/Excel → fichier généré
└─ Rapports → données correctes
```

### Tests Manuels (UAT)
```
Liste UAT à faire avec Roufai:
├─ Émission 50 tickets + vérif total recettes
├─ Créer besoin, stock insuffisant, essayer déduction → ✓ Erreur OK
├─ Corriger menu, réessayer déduction → ✓ Succès
├─ Enregistrer perte, vérifier sync vers stock
├─ Générer rapport PDF, vérifier format
└─ Dashboard mise à jour temps réel
```

---

## 📅 TIMELINE RECOMMANDÉE

| Phase | Durée | Modules | Status |
|-------|-------|---------|--------|
| **1: Setup & BD** | 1 sem | 1-2 | ⏳ En cours |
| **2: API Core** | 1.5 sem | 3-5 | ⏳ À faire |
| **3: Stock Integration** | 1 sem | Modules 4+6 liaison | ⏳ À faire |
| **4: Frontend** | 1.5 sem | 8 | ⏳ À faire |
| **5: Rapports** | 1 sem | 7 | ⏳ À faire |
| **6: Polish & Tests** | 0.5 sem | All | ⏳ À faire |
| **7: UAT & Deploy** | 0.5 sem | All | ⏳ À faire |

**Total: ~6.5 semaines**

---

## 🚨 RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| API Stock indisponible pendant dev | Moyen | Élevé | Mocker API tôt, tests indépendants |
| Volumes importants (1000s tickets/jour) | Bas | Élevé | Index BD, pagination, caching |
| Changement tarifs en cours de journée | Bas | Moyen | Gel tarif à 00:00, historique |
| Données sync cassées | Bas | Critique | Logs détaillés + endpoint reconciliation |
| Oubli intégration Finances | Moyen | Moyen | Planifier tôt dans MODULE 7 |
| Performance exports Excel gros volumes | Bas | Moyen | Générer en background (Bull) |

---

## 🎁 DELIVERABLES FINAUX

```
├─ Code source (GitHub/GitLab)
│  ├─ Backend (API + tests)
│  └─ Frontend (Pages + composants)
├─ Documentation
│  ├─ README installation
│  ├─ API docs (Swagger/OpenAPI)
│  ├─ Diagrammes architecture
│  └─ Procédures opérationnelles
├─ Database
│  ├─ Migrations
│  ├─ Seed data (tarifs, catégories)
│  └─ Backup init
├─ Tests
│  ├─ Unit tests (80%+ coverage)
│  ├─ Integration tests
│  └─ UAT checklist
└─ Deployment
   ├─ Docker compose (dev + prod)
   ├─ CI/CD pipeline
   └─ Runbooks (troubleshooting)
```

---

## 📞 POINTS DE CONTACT

**Propriétaire Projet** : Roufai
- Clarifications métier
- Décisions architecture
- Feedback UAT

**Tech Lead (Si existant)** :
- Code review
- Standards projet

**Admin Infrastructure** :
- Accès API Stock
- Deployment prod

---

## ✅ CHECKLIST PRE-LANCEMENT

- [ ] Accès BD dev configuré
- [ ] API Stock documentée + testée
- [ ] Team dev familiarisée avec projet
- [ ] Stack technologique confirmée
- [ ] Tarifs CROU 2025 confirmés (150/350/350 ?)
- [ ] Design UI approuvé
- [ ] Plan de migration données (si upgrading)
- [ ] Alertes/notifications configurées
- [ ] Monitoring BD setup (logs, perfs)
- [ ] Plan backup & disaster recovery

---

## 🚀 LET'S BUILD IT !

**Contact Roufai** : Démarrage immédiat si tous les pré-requis OK

**Prochaine étape** : 
1. Confirmer stack tech
2. Créer repo GitHub
3. Setup BD dev
4. Débuter MODULE 1 (Migrations)

---

*Document généré le : 2025-04-24*
*Version : 1.0*
*Auteur : AI Coordination Assistant*