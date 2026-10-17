'use client'

/**
 * WebAuthn & Device Biometrics (Face ID, Touch ID, Windows Hello) Client Helper
 */

const STORAGE_KEY = 'amr_academy_face_id_cred'

export interface EnrolledBiometricProfile {
  identifier: string
  studentCode: string
  studentName: string
  email: string
  role: 'student' | 'teacher'
  biometricToken: string
  credentialId?: string
  enrolledAt: string
  deviceName: string
}

/**
 * Checks if browser supports WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  )
}

/**
 * Checks if device has a platform authenticator (Apple Face ID, Touch ID, Windows Hello)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/**
 * Get device name (e.g. iPhone, iPad, Windows PC, Mac)
 */
export function getClientDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device'
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone (Face ID)'
  if (/iPad/i.test(ua)) return 'iPad (Face ID)'
  if (/Macintosh/i.test(ua)) return 'Mac (Touch ID)'
  if (/Windows/i.test(ua)) return 'Windows PC (Hello Face)'
  if (/Android/i.test(ua)) return 'Android Device (Biometric)'
  return 'Personal Device'
}

/**
 * Save enrolled profile in browser secure storage
 */
export function saveEnrolledBiometric(profile: EnrolledBiometricProfile) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (err) {
    console.error('Failed to save biometric credentials:', err)
  }
}

/**
 * Get enrolled profile from browser storage
 */
export function getEnrolledBiometric(): EnrolledBiometricProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EnrolledBiometricProfile
  } catch {
    return null
  }
}

/**
 * Clear enrolled biometric from browser storage
 */
export function removeEnrolledBiometric() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to remove biometric credentials:', err)
  }
}

/**
 * Native Platform Biometric Prompt (Apple Face ID / Windows Hello)
 */
export async function promptNativeBiometrics(
  action: 'enroll' | 'verify',
  email: string,
  displayName: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn not supported on this device/browser' }
  }

  const challenge = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(challenge)
  }

  try {
    if (action === 'enroll') {
      const userId = new TextEncoder().encode(email)
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Eng. Amr Hatem Academy',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          },
          user: {
            id: userId,
            name: email,
            displayName,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'discouraged',
          },
          timeout: 60000,
        },
      })

      if (!credential) {
        return { success: false, error: 'Biometric enrollment was cancelled or failed' }
      }

      return { success: true, credentialId: credential.id }
    } else {
      // Verify
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
      })

      if (!assertion) {
        return { success: false, error: 'Biometric verification was cancelled' }
      }

      return { success: true, credentialId: assertion.id }
    }
  } catch (err: any) {
    // If user cancelled, or platform biometrics not fully configured, return descriptive error
    console.warn('Native biometric prompt result:', err)
    return {
      success: false,
      error: err.name === 'NotAllowedError'
        ? 'User cancelled or biometric scan timed out'
        : err.message || 'Biometric authentication failed',
    }
  }
}
