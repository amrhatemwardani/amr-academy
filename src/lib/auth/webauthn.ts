'use client'

/**
 * WebAuthn & Device Biometrics (Face ID, Touch ID, Windows Hello) Client Helper
 */

const STORAGE_KEY = 'amr_academy_face_id_cred'
const STORAGE_MAP_KEY = 'amr_academy_face_id_creds_map'
const LAST_ACTIVE_ID_KEY = 'amr_academy_face_id_last_active'

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

function normalizeKey(id: string): string {
  return id.trim().toLowerCase()
}

function getProfilesMap(): Record<string, EnrolledBiometricProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_MAP_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }

  // Check legacy single-profile key
  try {
    const legacy = localStorage.getItem(STORAGE_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as EnrolledBiometricProfile
      const key = normalizeKey(parsed.studentCode || parsed.identifier)
      return { [key]: parsed }
    }
  } catch {
    // ignore
  }

  return {}
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
 * Save enrolled profile in browser secure storage (supports multiple students on the same PC)
 */
export function saveEnrolledBiometric(profile: EnrolledBiometricProfile) {
  if (typeof window === 'undefined') return
  try {
    const map = getProfilesMap()
    const primaryKey = normalizeKey(profile.studentCode || profile.identifier)
    map[primaryKey] = profile

    // Also alias by email if different
    if (profile.email) {
      map[normalizeKey(profile.email)] = profile
    }

    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map))
    localStorage.setItem(LAST_ACTIVE_ID_KEY, primaryKey)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) // legacy sync
  } catch (err) {
    console.error('Failed to save biometric credentials:', err)
  }
}

/**
 * Get enrolled profile from browser storage safely for this PC.
 * If identifier is provided, returns ONLY the profile enrolled for that specific student code.
 * If identifier is NOT provided, returns the last active enrolled profile.
 */
export function getEnrolledBiometric(identifier?: string): EnrolledBiometricProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const map = getProfilesMap()

    if (identifier && identifier.trim()) {
      const cleanId = normalizeKey(identifier)
      // Check exact match in map
      if (map[cleanId]) return map[cleanId]

      // Check case-insensitive match by studentCode or email
      for (const key of Object.keys(map)) {
        const p = map[key]
        if (
          normalizeKey(p.studentCode) === cleanId ||
          normalizeKey(p.identifier) === cleanId ||
          normalizeKey(p.email) === cleanId
        ) {
          return p
        }
      }
      return null
    }

    // No identifier provided: return last active profile or first available
    const lastActive = localStorage.getItem(LAST_ACTIVE_ID_KEY)
    if (lastActive && map[lastActive]) {
      return map[lastActive]
    }

    const allKeys = Object.keys(map)
    if (allKeys.length > 0) {
      return map[allKeys[0]]
    }

    return null
  } catch {
    return null
  }
}

/**
 * List all enrolled student accounts registered on this PC
 */
export function listEnrolledBiometrics(): EnrolledBiometricProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const map = getProfilesMap()
    const seen = new Set<string>()
    const list: EnrolledBiometricProfile[] = []

    for (const key of Object.keys(map)) {
      const profile = map[key]
      const uniqueId = normalizeKey(profile.studentCode || profile.identifier)
      if (!seen.has(uniqueId)) {
        seen.add(uniqueId)
        list.push(profile)
      }
    }
    return list
  } catch {
    return []
  }
}

/**
 * Clear enrolled biometric from browser storage for a specific student or active account
 */
export function removeEnrolledBiometric(identifier?: string) {
  if (typeof window === 'undefined') return
  try {
    const map = getProfilesMap()

    if (identifier && identifier.trim()) {
      const cleanId = normalizeKey(identifier)
      delete map[cleanId]
      for (const k of Object.keys(map)) {
        if (normalizeKey(map[k].studentCode) === cleanId || normalizeKey(map[k].email) === cleanId) {
          delete map[k]
        }
      }
    } else {
      const lastActive = localStorage.getItem(LAST_ACTIVE_ID_KEY)
      if (lastActive) delete map[lastActive]
    }

    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map))

    const remaining = Object.keys(map)
    if (remaining.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LAST_ACTIVE_ID_KEY)
    } else {
      localStorage.setItem(LAST_ACTIVE_ID_KEY, remaining[0])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map[remaining[0]]))
    }
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
