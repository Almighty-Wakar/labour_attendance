import React, { useState } from 'react';
import { AppSettings, UserSession } from '../types';
import { enrollDeviceBiometric } from '../utils/biometrics';
import {
  updateBackendSecurity,
  resetBackendOwner,
  mapBackendUserToSession,
} from '../utils/authApi';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Phone,
  Check,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  ScanEye,
  Smartphone,
  Mail,
  UserX,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSession: (newSession: UserSession) => void;
  onLockNow?: () => void;
  onOwnerReset?: () => void;
}

export const LoginAccessModal: React.FC<LoginAccessModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSession,
  onLockNow,
  onOwnerReset,
}) => {
  const currentSession = settings.userSession || {
    isLoggedIn: true,
    userName: 'Account Holder',
    email: '',
    userRole: 'admin',
    phone: '',
    requireLoginOnLaunch: true,
    lockOnBackground: false,
    biometricThumbEnabled: true,
    biometricEyeEnabled: true,
    hasPassword: false,
  };

  const [activeTab, setActiveTab] = useState<'status' | 'security'>('status');

  // Personal profile edits (no title/role)
  const [userName, setUserName] = useState(currentSession.userName);
  const [phone, setPhone] = useState(currentSession.phone || '');

  // Password change state
  const [currentPasswordOrPin, setCurrentPasswordOrPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // PIN change & owner reset state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetPinConfirm, setResetPinConfirm] = useState('');
  const [showResetBox, setShowResetBox] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  if (!isOpen) return null;

  const requireLoginOnLaunch = currentSession.requireLoginOnLaunch !== false;
  const lockOnBackground = Boolean(currentSession.lockOnBackground);
  const thumbEnabled = currentSession.biometricThumbEnabled !== false;
  const eyeEnabled = currentSession.biometricEyeEnabled !== false;
  const hasPassword = Boolean(currentSession.hasPassword);

  const showTimedFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 2800);
  };

  const toggleSettingFlag = async (
    key: 'requireLoginOnLaunch' | 'lockOnBackground' | 'biometricThumbEnabled' | 'biometricEyeEnabled',
    val: boolean,
    label: string
  ) => {
    setSaving(true);
    try {
      const { user } = await updateBackendSecurity({ [key]: val });
      onUpdateSession(mapBackendUserToSession(user));
      showTimedFeedback('success', `${label} ${val ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      showTimedFeedback('error', err instanceof Error ? err.message : 'Failed to update setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollBiometric = async () => {
    setEnrolling(true);
    try {
      const res = await enrollDeviceBiometric(currentSession.userName);
      const { user } = await updateBackendSecurity({
        biometricThumbEnabled: true,
        biometricEyeEnabled: true,
        webAuthnCredentialId: res.credentialId,
      });
      onUpdateSession(mapBackendUserToSession(user));
      showTimedFeedback(
        'success',
        res.credentialId
          ? 'Device passkey synced with backend for Thumb & Eye login!'
          : 'Thumb Touch & Eye Login enabled on backend!'
      );
    } catch (err) {
      showTimedFeedback('error', err instanceof Error ? err.message : 'Biometric linking failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordOrPin.trim()) {
      setFeedback({
        type: 'error',
        msg: hasPassword
          ? 'Enter your current password or 4-digit PIN.'
          : 'Enter your current 4-digit PIN to set a password.',
      });
      return;
    }
    if (newPassword.length > 12) {
      setFeedback({ type: 'error', msg: 'New password must be between 0 and 12 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    setSaving(true);
    try {
      const isFourDigits = /^\d{4}$/.test(currentPasswordOrPin.trim());
      const { user } = await updateBackendSecurity({
        currentPassword: hasPassword ? currentPasswordOrPin : undefined,
        currentPin: isFourDigits ? currentPasswordOrPin.trim() : undefined,
        newPassword,
      });
      onUpdateSession(mapBackendUserToSession(user));
      setCurrentPasswordOrPin('');
      setNewPassword('');
      setConfirmPassword('');
      showTimedFeedback(
        'success',
        newPassword.length === 0
          ? 'Account password cleared (PIN login active).'
          : 'Account password updated on backend!',
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to update password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setFeedback({ type: 'error', msg: 'Both current and new PIN must be 4 numeric digits.' });
      return;
    }

    setSaving(true);
    try {
      const { user } = await updateBackendSecurity({ currentPin, newPin });
      onUpdateSession(mapBackendUserToSession(user));
      setCurrentPin('');
      setNewPin('');
      showTimedFeedback('success', 'Backend 4-digit security PIN updated!');
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to update PIN.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user } = await updateBackendSecurity({
        name: userName.trim() || currentSession.userName,
        phone: phone.trim(),
      });
      onUpdateSession(mapBackendUserToSession(user));
      setFeedback({ type: 'success', msg: 'Account details saved to backend!' });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 750);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(resetPinConfirm)) {
      setFeedback({ type: 'error', msg: 'Enter your current 4-digit PIN to reset account.' });
      return;
    }

    setSaving(true);
    try {
      await resetBackendOwner(resetPinConfirm);
      setResetPinConfirm('');
      setShowResetBox(false);
      onClose();
      if (onOwnerReset) {
        onOwnerReset();
      } else if (onLockNow) {
        onLockNow();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Current PIN incorrect.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl border border-purple-100 shadow-2xl overflow-hidden flex flex-col max-h-[90%] pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-2.5 pb-3.5 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-2.5 sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  Login &amp; Access Control
                </h2>
                <p className="text-[11px] text-purple-200 mt-0.5 truncate">
                  Password, PIN, Thumb Touch &amp; Eye login
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-purple-100 bg-purple-50/50 p-1.5 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'status'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'security'
                ? 'bg-white text-[#5C2D91] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Password &amp; Security
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain space-y-4">
          {feedback && (
            <div
              className={`p-3 text-xs rounded-2xl flex items-center gap-2 font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* TAB 1: ACCOUNT SESSION */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/40 rounded-2xl border border-purple-100 shadow-xs space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#5C2D91] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    {currentSession.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-neutral-900 truncate block">
                      {currentSession.userName}
                    </span>
                    {currentSession.email && (
                      <p className="text-[11px] text-neutral-600 mt-0.5 flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-[#5C2D91] shrink-0" />
                        <span className="truncate">{currentSession.email}</span>
                      </p>
                    )}
                    {currentSession.phone && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{currentSession.phone}</span>
                      </p>
                    )}
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

              {/* Lock App Now Quick Action */}
              {onLockNow && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLockNow();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[46px]"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Lock App &amp; Sign Out</span>
                </button>
              )}

              {/* Edit Personal Details (No Title/Role) */}
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[46px] disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Update Account Details'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PASSWORD, BIOMETRICS & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Change / Set Account Password */}
              <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2.5">
                <span className="text-xs font-bold text-[#5C2D91] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{hasPassword ? 'Change Account Password' : 'Set Account Password'}</span>
                </span>
                <form onSubmit={handleChangePasswordSubmit} className="space-y-2">
                  <input
                    type="password"
                    placeholder={hasPassword ? 'Current Password (or 4-Digit PIN)' : 'Verify with Current 4-Digit PIN'}
                    value={currentPasswordOrPin}
                    onChange={(e) => setCurrentPasswordOrPin(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      maxLength={12}
                      placeholder="New Password (0–12 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value.slice(0, 12))}
                      className="w-full min-h-[42px] pl-3 pr-10 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    maxLength={12}
                    placeholder="Confirm New Password (0–12 characters)"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value.slice(0, 12))}
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-white border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full min-h-[44px] py-2 text-xs font-bold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {hasPassword ? 'Update Password' : 'Save Password'}
                  </button>
                </form>
              </div>

              {/* Change 4-Digit PIN */}
              <div className="pt-2 border-t border-purple-100 space-y-2">
                <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#5C2D91]" />
                  <span>Change 4-Digit Security PIN</span>
                </span>
                <form onSubmit={handleChangePinSubmit} className="grid grid-cols-3 gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Current"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="min-h-[44px] px-2.5 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] font-mono tracking-widest text-center"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="New PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="min-h-[44px] px-2.5 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] font-mono tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-[44px] px-3 py-2 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Set PIN
                  </button>
                </form>
              </div>

              {/* App Close & Biometric Toggles */}
              <div className="pt-2 border-t border-purple-100 space-y-2">
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Smartphone className="w-4 h-4 text-[#5C2D91] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900">Require Login on App Open</p>
                      <p className="text-[11px] text-neutral-500">
                        Always prompt when app is closed &amp; reopened
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      toggleSettingFlag('requireLoginOnLaunch', !requireLoginOnLaunch, 'Login on app open')
                    }
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      requireLoginOnLaunch ? 'bg-[#5C2D91]' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle require login on app open"
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        requireLoginOnLaunch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lock className="w-4 h-4 text-[#5C2D91] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900">Auto-Lock When Minimized</p>
                      <p className="text-[11px] text-neutral-500">
                        Lock immediately if switched to another app
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      toggleSettingFlag('lockOnBackground', !lockOnBackground, 'Background auto-lock')
                    }
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      lockOnBackground ? 'bg-[#5C2D91]' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle auto lock when minimized"
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        lockOnBackground ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Fingerprint className="w-4 h-4 text-[#5C2D91] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900">Allow Thumb Touch Login</p>
                      <p className="text-[11px] text-neutral-500">Fingerprint / Touch ID verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      toggleSettingFlag('biometricThumbEnabled', !thumbEnabled, 'Thumb Touch login')
                    }
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      thumbEnabled ? 'bg-[#5C2D91]' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle Thumb Touch login"
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        thumbEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ScanEye className="w-4 h-4 text-[#5C2D91] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900">Allow Eye / Face Login</p>
                      <p className="text-[11px] text-neutral-500">Iris &amp; facial recognition unlock</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      toggleSettingFlag('biometricEyeEnabled', !eyeEnabled, 'Eye login')
                    }
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      eyeEnabled ? 'bg-[#5C2D91]' : 'bg-neutral-300'
                    }`}
                    aria-label="Toggle Eye login"
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        eyeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnrollBiometric}
                disabled={enrolling}
                className="w-full py-2.5 px-3 text-xs font-bold text-[#5C2D91] bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{enrolling ? 'Syncing Device Passkey...' : 'Bind Device Thumb & Eye Passkey'}</span>
              </button>

              {/* Transfer / Reset Single Account */}
              <div className="pt-2 border-t border-purple-100">
                {showResetBox ? (
                  <form onSubmit={handleResetOwnerSubmit} className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
                    <p className="text-xs font-bold text-rose-800">
                      Enter your current 4-digit PIN to delete this account and allow Create Account:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="Current PIN"
                        value={resetPinConfirm}
                        onChange={(e) => setResetPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="flex-1 min-h-[42px] px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl text-neutral-900 font-mono tracking-widest text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetBox(false);
                          setResetPinConfirm('');
                        }}
                        className="min-h-[42px] px-3 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="min-h-[42px] px-3 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResetBox(true)}
                    className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Reset Account</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
