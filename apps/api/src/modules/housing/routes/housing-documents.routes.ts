/**
 * FICHIER: apps/api/src/modules/housing/routes/housing-documents.routes.ts
 * ROUTES: Upload et gestion documents pour demandes logement
 *
 * DESCRIPTION:
 * Routes REST pour upload, téléchargement et gestion des documents
 * Support multi-fichiers, validation stricte, URLs signées temporaires
 *
 * ENDPOINTS:
 * - POST /housing/requests/:id/upload/:docType    - Upload document
 * - GET /housing/requests/:id/documents           - Liste documents demande
 * - GET /housing/requests/:id/documents/:docType  - Document par type
 * - GET /housing/documents/:id/download           - Télécharger avec token
 * - DELETE /housing/documents/:id                 - Supprimer document
 * - PATCH /housing/documents/:id/verify           - Marquer vérifié
 *
 * PERMISSIONS REQUISES:
 * - housing:documents:upload - Upload documents (étudiant)
 * - housing:documents:view - Voir documents (gestionnaire)
 * - housing:documents:verify - Vérifier documents (gestionnaire)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DocumentUploadService } from '../services/DocumentUploadService';
import { DocumentType } from '@crou/database';

const router = Router();

// Configuration Multer (stockage mémoire temporaire)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Mo max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé (PDF, JPG, PNG uniquement)'));
    }
  }
});

/**
 * POST /housing/requests/:id/upload/:docType
 * Upload document pour une demande
 */
router.post(
  '/requests/:id/upload/:docType',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const studentId = req.user?.id; // Assuming user is student
      const { id: requestId } = req.params;
      const { docType } = req.params;

      if (!tenantId) {
        return res.status(401).json({ message: 'Tenant non identifié' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier uploadé' });
      }

      // Valider docType
      if (!Object.values(DocumentType).includes(docType as DocumentType)) {
        return res.status(400).json({ message: 'Type de document invalide' });
      }

      const result = await DocumentUploadService.uploadDocument({
        file: req.file,
        studentId: studentId || req.body.studentId, // Allow manual studentId for admin
        requestId,
        docType: docType as DocumentType,
        tenantId,
        description: req.body.description
      });

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.status(201).json({
        message: 'Document uploadé avec succès',
        document: {
          id: result.document!.id,
          fileName: result.document!.fileName,
          docType: result.document!.docType,
          fileSize: result.document!.fileSize,
          mimeType: result.document!.mimeType,
          url: result.document!.getSignedUrl(3600), // URL valide 1h
          uploadedAt: result.document!.uploadedAt
        }
      });
    } catch (error) {
      console.error('[DocumentsRoutes] Erreur upload:', error);
      next(error);
    }
  }
);

/**
 * GET /housing/requests/:id/documents
 * Liste tous documents d'une demande
 */
router.get('/requests/:id/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id: requestId } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const documents = await DocumentUploadService.getRequestDocuments(requestId, tenantId);

    res.json({
      data: documents.map(doc => ({
        id: doc.id,
        docType: doc.docType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt,
        isValid: doc.isValid,
        url: doc.getSignedUrl(3600),
        readableSize: doc.getReadableFileSize(),
        typeLabel: doc.getTypeLabel()
      })),
      count: documents.length
    });
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur liste documents:', error);
    next(error);
  }
});

/**
 * GET /housing/requests/:id/documents/:docType
 * Récupérer document spécifique par type
 */
router.get('/requests/:id/documents/:docType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id: requestId, docType } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    // Valider docType
    if (!Object.values(DocumentType).includes(docType as DocumentType)) {
      return res.status(400).json({ message: 'Type de document invalide' });
    }

    const document = await DocumentUploadService.getDocumentByType(
      requestId,
      docType as DocumentType,
      tenantId
    );

    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    res.json({
      data: {
        id: document.id,
        docType: document.docType,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        description: document.description,
        uploadedAt: document.uploadedAt,
        verifiedAt: document.verifiedAt,
        url: document.getSignedUrl(3600),
        readableSize: document.getReadableFileSize()
      }
    });
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur récupération document:', error);
    next(error);
  }
});

/**
 * GET /housing/documents/:id/download
 * Télécharger document avec token signé
 */
router.get('/documents/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token manquant ou invalide' });
    }

    const result = await DocumentUploadService.downloadDocument(documentId, token);

    if (!result) {
      return res.status(404).json({ message: 'Document non trouvé ou token invalide' });
    }

    const { buffer, document } = result;

    // Headers téléchargement
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur téléchargement:', error);
    next(error);
  }
});

/**
 * DELETE /housing/documents/:id
 * Supprimer document
 */
router.delete('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id: documentId } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const success = await DocumentUploadService.deleteDocument(documentId, tenantId);

    if (!success) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur suppression:', error);
    next(error);
  }
});

/**
 * PATCH /housing/documents/:id/verify
 * Marquer document comme vérifié (gestionnaire uniquement)
 */
router.patch('/documents/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const verifiedBy = req.user?.id;
    const { id: documentId } = req.params;

    if (!tenantId || !verifiedBy) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // TODO: Vérifier permission housing:documents:verify

    const success = await DocumentUploadService.verifyDocument(documentId, verifiedBy, tenantId);

    if (!success) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    res.json({ message: 'Document vérifié avec succès' });
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur vérification:', error);
    next(error);
  }
});

/**
 * GET /housing/students/:studentId/documents/stats
 * Statistiques uploads étudiant
 */
router.get('/students/:studentId/documents/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { studentId } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const stats = await DocumentUploadService.getStudentUploadStats(studentId, tenantId);

    if (!stats) {
      return res.status(500).json({ message: 'Erreur récupération statistiques' });
    }

    res.json({ data: stats });
  } catch (error) {
    console.error('[DocumentsRoutes] Erreur stats:', error);
    next(error);
  }
});

export default router;
