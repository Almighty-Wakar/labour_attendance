import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, UserSession } from '../types';
import { enrollDeviceBiometric, verifyDeviceBiometric } from '../utils/biometrics';
import { triggerHaptic } from '../utils/haptics';
import {
  getBackendAuthStatus,
  registerOwnerAccount,
  loginWithBackendPin,
  loginWithBackendPassword,
  loginWithBackendBiometric,
  mapBackendUserToSession,
} from '../utils/authApi';
import {
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  ScanEye,
  Delete,
  Check,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

interface LoginLockScreenProps {
  settings: AppSettings;
  onUnlock: (updatedSession?: UserSession) => void;
  initialHasAccount?: boolean;
}

type ScreenView = 'loading' | 'email' | 'credentials' | 'thumb' | 'eye' | 'signup';

export const LoginLockScreen: React.FC<LoginLockScreenProps> = ({
  settings,
  onUnlock,
  initialHasAccount,
}) => {
  const [hasAccount, setHasAccount] = useState<boolean>(initialHasAccount ?? false);
  const [view, setView] = useState<ScreenView>(
    initialHasAccount === undefined ? 'loading' : initialHasAccount ? 'email' : 'signup'
  );

  const [ownerName, setOwnerName] = useState<string>(settings.userSession?.userName || 'Account Holder');
  const [emailHint, setEmailHint] = useState<string>('');
  const [isEmailMasked, setIsEmailMasked] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>('');
  const [thumbEnabled, setThumbEnabled] = useState<boolean>(true);
  const [eyeEnabled, setEyeEnabled] = useState<boolean>(true);
  const [accountHasPassword, setAccountHasPassword] = useState<boolean>(false);
  const [hasWebAuthn, setHasWebAuthn] = useState<boolean>(false);

  // Credential sign-in state (Password or 4-digit PIN)
  const [authMethod, setAuthMethod] = useState<'password' | 'pin'>('pin');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // Thumb & Eye biometric states
  const [thumbProgress, setThumbProgress] = useState(0);
  const [eyeProgress, setEyeProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Create Account state (no title/role)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupPin, setSignupPin] = useState('');

  // Load backend single-owner status on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getBackendAuthStatus();
        if (!mounted) return;

        if (status.authenticated && status.user) {
          onUnlock(mapBackendUserToSession(status.user));
          return;
        }

        setHasAccount(status.hasAccount);
        if (!status.hasAccount) {
          setView('signup');
        } else {
          const summary = status.ownerSummary;
          if (summary) {
            setOwnerName(summary.name);
            setEmailHint(summary.emailHint);
            setIsEmailMasked(summary.isEmailMasked);
            setRememberMe(summary.rememberMe);
            setThumbEnabled(summary.biometricThumbEnabled);
            setEyeEnabled(summary.biometricEyeEnabled);
            setAccountHasPassword(summary.hasPassword);
            setAuthMethod(summary.hasPassword ? 'password' : 'pin');
            setHasWebAuthn(summary.hasWebAuthn);
            if (!summary.isEmailMasked && summary.emailHint) {
              setEmailInput(summary.emailHint);
            }
          }
          setView('email');
        }
      } catch (err) {
        if (!mounted) return;
        setFeedback({
          type: 'error',
          msg: err instanceof Error ? err.message : 'Unable to reach backend authentication server.',
        });
        setView(initialHasAccount ? 'email' : 'signup');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (view !== 'eye') {
      stopCamera();
      setEyeProgress(0);
    }
    if (view !== 'thumb') {
      setThumbProgress(0);
    }
  }, [view]);

  const finishBackendUnlock = (methodLabel: string, session: UserSession) => {
    triggerHaptic();
    stopCamera();
    setFeedback({ type: 'success', msg: `${methodLabel} verified. Signing in...` });
    setTimeout(() => {
      onUnlock(session);
    }, 280);
  };

  // Step 1: Email submit -> move to Password / 4-digit PIN entry
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setFeedback({ type: 'error', msg: 'Please enter your email address.' });
      return;
    }
    setFeedback(null);
    setEnteredPin('');
    setPasswordInput('');
    setAuthMethod(accountHasPassword ? 'password' : 'pin');
    setView('credentials');
  };

  // Password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    triggerHaptic();
    if (!passwordInput) {
      setFeedback({ type: 'error', msg: 'Please enter your password.' });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { user } = await loginWithBackendPassword({
        email: emailInput.trim(),
        password: passwordInput,
        rememberMe,
      });
      finishBackendUnlock('Password', mapBackendUserToSession(user));
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Incorrect password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // PIN keypad handlers (verified on backend)
  const submitPinToBackend = async (pin: string) => {
    setIsSubmitting(true);
    try {
      const { user } = await loginWithBackendPin({
        email: emailInput.trim(),
        pin,
        rememberMe,
      });
      finishBackendUnlock('Security PIN', mapBackendUserToSession(user));
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Verification failed.',
      });
      setTimeout(() => {
        setEnteredPin('');
      }, 450);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (isSubmitting || enteredPin.length >= 4) return;
    triggerHaptic();
    const next = enteredPin + digit;
    setEnteredPin(next);
    setFeedback(null);

    if (next.length === 4) {
      void submitPinToBackend(next);
    }
  };

  const handleKeypadBackspace = () => {
    if (isSubmitting) return;
    triggerHaptic();
    setEnteredPin((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  const handleKeypadClear = () => {
    if (isSubmitting) return;
    triggerHaptic();
    setEnteredPin('');
    setFeedback(null);
  };

  // Start Thumb Touch Biometric Scan + Backend Token Issuance
  const triggerThumbScan = async () => {
    if (!thumbEnabled || isSubmitting) return;
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setFeedback({ type: 'error', msg: 'Enter your registered email first.' });
      return;
    }

    triggerHaptic();
    setView('thumb');
    setThumbProgress(25);
    setFeedback({ type: 'info', msg: 'Verifying Thumb Touch with server...' });

    const interval = setInterval(() => {
      setThumbProgress((p) => (p < 85 ? p + 20 : p));
    }, 150);

    try {
      const result = await verifyDeviceBiometric(settings.userSession?.webAuthnCredentialId);
      clearInterval(interval);
      if (!result.verified) {
        setThumbProgress(0);
        setFeedback({ type: 'error', msg: 'Thumbprint did not match. Try PIN or Password.' });
        return;
      }

      setThumbProgress(95);
      const { user } = await loginWithBackendBiometric({
        email: cleanEmail,
        method: 'thumb',
        credentialId: settings.userSession?.webAuthnCredentialId,
        rememberMe,
      });
      setThumbProgress(100);
      finishBackendUnlock('Thumb Touch', mapBackendUserToSession(user));
    } catch (err) {
      clearInterval(interval);
      setThumbProgress(0);
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Biometric login failed. Use Password or PIN.',
      });
      setView('email');
    }
  };

  // Start Eye / Iris Biometric Scan + Backend Token Issuance
  const triggerEyeScan = async () => {
    if (!eyeEnabled || isSubmitting) return;
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setFeedback({ type: 'error', msg: 'Enter your registered email first.' });
      return;
    }

    triggerHaptic();
    setView('eye');
    setEyeProgress(15);
    setFeedback({ type: 'info', msg: 'Align eyes inside the scanner frame...' });

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      setCameraActive(false);
    }

    const timer = setInterval(() => {
      setEyeProgress((prev) => (prev >= 90 ? 90 : prev + 25));
    }, 250);

    setTimeout(async () => {
      clearInterval(timer);
      try {
        await verifyDeviceBiometric(settings.userSession?.webAuthnCredentialId);
        const { user } = await loginWithBackendBiometric({
          email: cleanEmail,
          method: 'eye',
          credentialId: settings.userSession?.webAuthnCredentialId,
          rememberMe,
        });
        setEyeProgress(100);
        finishBackendUnlock('Eye Login', mapBackendUserToSession(user));
      } catch (err) {
        stopCamera();
        setEyeProgress(0);
        setFeedback({
          type: 'error',
          msg: err instanceof Error ? err.message : 'Eye verification failed. Use Password or PIN.',
        });
        setView('email');
      }
    }, 1050);
  };

  // Create Account on Backend (no title/role)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    triggerHaptic();

    if (signupName.trim().length < 2 || !signupEmail.trim()) {
      setFeedback({ type: 'error', msg: 'Please enter your full name and valid email.' });
      return;
    }
    if (signupPassword.length > 12) {
      setFeedback({ type: 'error', msg: 'Password must be between 0 and 12 characters.' });
      return;
    }
    const cleanPin = signupPin.replace(/\D/g, '').slice(0, 4);
    if (cleanPin.length !== 4) {
      setFeedback({ type: 'error', msg: 'Please set a 4-digit security PIN.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', msg: 'Creating your account on backend...' });

    try {
      const bio = await enrollDeviceBiometric(signupName.trim()).catch(() => ({
        enrolled: false,
        credentialId: undefined,
      }));

      const { user } = await registerOwnerAccount({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        pin: cleanPin,
        phone: signupPhone.trim(),
        rememberMe: true,
        webAuthnCredentialId: bio.credentialId,
      });

      setHasAccount(true);
      finishBackendUnlock('Account', mapBackendUserToSession(user));
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to create account.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 w-full flex flex-col overflow-y-auto overscroll-y-contain touch-scroll select-none px-3.5 sm:px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]"
      style={{
        background:
          'radial-gradient(ellipse 85% 65% at 55% 0%, rgba(147, 51, 234, 0.42) 0%, rgba(77, 34, 126, 0.96) 52%, #240B42 100%)',
      }}
    >
      {/* Subtle Top-Right Atmospheric Light Beam matching in-app purple palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-purple-300/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-[#5C2D91]/35 blur-3xl" />
      </div>

      {/* Centered Frosted Glass Login Card */}
      <div className="relative z-10 my-auto mx-auto w-full max-w-[380px] py-2">
        <div
          className="relative rounded-[28px] p-5 sm:p-7 overflow-hidden border border-purple-200/25 shadow-[0_24px_80px_rgba(24,6,48,0.65)] backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(160deg, rgba(110, 56, 173, 0.52) 0%, rgba(69, 26, 118, 0.80) 48%, rgba(42, 14, 77, 0.94) 100%)',
          }}
        >
          {/* Top Edge Specular Highlight Line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-purple-200/80 to-transparent"
          />

          {/* Top Centered Rounded Emblem */}
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#3D166B]/90 border border-white/20 shadow-[0_8px_24px_rgba(20,5,40,0.45)] flex items-center justify-center mb-3.5 sm:mb-4">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 1 9 9" />
                <path d="M21 12a9 9 0 0 1-9 9" opacity="0.85" />
                <path d="M12 21a9 9 0 0 1-9-9" />
                <path d="M3 12a9 9 0 0 1 9-9" opacity="0.85" />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {view === 'loading'
                ? 'Checking access...'
                : view === 'signup'
                ? 'Create Account'
                : 'Welcome back'}
            </h1>
            <p className="text-xs text-purple-100/80 mt-1">
              {view === 'loading'
                ? 'Connecting to secure authentication server'
                : view === 'signup'
                ? 'Only one individual person can access this app.'
                : view === 'credentials'
                ? authMethod === 'password'
                  ? `Enter password for ${ownerName}`
                  : `Enter 4-digit PIN for ${ownerName}`
                : view === 'thumb'
                ? 'Verify your identity using Thumb Touch'
                : view === 'eye'
                ? 'Verify your identity using Eye Recognition'
                : `Sign in as ${ownerName}`}
            </p>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`mt-3.5 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-300/35 text-emerald-100'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/20 border-rose-300/35 text-rose-100'
                  : 'bg-purple-400/20 border-purple-200/35 text-purple-100'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* VIEW 0: LOADING */}
          {view === 'loading' && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-purple-100">
              <Loader2 className="w-8 h-8 animate-spin text-purple-200" />
              <span className="text-xs font-medium">Verifying backend session...</span>
            </div>
          )}

          {/* VIEW 1: MAIN LOGIN (EMAIL + REMEMBER ME + THUMB TOUCH + EYE LOGIN) */}
          {view === 'email' && (
            <form onSubmit={handleEmailSubmit} className="mt-5 sm:mt-6 space-y-3.5 sm:space-y-4">
              {/* Embedded Purple Glass Email Input with Glowing Lavender Arrow Button */}
              <div className="flex items-center gap-2.5 bg-[#381461]/80 border border-white/15 focus-within:border-purple-200/60 rounded-2xl p-2 pl-3.5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="login-email-input"
                      className="block text-[11px] text-purple-200/80 font-medium leading-none mb-1"
                    >
                      Email
                    </label>
                    {isEmailMasked && emailHint && (
                      <span className="text-[10px] text-purple-200/70 font-mono truncate">
                        {emailHint}
                      </span>
                    )}
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={isEmailMasked && emailHint ? emailHint : 'you@domain.com'}
                    className="w-full min-h-[30px] bg-transparent text-[13px] text-white font-medium placeholder:text-purple-200/45 focus:outline-none selectable-text"
                  />
                </div>

                <button
                  type="submit"
                  aria-label="Continue with Email"
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 hover:brightness-105 active:scale-95 text-[#381461] flex items-center justify-center shrink-0 transition-all shadow-[0_4px_16px_rgba(216,180,254,0.4)] cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Remember me checkbox */}
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-purple-100/90 hover:text-white transition-colors min-h-[36px]">
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    triggerHaptic();
                    setRememberMe(!rememberMe);
                  }}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setRememberMe(!rememberMe);
                    }
                  }}
                  className={`w-4.5 h-4.5 rounded-[5px] border flex items-center justify-center transition-colors ${
                    rememberMe
                      ? 'bg-purple-200 border-purple-200 text-[#381461]'
                      : 'bg-transparent border-purple-200/50'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span>Remember me</span>
              </label>

              {/* OR Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[11px] font-semibold tracking-wider text-purple-200/75 uppercase">
                  OR
                </span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {/* Biometric Option 1: Continue with Thumb Touch */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!thumbEnabled || isSubmitting}
                  onClick={triggerThumbScan}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#381461]/70 hover:bg-[#4A1C80]/85 active:scale-[0.99] border border-white/15 transition-all group cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed min-h-[52px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-[#270C46] border border-white/15 flex items-center justify-center text-purple-200 shrink-0">
                      <Fingerprint className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-xs font-medium text-purple-50 group-hover:text-white truncate">
                      Continue with Thumb Touch
                    </span>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-[#270C46]/90 border border-white/15 flex items-center justify-center text-purple-200/80 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Biometric Option 2: Continue with Eye Login */}
                <button
                  type="button"
                  disabled={!eyeEnabled || isSubmitting}
                  onClick={triggerEyeScan}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#381461]/70 hover:bg-[#4A1C80]/85 active:scale-[0.99] border border-white/15 transition-all group cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed min-h-[52px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-[#270C46] border border-white/15 flex items-center justify-center text-purple-200 shrink-0">
                      <ScanEye className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-xs font-medium text-purple-50 group-hover:text-white truncate">
                      Continue with Eye Login
                    </span>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-[#270C46]/90 border border-white/15 flex items-center justify-center text-purple-200/80 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Single-Owner Lock Footer */}
              <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-purple-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>
                  Single-person backend lock {hasWebAuthn ? '· Passkey bound' : 'active'}
                </span>
              </div>
            </form>
          )}

          {/* VIEW 2: PASSWORD OR 4-DIGIT PIN VERIFICATION */}
          {view === 'credentials' && (
            <div className="mt-5 space-y-4">
              {/* Switch between Password and PIN */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#2B0E4E]/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setAuthMethod('password');
                    setFeedback(null);
                  }}
                  className={`min-h-[36px] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMethod === 'password'
                      ? 'bg-purple-200 text-[#381461] shadow-xs'
                      : 'text-purple-200/80 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setAuthMethod('pin');
                    setFeedback(null);
                  }}
                  className={`min-h-[36px] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMethod === 'pin'
                      ? 'bg-purple-200 text-[#381461] shadow-xs'
                      : 'text-purple-200/80 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>4-Digit PIN</span>
                </button>
              </div>

              {authMethod === 'password' ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="bg-[#381461]/80 border border-white/15 focus-within:border-purple-200/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="block text-[11px] text-purple-200/80 mb-0.5">
                        Account Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder="Enter your password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full min-h-[30px] bg-transparent text-xs text-white placeholder:text-purple-200/45 focus:outline-none selectable-text"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-200/80 hover:text-white cursor-pointer shrink-0"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[46px] py-2.5 rounded-xl bg-gradient-to-r from-purple-100 via-purple-200 to-purple-300 text-[#381461] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(216,180,254,0.35)] cursor-pointer active:scale-[0.98] disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-3 py-1">
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = enteredPin.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                            isFilled
                              ? 'bg-purple-200 border-purple-100 shadow-[0_0_16px_rgba(216,180,254,0.55)] scale-105'
                              : 'border-white/20 bg-[#381461]/70'
                          }`}
                        >
                          {isFilled && <span className="w-2.5 h-2.5 rounded-full bg-[#381461]" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleKeypadPress(digit)}
                        className="min-h-[48px] bg-[#381461]/80 hover:bg-[#4D227E] border border-white/15 text-white text-base font-semibold rounded-xl transition-all cursor-pointer active:scale-95 tabular-nums disabled:opacity-50"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleKeypadClear}
                      className="min-h-[48px] bg-[#2D0F50]/80 hover:bg-[#4D227E] border border-white/15 text-purple-200 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleKeypadPress('0')}
                      className="min-h-[48px] bg-[#381461]/80 hover:bg-[#4D227E] border border-white/15 text-white text-base font-semibold rounded-xl transition-all cursor-pointer active:scale-95 tabular-nums disabled:opacity-50"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleKeypadBackspace}
                      aria-label="Backspace"
                      className="min-h-[48px] bg-[#2D0F50]/80 hover:bg-rose-500/25 border border-white/15 text-purple-200 hover:text-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setView('email');
                    setFeedback(null);
                  }}
                  className="min-h-[38px] text-purple-200 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] text-purple-200/80 truncate max-w-[170px]">
                  {emailInput.trim()}
                </span>
              </div>
            </div>
          )}

          {/* VIEW 3: THUMB TOUCH SCAN */}
          {view === 'thumb' && (
            <div className="mt-5 py-2 flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={triggerThumbScan}
                className="relative w-28 h-28 rounded-full bg-[#381461]/85 border border-purple-200/45 flex items-center justify-center text-purple-200 shadow-[0_0_32px_rgba(216,180,254,0.28)] cursor-pointer active:scale-95 transition-transform"
              >
                <Fingerprint className="w-14 h-14" />
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">
                  Scanning Thumbprint ({thumbProgress}%)
                </p>
                <p className="text-[11px] text-purple-200/75 mt-0.5">
                  Verifying {ownerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setView('email');
                  setFeedback(null);
                }}
                className="min-h-[40px] text-xs text-purple-200 hover:text-white flex items-center gap-1 cursor-pointer pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Use Email or Eye Login instead</span>
              </button>
            </div>
          )}

          {/* VIEW 4: EYE RECOGNITION SCAN */}
          {view === 'eye' && (
            <div className="mt-5 py-2 flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-purple-200/55 bg-[#240B42] flex items-center justify-center shadow-[0_0_32px_rgba(216,180,254,0.3)]">
                {cameraActive && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-75"
                  />
                )}
                <ScanEye className="w-14 h-14 text-purple-200 relative z-10" />
                {eyeProgress < 100 && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-purple-300 shadow-[0_0_10px_#d8b4fe] z-20 transition-all duration-300"
                    style={{ top: `${Math.min(90, Math.max(10, eyeProgress))}%` }}
                  />
                )}
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold text-white">
                  Verifying Eye Pattern ({eyeProgress}%)
                </p>
                <p className="text-[11px] text-purple-200/75 mt-0.5">
                  Verifying {ownerName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setView('email');
                  setFeedback(null);
                }}
                className="min-h-[40px] text-xs text-purple-200 hover:text-white flex items-center gap-1 cursor-pointer pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel &amp; go back</span>
              </button>
            </div>
          )}

          {/* VIEW 5: CREATE ACCOUNT (No Title/Role, Password + 4-Digit PIN) */}
          {view === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3">
              <div className="bg-[#381461]/80 border border-white/15 rounded-xl px-3 py-2">
                <label className="block text-[11px] text-purple-200/80 mb-0.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full min-h-[28px] bg-transparent text-xs text-white placeholder:text-purple-200/45 focus:outline-none selectable-text"
                />
              </div>

              <div className="bg-[#381461]/80 border border-white/15 rounded-xl px-3 py-2">
                <label className="block text-[11px] text-purple-200/80 mb-0.5">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full min-h-[28px] bg-transparent text-xs text-white placeholder:text-purple-200/45 focus:outline-none selectable-text"
                />
              </div>

              <div className="bg-[#381461]/80 border border-white/15 rounded-xl px-3 py-2">
                <label className="block text-[11px] text-purple-200/80 mb-0.5">Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+977 98510 12345"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full min-h-[28px] bg-transparent text-xs text-white placeholder:text-purple-200/45 focus:outline-none selectable-text"
                />
              </div>

              <div className="bg-[#381461]/80 border border-white/15 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] text-purple-200/80 mb-0.5">
                    Password <span className="text-purple-200/60">(0–12 chars)</span>
                  </label>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    maxLength={12}
                    placeholder="0–12 characters (optional)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value.slice(0, 12))}
                    className="w-full min-h-[28px] bg-transparent text-xs text-white placeholder:text-purple-200/45 focus:outline-none selectable-text"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-200/80 hover:text-white cursor-pointer shrink-0"
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-[#381461]/80 border border-white/15 rounded-xl px-3 py-2">
                <label className="block text-[11px] text-purple-200/80 mb-0.5">4-Digit Quick PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full min-h-[28px] bg-transparent text-xs text-white font-mono tracking-widest placeholder:text-purple-200/45 focus:outline-none selectable-text"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-100 via-purple-200 to-purple-300 text-[#381461] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(216,180,254,0.35)] cursor-pointer min-h-[46px] active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
              </button>

              {hasAccount && (
                <div className="text-center text-xs text-purple-200/80 pt-1">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setView('email');
                      setFeedback(null);
                    }}
                    className="text-white hover:text-purple-200 font-semibold underline underline-offset-4 cursor-pointer py-1"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
