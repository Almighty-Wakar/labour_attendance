import { UserSession } from '../types';

const TOKEN_STORAGE_KEY = 'labour_backend_token_v1';

export interface BackendPublicUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'accountant' | 'viewer';
  phone: string;
  rememberMe: boolean;
  requireLoginOnLaunch: boolean;
  lockOnBackground: boolean;
  biometricThumbEnabled: boolean;
  biometricEyeEnabled: boolean;
  hasPassword: boolean;
  hasWebAuthn: boolean;
  webAuthnCredentialId?: string;
  lastLogin: string;
  createdAt: string;
}

export interface BackendOwnerSummary {
  name: string;
  emailHint: string;
  isEmailMasked: boolean;
  rememberMe: boolean;
  requireLoginOnLaunch: boolean;
  lockOnBackground: boolean;
  biometricThumbEnabled: boolean;
  biometricEyeEnabled: boolean;
  hasPassword: boolean;
  hasWebAuthn: boolean;
}

export interface BackendAuthStatus {
  hasAccount: boolean;
  authenticated: boolean;
  user?: BackendPublicUser;
  ownerSummary?: BackendOwnerSummary;
}

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted webviews
  }
}

export function mapBackendUserToSession(user: BackendPublicUser): UserSession {
  return {
    isLoggedIn: true,
    userName: user.name,
    email: user.email,
    userRole: user.role,
    phone: user.phone,
    lastLogin: user.lastLogin,
    rememberMe: user.rememberMe,
    requireLoginOnLaunch: user.requireLoginOnLaunch,
    lockOnBackground: user.lockOnBackground,
    biometricThumbEnabled: user.biometricThumbEnabled,
    biometricEyeEnabled: user.biometricEyeEnabled,
    hasPassword: user.hasPassword,
    webAuthnCredentialId: user.webAuthnCredentialId,
  };
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function getBackendAuthStatus(): Promise<BackendAuthStatus> {
  return apiFetch<BackendAuthStatus>('/api/auth/status', { method: 'GET' });
}

export async function registerOwnerAccount(payload: {
  name: string;
  email: string;
  pin: string;
  password?: string;
  phone?: string;
  rememberMe?: boolean;
  webAuthnCredentialId?: string;
}): Promise<{ token: string; user: BackendPublicUser }> {
  const res = await apiFetch<{ token: string; user: BackendPublicUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthToken(res.token);
  return res;
}

export async function loginWithBackendPin(payload: {
  email: string;
  pin: string;
  rememberMe?: boolean;
}): Promise<{ token: string; user: BackendPublicUser }> {
  const res = await apiFetch<{ token: string; user: BackendPublicUser }>('/api/auth/login/pin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthToken(res.token);
  return res;
}

export async function loginWithBackendPassword(payload: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<{ token: string; user: BackendPublicUser }> {
  const res = await apiFetch<{ token: string; user: BackendPublicUser }>('/api/auth/login/password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthToken(res.token);
  return res;
}

export async function loginWithBackendBiometric(payload: {
  email: string;
  method: 'thumb' | 'eye';
  credentialId?: string;
  rememberMe?: boolean;
}): Promise<{ token: string; user: BackendPublicUser }> {
  const res = await apiFetch<{ token: string; user: BackendPublicUser }>('/api/auth/login/biometric', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAuthToken(res.token);
  return res;
}

export async function logoutBackendSession(): Promise<void> {
  try {
    await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } catch {
    // Clear local token even if offline
  } finally {
    setAuthToken(null);
  }
}

export async function updateBackendSecurity(payload: {
  name?: string;
  phone?: string;
  rememberMe?: boolean;
  requireLoginOnLaunch?: boolean;
  lockOnBackground?: boolean;
  biometricThumbEnabled?: boolean;
  biometricEyeEnabled?: boolean;
  webAuthnCredentialId?: string;
  currentPin?: string;
  newPin?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ user: BackendPublicUser }> {
  return apiFetch<{ user: BackendPublicUser }>('/api/auth/security', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetBackendOwner(currentPin: string): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/auth/reset-owner', {
    method: 'POST',
    body: JSON.stringify({ currentPin }),
  });
  setAuthToken(null);
}
