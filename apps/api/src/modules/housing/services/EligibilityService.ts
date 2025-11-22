/**
 * FICHIER: apps/api/src/modules/housing/services/EligibilityService.ts
 * SERVICE: EligibilityService - Service de validation d'éligibilité logement
 *
 * DESCRIPTION:
 * Service responsable de la validation des règles métier d'attribution de logement
 * Vérifie l'éligibilité des étudiants selon les critères CROU
 * Calcule automatiquement le score de priorité
 *
 * RÈGLES MÉTIER:
 * 
 * RENOUVELLEMENT:
 * - Ne pas avoir épuisé limite années selon cycle (3 licence, 2 master, 8 médecine, 3 doctorat)
 * - Avoir payé le loyer de l'année précédente
 * - Score priorité: +100 (prioritaire sur nouvelles demandes)
 *
 * NOUVELLE ATTRIBUTION:
 * - Être boursier (obligatoire)
 * - Avoir fourni quittance d'inscription
 * - Score priorité: +20 boursier, +50 BAC scientifique (C/D/E), +30 non-résident
 *
 * PRIORITÉS ABSOLUES:
 * - Handicapé: +1000 (priorité absolue)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '@crou/database';
import {
  HousingRequest,
  RequestType,
  Student,
  HousingOccupancy,
  OccupancyStatus
} from '@crou/database';
import { Repository } from 'typeorm';

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  score: number;
  checks: {
    isBoursier: boolean;
    hasBacScientifique: boolean;
    isNonResident: boolean;
    hasExceededCycleLimit: boolean;
    hasRentPaid: boolean;
    hasRequiredDocuments: boolean;
    isHandicape: boolean;
  };
}

export class EligibilityService {
  private studentRepository: Repository<Student>;
  private requestRepository: Repository<HousingRequest>;
  private occupancyRepository: Repository<HousingOccupancy>;

  constructor() {
    this.studentRepository = AppDataSource.getRepository(Student);
    this.requestRepository = AppDataSource.getRepository(HousingRequest);
    this.occupancyRepository = AppDataSource.getRepository(HousingOccupancy);
  }

  /**
   * Valider l'éligibilité d'une demande de logement
   * Méthode principale appelée lors de la soumission
   */
  async validateEligibility(
    request: HousingRequest,
    tenantId: string
  ): Promise<EligibilityResult> {
    // Récupérer l'étudiant
    const student = await this.studentRepository.findOne({
      where: { id: request.studentId, tenantId }
    });

    if (!student) {
      return {
        isEligible: false,
        reasons: ['Étudiant non trouvé'],
        score: 0,
        checks: this.getDefaultChecks()
      };
    }

    // Vérifier selon le type de demande
    if (request.type === RequestType.RENOUVELLEMENT) {
      return await this.validateRenewalEligibility(student, request, tenantId);
    } else {
      return await this.validateNewAssignmentEligibility(student, request);
    }
  }

  /**
   * Valider éligibilité RENOUVELLEMENT
   */
  private async validateRenewalEligibility(
    student: Student,
    request: HousingRequest,
    tenantId: string
  ): Promise<EligibilityResult> {
    const reasons: string[] = [];
    const checks = this.getDefaultChecks();
    let isEligible = true;

    // 1. Vérifier limite années selon cycle
    checks.hasExceededCycleLimit = student.hasExceededMaxLogementYears();
    if (checks.hasExceededCycleLimit) {
      isEligible = false;
      reasons.push(`Limite d'années dépassée (max ${student.getMaxLogementYears()} ans pour ${student.getCycle()})`);
    }

    // 2. Vérifier paiement loyer année précédente
    checks.hasRentPaid = await this.checkRentPaid(student.id, tenantId);
    if (!checks.hasRentPaid) {
      isEligible = false;
      reasons.push('Loyer de l\'année précédente non payé');
    }

    // 3. Vérifier documents requis
    checks.hasRequiredDocuments = request.certificatScolariteFourni && request.pieceIdentiteFournie;
    if (!checks.hasRequiredDocuments) {
      isEligible = false;
      reasons.push('Documents requis manquants (certificat scolarité, pièce d\'identité)');
    }

    // 4. Vérifier handicap (priorité absolue)
    checks.isHandicape = student.isHandicape;

    // Calculer score priorité RENOUVELLEMENT
    let score = 0;
    if (isEligible) {
      score += 100; // Bonus renouvellement (prioritaire sur nouvelles demandes)
      if (checks.isHandicape) score += 1000; // Priorité absolue handicapé
    }

    return {
      isEligible,
      reasons: isEligible ? ['Éligible pour renouvellement'] : reasons,
      score,
      checks
    };
  }

  /**
   * Valider éligibilité NOUVELLE ATTRIBUTION
   */
  private async validateNewAssignmentEligibility(
    student: Student,
    request: HousingRequest
  ): Promise<EligibilityResult> {
    const reasons: string[] = [];
    const checks = this.getDefaultChecks();
    let isEligible = true;

    // 1. Vérifier si boursier (OBLIGATOIRE pour nouvelle demande)
    checks.isBoursier = student.isBoursier;
    if (!checks.isBoursier) {
      isEligible = false;
      reasons.push('Étudiant non boursier (obligatoire pour nouvelle attribution)');
    }

    // 2. Vérifier quittance d'inscription
    checks.hasRequiredDocuments = student.hasQuittanceInscription && 
                                   request.certificatScolariteFourni && 
                                   request.pieceIdentiteFournie;
    if (!checks.hasRequiredDocuments) {
      isEligible = false;
      reasons.push('Documents requis manquants (quittance inscription, certificat scolarité, pièce d\'identité)');
    }

    // 3. Vérifier BAC scientifique (bonus priorité)
    checks.hasBacScientifique = student.hasBacScientifique();

    // 4. Vérifier non-résident (bonus priorité)
    checks.isNonResident = student.isNonResident();

    // 5. Vérifier handicap (priorité absolue)
    checks.isHandicape = student.isHandicape;

    // Calculer score priorité NOUVELLE ATTRIBUTION
    const score = this.calculateNewAssignmentScore(student, checks);

    return {
      isEligible,
      reasons: isEligible ? ['Éligible pour nouvelle attribution'] : reasons,
      score: isEligible ? score : 0,
      checks
    };
  }

  /**
   * Calculer score de priorité pour NOUVELLE ATTRIBUTION
   * Selon règles CROU: BAC scientifique > non-résident > boursier
   */
  private calculateNewAssignmentScore(
    student: Student,
    checks: any
  ): number {
    let score = 0;

    // Priorité absolue: handicapé
    if (checks.isHandicape) {
      score += 1000;
    }

    // Boursier (base, obligatoire)
    if (checks.isBoursier) {
      score += 20;
    }

    // BAC scientifique (C, D, E)
    if (checks.hasBacScientifique) {
      score += 50;
    }

    // Non-résident de la ville universitaire
    if (checks.isNonResident) {
      score += 30;
    }

    // Bonus ancienneté (plus jeune = prioritaire)
    // L1=5 points, L2=4, L3=3, M1=2, M2=1, D=0
    const niveauScore = 6 - student.getNiveauNumeric();
    score += niveauScore * 5;

    return score;
  }

  /**
   * Vérifier si loyer année précédente est payé
   * Recherche dernière occupation et vérifie paiement
   */
  private async checkRentPaid(
    studentId: string,
    tenantId: string
  ): Promise<boolean> {
    // Récupérer dernière occupation de l'étudiant
    const lastOccupancy = await this.occupancyRepository.findOne({
      where: {
        studentId,
        tenantId,
        status: OccupancyStatus.ACTIVE
      },
      order: {
        dateDebut: 'DESC'
      }
    });

    if (!lastOccupancy) {
      // Pas d'occupation précédente = pas de loyer à vérifier
      return true;
    }

    // Vérifier si loyer est marqué comme payé
    // Note: Logique simplifiée, à adapter selon système de paiement réel
    return lastOccupancy.loyerPaye !== false;
  }

  /**
   * Calculer le score de priorité d'une demande
   * Wrapper pratique pour calcul rapide
   */
  async calculatePriorityScore(
    request: HousingRequest,
    tenantId: string
  ): Promise<number> {
    const eligibility = await this.validateEligibility(request, tenantId);
    return eligibility.score;
  }

  /**
   * Vérifier limite cycle d'un étudiant
   * Retourne true si limite dépassée
   */
  checkCycleLimit(student: Student): boolean {
    return student.hasExceededMaxLogementYears();
  }

  /**
   * Valider documents fournis
   */
  validateDocuments(request: HousingRequest): {
    isValid: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!request.certificatScolariteFourni) {
      missing.push('Certificat de scolarité');
    }

    if (!request.pieceIdentiteFournie) {
      missing.push('Pièce d\'identité');
    }

    if (request.type === RequestType.NOUVELLE && !request.student?.hasQuittanceInscription) {
      missing.push('Quittance d\'inscription');
    }

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Mettre à jour le score de priorité d'une demande
   * Appelé après validation/modification
   */
  async updateRequestPriorityScore(
    requestId: string,
    tenantId: string
  ): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, tenantId },
      relations: ['student']
    });

    if (!request) {
      throw new Error(`Demande ${requestId} non trouvée`);
    }

    const eligibility = await this.validateEligibility(request, tenantId);

    // Mettre à jour score et checks d'éligibilité
    request.priorityScore = eligibility.score;
    
    // Stocker checks dans eligibilityChecks (jsonb)
    const eligibilityChecks = {
      ...eligibility.checks,
      checkedAt: new Date(),
      isEligible: eligibility.isEligible,
      reasons: eligibility.reasons
    };

    await this.requestRepository.save({
      id: request.id,
      priorityScore: eligibility.score
      // eligibilityChecks: eligibilityChecks // Décommenter quand champ ajouté à entity
    });

    console.log(`[EligibilityService] Score mis à jour: ${request.id} → ${eligibility.score} points`);
  }

  /**
   * Obtenir checks par défaut
   */
  private getDefaultChecks() {
    return {
      isBoursier: false,
      hasBacScientifique: false,
      isNonResident: false,
      hasExceededCycleLimit: false,
      hasRentPaid: false,
      hasRequiredDocuments: false,
      isHandicape: false
    };
  }

  /**
   * Obtenir statistiques d'éligibilité pour un batch
   * Utile pour dashboard admin
   */
  async getBatchEligibilityStats(
    batchId: string,
    tenantId: string
  ): Promise<{
    total: number;
    eligible: number;
    ineligible: number;
    averageScore: number;
    topReasons: { reason: string; count: number }[];
  }> {
    const requests = await this.requestRepository.find({
      where: { batchId, tenantId },
      relations: ['student']
    });

    let eligible = 0;
    let ineligible = 0;
    let totalScore = 0;
    const reasonsMap: Map<string, number> = new Map();

    for (const request of requests) {
      const eligibility = await this.validateEligibility(request, tenantId);
      
      if (eligibility.isEligible) {
        eligible++;
        totalScore += eligibility.score;
      } else {
        ineligible++;
        eligibility.reasons.forEach(reason => {
          reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
        });
      }
    }

    const topReasons = Array.from(reasonsMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: requests.length,
      eligible,
      ineligible,
      averageScore: eligible > 0 ? totalScore / eligible : 0,
      topReasons
    };
  }
}

export default new EligibilityService();
