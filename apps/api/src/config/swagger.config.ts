/**
 * FICHIER: apps/api/src/config/swagger.config.ts
 * CONFIG: Configuration Swagger/OpenAPI pour la documentation API
 *
 * DESCRIPTION:
 * Configuration complète de Swagger UI pour documenter tous les endpoints
 * Documentation interactive accessible à /api-docs
 *
 * FONCTIONNALITÉS:
 * - Documentation auto-générée depuis JSDoc
 * - Interface Swagger UI interactive
 * - Authentification JWT dans l'interface
 * - Schémas des entités
 * - Exemples de requêtes/réponses
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

// Configuration Swagger
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CROU Management System API',
      version: '1.0.0',
      description: `
# API CROU - Système de Gestion des Centres Régionaux des Œuvres Universitaires

API REST complète pour la gestion des 8 CROU du Niger et du Ministère de l'Enseignement Supérieur.

## Fonctionnalités

- **Authentification JWT** - Connexion sécurisée avec tokens
- **Multi-tenant** - Isolation des données par organisation
- **RBAC** - 8 rôles avec 40 permissions granulaires
- **Dashboard** - KPIs et statistiques en temps réel
- **Modules métiers** - Financial, Stocks, Housing, Transport
- **Reports** - Génération et export (PDF, Excel)
- **Audit** - Traçabilité complète des actions

## Authentification

1. **POST** \`/api/auth/login\` pour obtenir un token
2. Copier le token depuis la réponse
3. Cliquer sur "Authorize" en haut à droite
4. Coller le token (sans "Bearer")
5. Tous les endpoints authentifiés sont maintenant accessibles

## Organisations

- **1 Ministère** - Ministère de l'Enseignement Supérieur
- **8 CROU** - Niamey, Maradi, Zinder, Tahoua, Agadez, Dosso, Diffa, Tillabéry

## Support

- Email: support@crou.ne
- Tél: +227 20 73 31 29
      `.trim(),
      contact: {
        name: 'Équipe CROU',
        email: 'support@crou.ne',
        url: 'https://www.crou.ne'
      },
      license: {
        name: 'Propriétaire',
        url: 'https://www.crou.ne/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api-staging.crou.ne',
        description: 'Serveur de staging'
      },
      {
        url: 'https://api.crou.ne',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT (sans "Bearer")'
        }
      },
      schemas: {
        // Schéma Error standard
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Une erreur est survenue'
            },
            error: {
              type: 'string',
              example: 'ERROR_CODE'
            },
            statusCode: {
              type: 'number',
              example: 400
            }
          }
        },
        // Schéma Success standard
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Opération réussie'
            },
            data: {
              type: 'object'
            }
          }
        },
        // Schéma Pagination
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              example: 1
            },
            limit: {
              type: 'number',
              example: 20
            },
            total: {
              type: 'number',
              example: 100
            },
            totalPages: {
              type: 'number',
              example: 5
            }
          }
        }
      },
      parameters: {
        // Paramètres communs
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Numéro de la page'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Nombre d\'éléments par page'
        },
        SearchParam: {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Recherche textuelle'
        },
        TenantIdParam: {
          in: 'query',
          name: 'tenantId',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID de l\'organisation (filtrage)'
        }
      },
      responses: {
        // Réponses communes
        UnauthorizedError: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Non autorisé',
                error: 'UNAUTHORIZED',
                statusCode: 401
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Permissions insuffisantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Accès interdit',
                error: 'FORBIDDEN',
                statusCode: 403
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Ressource non trouvée',
                error: 'NOT_FOUND',
                statusCode: 404
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Données invalides',
                error: 'VALIDATION_ERROR',
                statusCode: 400,
                details: [
                  {
                    field: 'email',
                    message: 'Email invalide'
                  }
                ]
              }
            }
          }
        },
        ServerError: {
          description: 'Erreur serveur interne',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Erreur serveur',
                error: 'INTERNAL_SERVER_ERROR',
                statusCode: 500
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion des sessions'
      },
      {
        name: 'Dashboard',
        description: 'Statistiques et KPIs'
      },
      {
        name: 'Admin - Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Admin - Roles',
        description: 'Gestion des rôles et permissions'
      },
      {
        name: 'Admin - Tenants',
        description: 'Gestion des organisations'
      },
      {
        name: 'Admin - Security',
        description: 'Sécurité et monitoring'
      },
      {
        name: 'Admin - Audit',
        description: 'Logs d\'audit'
      },
      {
        name: 'Financial',
        description: 'Gestion financière (budgets, transactions)'
      },
      {
        name: 'Stocks',
        description: 'Gestion des stocks et fournisseurs'
      },
      {
        name: 'Housing',
        description: 'Gestion des logements et cités universitaires'
      },
      {
        name: 'Transport',
        description: 'Gestion de la flotte de véhicules'
      },
      {
        name: 'Reports',
        description: 'Génération et export de rapports'
      },
      {
        name: 'Workflows',
        description: 'Gestion des workflows et approbations'
      },
      {
        name: 'Notifications',
        description: 'Notifications système'
      }
    ]
  },
  // Chemins vers les fichiers à scanner pour la documentation
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.controller.ts',
    './src/modules/**/index.ts',
    './src/shared/middlewares/*.ts'
  ]
};

// Options pour Swagger UI
export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; }
  `,
  customSiteTitle: 'CROU API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  }
};

// Génération de la spécification Swagger
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Export de la configuration
export default {
  swaggerSpec,
  swaggerUiOptions
};
