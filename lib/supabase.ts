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
