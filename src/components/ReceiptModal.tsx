import React from 'react';
import { Loan, Repayment, AppSettings } from '../types';
import { ReceiptView } from './ReceiptView';
import { X } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  repayment?: Repayment | null;
  settings: AppSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  loan,
  repayment,
  settings,
}) => {
  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        id="official-receipt-modal-wrapper"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-300">
              Hakiki Risiti Rasmi - {settings.companyName}
            </h2>
            <p className="text-xs text-slate-400">
              Mteja: {loan.clientName} | Risiti: #{repayment ? repayment.receiptNumber : loan.receiptNumber}
            </p>
          </div>

          <button
            id="btn-close-receipt-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <ReceiptView
            loan={loan}
            repayment={repayment || undefined}
            settings={settings}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
