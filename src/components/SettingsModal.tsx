import React, { useState, useRef } from 'react';
import { AppSettings, AccountBalances, Loan, Expense } from '../types';
import { storageService } from '../services/storage';
import moshaLogo from '../assets/images/mosha_bank_logo_1786905642948.jpg';
import { 
  Settings as SettingsIcon, 
  Key, 
  FileSignature, 
  Building2, 
  Image as ImageIcon, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  RotateCcw
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'office' | 'backup'>('security');
  
  // Security Tab States
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [securitySignInput, setSecuritySignInput] = useState(settings.securitySign || '');

  // Office Profile States
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle Logo Upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Picha ya Logo isizidi 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
        setMessage({ type: 'success', text: 'Logo imewekwa vizuri! Bonyeza Hifadhi.' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Security Settings
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // If attempting to change passkey
    if (newPasskey) {
      const activePasskey = (settings.passkey || 'MOSHA').trim();
      const enteredCurrent = currentPasskey.trim();
      
      if (enteredCurrent !== activePasskey && enteredCurrent.toUpperCase() !== activePasskey.toUpperCase()) {
        setMessage({ type: 'error', text: 'Passkey ya sasa uliyoweka sio sahihi.' });
        return;
      }
      if (newPasskey.trim().length < 4) {
        setMessage({ type: 'error', text: 'Passkey mpya lazima iwe na angalau tarakimu au herufi 4.' });
        return;
      }
      if (newPasskey.trim() !== confirmPasskey.trim()) {
        setMessage({ type: 'error', text: 'Passkey mpya na ya kuthibitisha hazilingani.' });
        return;
      }
    }

    if (!securitySignInput.trim()) {
      setMessage({ type: 'error', text: 'Sahihi ya Uokozi (Sign) haiwezi kuwa tupu.' });
      return;
    }

    const updated: AppSettings = {
      ...settings,
      passkey: newPasskey ? newPasskey.trim() : settings.passkey,
      securitySign: securitySignInput.trim(),
    };

    onSaveSettings(updated);
    setMessage({ type: 'success', text: 'Taarifa za Ulinzi (Passkey & Sign) zimehifadhiwa kikamilifu!' });
    setCurrentPasskey('');
    setNewPasskey('');
    setConfirmPasskey('');
  };

  // Save Office Settings
  const handleSaveOffice = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const updated: AppSettings = {
      ...settings,
      companyName: companyName.trim() || 'MOSHA FOUNDATION BANK',
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      currency,
      logoUrl: logoPreview,
    };

    onSaveSettings(updated);
    setMessage({ type: 'success', text: 'Taarifa za Ofisi na Logo zimehifadhiwa kikamilifu!' });
  };

  // Export Data JSON
  const handleExportBackup = () => {
    const dataStr = storageService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mosha_Foundation_Bank_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setMessage({ type: 'success', text: 'Faili la Backup limepakuliwa! Unaweza kulihifadhi Google Drive au simu nyingine.' });
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = storageService.importAllData(content);
          if (success) {
            setMessage({ type: 'success', text: 'Data zote zimerejeshwa (Restored) kikamilifu!' });
            onRefreshData();
          } else {
            setMessage({ type: 'error', text: 'Faili la backup halijakaa vizuri.' });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="settings-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Mipangilio ya Mfumo & Ulinzi</h2>
              <p className="text-xs text-slate-400">Badili Passkey, Sign ya Uokozi, Logo na Hifadhi ya Data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`flex-1 py-3 px-2 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Ulinzi & Passkey / Sign</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('office'); setMessage(null); }}
            className={`flex-1 py-3 px-2 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'office'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Ofisi & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('backup'); setMessage(null); }}
            className={`flex-1 py-3 px-2 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Hifadhi / Backup</span>
          </button>
        </div>

        {/* Modal Notification */}
        {message && (
          <div className={`p-3 text-xs flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Security & Passkey / Sign */}
        {activeTab === 'security' && (
          <form onSubmit={handleSaveSecurity} className="p-5 space-y-4 overflow-y-auto">
            {/* Google Permanent Account Lock Section */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2.5 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Akaunti Rasmi ya Google (Hifadhi ya Mtandaoni):</span>
                </div>
                {settings.authorizedGoogleEmail ? (
                  <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full">
                    Imefungwa Moja kwa Moja
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold rounded-full">
                    Bado Haijafungwa
                  </span>
                )}
              </div>

              {settings.authorizedGoogleEmail ? (
                <div className="text-xs text-slate-300 space-y-1.5">
                  <p>
                    Barua pepe rasmi iliyoidhinishwa kufungua mfumo huu:
                  </p>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-emerald-300 text-xs flex items-center justify-between">
                    <span>{settings.authorizedGoogleEmail}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Akaunti nyingine yoyote ya Google ikijaribu kuingia itazuiwa mara moja.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Ukiingia kwa mara ya kwanza na akaunti yako ya Google (kama vile <em>kingshamo47@gmail.com</em>), mfumo utaifunga kiotomatiki kama akaunti moja rasmi ya kudumu.
                </p>
              )}
            </div>

            {/* Recovery Sign Section */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                <FileSignature className="w-4 h-4 text-indigo-700" />
                <span>Sahihi ya Uokozi (Recovery Sign):</span>
              </div>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Hii ni <strong>Sign/Sahihi</strong> itakayotumika kufungua mfumo endapo utasahau Passkey yako ya ofisi.
              </p>
              <input
                id="input-settings-security-sign"
                type="text"
                required
                value={securitySignInput}
                onChange={(e) => setSecuritySignInput(e.target.value)}
                placeholder="Mfano: MOSHA-SIGN-2026"
                className="w-full px-3.5 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Change Passkey Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Badili Passkey ya Kuingia Ofisini (Hiari):</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Passkey ya Sasa:
                </label>
                <input
                  id="input-current-passkey"
                  type="password"
                  value={currentPasskey}
                  onChange={(e) => setCurrentPasskey(e.target.value)}
                  placeholder="Weka passkey ya sasa..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Passkey Mpya:
                  </label>
                  <input
                    id="input-settings-new-passkey"
                    type="password"
                    value={newPasskey}
                    onChange={(e) => setNewPasskey(e.target.value)}
                    placeholder="Weka mpya..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rudia Passkey Mpya:
                  </label>
                  <input
                    id="input-settings-confirm-passkey"
                    type="password"
                    value={confirmPasskey}
                    onChange={(e) => setConfirmPasskey(e.target.value)}
                    placeholder="Thibitisha mpya..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-save-security-settings"
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Hifadhi Mipangilio ya Ulinzi
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Office Profile & Logo */}
        {activeTab === 'office' && (
          <form onSubmit={handleSaveOffice} className="p-5 space-y-4 overflow-y-auto">
            {/* Logo Upload Section */}
            <div className="flex items-center space-x-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-amber-400/80 p-0.5 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="block text-xs font-bold uppercase text-slate-700">Logo ya Ofisi & Risiti:</span>
                <p className="text-[11px] text-slate-500">Itaonekana kwenye Risiti za PDF, picha na mfumo mzima.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition flex items-center space-x-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Pakia Logo Mpya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoPreview(moshaLogo)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium rounded-lg transition flex items-center space-x-1"
                    title="Tumia Logo Rasmi ya Dhahabu ya Mosha Bank"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    <span>Logo Rasmi ya Bank</span>
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Ondoa
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Jina la Kampuni / Ofisi:
                </label>
                <input
                  id="input-settings-company-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Kauli Mbiu (Tagline):
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Namba ya Simu ya Ofisi:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Barua Pepe ya Ofisi:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Anwani / Mahali Ilipo Ofisi:
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Sarafu (Currency):
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="TZS">TZS (Shilingi ya Tanzania)</option>
                    <option value="USD">USD (Dola ya Kimarekani)</option>
                    <option value="KES">KES (Shilingi ya Kenya)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-save-office-settings"
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Hifadhi Taarifa za Ofisi
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Backup & Data Management */}
        {activeTab === 'backup' && (
          <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <span className="font-bold text-emerald-950 block text-sm flex items-center space-x-1.5">
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Pakua Nakala ya Data Zote (Export JSON Backup):</span>
              </span>
              <p className="text-emerald-900/80">
                Inakupa faili salama lenye orodha nzima ya madeni, malipo, matumizi, na salio. Unaweza kulihifadhi kwenye kifaa chochote.
              </p>
              <button
                id="btn-export-backup"
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Pakua Backup Yangu Sasa</span>
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <span className="font-bold text-blue-950 block text-sm flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Rejesha Data Kutoka Kwenye Backup (Import JSON):</span>
              </span>
              <p className="text-blue-900/80">
                Ukiingia kwenye simu au kompyuta mpya, pakia faili lako la backup hapa ili kupata data zako zote mara moja.
              </p>
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl transition shadow flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Chagua Faili la Backup</span>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </div>

            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Weka Mfano wa Data (Demo Mode):</span>
                <p className="text-[11px] text-slate-500">Itaweka mifano ya madeni na salio kwa majaribio.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Ungependa kuweka mifano ya majaribio?')) {
                    storageService.seedDemoData();
                    onRefreshData();
                    setMessage({ type: 'success', text: 'Mifano ya data imewekwa!' });
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 text-white font-medium rounded-lg text-xs hover:bg-slate-700"
              >
                Weka Demo
              </button>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-red-900 block">Futa Rekodi Zote (Clean Fresh Start):</span>
                <p className="text-[11px] text-red-600">Itafuta madeni na matumizi yote ili uanze upya kabisa.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tahadhari: Je, una uhakika unataka kufuta rekodi zote?')) {
                    storageService.clearAllData();
                    onRefreshData();
                    setMessage({ type: 'success', text: 'Rekodi zote zimefutwa. Mfumo uko wazi kuanza upya!' });
                  }
                }}
                className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-500 shadow"
              >
                Futa Zote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
