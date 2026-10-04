import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Supabase admin client using the service-role key.
 *
 * SECURITY: This module is marked `server-only`. The service-role key
 * bypasses RLS. Use ONLY for:
 *   - Creating/deleting student auth users
 *   - Resetting student passwords
 *   - Reading user_metadata for admin purposes
 *
 * NEVER use this client for data reads/writes that should be RLS-protected.
 * NEVER reference this file from client components or NEXT_PUBLIC_ code paths.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
