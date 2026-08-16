import React, { useRef, useState } from 'react';
import { Loan, Repayment, AppSettings } from '../types';
import { formatCurrency, generateLoanNoticeMessage, generateRepaymentMessage } from '../services/notificationService';
import { generateOfficialReceiptPDF, shareOrSendReceiptPDF } from '../services/pdfGenerator';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Download, 
  Printer, 
  Share2, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  ShieldCheck, 
  FileText, 
  Building2, 
  Image as ImageIcon,
  Copy,
  Clock,
  Mail
} from 'lucide-react';

interface ReceiptViewProps {
  loan: Loan;
  repayment?: Repayment;
  settings: AppSettings;
  onClose?: () => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  loan,
  repayment,
  settings,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isRepaymentReceipt = !!repayment;
  const receiptNumber = repayment ? repayment.receiptNumber : loan.receiptNumber;
  const receiptDate = repayment ? repayment.date : loan.loanDate;
  const receiptType = isRepaymentReceipt ? 'RISITI YA MALIPO YA DENI' : 'RISITI YA MKOPO & DENI';

  const messages = isRepaymentReceipt
    ? generateRepaymentMessage(loan, repayment, settings)
    : generateLoanNoticeMessage(loan, settings);

  // Export to high quality PDF
  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const { blob, filename } = generateOfficialReceiptPDF(loan, settings, repayment);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PNG Image
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Remove any modern css variables or oklch that might confuse html2canvas
          const el = clonedDoc.getElementById('official-receipt-canvas');
          if (el) {
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#0f172a';
          }
        }
      });
      const link = document.createElement('a');
      link.download = `${settings.companyName.replace(/\s+/g, '_')}_Risiti_${receiptNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.warn('Image export error fallback to PDF:', err);
      // If canvas image fails, provide the vector PDF instead
      handleDownloadPDF();
    } finally {
      setIsExporting(false);
    }
  };

  // One-click Share to WhatsApp with PDF Download / Native Share
  const handleSendWhatsApp = async () => {
    setIsExporting(true);
    try {
      await shareOrSendReceiptPDF(loan, settings, repayment);
      // Open WhatsApp chat in new window
      window.open(messages.whatsappUrl, '_blank');
    } catch (err) {
      window.open(messages.whatsappUrl, '_blank');
    } finally {
      setIsExporting(false);
    }
  };

  // One-click Share to Email with PDF Download / Native Share
  const handleSendEmail = async () => {
    setIsExporting(true);
    try {
      await shareOrSendReceiptPDF(loan, settings, repayment);
      if (messages.emailUrl) {
        window.location.href = messages.emailUrl;
      }
    } catch (err) {
      if (messages.emailUrl) {
        window.location.href = messages.emailUrl;
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Print directly
  const handlePrint = () => {
    window.print();
  };

  // Copy text details
  const handleCopyText = () => {
    navigator.clipboard.writeText(messages.whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isFullPaid = loan.balanceRemaining <= 0;

  return (
    <div id="receipt-modal-container" className="space-y-6">
      {/* Action Bar (Top Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-md print:hidden">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm sm:text-base">Risiti Rasmi #{receiptNumber}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-download-pdf"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Inatayarisha...' : 'Pakua PDF'}</span>
          </button>

          <button
            id="btn-whatsapp-direct"
            type="button"
            onClick={handleSendWhatsApp}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tuma WhatsApp (PDF & Ujumbe)</span>
          </button>

          {loan.clientEmail && (
            <button
              id="btn-email-direct"
              type="button"
              onClick={handleSendEmail}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow"
            >
              <Mail className="w-4 h-4" />
              <span>Tuma Email</span>
            </button>
          )}

          <button
            id="btn-download-img"
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Pakua Picha</span>
          </button>

          <button
            id="btn-print-receipt"
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Chapisha</span>
          </button>

          <button
            id="btn-copy-msg"
            type="button"
            onClick={handleCopyText}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
            title="Nakili maandishi ya ujumbe"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Imenakiliwa!' : 'Nakili'}</span>
          </button>
        </div>
      </div>

      {/* The Printable / Renderable Receipt Document */}
      <div className="flex justify-center overflow-x-auto p-1 sm:p-2 bg-slate-100 rounded-xl">
        <div
          ref={receiptRef}
          id="official-receipt-canvas"
          className="w-full max-w-xl bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200 relative overflow-hidden"
          style={{ minWidth: '320px' }}
        >
          {/* Subtle Security Bank Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
            <Building2 className="w-96 h-96 text-slate-900" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-5 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-md border-2 border-amber-400/80 flex items-center justify-center shrink-0 overflow-hidden">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 text-amber-400 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {settings.companyName || 'MOSHA FOUNDATION BANK'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">{settings.tagline || 'Hifadhi ya Fedha, Madeni & Matumizi'}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Simu: <span className="font-semibold text-slate-800">{settings.phone}</span>
                  {settings.email && ` | Email: ${settings.email}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-amber-300 font-mono text-xs font-bold rounded-md tracking-wider shadow-sm">
                #{receiptNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono font-medium">
                {new Date(receiptDate).toLocaleDateString('sw-TZ', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Receipt Title Banner */}
          <div className="text-center py-2 px-4 bg-slate-50 border border-slate-200 rounded-lg mb-5 relative z-10">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              {receiptType}
            </h2>
            <div className="text-[11px] text-slate-500">
              Hati halali ya kielektroniki kutoka {settings.companyName}
            </div>
          </div>

          {/* Client & Loan Info Box */}
          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm mb-5 p-3.5 bg-slate-50/70 rounded-lg border border-slate-100 relative z-10">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Jina la Mteja</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base">{loan.clientName}</span>
              <span className="text-xs text-slate-500 block font-mono mt-0.5">{loan.clientPhone}</span>
              {loan.clientEmail && (
                <span className="text-[11px] text-slate-400 block">{loan.clientEmail}</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hali ya Deni</span>
              <div className="mt-1">
                {isFullPaid ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                    <CheckCircle className="w-3 h-3" />
                    <span>LIMELIPWA LOTE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">
                    <Clock className="w-3 h-3" />
                    <span>LINAENDELEA KULIPWA</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Tarehe ya Mwisho: <span className="font-semibold text-slate-700">{loan.dueDate}</span>
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mb-5 relative z-10">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 text-[11px] uppercase">
                  <th className="py-2 px-3 font-bold">Maelezo ya Kituo</th>
                  <th className="py-2 px-3 text-right font-bold">Kiasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 text-slate-700">Kiasi cha Mkopo Uliochukuliwa</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(loan.principalAmount, settings.currency)}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 text-slate-700">
                    Ada ya Huduma / Ofisi (Processing Fee)
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(loan.feeAmount, settings.currency)}
                  </td>
                </tr>

                <tr className="bg-slate-50 font-bold">
                  <td className="py-2.5 px-3 text-slate-900">JUMLA KUU YA DENI (Mtaji + Ada)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {formatCurrency(loan.totalAmount, settings.currency)}
                  </td>
                </tr>

                {isRepaymentReceipt && repayment && (
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-200">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kiasi Kilicholipwa Sasa (Njia: {repayment.paymentMethod})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">
                      {formatCurrency(repayment.amount, settings.currency)}
                    </td>
                  </tr>
                )}

                <tr>
                  <td className="py-2 px-3 text-slate-600 text-xs">Jumla Iliyolipwa Hadi Sasa</td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-slate-700">
                    {formatCurrency(loan.amountPaid, settings.currency)}
                  </td>
                </tr>

                <tr className="border-t-2 border-slate-900 bg-slate-900 text-white font-bold">
                  <td className="py-3 px-3 uppercase text-xs tracking-wider">
                    BAKI INAYODAIWA (BALANCE)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base text-amber-300">
                    {isFullPaid ? 'TZS 0.00' : formatCurrency(loan.balanceRemaining, settings.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Collateral & Notes if available */}
          {(loan.collateral || loan.notes || (repayment && repayment.notes)) && (
            <div className="mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 relative z-10">
              {loan.collateral && (
                <div>
                  <span className="font-semibold text-slate-700">Dhamana Iliyowekwa:</span>{' '}
                  <span className="text-slate-600">{loan.collateral}</span>
                </div>
              )}
              {loan.notes && (
                <div>
                  <span className="font-semibold text-slate-700">Maelezo:</span>{' '}
                  <span className="text-slate-600">{loan.notes}</span>
                </div>
              )}
              {repayment && repayment.notes && (
                <div>
                  <span className="font-semibold text-slate-700">Ufafanuzi wa Malipo:</span>{' '}
                  <span className="text-slate-600">{repayment.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Signatures & Seal Section */}
          <div className="pt-4 border-t border-slate-200 mt-6 grid grid-cols-2 gap-6 relative z-10">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] italic text-indigo-900 font-serif font-bold">
                  Mosha Foundation Auth.
                </span>
              </div>
              <p className="text-[10px] text-center uppercase font-bold text-slate-500 mt-1">
                Sahihi ya Ofisi / Mhasibu
              </p>
            </div>

            <div>
              <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] text-slate-400 font-mono italic">
                  {loan.clientName.split(' ')[0]}
                </span>
              </div>
              <p className="text-[10px] text-center uppercase font-bold text-slate-500 mt-1">
                Sahihi ya Mteja
              </p>
            </div>
          </div>

          {/* Official Footer */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
            <div className="flex items-center space-x-1 text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Imethibitishwa na Mfumo wa Mosha Foundation Bank</span>
            </div>
            <div className="font-mono">
              Tarehe: {new Date().toLocaleDateString('sw-TZ')} {new Date().toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Share / Dispatch Shortcuts */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 print:hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span>Chagua Njia ya Kumtumia Mteja Taarifa Hii:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* WhatsApp Direct */}
          <a
            id="link-send-wa"
            href={messages.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition font-medium text-xs sm:text-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp (Ujumbe & Risiti)</span>
          </a>

          {/* Native SMS Direct */}
          <a
            id="link-send-sms"
            href={messages.smsUrl}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition font-medium text-xs sm:text-sm"
          >
            <Send className="w-4 h-4 text-blue-600" />
            <span>SMS ya Kawaida</span>
          </a>

          {/* Email if available */}
          {loan.clientEmail ? (
            <a
              id="link-send-email"
              href={messages.emailUrl}
              className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 transition font-medium text-xs sm:text-sm"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Barua Pepe (Email)</span>
            </a>
          ) : (
            <div className="flex items-center justify-center space-x-2 p-3 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 text-xs">
              <span>Bila Email (Hakuna barua pepe)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
