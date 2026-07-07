import { createClient } from '@supabase/supabase-js'
import { chromeStorageAdapter } from './chromeStorage'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: chromeStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        // No browser tab redirect happens inside a popup — OAuth is
        // handled separately via chrome.identity, not the default flow.
        detectSessionInUrl: false,
      },
    })
  : null
