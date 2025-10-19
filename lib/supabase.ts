import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yfzydrabsgdlgfqsvlet.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmenlkcmFic2dkbGdmcXN2bGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTQzODQsImV4cCI6MjA3NjM3MDM4NH0.9ePfxPZK-Gk39owo2ncSWB4lWKbOYes9Snha6YDKMQU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin account credentials (from secure-storage.ts)
const ADMIN_EMAIL = 'admin@robloxstudio.dev'
const ADMIN_PASSWORD = 'Rb!0x$tud10#2024@Adm1n!Secur3'

// Initialize admin account if it doesn't exist
export const initializeAdminAccount = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single()

    if (existingUser) {
      console.log('[v0] Admin account already exists')
      return
    }

    console.log('[v0] Creating admin account...')

    // Create Supabase Auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          username: 'Owner Noel',
          nickname: 'Owner Noel',
          is_admin: true,
          role: 'user'
        }
      }
    })

    if (authError) {
      console.error('[v0] Failed to create admin auth user:', authError.message)
      return
    }

    if (authData.user) {
      // Create user profile in our custom users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: ADMIN_EMAIL,
          username: 'Owner Noel',
          nickname: 'Owner Noel',
          password_hash: '$2a$10$rQZ8J8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ', // Pre-hashed password
          is_admin: true,
          role: 'user',
          created_at: new Date().toISOString(),
          last_ip: 'system'
        })

      if (profileError) {
        console.error('[v0] Failed to create admin profile:', profileError.message)
      } else {
        console.log('[v0] Admin account created successfully')
      }
    }
  } catch (error) {
    console.error('[v0] Error initializing admin account:', error)
  }
}

// Types for our database schema
export interface User {
  id: string
  email: string
  username: string
  nickname: string
  passwordHash: string  // Changed from password_hash to match existing code
  isAdmin: boolean      // Changed from is_admin to match existing code
  role: 'user' | 'helper' | 'tester' | 'early_access'
  createdAt: string    // Changed from created_at to match existing code
  lastIp?: string      // Changed from last_ip to match existing code
}

export interface Project {
  id: string
  name: string
  user_id: string
  created_at: string
  last_modified: string
  explorer_data: any[]
  open_scripts: any[]
  invite_code: string
  collaborators: string[]
  chat_threads: any[]
  active_thread_id?: string
}

export interface ChatThread {
  id: string
  project_id: string
  name: string
  messages: any[]
  created_at: string
  last_modified: string
}
