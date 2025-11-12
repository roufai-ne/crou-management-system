/**
 * FICHIER: packages/database/src/migrations/1762850835000-RestaurantModule.ts
 * MIGRATION: Module Restauration CROU
 *
 * DESCRIPTION:
 * Création complète du module de gestion de restauration universitaire
 * 5 tables: restaurants, menus, tickets_repas, repas, stock_denrees
 * Support multi-tenant strict avec tenant_id obligatoire
 * Intégration avec module Stocks via stock_denrees
 *
 * TABLES CRÉÉES:
 * 1. restaurants - Restaurants universitaires, cafétérias, cantines
 * 2. menus - Planification des menus avec composition détaillée
 * 3. tickets_repas - Tickets repas (unitaires, forfaits, gratuits)
 * 4. repas - Distributions réelles de repas (post-service)
 * 5. stock_denrees - Allocation denrées aux restaurants (lien Stocks)
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class RestaurantModule1762850835000 implements MigrationInterface {
    name = 'RestaurantModule1762850835000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ========================================
        // 1. CRÉATION DES ENUMS
        // ========================================

        // Enum pour types de restaurants
        await queryRunner.query(`
            CREATE TYPE "public"."restaurant_type_enum" AS ENUM(
                'universitaire',
                'cafeteria',
                'cantine'
            )
        `);

        // Enum pour statuts de restaurants
        await queryRunner.query(`
            CREATE TYPE "public"."restaurant_status_enum" AS ENUM(
                'actif',
                'ferme_temporaire',
                'maintenance',
                'inactif'
            )
        `);

        // Enum pour types de repas
        await queryRunner.query(`
            CREATE TYPE "public"."type_repas_enum" AS ENUM(
                'petit_dejeuner',
                'dejeuner',
                'diner'
            )
        `);

        // Enum pour statuts de menus
        await queryRunner.query(`
            CREATE TYPE "public"."menu_status_enum" AS ENUM(
                'brouillon',
                'publie',
                'valide',
                'archive'
            )
        `);

        // Enum pour types de tickets
        await queryRunner.query(`
            CREATE TYPE "public"."type_ticket_enum" AS ENUM(
                'unitaire',
                'forfait_hebdo',
                'forfait_mensuel',
                'gratuit'
            )
        `);

        // Enum pour statuts de tickets
        await queryRunner.query(`
            CREATE TYPE "public"."ticket_status_enum" AS ENUM(
                'actif',
                'utilise',
                'expire',
                'annule',
                'suspendu'
            )
        `);

        // Enum pour catégories de tickets
        await queryRunner.query(`
            CREATE TYPE "public"."categorie_ticket_enum" AS ENUM(
                'etudiant_regulier',
                'etudiant_boursier',
                'personnel',
                'invite'
            )
        `);

        // Enum pour statuts de repas
        await queryRunner.query(`
            CREATE TYPE "public"."repas_status_enum" AS ENUM(
                'planifie',
                'en_cours',
                'termine',
                'annule'
            )
        `);

        // Enum pour statuts d'allocation denrées
        await queryRunner.query(`
            CREATE TYPE "public"."allocation_status_enum" AS ENUM(
                'allouee',
                'utilisee_partiellement',
                'utilisee_totalement',
                'expiree',
                'retournee'
            )
        `);

        // Enum pour types de mouvements denrées
        await queryRunner.query(`
            CREATE TYPE "public"."type_mouvement_denree_enum" AS ENUM(
                'allocation',
                'utilisation',
                'retour',
                'ajustement',
                'perte'
            )
        `);

        // ========================================
        // 2. TABLE: restaurants
        // ========================================

        await queryRunner.query(`
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
            )
        `);

        // Index pour restaurants
        await queryRunner.query(`CREATE INDEX "IDX_restaurants_tenant_type" ON "restaurants" ("tenant_id", "type")`);
        await queryRunner.query(`CREATE INDEX "IDX_restaurants_tenant_status" ON "restaurants" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_restaurants_code" ON "restaurants" ("code")`);

        // ========================================
        // 3. TABLE: menus
        // ========================================

        await queryRunner.query(`
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
            )
        `);

        // Index pour menus
        await queryRunner.query(`CREATE INDEX "IDX_menus_tenant_date" ON "menus" ("tenant_id", "dateService")`);
        await queryRunner.query(`CREATE INDEX "IDX_menus_restaurant_date_type" ON "menus" ("restaurant_id", "dateService", "typeRepas")`);
        await queryRunner.query(`CREATE INDEX "IDX_menus_status" ON "menus" ("status")`);

        // ========================================
        // 4. TABLE: tickets_repas
        // ========================================

        await queryRunner.query(`
            CREATE TABLE "tickets_repas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "etudiant_id" uuid NOT NULL,
                "numero_ticket" character varying(50) NOT NULL,
                "type" "public"."type_ticket_enum" NOT NULL,
                "categorie" "public"."categorie_ticket_enum" NOT NULL,
                "typeRepasAutorise" "public"."type_repas_enum",
                "montant" numeric(10,2) NOT NULL,
                "montantSubvention" numeric(10,2) NOT NULL DEFAULT 0,
                "montantRembourse" numeric(10,2),
                "date_emission" date NOT NULL,
                "date_expiration" date NOT NULL,
                "status" "public"."ticket_status_enum" NOT NULL DEFAULT 'actif',
                "est_utilise" boolean NOT NULL DEFAULT false,
                "date_utilisation" TIMESTAMP,
                "restaurant_id" uuid,
                "repas_id" uuid,
                "nombre_repas_restants" integer,
                "nombre_repas_total" integer,
                "methode_paiement" character varying(50),
                "reference_paiement" character varying(100),
                "qr_code" text,
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
                CONSTRAINT "FK_tickets_tenant" FOREIGN KEY ("tenant_id")
                    REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_tickets_etudiant" FOREIGN KEY ("etudiant_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_tickets_restaurant" FOREIGN KEY ("restaurant_id")
                    REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // Index pour tickets_repas
        await queryRunner.query(`CREATE INDEX "IDX_tickets_tenant_etudiant" ON "tickets_repas" ("tenant_id", "etudiant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_numero" ON "tickets_repas" ("numero_ticket")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_status_expiration" ON "tickets_repas" ("status", "date_expiration")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_restaurant_date" ON "tickets_repas" ("restaurant_id", "date_utilisation")`);

        // ========================================
        // 5. TABLE: repas
        // ========================================

        await queryRunner.query(`
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
                "nombre_tickets_unitaires" integer NOT NULL DEFAULT 0,
                "nombre_tickets_forfaits" integer NOT NULL DEFAULT 0,
                "nombre_tickets_gratuits" integer NOT NULL DEFAULT 0,
                "repartition_categories" jsonb,
                "recettes_totales" numeric(10,2) NOT NULL DEFAULT 0,
                "recettes_unitaires" numeric(10,2) NOT NULL DEFAULT 0,
                "recettes_forfaits" numeric(10,2) NOT NULL DEFAULT 0,
                "montant_subventions" numeric(10,2) NOT NULL DEFAULT 0,
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
                    REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Index pour repas
        await queryRunner.query(`CREATE INDEX "IDX_repas_tenant_date" ON "repas" ("tenant_id", "date_service")`);
        await queryRunner.query(`CREATE INDEX "IDX_repas_restaurant_date_type" ON "repas" ("restaurant_id", "date_service", "typeRepas")`);
        await queryRunner.query(`CREATE INDEX "IDX_repas_menu" ON "repas" ("menu_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_repas_status" ON "repas" ("status")`);

        // ========================================
        // 6. TABLE: stock_denrees
        // ========================================

        await queryRunner.query(`
            CREATE TABLE "stock_denrees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "restaurant_id" uuid NOT NULL,
                "stock_id" uuid NOT NULL,
                "menu_id" uuid,
                "nom_denree" character varying(255) NOT NULL,
                "code_denree" character varying(50) NOT NULL,
                "unite" character varying(50) NOT NULL,
                "quantite_allouee" numeric(10,3) NOT NULL,
                "quantite_utilisee" numeric(10,3) NOT NULL DEFAULT 0,
                "quantite_restante" numeric(10,3) NOT NULL DEFAULT 0,
                "quantite_perdue" numeric(10,3),
                "prix_unitaire" numeric(10,2) NOT NULL,
                "valeur_totale" numeric(10,2) NOT NULL,
                "valeur_utilisee" numeric(10,2),
                "valeur_perdue" numeric(10,2),
                "date_allocation" date NOT NULL,
                "date_expiration" date,
                "date_premiere_utilisation" TIMESTAMP,
                "date_derniere_utilisation" TIMESTAMP,
                "status" "public"."allocation_status_enum" NOT NULL DEFAULT 'allouee',
                "mouvement_stock_cree" boolean NOT NULL DEFAULT false,
                "stock_movement_id" character varying(255),
                "alloue_par" character varying(255) NOT NULL,
                "utilisee_par" character varying(255),
                "motif_allocation" text,
                "necessite_validation" boolean NOT NULL DEFAULT false,
                "est_validee" boolean NOT NULL DEFAULT false,
                "validee_par" character varying(255),
                "date_validation" TIMESTAMP,
                "historique_mouvements" jsonb DEFAULT '[]',
                "notes" text,
                "metadata" jsonb,
                "alerte_expiration" boolean NOT NULL DEFAULT false,
                "alerte_surconsommation" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" character varying(255) NOT NULL,
                "updatedBy" character varying(255),
                CONSTRAINT "PK_stock_denrees" PRIMARY KEY ("id"),
                CONSTRAINT "FK_stock_denrees_tenant" FOREIGN KEY ("tenant_id")
                    REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_stock_denrees_restaurant" FOREIGN KEY ("restaurant_id")
                    REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_stock_denrees_stock" FOREIGN KEY ("stock_id")
                    REFERENCES "stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "FK_stock_denrees_menu" FOREIGN KEY ("menu_id")
                    REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // Index pour stock_denrees
        await queryRunner.query(`CREATE INDEX "IDX_stock_denrees_tenant_restaurant" ON "stock_denrees" ("tenant_id", "restaurant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_stock_denrees_stock_restaurant" ON "stock_denrees" ("stock_id", "restaurant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_stock_denrees_status" ON "stock_denrees" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_stock_denrees_date_allocation" ON "stock_denrees" ("date_allocation")`);

        // ========================================
        // 7. FOREIGN KEY ADDITIONNELLE
        // ========================================

        // Ajouter FK pour repas → tickets (relation inverse)
        await queryRunner.query(`
            ALTER TABLE "tickets_repas"
            ADD CONSTRAINT "FK_tickets_repas"
            FOREIGN KEY ("repas_id")
            REFERENCES "repas"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // ========================================
        // 8. AJOUTER 'restauration' À service_type_enum
        // ========================================

        // Si l'enum existe déjà (depuis TenantHierarchy migration)
        await queryRunner.query(`
            ALTER TYPE "public"."service_type_enum"
            ADD VALUE IF NOT EXISTS 'restauration'
        `);

        console.log('✅ Migration RestaurantModule1762850835000 - UP completed successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer dans l'ordre inverse pour respecter les FK

        // 1. Supprimer FK additionnelle
        await queryRunner.query(`ALTER TABLE "tickets_repas" DROP CONSTRAINT IF EXISTS "FK_tickets_repas"`);

        // 2. Supprimer tables (ordre inverse de création)
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_denrees" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "repas" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tickets_repas" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "menus" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "restaurants" CASCADE`);

        // 3. Supprimer enums
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."type_mouvement_denree_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."allocation_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."repas_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."categorie_ticket_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."ticket_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."type_ticket_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."menu_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."type_repas_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."restaurant_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."restaurant_type_enum"`);

        console.log('✅ Migration RestaurantModule1762850835000 - DOWN completed successfully');
    }
}
