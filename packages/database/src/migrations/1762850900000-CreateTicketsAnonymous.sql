-- ===================================================
-- MIGRATION: CreateTicketsAnonymous (Combined)
-- DATE: Janvier 2025
-- FICHIER: 1762850900000-CreateTicketsAnonymous.sql
-- ===================================================
--
-- DESCRIPTION:
-- Création directe du système de tickets anonymes
-- Combine la création des tables ET le schéma anonyme (skip l'ancien schéma)
-- Crée: restaurants, menus, tickets_repas (anonyme), repas, stock_denrees
--
-- ===================================================

BEGIN;

-- Enregistrer la migration dans l'historique
INSERT INTO _migrations_history (timestamp, name)
VALUES (1762850900000, 'CreateTicketsAnonymous1762850900000')
ON CONFLICT DO NOTHING;

-- ========================================
-- 1. CRÉATION DES ENUMS
-- ========================================

-- Enum pour types de restaurants
CREATE TYPE "public"."restaurant_type_enum" AS ENUM(
    'universitaire',
    'cafeteria',
    'cantine'
);

-- Enum pour statuts de restaurants
CREATE TYPE "public"."restaurant_status_enum" AS ENUM(
    'actif',
    'ferme_temporaire',
    'maintenance',
    'inactif'
);

-- Enum pour types de repas
CREATE TYPE "public"."type_repas_enum" AS ENUM(
    'petit_dejeuner',
    'dejeuner',
    'diner'
);

-- Enum pour statuts de menus
CREATE TYPE "public"."menu_status_enum" AS ENUM(
    'brouillon',
    'publie',
    'valide',
    'archive'
);

-- Enum pour statuts de tickets (NOUVEAU - sans SUSPENDU)
CREATE TYPE "public"."ticket_status_enum" AS ENUM(
    'actif',
    'utilise',
    'expire',
    'annule'
);

-- Enum pour catégories de tickets (NOUVEAU - ANONYME)
CREATE TYPE "public"."categorie_ticket_enum" AS ENUM(
    'payant',
    'gratuit'
);

-- Enum pour statuts de repas
CREATE TYPE "public"."repas_status_enum" AS ENUM(
    'planifie',
    'en_cours',
    'termine',
    'annule'
);

-- Enum pour statuts d'allocation denrées
CREATE TYPE "public"."allocation_status_enum" AS ENUM(
    'allouee',
    'utilisee_partiellement',
    'utilisee_totalement',
    'expiree',
    'retournee'
);

-- Enum pour types de mouvements denrées
CREATE TYPE "public"."type_mouvement_denree_enum" AS ENUM(
    'allocation',
    'utilisation',
    'retour',
    'ajustement',
    'perte'
);

-- ========================================
-- 2. TABLE: restaurants
-- ========================================

CREATE TABLE "restaurants" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,
    "code" character varying(50) NOT NULL,
    "nom" character varying(255) NOT NULL,
    "description" text,
    "type" "public"."restaurant_type_enum" NOT NULL,
    "adresse" character varying(500) NOT NULL,
    "ville" character varying(100),
    "commune" character varying(100),
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "capaciteTotal" integer NOT NULL,
    "nombrePlaces" integer NOT NULL DEFAULT 0,
    "frequentationMoyenne" integer NOT NULL DEFAULT 0,
    "horaires" jsonb,
    "equipements" jsonb DEFAULT '[]',
    "status" "public"."restaurant_status_enum" NOT NULL DEFAULT 'actif',
    "isActif" boolean NOT NULL DEFAULT true,
    "tarifPetitDejeuner" numeric(10,2),
    "tarifDejeuner" numeric(10,2),
    "tarifDiner" numeric(10,2),
    "responsableNom" character varying(255),
    "responsableTelephone" character varying(100),
    "responsableEmail" character varying(255),
    "notes" text,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "createdBy" character varying(255) NOT NULL,
    "updatedBy" character varying(255),
    CONSTRAINT "PK_restaurants" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_restaurants_code" UNIQUE ("code"),
    CONSTRAINT "FK_restaurants_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IDX_restaurants_tenant_type" ON "restaurants" ("tenant_id", "type");
CREATE INDEX "IDX_restaurants_tenant_status" ON "restaurants" ("tenant_id", "status");
CREATE INDEX "IDX_restaurants_code" ON "restaurants" ("code");

-- ========================================
-- 3. TABLE: menus
-- ========================================

CREATE TABLE "menus" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,
    "restaurant_id" uuid NOT NULL,
    "nom" character varying(255) NOT NULL,
    "description" text,
    "dateService" date NOT NULL,
    "typeRepas" "public"."type_repas_enum" NOT NULL,
    "plats" jsonb NOT NULL,
    "nombreRationnairesPrevu" integer NOT NULL DEFAULT 0,
    "nombreReservations" integer NOT NULL DEFAULT 0,
    "coutMatierePremiere" numeric(10,2) NOT NULL DEFAULT 0,
    "coutUnitaire" numeric(10,2) NOT NULL DEFAULT 0,
    "prixVente" numeric(10,2),
    "besoinsDenrees" jsonb,
    "status" "public"."menu_status_enum" NOT NULL DEFAULT 'brouillon',
    "isActif" boolean NOT NULL DEFAULT true,
    "stockDeduit" boolean NOT NULL DEFAULT false,
    "date_validation" TIMESTAMP,
    "valide_par" character varying(255),
    "notes" text,
    "allergenesPresents" jsonb,
    "valeursNutritionnelles" jsonb,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "createdBy" character varying(255) NOT NULL,
    "updatedBy" character varying(255),
    CONSTRAINT "PK_menus" PRIMARY KEY ("id"),
    CONSTRAINT "FK_menus_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_menus_restaurant" FOREIGN KEY ("restaurant_id")
        REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IDX_menus_tenant_date" ON "menus" ("tenant_id", "dateService");
CREATE INDEX "IDX_menus_restaurant_date_type" ON "menus" ("restaurant_id", "dateService", "typeRepas");
CREATE INDEX "IDX_menus_status" ON "menus" ("status");

-- ========================================
-- 4. TABLE: tickets_repas (ANONYME)
-- ========================================

CREATE TABLE "tickets_repas" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,

    -- Informations ticket anonyme
    "numero_ticket" character varying(50) NOT NULL,
    "categorie" "public"."categorie_ticket_enum" NOT NULL,
    "type_repas" "public"."type_repas_enum" NOT NULL,
    "annee" integer NOT NULL DEFAULT 2025,
    "tarif" numeric(10,2) NOT NULL DEFAULT 0,

    -- QR Code et identification
    "qr_code" character varying(255) NOT NULL,
    "message_indication" character varying(500),

    -- Validité
    "date_emission" date NOT NULL,
    "date_expiration" date NOT NULL,
    "status" "public"."ticket_status_enum" NOT NULL DEFAULT 'actif',
    "est_utilise" boolean NOT NULL DEFAULT false,
    "date_utilisation" TIMESTAMP,

    -- Utilisation
    "restaurant_id" uuid,
    "repas_id" uuid,

    -- Paiement (si PAYANT)
    "methode_paiement" character varying(50),
    "reference_paiement" character varying(100),
    "montantRembourse" numeric(10,2),

    -- Audit
    "valide_par" character varying(255),
    "annule_par" character varying(255),
    "motif_annulation" text,
    "notes" text,
    "metadata" jsonb,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "createdBy" character varying(255) NOT NULL,
    "updatedBy" character varying(255),

    CONSTRAINT "PK_tickets_repas" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_tickets_numero" UNIQUE ("numero_ticket"),
    CONSTRAINT "UQ_tickets_qr_code" UNIQUE ("qr_code"),
    CONSTRAINT "FK_tickets_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_tickets_restaurant" FOREIGN KEY ("restaurant_id")
        REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "IDX_tickets_tenant_numero" ON "tickets_repas" ("tenant_id", "numero_ticket");
CREATE INDEX "IDX_tickets_qr_code" ON "tickets_repas" ("qr_code");
CREATE INDEX "IDX_tickets_status_expiration" ON "tickets_repas" ("status", "date_expiration");
CREATE INDEX "IDX_tickets_restaurant_date" ON "tickets_repas" ("restaurant_id", "date_utilisation");
CREATE INDEX "IDX_tickets_categorie" ON "tickets_repas" ("categorie");
CREATE INDEX "IDX_tickets_type_repas" ON "tickets_repas" ("type_repas");
CREATE INDEX "IDX_tickets_annee" ON "tickets_repas" ("annee");

-- ========================================
-- 5. TABLE: repas
-- ========================================

CREATE TABLE "repas" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,
    "restaurant_id" uuid NOT NULL,
    "menu_id" uuid NOT NULL,
    "date_service" date NOT NULL,
    "typeRepas" "public"."type_repas_enum" NOT NULL,
    "heure_debut" time,
    "heure_fin" time,
    "nombre_prevus" integer NOT NULL DEFAULT 0,
    "nombre_servis" integer NOT NULL DEFAULT 0,
    "nombre_tickets_utilises" integer NOT NULL DEFAULT 0,
    "repartition_categories" jsonb,
    "recettes_totales" numeric(10,2) NOT NULL DEFAULT 0,
    "cout_matieres_premieres" numeric(10,2) NOT NULL DEFAULT 0,
    "marge_brute" numeric(10,2),
    "taux_frequentation" numeric(5,2),
    "quantite_gaspillee" numeric(10,2),
    "valeur_gaspillage" numeric(10,2),
    "raison_gaspillage" text,
    "status" "public"."repas_status_enum" NOT NULL DEFAULT 'planifie',
    "stock_deduit" boolean NOT NULL DEFAULT false,
    "date_deduction_stock" TIMESTAMP,
    "observations" text,
    "incidents" jsonb,
    "note_satisfaction" numeric(3,2),
    "nombre_avis" integer,
    "commentaires_clients" text,
    "chef_service" character varying(255),
    "valide_par" character varying(255),
    "date_validation" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "createdBy" character varying(255) NOT NULL,
    "updatedBy" character varying(255),
    CONSTRAINT "PK_repas" PRIMARY KEY ("id"),
    CONSTRAINT "FK_repas_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_repas_restaurant" FOREIGN KEY ("restaurant_id")
        REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_repas_menu" FOREIGN KEY ("menu_id")
        REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "IDX_repas_tenant_date" ON "repas" ("tenant_id", "date_service");
CREATE INDEX "IDX_repas_restaurant_date_type" ON "repas" ("restaurant_id", "date_service", "typeRepas");
CREATE INDEX "IDX_repas_status" ON "repas" ("status");
CREATE INDEX "IDX_repas_menu" ON "repas" ("menu_id");

-- ========================================
-- 6. TABLE: stock_denrees (lien avec module Stocks)
-- ========================================

CREATE TABLE "stock_denrees" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,
    "restaurant_id" uuid NOT NULL,
    "denree_id" uuid NOT NULL,
    "quantite_allouee" numeric(10,2) NOT NULL,
    "quantite_utilisee" numeric(10,2) NOT NULL DEFAULT 0,
    "quantite_restante" numeric(10,2) NOT NULL,
    "unite" character varying(50) NOT NULL,
    "date_allocation" date NOT NULL,
    "date_expiration" date,
    "cout_unitaire" numeric(10,2),
    "cout_total" numeric(10,2),
    "statut_allocation" "public"."allocation_status_enum" NOT NULL DEFAULT 'allouee',
    "type_mouvement" "public"."type_mouvement_denree_enum" NOT NULL DEFAULT 'allocation',
    "source_stock_id" uuid,
    "notes" text,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "createdBy" character varying(255) NOT NULL,
    "updatedBy" character varying(255),
    CONSTRAINT "PK_stock_denrees" PRIMARY KEY ("id"),
    CONSTRAINT "FK_stock_denrees_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_stock_denrees_restaurant" FOREIGN KEY ("restaurant_id")
        REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IDX_stock_denrees_tenant_restaurant" ON "stock_denrees" ("tenant_id", "restaurant_id");
CREATE INDEX "IDX_stock_denrees_denree_statut" ON "stock_denrees" ("denree_id", "statut_allocation");
CREATE INDEX "IDX_stock_denrees_date_expiration" ON "stock_denrees" ("date_expiration");

COMMIT;

-- ===================================================
-- MIGRATION COMPLÉTÉE
-- ===================================================
-- Module Restauration créé avec tickets anonymes
-- ===================================================
