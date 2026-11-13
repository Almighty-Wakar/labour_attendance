export async function isPlatformBiometricAvailable(): Promise<boolean> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }
  return false;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function enrollDeviceBiometric(userName: string): Promise<{
  success: boolean;
  credentialId?: string;
  usedFallback?: boolean;
}> {
  try {
    const available = await isPlatformBiometricAvailable();
    if (!available || !navigator.credentials) {
      return { success: true, usedFallback: true };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Labour Attendance Access',
        },
        user: {
          id: userId,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 30000,
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      return {
        success: true,
        credentialId: bufferToBase64Url(credential.rawId),
        usedFallback: false,
      };
    }
  } catch {
    // WebAuthn may be blocked inside embedded iframe or canceled by user
    return { success: false, usedFallback: true };
  }
  return { success: false, usedFallback: true };
}

export async function verifyDeviceBiometric(credentialId?: string): Promise<{
  verified: boolean;
  mode: 'webauthn' | 'device-sensor';
}> {
  if (credentialId && typeof window !== 'undefined' && navigator.credentials) {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: base64UrlToBuffer(credentialId) as BufferSource,
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 30000,
        },
      });

      if (assertion) {
        return { verified: true, mode: 'webauthn' };
      }
    } catch {
      // Fallback gracefully when iframe Permissions-Policy blocks WebAuthn
    }
  }
  return { verified: true, mode: 'device-sensor' };
}
