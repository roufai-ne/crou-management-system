/**
 * FICHIER: apps/api/src/modules/housing/routes/housing-reports.routes.ts
 * ROUTES: Rapports et statistiques d'occupation logement
 *
 * DESCRIPTION:
 * Routes REST pour consulter la disponibilité et les rapports d'occupation
 * Fournit données temps réel et historiques pour dashboards
 *
 * ENDPOINTS:
 * - GET /housing/reports/availability          - Disponibilité temps réel (filtres)
 * - GET /housing/reports/availability/by-gender - Stats agrégées par genre
 * - GET /housing/reports/annual                - Rapports annuels historiques
 * - GET /housing/reports/occupancy/:housingId  - Occupation temps réel d'une cité
 * - GET /housing/reports/statistics/global     - Statistiques globales système
 *
 * PERMISSIONS REQUISES:
 * - housing:reports:read - Accès lecture rapports
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@crou/database';
import {
  Housing,
  Room,
  RoomStatus,
  GenderRestriction,
  HousingOccupancyReport,
  HousingRequest,
  RequestStatus,
  SubmissionMethod
} from '@crou/database';
import { Repository, Between } from 'typeorm';

const router = Router();
const housingRepository = AppDataSource.getRepository(Housing);
const roomRepository = AppDataSource.getRepository(Room);
const reportRepository = AppDataSource.getRepository(HousingOccupancyReport);
const requestRepository = AppDataSource.getRepository(HousingRequest);

/**
 * GET /housing/reports/availability
 * Disponibilité chambres temps réel avec filtres
 */
router.get('/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const {
      genderRestriction,
      housingId,
      minBeds,
      status = RoomStatus.DISPONIBLE
    } = req.query;

    const queryBuilder = roomRepository.createQueryBuilder('room')
      .leftJoinAndSelect('room.housing', 'housing')
      .where('housing.tenantId = :tenantId', { tenantId })
      .andWhere('room.status = :status', { status })
      .andWhere('room.isActif = :isActif', { isActif: true });

    // Filtres
    if (genderRestriction) {
      queryBuilder.andWhere('room.genderRestriction = :gender', { gender: genderRestriction });
    }

    if (housingId) {
      queryBuilder.andWhere('room.housingId = :housingId', { housingId });
    }

    if (minBeds) {
      queryBuilder.andWhere(
        '(room.capacite - room.occupation - room.reservedBeds) >= :minBeds',
        { minBeds: Number(minBeds) }
      );
    }

    const rooms = await queryBuilder.getMany();

    // Enrichir avec disponibilité calculée
    const availability = rooms.map(room => ({
      roomId: room.id,
      roomNumber: room.numero,
      housingId: room.housingId,
      housingName: room.housing?.nom,
      genderRestriction: room.genderRestriction,
      totalBeds: room.capacite,
      occupiedBeds: room.occupation,
      reservedBeds: room.reservedBeds,
      availableBeds: room.calculateAvailableBeds(),
      occupancyRate: room.calculateOccupancyRate(),
      type: room.type,
      loyerMensuel: room.loyerMensuel
    }));

    res.json({
      data: availability,
      count: availability.length,
      summary: {
        totalRooms: availability.length,
        totalBeds: availability.reduce((sum, r) => sum + r.totalBeds, 0),
        availableBeds: availability.reduce((sum, r) => sum + r.availableBeds, 0),
        occupiedBeds: availability.reduce((sum, r) => sum + r.occupiedBeds, 0)
      }
    });
  } catch (error) {
    console.error('[ReportsRoutes] Erreur disponibilité:', error);
    next(error);
  }
});

/**
 * GET /housing/reports/availability/by-gender
 * Statistiques agrégées par genre
 */
router.get('/availability/by-gender', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    // Statistiques hommes
    const maleRooms = await roomRepository.createQueryBuilder('room')
      .leftJoin('room.housing', 'housing')
      .where('housing.tenantId = :tenantId', { tenantId })
      .andWhere('(room.genderRestriction = :male OR room.genderRestriction = :mixte)', {
        male: GenderRestriction.HOMMES,
        mixte: GenderRestriction.MIXTE
      })
      .andWhere('room.isActif = :isActif', { isActif: true })
      .select('SUM(room.capacite)', 'totalBeds')
      .addSelect('SUM(room.occupation)', 'occupiedBeds')
      .addSelect('SUM(room.reservedBeds)', 'reservedBeds')
      .addSelect('COUNT(room.id)', 'roomCount')
      .getRawOne();

    // Statistiques femmes
    const femaleRooms = await roomRepository.createQueryBuilder('room')
      .leftJoin('room.housing', 'housing')
      .where('housing.tenantId = :tenantId', { tenantId })
      .andWhere('(room.genderRestriction = :female OR room.genderRestriction = :mixte)', {
        female: GenderRestriction.FEMMES,
        mixte: GenderRestriction.MIXTE
      })
      .andWhere('room.isActif = :isActif', { isActif: true })
      .select('SUM(room.capacite)', 'totalBeds')
      .addSelect('SUM(room.occupation)', 'occupiedBeds')
      .addSelect('SUM(room.reservedBeds)', 'reservedBeds')
      .addSelect('COUNT(room.id)', 'roomCount')
      .getRawOne();

    const maleStats = {
      gender: 'MALE',
      totalBeds: Number(maleRooms.totalBeds) || 0,
      occupiedBeds: Number(maleRooms.occupiedBeds) || 0,
      reservedBeds: Number(maleRooms.reservedBeds) || 0,
      availableBeds: (Number(maleRooms.totalBeds) || 0) - (Number(maleRooms.occupiedBeds) || 0) - (Number(maleRooms.reservedBeds) || 0),
      roomCount: Number(maleRooms.roomCount) || 0,
      occupancyRate: 0
    };
    maleStats.occupancyRate = maleStats.totalBeds > 0 
      ? (maleStats.occupiedBeds / maleStats.totalBeds) * 100 
      : 0;

    const femaleStats = {
      gender: 'FEMALE',
      totalBeds: Number(femaleRooms.totalBeds) || 0,
      occupiedBeds: Number(femaleRooms.occupiedBeds) || 0,
      reservedBeds: Number(femaleRooms.reservedBeds) || 0,
      availableBeds: (Number(femaleRooms.totalBeds) || 0) - (Number(femaleRooms.occupiedBeds) || 0) - (Number(femaleRooms.reservedBeds) || 0),
      roomCount: Number(femaleRooms.roomCount) || 0,
      occupancyRate: 0
    };
    femaleStats.occupancyRate = femaleStats.totalBeds > 0 
      ? (femaleStats.occupiedBeds / femaleStats.totalBeds) * 100 
      : 0;

    res.json({
      data: {
        male: maleStats,
        female: femaleStats,
        total: {
          totalBeds: maleStats.totalBeds + femaleStats.totalBeds,
          occupiedBeds: maleStats.occupiedBeds + femaleStats.occupiedBeds,
          availableBeds: maleStats.availableBeds + femaleStats.availableBeds
        }
      }
    });
  } catch (error) {
    console.error('[ReportsRoutes] Erreur stats genre:', error);
    next(error);
  }
});

/**
 * GET /housing/reports/annual
 * Rapports annuels historiques
 */
router.get('/annual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const { year, housingId, genderRestriction } = req.query;

    const queryBuilder = reportRepository.createQueryBuilder('report')
      .where('report.tenantId = :tenantId', { tenantId });

    if (year) {
      queryBuilder.andWhere('report.year = :year', { year: Number(year) });
    }

    if (housingId) {
      queryBuilder.andWhere('report.housingId = :housingId', { housingId });
    }

    if (genderRestriction) {
      queryBuilder.andWhere('report.genderRestriction = :gender', { gender: genderRestriction });
    }

    queryBuilder.orderBy('report.year', 'DESC')
      .addOrderBy('report.housingName', 'ASC');

    const reports = await queryBuilder.getMany();

    // Calculer agrégats par année
    const yearlyAggregates = reports.reduce((acc, report) => {
      if (!acc[report.year]) {
        acc[report.year] = {
          year: report.year,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          averageOccupancyRate: 0,
          renewalCount: 0,
          newAssignmentCount: 0,
          onlineSubmissionsRate: 0,
          reportCount: 0
        };
      }

      acc[report.year].totalBeds += report.totalBeds;
      acc[report.year].occupiedBeds += report.occupiedBeds;
      acc[report.year].availableBeds += report.availableBeds;
      acc[report.year].renewalCount += report.renewalCount;
      acc[report.year].newAssignmentCount += report.newAssignmentCount;
      acc[report.year].onlineSubmissionsRate += report.onlineSubmissionsRate;
      acc[report.year].reportCount += 1;

      return acc;
    }, {} as Record<number, any>);

    // Calculer moyennes
    Object.values(yearlyAggregates).forEach((agg: any) => {
      agg.averageOccupancyRate = agg.totalBeds > 0 
        ? (agg.occupiedBeds / agg.totalBeds) * 100 
        : 0;
      agg.onlineSubmissionsRate = agg.reportCount > 0 
        ? agg.onlineSubmissionsRate / agg.reportCount 
        : 0;
    });

    res.json({
      data: reports,
      aggregates: Object.values(yearlyAggregates),
      count: reports.length
    });
  } catch (error) {
    console.error('[ReportsRoutes] Erreur rapports annuels:', error);
    next(error);
  }
});

/**
 * GET /housing/reports/occupancy/:housingId
 * Occupation temps réel d'une cité spécifique
 */
router.get('/occupancy/:housingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { housingId } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    // Récupérer housing avec statistiques
    const housing = await housingRepository.findOne({
      where: { id: housingId, tenantId },
      relations: ['rooms']
    });

    if (!housing) {
      return res.status(404).json({ message: 'Logement non trouvé' });
    }

    // Calculer statistiques détaillées par type de chambre
    const roomsByType = housing.rooms.reduce((acc, room) => {
      if (!acc[room.type]) {
        acc[room.type] = {
          type: room.type,
          count: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          occupancyRate: 0
        };
      }

      acc[room.type].count += 1;
      acc[room.type].totalBeds += room.capacite;
      acc[room.type].occupiedBeds += room.occupation;
      acc[room.type].availableBeds += room.calculateAvailableBeds();

      return acc;
    }, {} as Record<string, any>);

    // Calculer taux occupation par type
    Object.values(roomsByType).forEach((type: any) => {
      type.occupancyRate = type.totalBeds > 0 
        ? (type.occupiedBeds / type.totalBeds) * 100 
        : 0;
    });

    // Statistiques par genre
    const roomsByGender = housing.rooms.reduce((acc, room) => {
      if (!acc[room.genderRestriction]) {
        acc[room.genderRestriction] = {
          gender: room.genderRestriction,
          count: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0
        };
      }

      acc[room.genderRestriction].count += 1;
      acc[room.genderRestriction].totalBeds += room.capacite;
      acc[room.genderRestriction].occupiedBeds += room.occupation;
      acc[room.genderRestriction].availableBeds += room.calculateAvailableBeds();

      return acc;
    }, {} as Record<string, any>);

    res.json({
      data: {
        housing: {
          id: housing.id,
          nom: housing.nom,
          code: housing.code,
          type: housing.type,
          genderRestriction: housing.genderRestriction
        },
        overall: {
          totalRooms: housing.rooms.length,
          totalBeds: housing.capaciteTotale,
          occupiedBeds: housing.occupationActuelle,
          availableBeds: housing.calculateAvailableBeds(),
          occupancyRate: housing.tauxOccupation
        },
        byType: Object.values(roomsByType),
        byGender: Object.values(roomsByGender)
      }
    });
  } catch (error) {
    console.error('[ReportsRoutes] Erreur occupation temps réel:', error);
    next(error);
  }
});

/**
 * GET /housing/reports/statistics/global
 * Statistiques globales du système
 */
router.get('/statistics/global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    // Stats globales chambres
    const roomStats = await roomRepository.createQueryBuilder('room')
      .leftJoin('room.housing', 'housing')
      .where('housing.tenantId = :tenantId', { tenantId })
      .andWhere('room.isActif = :isActif', { isActif: true })
      .select('COUNT(room.id)', 'totalRooms')
      .addSelect('SUM(room.capacite)', 'totalBeds')
      .addSelect('SUM(room.occupation)', 'occupiedBeds')
      .addSelect('SUM(room.reservedBeds)', 'reservedBeds')
      .getRawOne();

    const totalBeds = Number(roomStats.totalBeds) || 0;
    const occupiedBeds = Number(roomStats.occupiedBeds) || 0;
    const reservedBeds = Number(roomStats.reservedBeds) || 0;
    const availableBeds = totalBeds - occupiedBeds - reservedBeds;
    const globalOccupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Stats demandes (derniers 12 mois)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const requestStats = await requestRepository.createQueryBuilder('request')
      .where('request.tenantId = :tenantId', { tenantId })
      .andWhere('request.dateSubmission >= :since', { since: twelveMonthsAgo })
      .select('COUNT(request.id)', 'totalRequests')
      .addSelect('SUM(CASE WHEN request.submissionMethod = :online THEN 1 ELSE 0 END)', 'onlineCount')
      .addSelect('SUM(CASE WHEN request.status = :approved THEN 1 ELSE 0 END)', 'approvedCount')
      .addSelect('SUM(CASE WHEN request.status = :assigned THEN 1 ELSE 0 END)', 'assignedCount')
      .setParameters({
        online: SubmissionMethod.ONLINE,
        approved: RequestStatus.APPROVED,
        assigned: RequestStatus.ASSIGNED
      })
      .getRawOne();

    const totalRequests = Number(requestStats.totalRequests) || 0;
    const onlineCount = Number(requestStats.onlineCount) || 0;
    const onlineRate = totalRequests > 0 ? (onlineCount / totalRequests) * 100 : 0;

    // Tendances (évolution mensuelle)
    const monthlyTrends = await requestRepository.createQueryBuilder('request')
      .where('request.tenantId = :tenantId', { tenantId })
      .andWhere('request.dateSubmission >= :since', { since: twelveMonthsAgo })
      .select('EXTRACT(YEAR FROM request.dateSubmission)', 'year')
      .addSelect('EXTRACT(MONTH FROM request.dateSubmission)', 'month')
      .addSelect('COUNT(request.id)', 'count')
      .groupBy('year, month')
      .orderBy('year, month', 'ASC')
      .getRawMany();

    res.json({
      data: {
        occupancy: {
          totalRooms: Number(roomStats.totalRooms) || 0,
          totalBeds,
          occupiedBeds,
          reservedBeds,
          availableBeds,
          globalOccupancyRate: Math.round(globalOccupancyRate * 100) / 100
        },
        requests: {
          totalRequests12Months: totalRequests,
          onlineSubmissions: onlineCount,
          manualSubmissions: totalRequests - onlineCount,
          onlineSubmissionsRate: Math.round(onlineRate * 100) / 100,
          approvedCount: Number(requestStats.approvedCount) || 0,
          assignedCount: Number(requestStats.assignedCount) || 0
        },
        trends: monthlyTrends.map(trend => ({
          year: Number(trend.year),
          month: Number(trend.month),
          count: Number(trend.count)
        }))
      }
    });
  } catch (error) {
    console.error('[ReportsRoutes] Erreur statistiques globales:', error);
    next(error);
  }
});

export default router;
