import { Loan, Repayment, AppSettings } from '../types';

export interface MessageBundle {
  smsText: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
  formattedPhone: string;
  whatsappUrl: string;
  smsUrl: string;
  emailUrl: string;
}

export function formatCurrency(amount: number, currency: string = 'TZS'): string {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US')}`;
}

export function cleanPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  // If starts with 07 or 06 (Tanzania standard), format to 255...
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function generateLoanNoticeMessage(loan: Loan, settings: AppSettings): MessageBundle {
  const phoneClean = cleanPhoneNumber(loan.clientPhone);
  const company = settings.companyName || 'MOSHA FOUNDATION BANK';
  const currency = settings.currency || 'TZS';

  const dateStr = new Date(loan.loanDate).toLocaleDateString('sw-TZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dueDateStr = new Date(loan.dueDate).toLocaleDateString('sw-TZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const principal = formatCurrency(loan.principalAmount, currency);
  const fee = formatCurrency(loan.feeAmount, currency);
  const total = formatCurrency(loan.totalAmount, currency);

  // Clean WhatsApp Text with formatting
  const whatsappText = 
`🏦 *${company}*
📜 *TAARIFA YA MKOPO & RISITI YA DENI*
────────────────────────
👤 *Mteja:* ${loan.clientName}
📱 *Simu:* ${loan.clientPhone}
🧾 *Namba ya Risiti:* #${loan.receiptNumber}
📅 *Tarehe ya Mkopo:* ${dateStr}

💰 *MCHANGANUO WA FEDHA:*
• Kiasi Ulichokopa: *${principal}*
• Ada ya Huduma/Ofisi: *${fee}*
• *JUMLA KUU INAYODAIWA:* *${total}*
• Tarehe ya Mwisho Kulipa: *${dueDateStr}*

${loan.collateral ? `🔒 *Dhamana:* ${loan.collateral}\n` : ''}${loan.notes ? `📝 *Maelezo:* ${loan.notes}\n` : ''}────────────────────────
Tafadhali zingatia kurejesha kabla ya tarehe ya mwisho.
Asante kwa kuchagua *${company}*.
Mawasiliano: ${settings.phone} | ${settings.email}`;

  // Clean SMS Text (concise for SMS standard)
  const smsText = 
`${company}: Ndugu ${loan.clientName}, umepokea mkopo wa ${principal} + Ada ${fee}. Jumla inayodaiwa ni ${total}. Mwisho wa kulipa ni ${dueDateStr}. Risiti: #${loan.receiptNumber}. Mawasiliano: ${settings.phone}`;

  // Email format
  const emailSubject = `${company} - Taarifa ya Mkopo na Risiti #${loan.receiptNumber}`;
  const emailBody = 
`Habari ndugu ${loan.clientName},\n\n` +
`Tunathibitisha kuwa umepokea mkopo kutoka ${company}.\n\n` +
`MCHANGANUO WA DENI:\n` +
`- Kiasi Ulichokopa: ${principal}\n` +
`- Ada ya Huduma: ${fee}\n` +
`- Jumla Inayodaiwa: ${total}\n` +
`- Tarehe ya Mkopo: ${dateStr}\n` +
`- Tarehe ya Mwisho wa Kulipa: ${dueDateStr}\n` +
`- Namba ya Risiti: #${loan.receiptNumber}\n\n` +
`Tafadhali hifadhi taarifa hii au risiti yako ya PDF uliyotumiwa.\n\n` +
`Asante,\n${company}\nSimu: ${settings.phone}`;

  const encodedWA = encodeURIComponent(whatsappText);
  const encodedSMS = encodeURIComponent(smsText);
  const encodedEmailSubj = encodeURIComponent(emailSubject);
  const encodedEmailBody = encodeURIComponent(emailBody);

  return {
    smsText,
    whatsappText,
    emailSubject,
    emailBody,
    formattedPhone: phoneClean,
    whatsappUrl: `https://wa.me/${phoneClean}?text=${encodedWA}`,
    smsUrl: `sms:${phoneClean}?body=${encodedSMS}`,
    emailUrl: loan.clientEmail ? `mailto:${loan.clientEmail}?subject=${encodedEmailSubj}&body=${encodedEmailBody}` : '',
  };
}

export function generateRepaymentMessage(loan: Loan, repayment: Repayment, settings: AppSettings): MessageBundle {
  const phoneClean = cleanPhoneNumber(loan.clientPhone);
  const company = settings.companyName || 'MOSHA FOUNDATION BANK';
  const currency = settings.currency || 'TZS';

  const repDateStr = new Date(repayment.date).toLocaleDateString('sw-TZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const amountPaid = formatCurrency(repayment.amount, currency);
  const totalLoan = formatCurrency(loan.totalAmount, currency);
  const remaining = formatCurrency(loan.balanceRemaining, currency);
  const totalPaidSoFar = formatCurrency(loan.amountPaid, currency);

  const isFullPaid = loan.balanceRemaining <= 0;

  const whatsappText = 
`🏦 *${company}*
🧾 *RISITI YA MALIPO YA DENI*
────────────────────────
👤 *Mteja:* ${loan.clientName}
📱 *Simu:* ${loan.clientPhone}
📜 *Risiti No:* #${repayment.receiptNumber}
📅 *Tarehe ya Malipo:* ${repDateStr}
💳 *Njia ya Malipo:* ${repayment.paymentMethod}

💰 *TAARIFA ZA MALIPO:*
• Kiasi Kilicholipwa Sasa: *${amountPaid}*
• Jumla ya Deni Lililokuwepo: *${totalLoan}*
• Jumla Uliyolipa Hadi Sasa: *${totalPaidSoFar}*
• *BAKI YA DENI:* *${isFullPaid ? 'TSH 0 (LIMELIPWA LOTE ✅)' : remaining}*

${isFullPaid ? '🎉 *HONGERA! Deni lako limekamilika kulipwa lote kikamilifu.*' : `📅 *Tafadhali kumbuka kukamilisha baki kabla ya:* ${new Date(loan.dueDate).toLocaleDateString('sw-TZ')}`}
────────────────────────
Asante kwa uaminifu wako kwa *${company}*.
Mawasiliano: ${settings.phone}`;

  const smsText = 
`${company}: Ndugu ${loan.clientName}, tumepokea malipo yako ya ${amountPaid} (Njia: ${repayment.paymentMethod}). Baki yako ya deni ni ${isFullPaid ? 'TZS 0 (Umemaliza)' : remaining}. Risiti: #${repayment.receiptNumber}. Asante!`;

  const emailSubject = `${company} - Risiti ya Malipo #${repayment.receiptNumber}`;
  const emailBody = 
`Habari ndugu ${loan.clientName},\n\n` +
`Tunathibitisha kupokea malipo yako ya deni.\n\n` +
`- Kiasi Kilicholipwa: ${amountPaid}\n` +
`- Njia ya Malipo: ${repayment.paymentMethod}\n` +
`- Tarehe: ${repDateStr}\n` +
`- Baki Inayodaiwa: ${isFullPaid ? 'HAKUNA (LIMELIPWA LOTE)' : remaining}\n` +
`- Risiti Namba: #${repayment.receiptNumber}\n\n` +
`Asante kwa kufanya biashara na sisi.\n\n` +
`${company}\nSimu: ${settings.phone}`;

  const encodedWA = encodeURIComponent(whatsappText);
  const encodedSMS = encodeURIComponent(smsText);
  const encodedEmailSubj = encodeURIComponent(emailSubject);
  const encodedEmailBody = encodeURIComponent(emailBody);

  return {
    smsText,
    whatsappText,
    emailSubject,
    emailBody,
    formattedPhone: phoneClean,
    whatsappUrl: `https://wa.me/${phoneClean}?text=${encodedWA}`,
    smsUrl: `sms:${phoneClean}?body=${encodedSMS}`,
    emailUrl: loan.clientEmail ? `mailto:${loan.clientEmail}?subject=${encodedEmailSubj}&body=${encodedEmailBody}` : '',
  };
}
