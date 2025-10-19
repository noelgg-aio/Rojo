import { supabase, type User } from "./supabase"
import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = "roblox-ai-studio-secure-key-2024"

export type { User }

function getUserIP(): string {
  if (typeof window === "undefined") return "unknown"
  // In production, this would be fetched from server
  let ip = localStorage.getItem("user_ip")
  if (!ip) {
    ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    localStorage.setItem("user_ip", ip)
  }
  return ip
}

export const authStorage = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      // Get user profile from database using snake_case column names
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // Transform from snake_case to camelCase for the app
        return {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          nickname: profile.nickname,
          passwordHash: profile.password_hash,
          isAdmin: profile.is_admin,
          role: profile.role,
          createdAt: profile.created_at, // Keep as string to match interface
          lastIp: profile.last_ip,
        }
      }

      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user && data.user.id) {
        // Get user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profile) {
          // Update last IP
          const userIP = getUserIP()
          await supabase
            .from('users')
            .update({ last_ip: userIP })
            .eq('id', data.user.id)

          return { success: true, user: profile }
        }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  },

  signup: async (email: string, username: string, nickname: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      // Check if email already exists
      const { data: existingEmailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingEmailUser) {
        return { success: false, error: 'Email already registered' }
      }

      // Check if username already exists
      const { data: existingUsernameUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (existingUsernameUser) {
        return { success: false, error: 'Username already taken' }
      }

      // Check if nickname already exists
      const { data: existingNicknameUser } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .maybeSingle()

      if (existingNicknameUser) {
        return { success: false, error: 'Nickname already taken' }
      }

      // Check if IP is banned
      const userIP = this.getUserIP()
      const ipBanResult = await this.checkIPBan(userIP)
      if (ipBanResult && ipBanResult.banned) {
        return { success: false, error: 'Your IP address is banned' }
      }

      // Hash password
      const passwordHash = CryptoJS.SHA256(password + ENCRYPTION_KEY).toString()

      // Create Supabase auth user first (this will send confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            nickname,
            password_hash: passwordHash,
            is_admin: false,
            role: 'user',
            last_ip: userIP,
          }
        }
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (authData.user) {
        // The user profile will be created automatically by a database trigger
        // or we can create it manually if needed
        const newUser = {
          id: authData.user.id,
          email: authData.user.email!,
          username,
          nickname,
          passwordHash,
          isAdmin: false,
          role: 'user' as const,
          createdAt: authData.user.created_at,
          lastIp: userIP,
        }

        return { success: true, user: newUser }
      }

      return { success: false, error: 'Signup failed' }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'An error occurred during signup' }
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut()
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return []

      // Check if current user is admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!currentUser?.is_admin) return []

      // Get all users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      return users || []
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  },

  updateUserRole: async (userId: string, role: User['role']): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Check if current user is admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!currentUser?.is_admin) return

      await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Check if current user is admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (!currentUser?.is_admin) return

      // Delete from Supabase auth
      await supabase.auth.admin.deleteUser(userId)

      // Delete from database (cascade will handle projects)
      await supabase
        .from('users')
        .delete()
        .eq('id', userId)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  },

  checkIPBan: async (ip: string): Promise<{ banned: boolean; reason?: string }> => {
    try {
      // For now, we'll implement a simple IP ban check
      // In a real implementation, you'd have an IP bans table
      return { banned: false }
    } catch (error) {
      console.error('Error checking IP ban:', error)
      return { banned: false }
    }
  },
}
