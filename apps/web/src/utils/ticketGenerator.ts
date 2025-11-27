import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { TicketTransport, CategorieTicketTransport } from '@/services/api/transportTicketService';

/**
 * Génère un PDF pour un ticket de transport
 * Format ticket (A6 ou personnalisé)
 */
export const generateTransportTicketPDF = async (ticket: TicketTransport) => {
    // Format A6 (105mm x 148mm)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
    });

    const width = doc.internal.pageSize.getWidth();
    let y = 10;

    // En-tête
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RÉPUBLIQUE DU NIGER', width / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.text("MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR,", width / 2, y, { align: 'center' });
    y += 4;
    doc.text("DE LA RECHERCHE ET DE L'INNOVATION", width / 2, y, { align: 'center' });
    y += 4;
    doc.text("TECHNOLOGIQUE", width / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(9);
    doc.text("CENTRE RÉGIONAL DES OEUVRES", width / 2, y, { align: 'center' });
    y += 4;
    doc.text("UNIVERSITAIRES (CROU)", width / 2, y, { align: 'center' });
    y += 10;

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(10, y, width - 10, y);
    y += 10;

    // Titre du ticket
    doc.setFontSize(14);
    doc.text('TICKET DE TRANSPORT', width / 2, y, { align: 'center' });
    y += 10;

    // Informations du ticket
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Numéro
    doc.text(`N° Ticket: ${ticket.numeroTicket}`, 15, y);
    y += 7;

    // Catégorie
    doc.text(`Catégorie: ${ticket.categorie === CategorieTicketTransport.PAYANT ? 'Payant' : 'Gratuit'}`, 15, y);
    y += 7;

    // Tarif (si payant)
    if (ticket.categorie === CategorieTicketTransport.PAYANT) {
        doc.text(`Tarif: ${ticket.tarif.toLocaleString()} XOF`, 15, y);
        y += 7;
    }

    // Année
    doc.text(`Année: ${ticket.annee}`, 15, y);
    y += 7;

    // Expiration
    const expirationDate = new Date(ticket.dateExpiration).toLocaleDateString('fr-FR');
    doc.text(`Valable jusqu'au: ${expirationDate}`, 15, y);
    y += 15;

    // QR Code
    try {
        const qrData = JSON.stringify({
            id: ticket.id,
            num: ticket.numeroTicket,
            type: 'TRANSPORT'
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });

        const qrSize = 30;
        const qrX = (width - qrSize) / 2;
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    } catch (err) {
        console.error('Error generating QR code:', err);
        // Fallback to rectangle
        const qrSize = 30;
        const qrX = (width - qrSize) / 2;
        doc.rect(qrX, y, qrSize, qrSize);
        doc.setFontSize(8);
        doc.text('QR CODE ERROR', width / 2, y + qrSize / 2, { align: 'center' });
    }

    y += 30 + 10; // qrSize + margin

    // Footer
    doc.setFontSize(7);
    doc.text('Ce ticket est personnel et incessible.', width / 2, y, { align: 'center' });
    y += 4;
    doc.text('A conserver précieusement.', width / 2, y, { align: 'center' });

    // Sauvegarde
    doc.save(`ticket_transport_${ticket.numeroTicket}.pdf`);
};
