/**
 * FICHIER: apps\api\src\modules\notifications\websocket.gateway.ts
 * GATEWAY: WebSocketGateway - Gateway WebSocket
 * 
 * DESCRIPTION:
 * Gateway WebSocket pour les notifications temps réel
 * Intégration avec Socket.IO
 * 
 * FONCTIONNALITÉS:
 * - Connexions WebSocket en temps réel
 * - Envoi de notifications
 * - Gestion des rooms par tenant
 * - Authentification JWT
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { User } from '../../../database/entities/User.entity';
import { logger } from '../../shared/utils/logger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { logger } from '@/shared/utils/logger';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private tenantRooms: Map<string, Set<string>> = new Map(); // tenantId -> Set<socketId>

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Gestion de la connexion
   */
  async handleConnection(client: Socket) {
    try {
      // Authentification via token JWT
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Vérifier le token JWT et extraire les informations utilisateur
      const user = await this.authenticateUser(token);
      
      if (!user) {
        client.disconnect();
        return;
      }

      // Stocker la connexion
      this.connectedUsers.set(user.id, client.id);
      
      // Rejoindre la room du tenant
      const tenantRoom = `tenant:${user.tenantId}`;
      client.join(tenantRoom);
      
      // Ajouter à la room du tenant
      if (!this.tenantRooms.has(user.tenantId)) {
        this.tenantRooms.set(user.tenantId, new Set());
      }
      this.tenantRooms.get(user.tenantId)!.add(client.id);

      // Envoyer les notifications en attente
      await this.sendPendingNotifications(client, user.id, user.tenantId);

      logger.info(`Utilisateur connecté: ${user.id} (${client.id})`);

    } catch (error) {
      logger.error('Erreur connexion WebSocket:', error);
      client.disconnect();
    }
  }

  /**
   * Gestion de la déconnexion
   */
  handleDisconnect(client: Socket) {
    try {
      // Trouver l'utilisateur
      const userId = Array.from(this.connectedUsers.entries())
        .find(([_, socketId]) => socketId === client.id)?.[0];

      if (userId) {
        this.connectedUsers.delete(userId);
        
        // Retirer de toutes les rooms
        for (const [tenantId, socketIds] of this.tenantRooms.entries()) {
          socketIds.delete(client.id);
          if (socketIds.size === 0) {
            this.tenantRooms.delete(tenantId);
          }
        }

        logger.info(`Utilisateur déconnecté: ${userId} (${client.id})`);
      }

    } catch (error) {
      logger.error('Erreur déconnexion WebSocket:', error);
    }
  }

  /**
   * Authentifier un utilisateur via JWT
   */
  private async authenticateUser(token: string): Promise<any> {
    try {
      // Vérifier et décoder le token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      if (!decoded || !decoded.userId || !decoded.tenantId) {
        logger.warn('Token JWT invalide ou incomplet');
        return null;
      }
      
      // Vérifier que l'utilisateur existe toujours en base
      const user = await this.userRepository.findOne({
        where: { 
          id: decoded.userId,
          tenantId: decoded.tenantId,
          isActive: true
        }
      });
      
      if (!user) {
        logger.warn(`Utilisateur non trouvé ou inactif: ${decoded.userId}`);
        return null;
      }
      
      // Vérifier l'expiration du token
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        logger.warn(`Token expiré pour l'utilisateur: ${decoded.userId}`);
        return null;
      }
      
      logger.info(`Utilisateur authentifié: ${user.id} (${user.email})`);
      return {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role
      };
      // Pour l'instant, retourner un utilisateur mocké
      return {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'admin'
      };

    } catch (error) {
      logger.error('Erreur authentification utilisateur:', error);
      return null;
    }
  }

  /**
   * Envoyer les notifications en attente
   */
  private async sendPendingNotifications(client: Socket, userId: string, tenantId: string): Promise<void> {
    try {
      const notifications = await this.notificationsService.getUserNotifications(
        userId,
        tenantId,
        { limit: 10, status: 'pending' }
      );

      for (const notification of notifications) {
        client.emit('notification', notification);
      }

    } catch (error) {
      logger.error('Erreur envoi notifications en attente:', error);
    }
  }

  /**
   * Envoyer une notification à un utilisateur
   */
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('notification', notification);
      }

    } catch (error) {
      logger.error('Erreur envoi notification utilisateur:', error);
    }
  }

  /**
   * Envoyer une notification à un tenant
   */
  async sendNotificationToTenant(tenantId: string, notification: any): Promise<void> {
    try {
      this.server.to(`tenant:${tenantId}`).emit('notification', notification);

    } catch (error) {
      logger.error('Erreur envoi notification tenant:', error);
    }
  }

  /**
   * Envoyer une notification à un rôle
   */
  async sendNotificationToRole(tenantId: string, role: string, notification: any): Promise<void> {
    try {
      this.server.to(`tenant:${tenantId}`).to(`role:${role}`).emit('notification', notification);

    } catch (error) {
      logger.error('Erreur envoi notification rôle:', error);
    }
  }

  /**
   * Envoyer une notification à tous les utilisateurs connectés
   */
  async sendNotificationToAll(notification: any): Promise<void> {
    try {
      this.server.emit('notification', notification);

    } catch (error) {
      logger.error('Erreur envoi notification globale:', error);
    }
  }

  /**
   * Écouter les messages de notification
   */
  @SubscribeMessage('notification:read')
  async handleNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // TODO: Implémenter la logique de marquage comme lu
      logger.info(`Notification marquée comme lue: ${data.notificationId}`);

    } catch (error) {
      logger.error('Erreur marquage notification:', error);
    }
  }

  /**
   * Écouter les messages de suppression
   */
  @SubscribeMessage('notification:delete')
  async handleNotificationDelete(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // TODO: Implémenter la logique de suppression
      logger.info(`Notification supprimée: ${data.notificationId}`);

    } catch (error) {
      logger.error('Erreur suppression notification:', error);
    }
  }

  /**
   * Écouter les messages de préférences
   */
  @SubscribeMessage('notification:preferences')
  async handleNotificationPreferences(
    @MessageBody() data: { preferences: any },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // TODO: Implémenter la logique de mise à jour des préférences
      logger.info('Préférences de notification mises à jour');

    } catch (error) {
      logger.error('Erreur mise à jour préférences:', error);
    }
  }

  /**
   * Écouter les messages de test
   */
  @SubscribeMessage('notification:test')
  async handleNotificationTest(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      client.emit('notification:test:response', {
        message: 'Test de notification reçu',
        timestamp: new Date().toISOString(),
        originalMessage: data.message
      });

    } catch (error) {
      logger.error('Erreur test notification:', error);
    }
  }

  /**
   * Obtenir les statistiques de connexion
   */
  getConnectionStats(): any {
    return {
      totalConnections: this.connectedUsers.size,
      tenantConnections: Object.fromEntries(
        Array.from(this.tenantRooms.entries()).map(([tenantId, socketIds]) => [
          tenantId,
          socketIds.size
        ])
      ),
      connectedUsers: Array.from(this.connectedUsers.keys())
    };
  }

  /**
   * Nettoyer les connexions
   */
  cleanup(): void {
    this.connectedUsers.clear();
    this.tenantRooms.clear();
  }
}
