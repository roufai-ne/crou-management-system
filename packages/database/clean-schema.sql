-- Script de nettoyage complet du schéma PostgreSQL
-- ATTENTION: Ce script supprime TOUTES les tables et données

-- Supprimer le schéma public et le recréer
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Donner les droits au user
GRANT ALL ON SCHEMA public TO crou_user;
GRANT ALL ON SCHEMA public TO public;

-- Créer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Message de confirmation
SELECT 'Base de données nettoyée avec succès' AS status;
