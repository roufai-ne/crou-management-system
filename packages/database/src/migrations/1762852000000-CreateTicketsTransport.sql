-- ===================================================
-- MIGRATION: CreateTicketsTransport (Anonymes)
-- DATE: Janvier 2025
-- FICHIER: 1762852000000-CreateTicketsTransport.sql
-- ===================================================
--
-- DESCRIPTION:
-- Création du système de tickets de transport anonymes
-- Tickets de bus anonymes avec QR codes
-- Système identique aux tickets repas mais pour le transport
-- Catégories: PAYANT et GRATUIT uniquement
--
-- ===================================================

BEGIN;

-- Enregistrer la migration dans l'historique
INSERT INTO _migrations_history (timestamp, name)
VALUES (1762852000000, 'CreateTicketsTransport1762852000000')
ON CONFLICT DO NOTHING;

-- ========================================
-- 1. CRÉATION DES ENUMS
-- ========================================

-- Enum pour statuts de tickets transport
CREATE TYPE "public"."ticket_transport_status_enum" AS ENUM(
    'actif',
    'utilise',
    'expire',
    'annule'
);

-- Enum pour catégories de tickets transport (ANONYME)
CREATE TYPE "public"."categorie_ticket_transport_enum" AS ENUM(
    'payant',
    'gratuit'
);

-- ========================================
-- 2. TABLE: tickets_transport (ANONYME)
-- ========================================

CREATE TABLE "tickets_transport" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" uuid NOT NULL,

    -- Informations ticket anonyme
    "numero_ticket" character varying(50) NOT NULL,
    "categorie" "public"."categorie_ticket_transport_enum" NOT NULL,
    "annee" integer NOT NULL DEFAULT 2025,
    "tarif" numeric(10,2) NOT NULL DEFAULT 0,

    -- QR Code et identification
    "qr_code" character varying(255) NOT NULL,
    "message_indication" character varying(500),

    -- Circuit de transport
    "circuit_id" uuid NOT NULL,

    -- Validité
    "date_emission" date NOT NULL,
    "date_voyage" date NOT NULL,
    "date_expiration" date NOT NULL,
    "status" "public"."ticket_transport_status_enum" NOT NULL DEFAULT 'actif',
    "est_utilise" boolean NOT NULL DEFAULT false,
    "date_utilisation" timestamp without time zone,

    -- Utilisation (trajet effectué)
    "trajet_id" uuid,
    "vehicule_immatriculation" character varying(50),
    "conducteur" character varying(255),

    -- Paiement (si PAYANT)
    "methode_paiement" character varying(50),
    "reference_paiement" character varying(100),
    "montant_rembourse" numeric(10,2),

    -- Audit
    "valide_par" character varying(255),
    "annule_par" character varying(255),
    "motif_annulation" text,
    "notes" text,
    "metadata" jsonb,
    "created_at" timestamp without time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp without time zone NOT NULL DEFAULT now(),
    "created_by" character varying(255) NOT NULL,
    "updated_by" character varying(255),

    CONSTRAINT "PK_tickets_transport" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_tickets_transport_numero" UNIQUE ("numero_ticket"),
    CONSTRAINT "UQ_tickets_transport_qr_code" UNIQUE ("qr_code"),
    CONSTRAINT "FK_tickets_transport_tenant" FOREIGN KEY ("tenant_id")
        REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FK_tickets_transport_circuit" FOREIGN KEY ("circuit_id")
        REFERENCES "transport_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ========================================
-- 3. INDEX DE PERFORMANCE
-- ========================================

CREATE INDEX "IDX_tickets_transport_tenant_numero" ON "tickets_transport" ("tenant_id", "numero_ticket");
CREATE INDEX "IDX_tickets_transport_qr_code" ON "tickets_transport" ("qr_code");
CREATE INDEX "IDX_tickets_transport_status_expiration" ON "tickets_transport" ("status", "date_expiration");
CREATE INDEX "IDX_tickets_transport_circuit_date" ON "tickets_transport" ("circuit_id", "date_voyage");
CREATE INDEX "IDX_tickets_transport_categorie" ON "tickets_transport" ("categorie");
CREATE INDEX "IDX_tickets_transport_annee" ON "tickets_transport" ("annee");
CREATE INDEX "IDX_tickets_transport_date_voyage" ON "tickets_transport" ("date_voyage");

-- ========================================
-- 4. COMMENTAIRES
-- ========================================

COMMENT ON TABLE "tickets_transport" IS 'Tickets de transport anonymes (tickets de bus) - un ticket = un trajet';
COMMENT ON COLUMN "tickets_transport"."numero_ticket" IS 'Numéro unique du ticket (format: TKT-TRANS-2025-001234)';
COMMENT ON COLUMN "tickets_transport"."qr_code" IS 'QR code unique pour scan rapide';
COMMENT ON COLUMN "tickets_transport"."categorie" IS 'Catégorie: payant (avec tarif) ou gratuit (0 F)';
COMMENT ON COLUMN "tickets_transport"."circuit_id" IS 'Circuit de transport (ex: Centre → Campus)';
COMMENT ON COLUMN "tickets_transport"."date_voyage" IS 'Date du voyage prévu';
COMMENT ON COLUMN "tickets_transport"."tarif" IS 'Montant du ticket en FCFA (0 si gratuit)';

COMMIT;

-- ===================================================
-- MIGRATION COMPLÉTÉE
-- ===================================================
-- Système de tickets transport anonymes créé
-- Prêt pour émission et utilisation de tickets
-- ===================================================
