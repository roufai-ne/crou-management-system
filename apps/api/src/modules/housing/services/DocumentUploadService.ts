/**
 * FICHIER: apps/api/src/modules/housing/services/DocumentUploadService.ts
 * SERVICE: DocumentUploadService
 *
 * DESCRIPTION:
 * Service de gestion des uploads de documents pour demandes logement
 * Gère stockage local, validation, génération URLs signées, suppression sécurisée
 *
 * FONCTIONNALITÉS:
 * - Upload fichiers avec validation (type, taille, sécurité)
 * - Stockage organisé par tenant/student
 * - Génération URLs temporaires signées
 * - Suppression sécurisée fichiers + métadonnées
 * - Statistiques uploads par étudiant/demande
 *
 * RÈGLES MÉTIER:
 * - Types acceptés: PDF, JPG, PNG
 * - Taille max: 5 Mo par fichier
 * - Nommage: {docType}-{timestamp}.{ext}
 * - Structure: /uploads/housing-documents/{tenantId}/{studentId}/
 *
 * SÉCURITÉ:
 * - Validation mimetype stricte
 * - Sanitisation noms fichiers
 * - Isolation tenant
 * - URLs signées avec expiration
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '@crou/database';
import { HousingDocument, DocumentType, HousingRequest } from '@crou/database';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const documentRepository = AppDataSource.getRepository(HousingDocument);
const requestRepository = AppDataSource.getRepository(HousingRequest);

// Configuration
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'housing-documents');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export interface UploadResult {
  success: boolean;
  document?: HousingDocument;
  error?: string;
}

export interface UploadOptions {
  file: any; // Multer file object
  studentId: string;
  requestId?: string;
  docType: DocumentType;
  tenantId: string;
  description?: string;
}

export class DocumentUploadService {
  /**
   * Upload document avec validation complète
   */
  static async uploadDocument(options: UploadOptions): Promise<UploadResult> {
    const { file, studentId, requestId, docType, tenantId, description } = options;

    try {
      // 1. Validation taille
      if (file.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)`
        };
      }

      // 2. Validation type MIME
      if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
        return {
          success: false,
          error: 'Type de fichier non autorisé (PDF, JPG, PNG uniquement)'
        };
      }

      // 3. Vérifier existence demande si requestId fourni
      if (requestId) {
        const request = await requestRepository.findOne({
          where: { id: requestId, tenantId }
        });

        if (!request) {
          return {
            success: false,
            error: 'Demande de logement non trouvée'
          };
        }
      }

      // 4. Créer structure dossiers
      const uploadDir = path.join(UPLOAD_BASE_DIR, tenantId, studentId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 5. Générer nom fichier sécurisé
      const timestamp = Date.now();
      const extension = this.getExtensionFromMimetype(file.mimetype);
      const sanitizedDocType = docType.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedDocType}-${timestamp}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      // 6. Sauvegarder fichier
      fs.writeFileSync(filePath, file.buffer);

      // 7. Créer enregistrement DB
      const document = documentRepository.create({
        tenantId,
        studentId,
        requestId,
        docType,
        fileName,
        filePath: path.relative(UPLOAD_BASE_DIR, filePath), // Stockage relatif
        mimeType: file.mimetype,
        fileSize: file.size,
        description,
        isValid: true
      });

      await documentRepository.save(document);

      console.log(`[DocumentUploadService] Document uploadé: ${fileName} (${studentId})`);

      return {
        success: true,
        document
      };
    } catch (error) {
      console.error('[DocumentUploadService] Erreur upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir URL signée temporaire pour téléchargement
   */
  static async getDocumentUrl(documentId: string, tenantId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const document = await documentRepository.findOne({
        where: { id: documentId, tenantId }
      });

      if (!document) {
        return null;
      }

      return document.getSignedUrl(expiresIn);
    } catch (error) {
      console.error('[DocumentUploadService] Erreur génération URL:', error);
      return null;
    }
  }

  /**
   * Télécharger document avec vérification token
   */
  static async downloadDocument(documentId: string, token: string): Promise<{ buffer: Buffer; document: HousingDocument } | null> {
    try {
      // Vérifier token
      if (!HousingDocument.verifySignedToken(documentId, token)) {
        console.warn(`[DocumentUploadService] Token invalide ou expiré: ${documentId}`);
        return null;
      }

      // Récupérer document
      const document = await documentRepository.findOne({
        where: { id: documentId }
      });

      if (!document) {
        return null;
      }

      // Lire fichier
      const fullPath = path.join(UPLOAD_BASE_DIR, document.filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`[DocumentUploadService] Fichier introuvable: ${fullPath}`);
        return null;
      }

      const buffer = fs.readFileSync(fullPath);

      return { buffer, document };
    } catch (error) {
      console.error('[DocumentUploadService] Erreur téléchargement:', error);
      return null;
    }
  }

  /**
   * Supprimer document (fichier + DB)
   */
  static async deleteDocument(documentId: string, tenantId: string): Promise<boolean> {
    try {
      const document = await documentRepository.findOne({
        where: { id: documentId, tenantId }
      });

      if (!document) {
        return false;
      }

      // Supprimer fichier
      const fullPath = path.join(UPLOAD_BASE_DIR, document.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Supprimer enregistrement DB
      await documentRepository.remove(document);

      console.log(`[DocumentUploadService] Document supprimé: ${document.fileName}`);

      return true;
    } catch (error) {
      console.error('[DocumentUploadService] Erreur suppression:', error);
      return false;
    }
  }

  /**
   * Lister documents d'un étudiant
   */
  static async getStudentDocuments(studentId: string, tenantId: string): Promise<HousingDocument[]> {
    try {
      return await documentRepository.find({
        where: { studentId, tenantId },
        order: { uploadedAt: 'DESC' }
      });
    } catch (error) {
      console.error('[DocumentUploadService] Erreur récupération documents:', error);
      return [];
    }
  }

  /**
   * Lister documents d'une demande
   */
  static async getRequestDocuments(requestId: string, tenantId: string): Promise<HousingDocument[]> {
    try {
      return await documentRepository.find({
        where: { requestId, tenantId },
        order: { uploadedAt: 'DESC' }
      });
    } catch (error) {
      console.error('[DocumentUploadService] Erreur récupération documents demande:', error);
      return [];
    }
  }

  /**
   * Obtenir document par type pour une demande
   */
  static async getDocumentByType(
    requestId: string,
    docType: DocumentType,
    tenantId: string
  ): Promise<HousingDocument | null> {
    try {
      return await documentRepository.findOne({
        where: { requestId, docType, tenantId },
        order: { uploadedAt: 'DESC' }
      });
    } catch (error) {
      console.error('[DocumentUploadService] Erreur récupération document par type:', error);
      return null;
    }
  }

  /**
   * Marquer document comme vérifié
   */
  static async verifyDocument(documentId: string, verifiedBy: string, tenantId: string): Promise<boolean> {
    try {
      const document = await documentRepository.findOne({
        where: { id: documentId, tenantId }
      });

      if (!document) {
        return false;
      }

      document.verifiedAt = new Date();
      document.verifiedBy = verifiedBy;
      await documentRepository.save(document);

      console.log(`[DocumentUploadService] Document vérifié: ${document.fileName}`);

      return true;
    } catch (error) {
      console.error('[DocumentUploadService] Erreur vérification document:', error);
      return false;
    }
  }

  /**
   * Statistiques uploads étudiant
   */
  static async getStudentUploadStats(studentId: string, tenantId: string): Promise<any> {
    try {
      const documents = await documentRepository.find({
        where: { studentId, tenantId }
      });

      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum: number, doc: HousingDocument) => sum + doc.fileSize, 0),
        byType: {} as Record<DocumentType, number>,
        verifiedCount: documents.filter((doc: HousingDocument) => doc.verifiedAt).length,
        pendingCount: documents.filter((doc: HousingDocument) => !doc.verifiedAt).length
      };

      // Compter par type
      documents.forEach((doc: HousingDocument) => {
        stats.byType[doc.docType] = (stats.byType[doc.docType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('[DocumentUploadService] Erreur stats:', error);
      return null;
    }
  }

  /**
   * Obtenir extension depuis mimetype
   */
  private static getExtensionFromMimetype(mimetype: string): string {
    const map: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png'
    };
    return map[mimetype] || '';
  }

  /**
   * Nettoyer documents orphelins (sans demande supprimée)
   */
  static async cleanOrphanedDocuments(tenantId: string): Promise<number> {
    try {
      const documents = await documentRepository.find({
        where: { tenantId },
        relations: ['request']
      });

      let deletedCount = 0;

      for (const doc of documents) {
        if (doc.requestId && !doc.request) {
          await this.deleteDocument(doc.id, tenantId);
          deletedCount++;
        }
      }

      console.log(`[DocumentUploadService] ${deletedCount} documents orphelins supprimés`);

      return deletedCount;
    } catch (error) {
      console.error('[DocumentUploadService] Erreur nettoyage:', error);
      return 0;
    }
  }
}

export default DocumentUploadService;
