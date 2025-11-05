/**
 * FICHIER: apps/api/src/modules/reports/reports.export.service.ts
 * SERVICE: ReportsExportService - Export de rapports en Excel et PDF
 *
 * DESCRIPTION:
 * Service pour exporter les rapports financiers et autres en formats Excel et PDF
 * Utilise exceljs pour Excel et pdfkit pour PDF
 * Support des graphiques, tableaux formatés et styles
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// ================================================================================================
// TYPES
// ================================================================================================

export interface ReportData {
  title: string;
  subtitle?: string;
  period: { start: Date; end: Date };
  crouName?: string;
  generatedBy: string;
  generatedAt: Date;
  sections: ReportSection[];
  summary?: ReportSummary;
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'text';
  data: any;
  columns?: ColumnDefinition[];
}

export interface ColumnDefinition {
  header: string;
  key: string;
  width?: number;
  style?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
}

export interface ReportSummary {
  totals: Record<string, number>;
  kpis: Array<{ label: string; value: string | number }>;
}

// ================================================================================================
// SERVICE D'EXPORT
// ================================================================================================

export class ReportsExportService {
  /**
   * Exporter un rapport en format Excel
   */
  static async exportToExcel(reportData: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CROU Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(reportData.title, {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true
      }
    });

    let currentRow = 1;

    // ============================================================================================
    // EN-TÊTE DU RAPPORT
    // ============================================================================================
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = reportData.title;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF0066CC' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };
    currentRow += 2;

    // Sous-titre
    if (reportData.subtitle) {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = reportData.subtitle;
      subtitleCell.font = { size: 12, italic: true };
      subtitleCell.alignment = { horizontal: 'center' };
      currentRow += 1;
    }

    // Informations du rapport
    if (reportData.crouName) {
      worksheet.getCell(`A${currentRow}`).value = 'CROU:';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = reportData.crouName;
      currentRow++;
    }

    worksheet.getCell(`A${currentRow}`).value = 'Période:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = `${this.formatDate(
      reportData.period.start
    )} - ${this.formatDate(reportData.period.end)}`;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Généré par:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = reportData.generatedBy;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Date génération:';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = this.formatDate(reportData.generatedAt);
    currentRow += 2;

    // ============================================================================================
    // SECTIONS DU RAPPORT
    // ============================================================================================
    for (const section of reportData.sections) {
      // Titre de section
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const sectionTitleCell = worksheet.getCell(`A${currentRow}`);
      sectionTitleCell.value = section.title;
      sectionTitleCell.font = { size: 14, bold: true, color: { argb: 'FF333333' } };
      sectionTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E8E8' }
      };
      currentRow += 2;

      if (section.type === 'table' && section.columns) {
        // En-têtes de colonnes
        const headerRow = worksheet.getRow(currentRow);
        section.columns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = col.header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0066CC' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Définir la largeur de colonne
          worksheet.getColumn(index + 1).width = col.width || 15;
        });
        currentRow++;

        // Données du tableau
        if (Array.isArray(section.data)) {
          section.data.forEach((row: any) => {
            const dataRow = worksheet.getRow(currentRow);
            section.columns!.forEach((col, index) => {
              const cell = dataRow.getCell(index + 1);
              const value = row[col.key];

              // Formater selon le style
              switch (col.style) {
                case 'currency':
                  cell.value = typeof value === 'number' ? value : 0;
                  cell.numFmt = '#,##0 "FCFA"';
                  cell.alignment = { horizontal: 'right' };
                  break;
                case 'number':
                  cell.value = typeof value === 'number' ? value : 0;
                  cell.numFmt = '#,##0';
                  cell.alignment = { horizontal: 'right' };
                  break;
                case 'percentage':
                  cell.value = typeof value === 'number' ? value / 100 : 0;
                  cell.numFmt = '0.00%';
                  cell.alignment = { horizontal: 'right' };
                  break;
                case 'date':
                  cell.value = value ? new Date(value) : '';
                  cell.numFmt = 'dd/mm/yyyy';
                  break;
                default:
                  cell.value = value || '';
              }

              cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
              };
            });
            currentRow++;
          });
        }

        currentRow += 2;
      } else if (section.type === 'text') {
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = section.data;
        currentRow += 2;
      }
    }

    // ============================================================================================
    // RÉSUMÉ
    // ============================================================================================
    if (reportData.summary) {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const summaryTitleCell = worksheet.getCell(`A${currentRow}`);
      summaryTitleCell.value = 'RÉSUMÉ';
      summaryTitleCell.font = { size: 14, bold: true, color: { argb: 'FF0066CC' } };
      summaryTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F8FF' }
      };
      currentRow += 2;

      // KPIs
      if (reportData.summary.kpis) {
        reportData.summary.kpis.forEach((kpi) => {
          worksheet.getCell(`A${currentRow}`).value = kpi.label;
          worksheet.getCell(`A${currentRow}`).font = { bold: true };
          worksheet.getCell(`B${currentRow}`).value = kpi.value;
          worksheet.getCell(`B${currentRow}`).font = { size: 12 };
          currentRow++;
        });
      }
    }

    // ============================================================================================
    // GÉNÉRATION DU BUFFER
    // ============================================================================================
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Exporter un rapport en format PDF
   */
  static async exportToPDF(reportData: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // ============================================================================================
        // EN-TÊTE
        // ============================================================================================
        this.addPDFHeader(doc, reportData);

        // ============================================================================================
        // SECTIONS
        // ============================================================================================
        for (const section of reportData.sections) {
          doc.moveDown();
          doc.fontSize(14).fillColor('#0066CC').text(section.title, { underline: true });
          doc.moveDown(0.5);

          if (section.type === 'table' && section.columns) {
            this.addPDFTable(doc, section.data, section.columns);
          } else if (section.type === 'text') {
            doc.fontSize(10).fillColor('#000000').text(section.data);
          }

          doc.moveDown();
        }

        // ============================================================================================
        // RÉSUMÉ
        // ============================================================================================
        if (reportData.summary) {
          doc.addPage();
          doc.fontSize(16).fillColor('#0066CC').text('RÉSUMÉ', { align: 'center' });
          doc.moveDown();

          if (reportData.summary.kpis) {
            reportData.summary.kpis.forEach((kpi) => {
              doc
                .fontSize(12)
                .fillColor('#000000')
                .text(`${kpi.label}: `, { continued: true })
                .font('Helvetica-Bold')
                .text(String(kpi.value));
              doc.moveDown(0.5);
            });
          }
        }

        // ============================================================================================
        // FOOTER
        // ============================================================================================
        this.addPDFFooter(doc, reportData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ================================================================================================
  // MÉTHODES PRIVÉES - HELPERS
  // ================================================================================================

  private static addPDFHeader(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    // Titre principal
    doc
      .fontSize(20)
      .fillColor('#0066CC')
      .text(reportData.title, { align: 'center' });

    if (reportData.subtitle) {
      doc.fontSize(14).fillColor('#666666').text(reportData.subtitle, { align: 'center' });
    }

    doc.moveDown();

    // Informations du rapport
    doc.fontSize(10).fillColor('#000000');
    if (reportData.crouName) {
      doc.text(`CROU: ${reportData.crouName}`);
    }
    doc.text(
      `Période: ${this.formatDate(reportData.period.start)} - ${this.formatDate(
        reportData.period.end
      )}`
    );
    doc.text(`Généré par: ${reportData.generatedBy}`);
    doc.text(`Date: ${this.formatDate(reportData.generatedAt)}`);

    doc.moveDown();
  }

  private static addPDFTable(
    doc: PDFKit.PDFDocument,
    data: any[],
    columns: ColumnDefinition[]
  ): void {
    if (!Array.isArray(data) || data.length === 0) {
      doc.fontSize(10).fillColor('#999999').text('Aucune donnée disponible');
      return;
    }

    const tableTop = doc.y;
    const tableLeft = 50;
    const columnWidth = (doc.page.width - 100) / columns.length;
    let yPosition = tableTop;

    // En-têtes
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF');
    columns.forEach((col, index) => {
      const xPosition = tableLeft + index * columnWidth;
      doc.rect(xPosition, yPosition, columnWidth, 20).fill('#0066CC');
      doc.fillColor('#FFFFFF').text(col.header, xPosition + 5, yPosition + 5, {
        width: columnWidth - 10,
        align: 'center'
      });
    });

    yPosition += 20;

    // Données
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    data.forEach((row, rowIndex) => {
      // Alterner les couleurs de fond
      const fillColor = rowIndex % 2 === 0 ? '#F9F9F9' : '#FFFFFF';

      columns.forEach((col, colIndex) => {
        const xPosition = tableLeft + colIndex * columnWidth;
        doc.rect(xPosition, yPosition, columnWidth, 18).fill(fillColor);

        let value = row[col.key];

        // Formater selon le style
        switch (col.style) {
          case 'currency':
            value = typeof value === 'number' ? `${value.toLocaleString()} FCFA` : '0 FCFA';
            break;
          case 'number':
            value = typeof value === 'number' ? value.toLocaleString() : '0';
            break;
          case 'percentage':
            value = typeof value === 'number' ? `${value.toFixed(2)}%` : '0%';
            break;
          case 'date':
            value = value ? this.formatDate(new Date(value)) : '-';
            break;
          default:
            value = value || '-';
        }

        doc.fillColor('#000000').text(String(value), xPosition + 5, yPosition + 4, {
          width: columnWidth - 10,
          align: col.style === 'currency' || col.style === 'number' ? 'right' : 'left'
        });
      });

      yPosition += 18;

      // Nouvelle page si nécessaire
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
      }
    });
  }

  private static addPDFFooter(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          `Page ${i + 1} / ${pageCount} - Généré le ${this.formatDate(reportData.generatedAt)}`,
          50,
          doc.page.height - 40,
          {
            align: 'center'
          }
        );
    }
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
