import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

interface StoredOwnerAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'accountant' | 'viewer';
  phone: string;
  pinHash: string;
  pinSalt: string;
  passwordHash?: string;
  passwordSalt?: string;
  rememberMe: boolean;
  requireLoginOnLaunch: boolean;
  lockOnBackground: boolean;
  biometricThumbEnabled: boolean;
  biometricEyeEnabled: boolean;
  webAuthnCredentialId?: string;
  tokenVersion: number;
  failedAttempts: number;
  lockUntil: number;
  createdAt: string;
  lastLogin: string;
}

interface AuthStoreData {
  owner: StoredOwnerAccount | null;
}

interface TokenPayload {
  sub: string;
  email: string;
  ver: number;
  iat: number;
  exp: number;
}

function resolveWritableDataDir(): string {
  const candidates = [
    path.join(process.cwd(), '.data'),
    path.join(os.tmpdir(), 'labour-attendance-auth'),
  ];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      const probe = path.join(dir, '.write-test');
      fs.writeFileSync(probe, 'ok');
      fs.unlinkSync(probe);
      return dir;
    } catch {
      // Try next writable directory
    }
  }
  return os.tmpdir();
}

const DATA_DIR = resolveWritableDataDir();
const AUTH_FILE = path.join(DATA_DIR, 'auth-owner.json');
const SECRET_FILE = path.join(DATA_DIR, 'auth-secret.key');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours max session
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

let inMemoryStore: AuthStoreData = { owner: null };

function getAuthSecret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
    return process.env.AUTH_SECRET;
  }
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const AUTH_SECRET = getAuthSecret();

function readStore(): AuthStoreData {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf8');
      const parsed = JSON.parse(raw) as AuthStoreData;
      inMemoryStore = { owner: parsed?.owner ?? null };
      return inMemoryStore;
    }
  } catch (err) {
    console.error('Failed to read auth store:', err);
  }
  return inMemoryStore;
}

function writeStore(data: AuthStoreData): void {
  inMemoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error('Failed to persist auth store to disk:', err);
  }
}

function hashPin(pin: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPinHash(pin: string, salt: string, storedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(pin, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

function signSessionToken(owner: StoredOwnerAccount): string {
  const payload: TokenPayload = {
    sub: owner.id,
    email: owner.email,
    ver: owner.tokenVersion,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function verifySessionToken(token: string | undefined, owner: StoredOwnerAccount | null): TokenPayload | null {
  if (!token || !owner) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    if (payload.sub !== owner.id || payload.email !== owner.email) return null;
    if (payload.ver !== owner.tokenVersion) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function toPublicUser(owner: StoredOwnerAccount) {
  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
    phone: owner.phone,
    rememberMe: owner.rememberMe,
    requireLoginOnLaunch: owner.requireLoginOnLaunch,
    lockOnBackground: owner.lockOnBackground,
    biometricThumbEnabled: owner.biometricThumbEnabled,
    biometricEyeEnabled: owner.biometricEyeEnabled,
    hasPassword: Boolean(owner.passwordHash),
    hasWebAuthn: Boolean(owner.webAuthnCredentialId),
    webAuthnCredentialId: owner.webAuthnCredentialId,
    lastLogin: owner.lastLogin,
    createdAt: owner.createdAt,
  };
}

interface AuthenticatedRequest extends Request {
  ownerAccount?: StoredOwnerAccount;
  storeData?: AuthStoreData;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const store = readStore();
  if (!store.owner) {
    res.status(401).json({ error: 'No owner account exists yet.' });
    return;
  }
  const token = extractToken(req);
  const verified = verifySessionToken(token, store.owner);
  if (!verified) {
    res.status(401).json({ error: 'Session expired or unauthorized. Please sign in.' });
    return;
  }
  req.ownerAccount = store.owner;
  req.storeData = store;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Check whether single owner account exists & if caller session is verified
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const store = readStore();
    if (!store.owner) {
      res.json({
        hasAccount: false,
        authenticated: false,
      });
      return;
    }

    const token = extractToken(req);
    const verified = verifySessionToken(token, store.owner);

    if (verified) {
      res.json({
        hasAccount: true,
        authenticated: true,
        user: toPublicUser(store.owner),
      });
      return;
    }

    res.json({
      hasAccount: true,
      authenticated: false,
      ownerSummary: {
        name: store.owner.name,
        emailHint: store.owner.rememberMe ? store.owner.email : maskEmail(store.owner.email),
        isEmailMasked: !store.owner.rememberMe,
        rememberMe: store.owner.rememberMe,
        requireLoginOnLaunch: store.owner.requireLoginOnLaunch,
        lockOnBackground: store.owner.lockOnBackground,
        biometricThumbEnabled: store.owner.biometricThumbEnabled,
        biometricEyeEnabled: store.owner.biometricEyeEnabled,
        hasPassword: Boolean(store.owner.passwordHash),
        hasWebAuthn: Boolean(store.owner.webAuthnCredentialId),
      },
    });
  });

  // 2. Register the SOLE individual owner account (strictly blocked once 1 account exists)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const store = readStore();
    if (store.owner) {
      res.status(403).json({
        error: 'Only one individual person can own and access this app. Sign in with the existing owner account.',
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const role: StoredOwnerAccount['role'] = 'admin';
    const rememberMe = req.body?.rememberMe !== false;
    const webAuthnCredentialId =
      typeof req.body?.webAuthnCredentialId === 'string' && req.body.webAuthnCredentialId.trim()
        ? req.body.webAuthnCredentialId.trim()
        : undefined;

    if (name.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length > 12) {
      res.status(400).json({ error: 'Password must be between 0 and 12 characters.' });
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'Security PIN must be exactly 4 digits.' });
      return;
    }

    const { hash, salt } = hashPin(pin);
    const pwCred = password ? hashPin(password) : null;
    const nowIso = new Date().toISOString();

    const newOwner: StoredOwnerAccount = {
      id: `owner_${crypto.randomUUID()}`,
      name,
      email,
      role,
      phone,
      pinHash: hash,
      pinSalt: salt,
      passwordHash: pwCred?.hash,
      passwordSalt: pwCred?.salt,
      rememberMe,
      requireLoginOnLaunch: true,
      lockOnBackground: false,
      biometricThumbEnabled: true,
      biometricEyeEnabled: true,
      webAuthnCredentialId,
      tokenVersion: 1,
      failedAttempts: 0,
      lockUntil: 0,
      createdAt: nowIso,
      lastLogin: nowIso,
    };

    writeStore({ owner: newOwner });
    const token = signSessionToken(newOwner);

    res.status(201).json({
      token,
      user: toPublicUser(newOwner),
    });
  });

  // 3. Authenticate sole owner via Email + 4-Digit PIN
  app.post('/api/auth/login/pin', (req: Request, res: Response) => {
    const store = readStore();
    if (!store.owner) {
      res.status(404).json({ error: 'No owner account exists yet. Please create your account first.' });
      return;
    }

    const owner = store.owner;
    const now = Date.now();
    if (owner.lockUntil > now) {
      const waitSec = Math.ceil((owner.lockUntil - now) / 1000);
      res.status(429).json({
        error: `Too many failed attempts. Try again in ${waitSec}s.`,
      });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const pin = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';
    const rememberMe = typeof req.body?.rememberMe === 'boolean' ? req.body.rememberMe : owner.rememberMe;

    if (!email || email !== owner.email) {
      owner.failedAttempts += 1;
      if (owner.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        owner.lockUntil = now + LOCKOUT_MS;
        owner.failedAttempts = 0;
      }
      writeStore(store);
      res.status(401).json({
        error: 'Access denied: Email does not match the sole registered owner.',
      });
      return;
    }

    if (!/^\d{4}$/.test(pin) || !verifyPinHash(pin, owner.pinSalt, owner.pinHash)) {
      owner.failedAttempts += 1;
      if (owner.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        owner.lockUntil = now + LOCKOUT_MS;
        owner.failedAttempts = 0;
      }
      writeStore(store);
      res.status(401).json({
        error: 'Incorrect 4-digit PIN. Please try again.',
      });
      return;
    }

    owner.failedAttempts = 0;
    owner.lockUntil = 0;
    owner.rememberMe = rememberMe;
    owner.lastLogin = new Date().toISOString();
    writeStore(store);

    const token = signSessionToken(owner);

    res.json({
      token,
      user: toPublicUser(owner),
    });
  });

  // 3b. Authenticate sole owner via Email + Account Password
  app.post('/api/auth/login/password', (req: Request, res: Response) => {
    const store = readStore();
    if (!store.owner) {
      res.status(404).json({ error: 'No owner account exists yet. Please create your account first.' });
      return;
    }

    const owner = store.owner;
    const now = Date.now();
    if (owner.lockUntil > now) {
      const waitSec = Math.ceil((owner.lockUntil - now) / 1000);
      res.status(429).json({
        error: `Too many failed attempts. Try again in ${waitSec}s.`,
      });
      return;
    }

    if (!owner.passwordHash || !owner.passwordSalt) {
      res.status(400).json({
        error: 'No password has been set for this account yet. Please sign in with your 4-digit PIN and set a password in Access Settings.',
      });
      return;
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = typeof req.body?.rememberMe === 'boolean' ? req.body.rememberMe : owner.rememberMe;

    if (!email || email !== owner.email) {
      owner.failedAttempts += 1;
      if (owner.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        owner.lockUntil = now + LOCKOUT_MS;
        owner.failedAttempts = 0;
      }
      writeStore(store);
      res.status(401).json({
        error: 'Access denied: Email does not match the sole registered owner.',
      });
      return;
    }

    if (!password || !verifyPinHash(password, owner.passwordSalt, owner.passwordHash)) {
      owner.failedAttempts += 1;
      if (owner.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        owner.lockUntil = now + LOCKOUT_MS;
        owner.failedAttempts = 0;
      }
      writeStore(store);
      res.status(401).json({
        error: 'Incorrect password. Please try again.',
      });
      return;
    }

    owner.failedAttempts = 0;
    owner.lockUntil = 0;
    owner.rememberMe = rememberMe;
    owner.lastLogin = new Date().toISOString();
    writeStore(store);

    const token = signSessionToken(owner);

    res.json({
      token,
      user: toPublicUser(owner),
    });
  });

  // 4. Authenticate sole owner via Thumb Touch or Eye Login
  app.post('/api/auth/login/biometric', (req: Request, res: Response) => {
    const store = readStore();
    if (!store.owner) {
      res.status(404).json({ error: 'No owner account exists yet. Please create your account first.' });
      return;
    }

    const owner = store.owner;
    const method = req.body?.method;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const credentialId = typeof req.body?.credentialId === 'string' ? req.body.credentialId.trim() : '';
    const rememberMe = typeof req.body?.rememberMe === 'boolean' ? req.body.rememberMe : owner.rememberMe;

    if (method !== 'thumb' && method !== 'eye') {
      res.status(400).json({ error: 'Invalid biometric method.' });
      return;
    }

    if (method === 'thumb' && !owner.biometricThumbEnabled) {
      res.status(403).json({ error: 'Thumb Touch login is disabled for this owner account.' });
      return;
    }

    if (method === 'eye' && !owner.biometricEyeEnabled) {
      res.status(403).json({ error: 'Eye Login is disabled for this owner account.' });
      return;
    }

    if (!email || email !== owner.email) {
      res.status(401).json({
        error: 'Enter the registered owner email before using biometric unlock.',
      });
      return;
    }

    if (owner.webAuthnCredentialId && credentialId && credentialId !== owner.webAuthnCredentialId) {
      res.status(401).json({ error: 'Device passkey credential does not match registered owner.' });
      return;
    }

    owner.failedAttempts = 0;
    owner.lockUntil = 0;
    owner.rememberMe = rememberMe;
    owner.lastLogin = new Date().toISOString();
    writeStore(store);

    const token = signSessionToken(owner);

    res.json({
      token,
      user: toPublicUser(owner),
    });
  });

  // 5. Logout / Lock app (revokes server-side token version)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const store = readStore();
    const token = extractToken(req);
    const verified = verifySessionToken(token, store.owner);
    if (store.owner && verified) {
      store.owner.tokenVersion += 1;
      writeStore(store);
    }
    res.json({ ok: true });
  });

  // 6. Update authenticated sole owner profile, PIN, or security toggles
  app.post('/api/auth/security', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const store = req.storeData!;
    const owner = req.ownerAccount!;

    if (typeof req.body?.name === 'string' && req.body.name.trim().length >= 2) {
      owner.name = req.body.name.trim();
    }
    if (
      req.body?.role === 'admin' ||
      req.body?.role === 'supervisor' ||
      req.body?.role === 'accountant' ||
      req.body?.role === 'viewer'
    ) {
      owner.role = req.body.role;
    }
    if (typeof req.body?.phone === 'string') {
      owner.phone = req.body.phone.trim();
    }
    if (typeof req.body?.rememberMe === 'boolean') {
      owner.rememberMe = req.body.rememberMe;
    }
    if (typeof req.body?.requireLoginOnLaunch === 'boolean') {
      owner.requireLoginOnLaunch = req.body.requireLoginOnLaunch;
    }
    if (typeof req.body?.lockOnBackground === 'boolean') {
      owner.lockOnBackground = req.body.lockOnBackground;
    }
    if (typeof req.body?.biometricThumbEnabled === 'boolean') {
      owner.biometricThumbEnabled = req.body.biometricThumbEnabled;
    }
    if (typeof req.body?.biometricEyeEnabled === 'boolean') {
      owner.biometricEyeEnabled = req.body.biometricEyeEnabled;
    }
    if (typeof req.body?.webAuthnCredentialId === 'string' && req.body.webAuthnCredentialId.trim()) {
      owner.webAuthnCredentialId = req.body.webAuthnCredentialId.trim();
    }

    if (typeof req.body?.newPin === 'string' && req.body.newPin.trim().length > 0) {
      const currentPin = typeof req.body?.currentPin === 'string' ? req.body.currentPin.trim() : '';
      const newPin = req.body.newPin.trim();
      if (!verifyPinHash(currentPin, owner.pinSalt, owner.pinHash)) {
        res.status(401).json({ error: 'Current 4-digit PIN is incorrect.' });
        return;
      }
      if (!/^\d{4}$/.test(newPin)) {
        res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits.' });
        return;
      }
      const { hash, salt } = hashPin(newPin);
      owner.pinHash = hash;
      owner.pinSalt = salt;
    }

    if (typeof req.body?.newPassword === 'string') {
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const currentPin = typeof req.body?.currentPin === 'string' ? req.body.currentPin.trim() : '';
      const newPassword = req.body.newPassword;

      if (owner.passwordHash && owner.passwordSalt) {
        const pwValid = currentPassword
          ? verifyPinHash(currentPassword, owner.passwordSalt, owner.passwordHash)
          : false;
        const pinValid = currentPin
          ? verifyPinHash(currentPin, owner.pinSalt, owner.pinHash)
          : false;
        if (!pwValid && !pinValid) {
          res.status(401).json({ error: 'Current password is incorrect.' });
          return;
        }
      } else {
        if (!verifyPinHash(currentPin, owner.pinSalt, owner.pinHash)) {
          res.status(401).json({ error: 'Verify your current 4-digit PIN to set your password.' });
          return;
        }
      }

      if (newPassword.length > 12) {
        res.status(400).json({ error: 'New password must be between 0 and 12 characters.' });
        return;
      }
      if (newPassword.length === 0) {
        owner.passwordHash = undefined;
        owner.passwordSalt = undefined;
      } else {
        const { hash, salt } = hashPin(newPassword);
        owner.passwordHash = hash;
        owner.passwordSalt = salt;
      }
    }

    writeStore(store);
    res.json({ user: toPublicUser(owner) });
  });

  // 7. Reset owner account (only authenticated owner with verified current PIN)
  app.post('/api/auth/reset-owner', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const owner = req.ownerAccount!;
    const currentPin = typeof req.body?.currentPin === 'string' ? req.body.currentPin.trim() : '';

    if (!verifyPinHash(currentPin, owner.pinSalt, owner.pinHash)) {
      res.status(401).json({ error: 'Current 4-digit PIN is incorrect.' });
      return;
    }

    writeStore({ owner: null });
    res.json({ ok: true });
  });

  // 8. Provide compiled dist/ web bundle files for offline Android Studio APK/AAB zip packaging
  app.get('/api/android-dist-files', (_req: Request, res: Response) => {
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      res.json({ available: false, files: [] });
      return;
    }

    const collected: Array<{ path: string; base64: string }> = [];
    const walkDir = (currentDir: string, relPrefix: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (relPath === 'assets/aistudio') {
          continue;
        }
        if (entry.isDirectory()) {
          walkDir(fullPath, relPath);
        } else if (entry.isFile()) {
          const content = fs.readFileSync(fullPath);
          collected.push({
            path: relPath,
            base64: content.toString('base64'),
          });
        }
      }
    };

    try {
      walkDir(distDir, '');
      res.json({ available: collected.length > 0, files: collected });
    } catch {
      res.json({ available: false, files: [] });
    }
  });

  // Vite dev middleware (only when not production and Vite is installed) or production static build
  const forceStatic = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);
  let mountedVite = false;

  if (!forceStatic) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      mountedVite = true;
    } catch {
      mountedVite = false;
    }
  }

  if (!mountedVite) {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
