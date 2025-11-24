export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  id: string;
  designation: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  quantityReceived: number;
  unit?: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  objet: string;
  description?: string;
  status: PurchaseOrderStatus;
  
  // Relations
  budgetId: string;
  supplierId: string;
  tenantId: string;
  
  // Supplier info (populated)
  supplier?: {
    id: string;
    nom: string;
    email?: string;
    telephone?: string;
  };
  
  // Budget info (populated)
  budget?: {
    id: string;
    libelle: string;
  };
  
  // Items
  items: PurchaseOrderItem[];
  
  // Montants
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  
  // Dates
  dateCommande?: string;
  dateApprobation?: string;
  dateLivraison?: string;
  createdAt: string;
  updatedAt: string;
  
  // Tracking
  createdBy?: string;
  approvedBy?: string;
  
  // Comments
  commentaire?: string;
  motifAnnulation?: string;
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus | string;
  supplierId?: string;
  budgetId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreatePurchaseOrderData {
  objet: string;
  description?: string;
  budgetId: string;
  supplierId: string;
  items: Array<{
    designation: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
  }>;
  tauxTVA?: number;
  dateCommande?: string;
  dateLivraison?: string;
  commentaire?: string;
}

export interface ReceivePurchaseOrderData {
  items: Array<{
    itemId: string;
    quantityReceived: number;
  }>;
  commentaire?: string;
  dateReception?: string;
}
