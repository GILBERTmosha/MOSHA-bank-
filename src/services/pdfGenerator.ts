import { jsPDF } from 'jspdf';
import { Loan, Repayment, AppSettings } from '../types';
import { formatCurrency } from './notificationService';

export interface PDFGenerationResult {
  blob: Blob;
  dataUri: string;
  filename: string;
}

export function generateOfficialReceiptPDF(
  loan: Loan,
  settings: AppSettings,
  repayment?: Repayment | null
): PDFGenerationResult {
  const isRepayment = !!repayment;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = settings.currency || 'TZS';
  const companyName = settings.companyName || 'MOSHA FOUNDATION BANK';
  const receiptNo = repayment ? repayment.receiptNumber : loan.receiptNumber;
  const receiptDate = repayment ? repayment.date : loan.loanDate;
  const formattedDate = new Date(receiptDate).toLocaleDateString('sw-TZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const dueDateStr = new Date(loan.dueDate).toLocaleDateString('sw-TZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // 2. Header Section with Logo Badge
  const logoBoxSize = 16;
  let hasDrawnImage = false;
  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'JPEG', margin, 10, logoBoxSize, logoBoxSize);
      hasDrawnImage = true;
    } catch {
      hasDrawnImage = false;
    }
  }

  if (!hasDrawnImage) {
    // Draw crisp vector gold & navy crest badge
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, 10, logoBoxSize, logoBoxSize, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, 10, logoBoxSize, logoBoxSize, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 158, 11);
    doc.text('MFB', margin + logoBoxSize / 2, 20.5, { align: 'center' });
  }

  const textStartX = margin + logoBoxSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), textStartX, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.tagline || 'Mfumo Rasmi wa Hifadhi ya Fedha, Madeni & Matumizi', textStartX, 22);
  doc.text(
    `Simu: ${settings.phone || '-'} | Email: ${settings.email || '-'}`,
    textStartX,
    26.5
  );

  // Receipt Number Badge on the Right
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - margin - 52, 10, 52, 17, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMBA YA RISITI:', pageWidth - margin - 48, 16);
  
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`#${receiptNo}`, pageWidth - margin - 48, 23);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, 31, pageWidth - margin, 31);

  // 3. Document Title Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, 40, contentWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const titleText = isRepayment ? 'RISITI YA MALIPO YA DENI' : 'RISITI YA MKOPO & DENI';
  doc.text(titleText, pageWidth / 2, 46.5, { align: 'center' });

  // 4. Client and Transaction Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 54, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TAARIFA ZA MTEJA:', margin + 4, 60);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(loan.clientName, margin + 4, 67);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Simu: ${loan.clientPhone}`, margin + 4, 73);
  if (loan.clientEmail) {
    doc.text(`Email: ${loan.clientEmail}`, margin + 4, 78);
  }

  // Right side of client box
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TAREHE YA RISITI:', rightColX, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, rightColX, 66);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TAREHE YA MWISHO:', rightColX, 72);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28);
  doc.text(dueDateStr, rightColX, 78);

  // 5. Financial Breakdown Table
  let currentY = 88;

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('MAELEZO YA HUDUMA & FEDHA', margin + 4, currentY + 5.5);
  doc.text('KIASI', pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // Row 1: Principal Amount
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Kiasi cha Mkopo Uliochukuliwa (Principal)', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(loan.principalAmount, currency), pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
  currentY += 8;

  // Row 2: Fee Amount
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Ada ya Huduma / Ofisi (Processing Fee)', margin + 4, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(loan.feeAmount, currency), pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
  currentY += 8;

  // Row 3: Total Loan (Principal + Fee)
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('JUMLA KUU YA DENI (Mtaji + Ada)', margin + 4, currentY + 6);
  doc.text(formatCurrency(loan.totalAmount, currency), pageWidth - margin - 4, currentY + 6, { align: 'right' });
  currentY += 9;

  // Repayment Specific Rows
  if (isRepayment && repayment) {
    // Current Payment Made
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.rect(margin, currentY, contentWidth, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text(`Kiasi Kilicholipwa Sasa (${repayment.paymentMethod})`, margin + 4, currentY + 6);
    doc.text(formatCurrency(repayment.amount, currency), pageWidth - margin - 4, currentY + 6, { align: 'right' });
    currentY += 9;

    // Total Paid so far
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Jumla Iliyolipwa Hadi Sasa', margin + 4, currentY + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(loan.amountPaid, currency), pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
    currentY += 8;
  }

  // Final Balance Box
  const isPaidOff = loan.balanceRemaining <= 0;
  doc.setFillColor(isPaidOff ? 236 : 254, isPaidOff ? 253 : 242, isPaidOff ? 245 : 242);
  doc.setDrawColor(isPaidOff ? 167 : 254, isPaidOff ? 243 : 202, isPaidOff ? 208 : 202);
  doc.roundedRect(margin, currentY + 2, contentWidth, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(isPaidOff ? 6 : 153, isPaidOff ? 95 : 27, isPaidOff ? 70 : 27);
  doc.text('BAKI YA DENI INAYODAIWA:', margin + 4, currentY + 9.5);
  doc.setFontSize(12);
  doc.text(
    isPaidOff ? 'TSH 0 (DENI LIMELIPWA LOTE)' : formatCurrency(loan.balanceRemaining, currency),
    pageWidth - margin - 4,
    currentY + 9.5,
    { align: 'right' }
  );

  currentY += 20;

  // 6. Additional Notes & Collateral
  if (loan.collateral || loan.notes) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('MAELEZO YA NYONGEZA:', margin + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    let noteText = '';
    if (loan.collateral) noteText += `Dhamana: ${loan.collateral}. `;
    if (loan.notes) noteText += `Maelezo: ${loan.notes}.`;
    doc.text(noteText, margin + 3, currentY + 11, { maxWidth: contentWidth - 6 });

    currentY += 20;
  }

  // 7. Security Stamp and Banker Signatures
  currentY += 10;
  const stampWidth = 55;

  // Authorized Signatory
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, currentY + 15, margin + stampWidth + 10, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('SAHIHI YA AFISA MTOAJI', margin + 8, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(companyName, margin + 8, currentY + 24);

  // Bank Official Electronic Stamp Box
  const stampX = pageWidth - margin - stampWidth - 5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.roundedRect(stampX, currentY - 2, stampWidth, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('MUHURI RASMI WA AFISI', stampX + stampWidth / 2, currentY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.text(companyName, stampX + stampWidth / 2, currentY + 11, { align: 'center' });
  doc.setTextColor(16, 185, 129);
  doc.text('VERIFIED ELECTRONIC RECORD', stampX + stampWidth / 2, currentY + 17, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.text(formattedDate, stampX + stampWidth / 2, currentY + 23, { align: 'center' });

  // 8. Footer Section
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 275, pageWidth - margin, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Hati hii ni risiti rasmi ya kielektroniki iliyotolewa na ${companyName}. Hairuhusiwi kubadilishwa.`,
    pageWidth / 2,
    280,
    { align: 'center' }
  );

  const filename = `${companyName.replace(/\s+/g, '_')}_Risiti_${receiptNo}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  return { blob, dataUri, filename };
}

// Function to share or download the PDF with WhatsApp / Email
export async function shareOrSendReceiptPDF(
  loan: Loan,
  settings: AppSettings,
  repayment?: Repayment | null
): Promise<{ success: boolean; sharedDirectly: boolean }> {
  try {
    const { blob, filename } = generateOfficialReceiptPDF(loan, settings, repayment);
    const file = new File([blob], filename, { type: 'application/pdf' });

    // Check if Web Share API with files is available (mobile browsers / supported tablets)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Risiti Rasmi - ${settings.companyName}`,
          text: `Hati ya Risiti Rasmi ya #${repayment ? repayment.receiptNumber : loan.receiptNumber} kwa ajili ya ndugu ${loan.clientName}.`,
        });
        return { success: true, sharedDirectly: true };
      } catch (shareErr: any) {
        // If the user cancelled or aborted the native share prompt, this is expected behavior
        if (shareErr?.name === 'AbortError' || String(shareErr?.message || shareErr).toLowerCase().includes('cancel')) {
          return { success: true, sharedDirectly: false };
        }
        // Otherwise fallback to normal download below
      }
    }

    // Fallback: Trigger standard download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return { success: true, sharedDirectly: false };
  } catch (err: any) {
    if (err?.name !== 'AbortError' && !String(err?.message || err).toLowerCase().includes('cancel')) {
      console.warn('PDF share fallback used:', err);
    }
    return { success: false, sharedDirectly: false };
  }
}
