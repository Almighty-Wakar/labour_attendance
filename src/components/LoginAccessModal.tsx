import React, { useState } from 'react';
import { AppSettings, UserSession } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  User, 
  Phone, 
  Check, 
  X, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Delete,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface LoginAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSession: (newSession: UserSession) => void;
}

const PRESET_SUPERVISORS = [
  {
    name: 'Er. Rajesh Shrestha',
    role: 'admin' as const,
    phone: '+977 98510 12345',
    site: 'Tower 4 - Commercial Plaza',
    pin: '1234',
  },
  {
    name: 'Suman Gurung',
    role: 'supervisor' as const,
    phone: '+977 98460 99881',
    site: 'Pokhara Resort & Luxury Villas',
    pin: '1234',
  },
  {
    name: 'Manoj Patel',
    role: 'supervisor' as const,
    phone: '+977 98112 33445',
    site: 'Birgunj Logistics Dry Port',
    pin: '1234',
  },
  {
    name: 'Anita Shrestha (CPA)',
    role: 'accountant' as const,
    phone: '+977 98415 67890',
    site: 'Head Office Financials',
    pin: '1234',
  },
];

const ROLES_INFO = {
  admin: {
    title: 'Site Admin / Owner',
    desc: 'Unrestricted access to all worksites, wages, settings, advances, and exports.',
    badgeClass: 'bg-emerald-500 text-white',
    permissions: [
      'Manage all worksites & switch anytime',
      'Full attendance muster roll & wages control',
      'Approve & record cash advances / bonuses',
      'Export and restore database backups',
    ],
  },
  supervisor: {
    title: 'Site Supervisor / Munshi',
    desc: 'Daily muster roll marking, overtime tracking, and advance distribution.',
    badgeClass: 'bg-purple-600 text-white',
    permissions: [
      'Mark daily labour attendance & overtime',
      'Register new site labourers',
      'Issue mid-week cash advances & receipts',
      'View site muster summaries',
    ],
  },
  accountant: {
    title: 'Site Accountant / Cashier',
    desc: 'Wages calculations, salary settlements, and advance recovery ledger.',
    badgeClass: 'bg-blue-600 text-white',
    permissions: [
      'Calculate net payable wages & deductions',
      'Manage payments & advance transactions',
      'Generate labour payslips & printable vouchers',
      'View ledger balances',
    ],
  },
  viewer: {
    title: 'Read-Only Auditor / Client',
    desc: 'Read-only inspection of attendance cards and project workforce count.',
    badgeClass: 'bg-neutral-600 text-white',
    permissions: [
      'View active workforce & attendance roster',
      'Inspect site daily status reports',
      'Restricted from modifying wages or advances',
    ],
  },
};

export const LoginAccessModal: React.FC<LoginAccessModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSession,
}) => {
  const currentSession = settings.userSession || {
    isLoggedIn: true,
    userName: 'Er. Rajesh Shrestha',
    userRole: 'admin',
    phone: '+977 98510 12345',
    pinCode: '1234',
  };

  const [activeTab, setActiveTab] = useState<'status' | 'pin' | 'switch'>('status');
  
  // Custom profile edits
  const [userName, setUserName] = useState(currentSession.userName);
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'accountant' | 'viewer'>(currentSession.userRole);
  const [phone, setPhone] = useState(currentSession.phone || '');

  // PIN keypad state
  const [enteredPin, setEnteredPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isPinUnlocked, setIsPinUnlocked] = useState(true);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === 4) {
        // verify PIN
        const currentExpectedPin = currentSession.pinCode || '1234';
        if (next === currentExpectedPin) {
          setPinFeedback({ type: 'success', msg: 'PIN verified successfully! Session unlocked.' });
          setIsPinUnlocked(true);
        } else {
          setPinFeedback({ type: 'error', msg: 'Incorrect 4-digit PIN. Try again.' });
          setTimeout(() => {
            setEnteredPin('');
          }, 800);
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinFeedback(null);
  };

  const handleKeypadClear = () => {
    setEnteredPin('');
    setPinFeedback(null);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinFeedback({ type: 'error', msg: 'PIN must be exactly 4 numeric digits.' });
      return;
    }

    const updated: UserSession = {
      ...currentSession,
      pinCode: newPin,
      lastLogin: new Date().toISOString(),
    };
    onUpdateSession(updated);
    setNewPin('');
    setPinFeedback({ type: 'success', msg: `PIN successfully updated to: ${newPin}` });
    setTimeout(() => {
      setPinFeedback(null);
    }, 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSession = {
      ...currentSession,
      userName: userName.trim() || currentSession.userName,
      userRole,
      phone: phone.trim(),
      lastLogin: new Date().toISOString(),
    };
    onUpdateSession(updated);
    setPinFeedback({ type: 'success', msg: 'Supervisor access profile updated!' });
    setTimeout(() => {
      setPinFeedback(null);
      onClose();
    }, 900);
  };

  const handleSwitchToPreset = (preset: typeof PRESET_SUPERVISORS[0]) => {
    const updated: UserSession = {
      isLoggedIn: true,
      userName: preset.name,
      userRole: preset.role,
      phone: preset.phone,
      pinCode: preset.pin,
      lastLogin: new Date().toISOString(),
    };
    setUserName(preset.name);
    setUserRole(preset.role);
    setPhone(preset.phone);
    onUpdateSession(updated);
    setPinFeedback({ type: 'success', msg: `Switched supervisor session to ${preset.name}` });
    setTimeout(() => {
      setPinFeedback(null);
      onClose();
    }, 800);
  };

  const activeRoleDetails = ROLES_INFO[userRole] || ROLES_INFO.admin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                Supervisor Login &amp; Access Control
              </h2>
              <p className="text-[11px] text-purple-200 mt-0.5">
                Authentication, role permissions &amp; PIN lock
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-purple-100 bg-purple-50/50 p-1.5 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Active Session
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Security PIN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'switch'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Switch Profile
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {pinFeedback && (
            <div className={`p-3 text-xs rounded-2xl flex items-center gap-2 font-semibold ${
              pinFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {pinFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{pinFeedback.msg}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE SESSION */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/40 rounded-2xl border border-purple-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#5C2D91] text-white flex items-center justify-center font-black text-sm shadow-sm">
                      {currentSession.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900">
                          {currentSession.userName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeRoleDetails.badgeClass}`}>
                          {activeRoleDetails.title.split('/')[0].trim()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{currentSession.phone || '+977 98510 12345'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Building2 className="w-3.5 h-3.5 text-[#5C2D91]" />
                    <span>Worksite:</span>
                  </span>
                  <span className="font-semibold text-neutral-900 truncate max-w-[200px]">
                    {settings.worksiteName}
                  </span>
                </div>
              </div>

              {/* Edit Role & Access Level Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Supervisor / User Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      System Role
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] cursor-pointer"
                    >
                      <option value="admin">Site Admin (Full Access)</option>
                      <option value="supervisor">Project Supervisor</option>
                      <option value="accountant">Site Accountant</option>
                      <option value="viewer">Auditor / Viewer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                    />
                  </div>
                </div>

                {/* Role Permissions Box */}
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-[#5C2D91] uppercase tracking-wider">
                    Role Privileges: {activeRoleDetails.title}
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    {activeRoleDetails.desc}
                  </p>
                  <ul className="pt-1 space-y-1">
                    {activeRoleDetails.permissions.map((perm, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-700">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Session Profile</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY PIN & LOCK */}
          {activeTab === 'pin' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#5C2D91]/10 flex items-center justify-center text-[#5C2D91]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900">
                      Quick 4-Digit Security PIN
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Default PIN is <span className="font-mono font-bold text-[#5C2D91]">1234</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPinUnlocked(!isPinUnlocked)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPinUnlocked
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {isPinUnlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </>
                  )}
                </button>
              </div>

              {/* Interactive Keypad verification display */}
              <div className="text-center space-y-2 py-2">
                <span className="text-xs font-semibold text-neutral-600">
                  Verify or test your 4-digit PIN:
                </span>
                <div className="flex justify-center items-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = enteredPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                          isFilled
                            ? 'bg-[#5C2D91] border-[#5C2D91] text-white shadow-xs scale-105'
                            : 'border-purple-200 bg-white'
                        }`}
                      >
                        {isFilled && <span className="w-3 h-3 rounded-full bg-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Number Keypad Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3 bg-neutral-100 hover:bg-purple-100 text-neutral-900 hover:text-[#5C2D91] text-base font-bold rounded-2xl transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-neutral-100 hover:bg-purple-100 text-neutral-900 hover:text-[#5C2D91] text-base font-bold rounded-2xl transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-3 bg-neutral-100 hover:bg-rose-100 text-neutral-600 hover:text-rose-600 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Change PIN Section */}
              <div className="pt-3 border-t border-purple-100 space-y-2">
                <span className="text-xs font-bold text-neutral-700 block">
                  Change Supervisor PIN:
                </span>
                <form onSubmit={handleChangePinSubmit} className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="New 4 digits"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="flex-1 px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] font-mono tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer"
                  >
                    Set PIN
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH SUPERVISOR PRESET */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Select Site Supervisor Account:
              </span>

              <div className="space-y-2">
                {PRESET_SUPERVISORS.map((preset, idx) => {
                  const isCurrent = currentSession.userName === preset.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSwitchToPreset(preset)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-50/90 border-[#5C2D91] shadow-xs'
                          : 'bg-white hover:bg-purple-50/30 border-purple-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCurrent ? 'bg-[#5C2D91] text-white shadow-xs' : 'bg-purple-100 text-[#5C2D91]'
                        }`}>
                          {preset.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">
                              {preset.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-[#5C2D91]">
                              {preset.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {preset.site} • {preset.phone}
                          </p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-[#5C2D91] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-neutral-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
