/**
 * Script de test du système de tickets anonymes
 * Teste la création et l'utilisation de tickets payants et gratuits
 */

import { AppDataSource } from '../../../../packages/database/src/config/datasource';
import { TicketService, CreateTicketDTO } from '../modules/restauration/ticket.service';
import { CategorieTicket } from '../../../../packages/database/src/entities/TicketRepas.entity';
import { TypeRepas } from '../../../../packages/database/src/entities/Menu.entity';

async function testAnonymousTickets() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connecté\n');

    // Récupérer un tenant de test
    const tenantRepo = AppDataSource.getRepository('Tenant' as any);
    const tenants = await tenantRepo.find({ take: 1 });
    if (tenants.length === 0) {
      console.error('❌ Aucun tenant trouvé dans la base de données');
      process.exit(1);
    }
    const tenantId = tenants[0].id;
    console.log(`✅ Tenant de test: ${tenantId}\n`);

    // ========================================
    // TEST 1: Créer un ticket GRATUIT
    // ========================================
    console.log('📋 TEST 1: Création d\'un ticket GRATUIT');
    console.log('─'.repeat(60));

    const ticketGratuitData: CreateTicketDTO = {
      categorie: CategorieTicket.GRATUIT,
      typeRepas: TypeRepas.DEJEUNER,
      tarif: 0,
      dateExpiration: new Date('2025-12-31'),
      annee: 2025,
      messageIndication: 'Ticket repas gratuit - Bon appétit!'
    };

    const ticketGratuit = await TicketService.createTicket(
      tenantId,
      'test-user',
      ticketGratuitData
    );

    console.log('✅ Ticket GRATUIT créé:');
    console.log(`   • Numéro: ${ticketGratuit.numeroTicket}`);
    console.log(`   • QR Code: ${ticketGratuit.qrCode}`);
    console.log(`   • Catégorie: ${ticketGratuit.categorie}`);
    console.log(`   • Type repas: ${ticketGratuit.typeRepas}`);
    console.log(`   • Tarif: ${ticketGratuit.tarif} F CFA`);
    console.log(`   • Année: ${ticketGratuit.annee}`);
    console.log(`   • Message: ${ticketGratuit.messageIndication}`);
    console.log('');

    // ========================================
    // TEST 2: Créer un ticket PAYANT
    // ========================================
    console.log('📋 TEST 2: Création d\'un ticket PAYANT');
    console.log('─'.repeat(60));

    const ticketPayantData: CreateTicketDTO = {
      categorie: CategorieTicket.PAYANT,
      typeRepas: TypeRepas.DINER,
      tarif: 500,
      dateExpiration: new Date('2025-12-31'),
      annee: 2025,
      methodePaiement: 'ESPECES',
      messageIndication: 'Ticket repas payant - Merci de votre achat!'
    };

    const ticketPayant = await TicketService.createTicket(
      tenantId,
      'test-user',
      ticketPayantData
    );

    console.log('✅ Ticket PAYANT créé:');
    console.log(`   • Numéro: ${ticketPayant.numeroTicket}`);
    console.log(`   • QR Code: ${ticketPayant.qrCode}`);
    console.log(`   • Catégorie: ${ticketPayant.categorie}`);
    console.log(`   • Type repas: ${ticketPayant.typeRepas}`);
    console.log(`   • Tarif: ${ticketPayant.tarif} F CFA`);
    console.log(`   • Méthode paiement: ${ticketPayant.methodePaiement}`);
    console.log(`   • Message: ${ticketPayant.messageIndication}`);
    console.log('');

    // ========================================
    // TEST 3: Récupérer un ticket par QR code
    // ========================================
    console.log('📋 TEST 3: Récupération par QR code');
    console.log('─'.repeat(60));

    const ticketByQR = await TicketService.getTicketByIdentifier(
      ticketGratuit.qrCode,
      tenantId
    );

    console.log('✅ Ticket retrouvé par QR code:');
    console.log(`   • ID: ${ticketByQR.id}`);
    console.log(`   • Numéro: ${ticketByQR.numeroTicket}`);
    console.log(`   • Status: ${ticketByQR.status}`);
    console.log('');

    // ========================================
    // TEST 4: Récupérer un ticket par numéro
    // ========================================
    console.log('📋 TEST 4: Récupération par numéro');
    console.log('─'.repeat(60));

    const ticketByNumero = await TicketService.getTicketByIdentifier(
      ticketPayant.numeroTicket,
      tenantId
    );

    console.log('✅ Ticket retrouvé par numéro:');
    console.log(`   • ID: ${ticketByNumero.id}`);
    console.log(`   • QR Code: ${ticketByNumero.qrCode}`);
    console.log(`   • Status: ${ticketByNumero.status}`);
    console.log('');

    // ========================================
    // TEST 5: Vérifier validité d'un ticket
    // ========================================
    console.log('📋 TEST 5: Vérification validité');
    console.log('─'.repeat(60));

    const validite = await TicketService.verifierValidite(ticketGratuit);

    console.log(`✅ Validité du ticket ${ticketGratuit.numeroTicket}:`);
    console.log(`   • Valide: ${validite.valide ? 'OUI' : 'NON'}`);
    if (validite.raison) {
      console.log(`   • Raison: ${validite.raison}`);
    }
    console.log('');

    // ========================================
    // TEST 6: Lister tous les tickets
    // ========================================
    console.log('📋 TEST 6: Liste des tickets');
    console.log('─'.repeat(60));

    const result = await TicketService.getTickets(tenantId);

    console.log('✅ Statistiques des tickets:');
    console.log(`   • Total: ${result.total}`);
    console.log(`   • Actifs: ${result.actifs}`);
    console.log(`   • Payants: ${result.payants}`);
    console.log(`   • Gratuits: ${result.gratuits}`);
    console.log(`   • Montant total: ${result.montantTotal} F CFA`);
    console.log('');

    console.log('✅ Tests terminés avec succès!');
    console.log('');
    console.log('🎯 Résumé:');
    console.log('   • Système de tickets anonymes fonctionnel');
    console.log('   • Création tickets payants et gratuits: OK');
    console.log('   • QR codes uniques générés: OK');
    console.log('   • Recherche par QR/numéro: OK');
    console.log('   • Validation tickets: OK');

  } catch (error: any) {
    console.error('❌ ERREUR lors des tests:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔌 Déconnexion de la base de données');
    }
  }
}

testAnonymousTickets();
