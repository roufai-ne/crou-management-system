/**
 * FICHIER: apps/web/src/services/api/restaurationService.ts
 * SERVICE: RestaurationService - Service pour la gestion de la restauration universitaire
 *
 * DESCRIPTION:
 * Service pour la gestion complète du module Restauration
 * Support multi-tenant avec permissions granulaires
 * Gestion restaurants, menus, tickets, repas, denrées
 *
 * FONCTIONNALITÉS:
 * - Gestion des restaurants universitaires
 * - Planification et composition des menus
 * - Émission et utilisation de tickets repas
 * - Suivi des distributions de repas
 * - Allocation et gestion des denrées
 * - Intégration avec module Stocks
 * - Statistiques et rapports
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// ========================================
// TYPES RESTAURANTS
// ========================================

export enum RestaurantType {
  UNIVERSITAIRE = 'universitaire',
  CAFETERIA = 'cafeteria',
  CANTINE = 'cantine'
}

export enum RestaurantStatus {
  ACTIF = 'actif',
  FERME_TEMPORAIRE = 'ferme_temporaire',
  MAINTENANCE = 'maintenance',
  INACTIF = 'inactif'
}

export interface Restaurant {
  id: string;
  tenantId: string;
  code: string;
  nom: string;
  type: RestaurantType;
  description?: string;
  adresse: string;
  ville: string;
  telephone?: string;
  capaciteAccueil: number;
  frequentationMoyenne?: number;
  horaires?: {
    petitDejeuner?: { debut: string; fin: string };
    dejeuner?: { debut: string; fin: string };
    diner?: { debut: string; fin: string };
  };
  equipements?: string[];
  tarifs?: {
    petitDejeuner: number;
    dejeuner: number;
    diner: number;
  };
  status: RestaurantStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRestaurantRequest {
  code: string;
  nom: string;
  type: RestaurantType;
  description?: string;
  adresse: string;
  ville: string;
  telephone?: string;
  capaciteAccueil: number;
  horaires?: Restaurant['horaires'];
  equipements?: string[];
  tarifs?: Restaurant['tarifs'];
}

export interface UpdateRestaurantRequest {
  nom?: string;
  description?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  capaciteAccueil?: number;
  horaires?: Restaurant['horaires'];
  equipements?: string[];
  tarifs?: Restaurant['tarifs'];
  status?: RestaurantStatus;
}

export interface RestaurantStatistics {
  totalRepasServis: number;
  tauxFrequentation: number;
  recettesTotales: number;
  nombreTicketsEmis: number;
  periodeStats: {
    debut: Date;
    fin: Date;
  };
}

// ========================================
// TYPES MENUS
// ========================================

export enum TypeRepas {
  PETIT_DEJEUNER = 'petit_dejeuner',
  DEJEUNER = 'dejeuner',
  DINER = 'diner'
}

export enum MenuStatus {
  BROUILLON = 'brouillon',
  PUBLIE = 'publie',
  VALIDE = 'valide'
}

export interface IngredientMenu {
  stockId: string;
  nomDenree: string;
  quantiteUnitaire: number;
  unite: string;
  coutUnitaire: number;
}

export interface PlatMenu {
  nom: string;
  description?: string;
  ingredients: IngredientMenu[];
  categorieApport?: string;
}

export interface BesoinDenree {
  stockId: string;
  nomDenree: string;
  quantiteTotale: number;
  unite: string;
  stockDisponible: number;
  suffisant: boolean;
}

export interface Menu {
  id: string;
  tenantId: string;
  restaurantId: string;
  nom: string;
  description?: string;
  dateService: Date;
  typeRepas: TypeRepas;
  plats: PlatMenu[];
  nombreRationnairesPrevu: number;
  coutMatierePremiere: number;
  coutUnitaire: number;
  besoinsDenrees?: BesoinDenree[];
  status: MenuStatus;
  publishedAt?: Date;
  validatedAt?: Date;
  validatedBy?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  restaurant?: Restaurant;
}

export interface CreateMenuRequest {
  restaurantId: string;
  nom: string;
  description?: string;
  dateService: string; // ISO date
  typeRepas: TypeRepas;
  plats: PlatMenu[];
  nombreRationnairesPrevu: number;
}

export interface UpdateMenuRequest {
  nom?: string;
  description?: string;
  dateService?: string;
  plats?: PlatMenu[];
  nombreRationnairesPrevu?: number;
}

// ========================================
// TYPES TICKETS
// ========================================

export enum TypeTicket {
  UNITAIRE = 'unitaire',
  FORFAIT_HEBDO = 'forfait_hebdo',
  FORFAIT_MENSUEL = 'forfait_mensuel',
  GRATUIT = 'gratuit'
}

export enum TicketStatus {
  ACTIF = 'actif',
  UTILISE = 'utilise',
  EXPIRE = 'expire',
  ANNULE = 'annule',
  SUSPENDU = 'suspendu'
}

export enum CategorieTicket {
  ETUDIANT_BOURSIER = 'etudiant_boursier',
  ETUDIANT_NON_BOURSIER = 'etudiant_non_boursier',
  PERSONNEL = 'personnel',
  INVITE = 'invite'
}

export interface TicketRepas {
  id: string;
  tenantId: string;
  numeroTicket: string; // TKT-2025-XXXXXX
  etudiantId: string;
  etudiantNom?: string;
  type: TypeTicket;
  categorie: CategorieTicket;
  montant: number;
  dateEmission: Date;
  dateExpiration: Date;
  nombreRepasInitial?: number;
  nombreRepasRestants?: number;
  estUtilise: boolean;
  dateUtilisation?: Date;
  repasId?: string;
  status: TicketStatus;
  motifAnnulation?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface anonyme - pas de lien avec étudiant
export interface CreateTicketRequest {
  categorie: CategorieTicket; // PAYANT ou GRATUIT
  typeRepas: TypeRepas; // PETIT_DEJEUNER, DEJEUNER, DINER
  tarif: number; // Montant en FCFA (0 si gratuit)
  dateExpiration: string; // ISO date
  annee?: number; // Année (défaut: année courante)
  methodePaiement?: string; // Si payant: ESPECES, CARTE, MOBILE_MONEY
  referencePaiement?: string; // Référence transaction si applicable
  messageIndication?: string; // Message sur le ticket
  notes?: string;
}

export interface CreateTicketsBatchRequest {
  quantite: number; // Nombre de tickets à créer
  categorie: CategorieTicket;
  typeRepas: TypeRepas;
  tarif: number;
  dateExpiration: string;
  annee?: number;
  messageIndication?: string;
}

export interface UtiliserTicketRequest {
  numeroTicket: string;
  repasId: string;
  restaurantId: string;
}

export interface TicketValidationResult {
  valide: boolean;
  raison?: string;
  ticket?: TicketRepas;
}

// ========================================
// TYPES REPAS
// ========================================

export enum RepasStatus {
  PLANIFIE = 'planifie',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule'
}

export interface Repas {
  id: string;
  tenantId: string;
  restaurantId: string;
  menuId: string;
  dateService: Date;
  typeRepas: TypeRepas;
  heureDebut?: Date;
  heureFin?: Date;
  nombrePrevus: number;
  nombreServis: number;
  coutMatieresPremières: number;
  nombreTicketsUnitaires: number;
  nombreTicketsForfaits: number;
  nombreTicketsGratuits: number;
  recettesTotales: number;
  margeBrute: number;
  tauxFrequentation?: number;
  gaspillageEstime?: number;
  valeurGaspillage?: number;
  observations?: string;
  status: RepasStatus;
  motifAnnulation?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  restaurant?: Restaurant;
  menu?: Menu;
}

export interface CreateRepasRequest {
  restaurantId: string;
  menuId: string;
  dateService: string; // ISO date
  typeRepas: TypeRepas;
  heureDebut?: string; // ISO datetime
  nombrePrevus: number;
}

export interface TerminerServiceRequest {
  nombreServis: number;
  nombreTicketsUnitaires: number;
  nombreTicketsForfaits: number;
  nombreTicketsGratuits: number;
  recettesUnitaires: number;
  recettesForfaits: number;
  montantSubventions: number;
  gaspillageEstime?: number;
  observations?: string;
}

export interface RepasStatistiques {
  tauxFrequentation: number;
  tauxUtilisationCapacite: number;
  recettesMoyennes: number;
  margeBrute: number;
  tauxGaspillage: number;
}

// ========================================
// TYPES DENRÉES
// ========================================

export enum AllocationStatus {
  ALLOUEE = 'allouee',
  PARTIELLEMENT_UTILISEE = 'partiellement_utilisee',
  UTILISEE = 'utilisee',
  RETOURNEE = 'retournee',
  PERDUE = 'perdue'
}

export enum TypeMouvementDenree {
  ALLOCATION = 'allocation',
  UTILISATION = 'utilisation',
  RETOUR = 'retour',
  PERTE = 'perte'
}

export interface MouvementHistorique {
  date: string;
  type: TypeMouvementDenree;
  quantite: number;
  utilisateur: string;
  menuId?: string;
  repasId?: string;
  motif?: string;
}

export interface StockDenree {
  id: string;
  tenantId: string;
  stockId: string;
  nomDenree: string;
  restaurantId: string;
  quantiteAllouee: number;
  quantiteUtilisee: number;
  quantiteRestante: number;
  unite: string;
  dateAllocation: Date;
  datePeremption: Date;
  prixUnitaire: number;
  valeurTotale: number;
  status: AllocationStatus;
  mouvementStockCree: boolean;
  stockMovementId?: string;
  historiqueMouvements?: MouvementHistorique[];
  motifAllocation?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AllouerDenreeRequest {
  stockId: string;
  restaurantId: string;
  quantiteAllouee: number;
  datePeremption: string; // ISO date
  motifAllocation?: string;
}

export interface AlerteExpiration {
  allocation: StockDenree;
  joursRestants: number;
  priorite: 'haute' | 'moyenne' | 'basse';
}

// ========================================
// TYPES GÉNÉRAUX
// ========================================

export interface RestaurantFilters {
  search?: string;
  type?: RestaurantType;
  status?: RestaurantStatus;
  ville?: string;
}

export interface MenuFilters {
  search?: string;
  dateDebut?: string;
  dateFin?: string;
  typeRepas?: TypeRepas;
  status?: MenuStatus;
  restaurantId?: string;
}

export interface TicketFilters {
  etudiantId?: string;
  status?: TicketStatus;
  type?: TypeTicket;
  categorie?: CategorieTicket;
  dateEmissionDebut?: string;
  dateEmissionFin?: string;
  numeroTicket?: string;
}

export interface RepasFilters {
  dateDebut?: string;
  dateFin?: string;
  typeRepas?: TypeRepas;
  status?: RepasStatus;
  restaurantId?: string;
}

export interface DenreeFilters {
  restaurantId?: string;
  status?: AllocationStatus;
  alerteExpiration?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ========================================
// SERVICE API
// ========================================

export const restaurationService = {
  // ========================================
  // RESTAURANTS
  // ========================================

  async getRestaurants(filters?: RestaurantFilters): Promise<{ restaurants: Restaurant[]; total: number }> {
    const response = await apiClient.get('/restauration/restaurants', { params: filters });
    return response.data.data;
  },

  async getRestaurant(id: string): Promise<Restaurant> {
    const response = await apiClient.get(`/restauration/restaurants/${id}`);
    return response.data.data;
  },

  async createRestaurant(data: CreateRestaurantRequest): Promise<Restaurant> {
    const response = await apiClient.post('/restauration/restaurants', data);
    return response.data.data;
  },

  async updateRestaurant(id: string, data: UpdateRestaurantRequest): Promise<Restaurant> {
    const response = await apiClient.put(`/restauration/restaurants/${id}`, data);
    return response.data.data;
  },

  async deleteRestaurant(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/restauration/restaurants/${id}`);
    return response.data.data;
  },

  async getRestaurantStatistics(id: string): Promise<RestaurantStatistics> {
    const response = await apiClient.get(`/restauration/restaurants/${id}/statistics`);
    return response.data.data;
  },

  async updateFrequentationMoyenne(id: string, frequentation: number): Promise<Restaurant> {
    const response = await apiClient.patch(`/restauration/restaurants/${id}/frequentation`, { frequentation });
    return response.data.data;
  },

  // ========================================
  // MENUS
  // ========================================

  async getMenus(filters?: MenuFilters): Promise<{ menus: Menu[]; total: number }> {
    const response = await apiClient.get('/restauration/menus', { params: filters });
    return response.data.data;
  },

  async getMenu(id: string): Promise<Menu> {
    const response = await apiClient.get(`/restauration/menus/${id}`);
    return response.data.data;
  },

  async createMenu(data: CreateMenuRequest): Promise<Menu> {
    const response = await apiClient.post('/restauration/menus', data);
    return response.data.data;
  },

  async updateMenu(id: string, data: UpdateMenuRequest): Promise<Menu> {
    const response = await apiClient.put(`/restauration/menus/${id}`, data);
    return response.data.data;
  },

  async deleteMenu(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/restauration/menus/${id}`);
    return response.data.data;
  },

  async publishMenu(id: string): Promise<Menu> {
    const response = await apiClient.post(`/restauration/menus/${id}/publish`);
    return response.data.data;
  },

  async validateMenu(id: string): Promise<Menu> {
    const response = await apiClient.post(`/restauration/menus/${id}/validate`);
    return response.data.data;
  },

  async calculateBesoins(id: string, nombreRationnaires: number): Promise<BesoinDenree[]> {
    const response = await apiClient.get(`/restauration/menus/${id}/besoins`, {
      params: { nombreRationnaires }
    });
    return response.data.data;
  },

  async getMenusByRestaurantAndDate(restaurantId: string, date: string): Promise<Menu[]> {
    const response = await apiClient.get(`/restauration/menus/restaurant/${restaurantId}/date/${date}`);
    return response.data.data;
  },

  async duplicateMenu(id: string, nouvelleDateService: string): Promise<Menu> {
    const response = await apiClient.post(`/restauration/menus/${id}/duplicate`, { nouvelleDateService });
    return response.data.data;
  },

  // ========================================
  // TICKETS
  // ========================================

  async getTickets(filters?: TicketFilters): Promise<{ tickets: TicketRepas[]; total: number }> {
    const response = await apiClient.get('/restauration/tickets', { params: filters });
    return response.data.data;
  },

  async getTicketByNumero(numeroTicket: string): Promise<TicketRepas> {
    const response = await apiClient.get(`/restauration/tickets/numero/${numeroTicket}`);
    return response.data.data;
  },

  async getTicketsByEtudiant(etudiantId: string): Promise<{ tickets: TicketRepas[]; actifs: number }> {
    const response = await apiClient.get(`/restauration/tickets/etudiant/${etudiantId}`);
    return response.data.data;
  },

  async createTicket(data: CreateTicketRequest): Promise<TicketRepas> {
    const response = await apiClient.post('/restauration/tickets', data);
    return response.data.data;
  },

  async createTicketsBatch(data: CreateTicketsBatchRequest): Promise<{ tickets: TicketRepas[]; total: number }> {
    const response = await apiClient.post('/restauration/tickets/batch', data);
    return response.data.data;
  },

  async utiliserTicket(data: UtiliserTicketRequest): Promise<TicketRepas> {
    const response = await apiClient.post('/restauration/tickets/utiliser', data);
    return response.data.data;
  },

  async annulerTicket(id: string, motif: string): Promise<TicketRepas> {
    const response = await apiClient.post(`/restauration/tickets/${id}/annuler`, { motif });
    return response.data.data;
  },

  async updateExpiredTickets(): Promise<{ updated: number }> {
    const response = await apiClient.post('/restauration/tickets/expired/update');
    return response.data.data;
  },

  // ========================================
  // REPAS
  // ========================================

  async getRepas(filters?: RepasFilters): Promise<{ repas: Repas[]; total: number }> {
    const response = await apiClient.get('/restauration/repas', { params: filters });
    return response.data.data;
  },

  async getRepasById(id: string): Promise<Repas> {
    const response = await apiClient.get(`/restauration/repas/${id}`);
    return response.data.data;
  },

  async createRepas(data: CreateRepasRequest): Promise<Repas> {
    const response = await apiClient.post('/restauration/repas', data);
    return response.data.data;
  },

  async demarrerService(id: string): Promise<Repas> {
    const response = await apiClient.post(`/restauration/repas/${id}/demarrer`);
    return response.data.data;
  },

  async terminerService(id: string, stats: TerminerServiceRequest): Promise<Repas> {
    const response = await apiClient.post(`/restauration/repas/${id}/terminer`, stats);
    return response.data.data;
  },

  async calculerStatistiques(id: string): Promise<RepasStatistiques> {
    const response = await apiClient.get(`/restauration/repas/${id}/statistiques`);
    return response.data.data;
  },

  async getRepasByRestaurantAndPeriode(
    restaurantId: string,
    dateDebut: string,
    dateFin: string
  ): Promise<{ repas: Repas[]; statistiques: RepasStatistiques }> {
    const response = await apiClient.get(`/restauration/repas/restaurant/${restaurantId}/periode`, {
      params: { dateDebut, dateFin }
    });
    return response.data.data;
  },

  async annulerRepas(id: string, motif: string): Promise<Repas> {
    const response = await apiClient.post(`/restauration/repas/${id}/annuler`, { motif });
    return response.data.data;
  },

  // ========================================
  // DENRÉES
  // ========================================

  async getDenrees(filters?: DenreeFilters): Promise<{ allocations: StockDenree[]; total: number }> {
    const response = await apiClient.get('/restauration/denrees', { params: filters });
    return response.data.data;
  },

  async getDenreesRestaurant(restaurantId: string): Promise<{ allocations: StockDenree[]; valeurTotale: number }> {
    const response = await apiClient.get(`/restauration/denrees/restaurant/${restaurantId}`);
    return response.data.data;
  },

  async allouerDenree(data: AllouerDenreeRequest): Promise<StockDenree> {
    const response = await apiClient.post('/restauration/denrees/allouer', data);
    return response.data.data;
  },

  async utiliserDenree(id: string, quantite: number, menuId?: string, repasId?: string): Promise<StockDenree> {
    const response = await apiClient.post(`/restauration/denrees/${id}/utiliser`, { quantite, menuId, repasId });
    return response.data.data;
  },

  async retournerDenree(id: string, quantite: number, motif: string): Promise<StockDenree> {
    const response = await apiClient.post(`/restauration/denrees/${id}/retourner`, { quantite, motif });
    return response.data.data;
  },

  async enregistrerPerte(id: string, quantite: number, motif: string): Promise<StockDenree> {
    const response = await apiClient.post(`/restauration/denrees/${id}/perte`, { quantite, motif });
    return response.data.data;
  },

  async getAlertesExpiration(joursAvance: number = 7): Promise<AlerteExpiration[]> {
    const response = await apiClient.get('/restauration/denrees/alertes/expiration', {
      params: { joursAvance }
    });
    return response.data.data;
  },

  async getHistoriqueMouvements(id: string): Promise<MouvementHistorique[]> {
    const response = await apiClient.get(`/restauration/denrees/${id}/historique`);
    return response.data.data;
  },
};
