import { createClient, SupabaseClient } from '@supabase/supabase-js'

// These environment variables are injected via Vite's env prefix.
// Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// or replace the values directly for development.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? { getItem: (key: string) => sessionStorage.getItem(key), setItem: (key: string, value: string) => sessionStorage.setItem(key, value), removeItem: (key: string) => sessionStorage.removeItem(key) } : undefined,
  },
})

// Set the current user's email for RLS policies to work
// This is set when a user logs in or registers
export const setCurrentUserEmail = (email: string | null) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('app.current_user_email', email || '')
  }
}

export const getCurrentUserEmail = (): string => {
  return typeof window !== 'undefined'
    ? sessionStorage.getItem('app.current_user_email') || ''
    : ''
}