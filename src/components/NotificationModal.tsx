import React, { useState, useEffect } from 'react';
import { Loan, Repayment, AppSettings } from '../types';
import { generateLoanNoticeMessage, generateRepaymentMessage } from '../services/notificationService';
import { shareOrSendReceiptPDF, generateOfficialReceiptPDF } from '../services/pdfGenerator';
import { 
  Clock, 
  MessageSquare, 
  Send, 
  Mail, 
  CheckCircle, 
  X, 
  FileText, 
  Copy, 
  ExternalLink,
  ShieldCheck, 
  AlertCircle,
  Download
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  repayment?: Repayment;
  settings: AppSettings;
  onViewReceipt: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  loan,
  repayment,
  settings,
  onViewReceipt,
}) => {
  const [countdown, setCountdown] = useState(60); // 1 minute countdown (60 seconds)
  const [isPaused, setIsPaused] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(60);
      setIsPaused(false);
      setSentSuccess(false);
      return;
    }

    const timer = setInterval(() => {
      if (!isPaused) {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const isRepayment = !!repayment;
  const messages = isRepayment
    ? generateRepaymentMessage(loan, repayment, settings)
    : generateLoanNoticeMessage(loan, settings);

  const handleSendNow = async () => {
    setSentSuccess(true);
    if (selectedChannel === 'whatsapp') {
      setIsGeneratingPdf(true);
      try {
        await shareOrSendReceiptPDF(loan, settings, repayment);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeneratingPdf(false);
      }
      window.open(messages.whatsappUrl, '_blank');
    } else if (selectedChannel === 'sms') {
      window.location.href = messages.smsUrl;
    } else if (selectedChannel === 'email' && messages.emailUrl) {
      setIsGeneratingPdf(true);
      try {
        await shareOrSendReceiptPDF(loan, settings, repayment);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeneratingPdf(false);
      }
      window.location.href = messages.emailUrl;
    }
  };

  const handleDownloadOnlyPDF = () => {
    const { blob, filename } = generateOfficialReceiptPDF(loan, settings, repayment);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleCopy = () => {
    const textToCopy = selectedChannel === 'sms' ? messages.smsText : messages.whatsappText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="notification-dispatch-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Countdown Bar */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            id="close-notif-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 animate-spin-slow" />
            <span>Mfumo wa Utumaji Taarifa kwa Mteja</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white">
            {isRepayment ? 'Tuma Risiti ya Malipo' : 'Tuma Taarifa ya Mkopo & Deni'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Mteja: <span className="font-semibold text-amber-300">{loan.clientName}</span> ({loan.clientPhone})
          </p>

          {/* 1 Minute Countdown Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">
                Muda wa Kutuma (Dakika 1):
              </span>
              <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded">
                {countdown > 0 ? `${countdown} Sekunde zimebaki` : 'Muda Umefika! (Tuma Sasa)'}
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${((60 - countdown) / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 text-sm">
          {/* Channel Selection Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Chagua Njia ya Kumtumia Taarifa:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* WhatsApp Button */}
              <button
                id="channel-select-whatsapp"
                type="button"
                onClick={() => setSelectedChannel('whatsapp')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  selectedChannel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <MessageSquare className={`w-5 h-5 mb-1 ${selectedChannel === 'whatsapp' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">WhatsApp</span>
                <span className="text-[10px] text-slate-400 font-normal">Ujumbe & PDF</span>
              </button>

              {/* SMS Button */}
              <button
                id="channel-select-sms"
                type="button"
                onClick={() => setSelectedChannel('sms')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  selectedChannel === 'sms'
                    ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Send className={`w-5 h-5 mb-1 ${selectedChannel === 'sms' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs">SMS ya Kawaida</span>
                <span className="text-[10px] text-slate-400 font-normal">Moja kwa moja</span>
              </button>

              {/* Email Button */}
              <button
                id="channel-select-email"
                type="button"
                onClick={() => setSelectedChannel('email')}
                disabled={!loan.clientEmail}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !loan.clientEmail
                    ? 'opacity-40 border-slate-200 cursor-not-allowed bg-slate-50'
                    : selectedChannel === 'email'
                    ? 'border-purple-500 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Mail className={`w-5 h-5 mb-1 ${selectedChannel === 'email' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="text-xs">Barua Pepe</span>
                <span className="text-[10px] text-slate-400 font-normal">{loan.clientEmail ? 'Email ipo' : 'Hakuna email'}</span>
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
              <span className="font-semibold">Muonekano wa Ujumbe utakaotumwa ({selectedChannel.toUpperCase()}):</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Umenakiliwa!' : 'Nakili'}</span>
              </button>
            </div>

            <pre className="text-xs font-sans text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
              {selectedChannel === 'sms' ? messages.smsText : messages.whatsappText}
            </pre>
          </div>

          {/* PDF Document Quick Actions */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center space-x-2 text-xs">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">Document ya PDF & Logo Ipo Tayari</span>
                <span className="text-[11px] text-slate-400">Ina nembo, mkopo, ada na taarifa zote rasmi</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                id="btn-download-pdf-modal"
                type="button"
                onClick={handleDownloadOnlyPDF}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1 transition"
                title="Pakua PDF ya Risiti"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pakua PDF</span>
              </button>
              <button
                id="btn-view-receipt-from-modal"
                type="button"
                onClick={() => {
                  onClose();
                  onViewReceipt();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shrink-0 transition"
              >
                Fungua Risiti
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            {isPaused ? '▶ Endelea na Dakika 1' : '⏸ Simamisha Hesabu'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition"
            >
              Funga
            </button>

            <button
              id="btn-confirm-send-now"
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSendNow}
              className={`flex items-center space-x-2 px-5 py-2 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition ${
                selectedChannel === 'whatsapp'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : selectedChannel === 'sms'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {isGeneratingPdf
                  ? 'Inatayarisha PDF...'
                  : `Tuma Sasa (${selectedChannel === 'whatsapp' ? 'WhatsApp & PDF' : selectedChannel.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
