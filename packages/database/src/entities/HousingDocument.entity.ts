/**
 * FICHIER: packages/database/src/entities/HousingDocument.entity.ts
 * ENTITÃ‰: HousingDocument
 *
 * DESCRIPTION:
 * EntitÃ© pour stocker les mÃ©tadonnÃ©es des documents uploadÃ©s
 * par les Ã©tudiants dans le cadre de leurs demandes de logement
 *
 * RELATIONS:
 * - ManyToOne Student (propriÃ©taire document)
 * - ManyToOne HousingRequest (demande associÃ©e)
 *
 * TYPES DOCUMENTS:
 * - rentReceipt: Quittance loyer derniÃ¨re annÃ©e (renouvellement)
 * - scholarshipProof: Attestation bourse (nouvelles demandes)
 * - enrollmentReceipt: Quittance inscription (obligatoire)
 * - idCard: Carte identitÃ©
 * - medicalCertificate: Certificat mÃ©dical (handicap)
 * - other: Autres justificatifs
 *
 * SÃ‰CURITÃ‰:
 * - filePath stockÃ© relatif Ã  UPLOAD_BASE_DIR
 * - URLs signÃ©es avec expiration (getSignedUrl())
 * - Isolation tenant via tenantId
 *
 * AUTEUR: Ã‰quipe CROU
 * DATE: Janvier 2025
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index
} from 'typeorm';
import { Student } from './Student.entity';
import { HousingRequest } from './HousingRequest.entity';

export enum DocumentType {
  RENT_RECEIPT = 'rentReceipt',
  SCHOLARSHIP_PROOF = 'scholarshipProof',
  ENROLLMENT_RECEIPT = 'enrollmentReceipt',
  ID_CARD = 'idCard',
  MEDICAL_CERTIFICATE = 'medicalCertificate',
  OTHER = 'other'
}

@Entity('housing_documents')
@Index(['tenantId', 'studentId'])
@Index(['tenantId', 'requestId'])
@Index(['tenantId', 'docType'])
export class HousingDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Tenant multi-tenant
  @Column({ type: 'uuid' })
  tenantId: string;

  // Relations
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid', nullable: true })
  requestId?: string;

  @ManyToOne('HousingRequest', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestId' })
  request?: HousingRequest;

  // MÃ©tadonnÃ©es document
  @Column({
    type: 'enum',
    enum: DocumentType
  })
  docType: DocumentType;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  // Dates
  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string;

  // Statut
  @Column({ type: 'boolean', default: true })
  isValid: boolean;

  /**
   * Obtenir URL signÃ©e temporaire pour tÃ©lÃ©chargement
   * @param expiresIn DurÃ©e validitÃ© en secondes (dÃ©faut: 1h)
   * @returns URL signÃ©e avec token
   */
  getSignedUrl(expiresIn: number = 3600): string {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const token = this.generateSignedToken(expiresIn);
    return `${baseUrl}/api/housing/documents/${this.id}/download?token=${token}`;
  }

  /**
   * GÃ©nÃ©rer token signÃ© pour URL temporaire
   * @param expiresIn DurÃ©e validitÃ© en secondes
   * @returns Token JWT ou simple hash
   */
  private generateSignedToken(expiresIn: number): string {
    const crypto = require('crypto');
    const expiresAt = Date.now() + (expiresIn * 1000);
    const payload = `${this.id}:${expiresAt}:${process.env.UPLOAD_SECRET || 'default-secret'}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return `${hash}.${expiresAt}`;
  }

  /**
   * VÃ©rifier validitÃ© token signÃ©
   * @param token Token Ã  vÃ©rifier
   * @returns true si token valide et non expirÃ©
   */
  static verifySignedToken(documentId: string, token: string): boolean {
    try {
      const [hash, expiresAtStr] = token.split('.');
      const expiresAt = parseInt(expiresAtStr, 10);

      if (Date.now() > expiresAt) {
        return false; // Token expirÃ©
      }

      const crypto = require('crypto');
      const payload = `${documentId}:${expiresAt}:${process.env.UPLOAD_SECRET || 'default-secret'}`;
      const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');

      return hash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir extension fichier depuis mimeType
   * @returns Extension (.pdf, .jpg, .png)
   */
  getFileExtension(): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png'
    };
    return mimeMap[this.mimeType] || '';
  }

  /**
   * Formater taille fichier lisible
   * @returns Taille formatÃ©e (1.5 MB, 320 KB)
   */
  getReadableFileSize(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * VÃ©rifier si document est une image
   * @returns true si image (JPEG, PNG)
   */
  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * VÃ©rifier si document est un PDF
   * @returns true si PDF
   */
  isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  /**
   * Obtenir libellÃ© type document en franÃ§ais
   * @returns LibellÃ© traduit
   */
  getTypeLabel(): string {
    const labels: Record<DocumentType, string> = {
      [DocumentType.RENT_RECEIPT]: 'Quittance de loyer',
      [DocumentType.SCHOLARSHIP_PROOF]: 'Attestation de bourse',
      [DocumentType.ENROLLMENT_RECEIPT]: "Quittance d'inscription",
      [DocumentType.ID_CARD]: "Carte d'identitÃ©",
      [DocumentType.MEDICAL_CERTIFICATE]: 'Certificat mÃ©dical',
      [DocumentType.OTHER]: 'Autre document'
    };
    return labels[this.docType] || 'Document';
  }
}
