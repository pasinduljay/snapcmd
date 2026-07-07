import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Exported so the app can show a friendly setup screen instead of crashing
// when the .env file hasn't been filled in yet.
export const isConfigured = Boolean(url && anonKey)

export const supabase = isConfigured ? createClient(url, anonKey) : null
