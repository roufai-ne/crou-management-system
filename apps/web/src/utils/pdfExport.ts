/**
 * FICHIER: apps/web/src/utils/pdfExport.ts
 * UTILITY: PDF Export - Helper pour exporter des données en PDF
 *
 * DESCRIPTION:
 * Utilitaires pour générer des exports PDF avec jsPDF
 * Tables, en-têtes, pieds de page personnalisés
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exporte des données tabulaires en PDF
 */
export function exportToPDF(options: PDFExportOptions): void {
  const {
    title,
    subtitle,
    headers,
    data,
    fileName = 'export.pdf',
    orientation = 'portrait'
  } = options;

  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // En-tête du document avec logo CROU
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Date de génération
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  yPosition += 10;

  // Table des données
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: yPosition,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [41, 128, 185], // Bleu
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 10, left: 10, right: 10 },
    didDrawPage: (data: any) => {
      // Pied de page sur chaque page
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${data.pageNumber} sur ${pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Logo ou info du CROU
      doc.text(
        'Système de Gestion CROU - Niger',
        10,
        pageHeight - 10
      );
    }
  });

  // Sauvegarder le PDF
  doc.save(fileName);
}

/**
 * Exporte les logs d'audit en PDF
 */
export function exportAuditLogsToPDF(logs: any[]): void {
  const headers = ['Date/Heure', 'Utilisateur', 'Action', 'Ressource', 'IP', 'Résultat'];
  const data = logs.map(log => [
    new Date(log.createdAt).toLocaleString('fr-FR'),
    log.userName || 'N/A',
    log.action,
    log.resource,
    log.ipAddress || 'N/A',
    log.success ? 'Succès' : 'Échec'
  ]);

  exportToPDF({
    title: 'Logs d\'Audit - CROU',
    subtitle: `Total: ${logs.length} enregistrement${logs.length > 1 ? 's' : ''}`,
    headers,
    data,
    fileName: `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation: 'landscape'
  });
}

/**
 * Exporte les alertes de sécurité en PDF
 */
export function exportSecurityAlertsToPDF(alerts: any[]): void {
  const headers = ['ID', 'Type', 'Sévérité', 'Description', 'IP', 'Date', 'Statut'];
  const data = alerts.map(alert => [
    alert.id.substring(0, 8) + '...',
    alert.type,
    alert.severity,
    alert.description,
    alert.ipAddress || 'N/A',
    new Date(alert.timestamp).toLocaleString('fr-FR'),
    alert.resolved ? 'Résolu' : 'En cours'
  ]);

  exportToPDF({
    title: 'Alertes de Sécurité - CROU',
    subtitle: `Total: ${alerts.length} alerte${alerts.length > 1 ? 's' : ''}`,
    headers,
    data,
    fileName: `security_alerts_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation: 'landscape'
  });
}

/**
 * Exporte les utilisateurs en PDF
 */
export function exportUsersToPDF(users: any[]): void {
  const headers = ['Email', 'Nom', 'Rôle', 'Organisation', 'Statut', 'Créé le'];
  const data = users.map(user => [
    user.email,
    user.name,
    user.role.name,
    user.tenant.name,
    user.status,
    new Date(user.createdAt).toLocaleDateString('fr-FR')
  ]);

  exportToPDF({
    title: 'Liste des Utilisateurs - CROU',
    subtitle: `Total: ${users.length} utilisateur${users.length > 1 ? 's' : ''}`,
    headers,
    data,
    fileName: `users_${new Date().toISOString().split('T')[0]}.pdf`
  });
}
