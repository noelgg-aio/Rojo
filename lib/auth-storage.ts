import { supabase, type User } from "./supabase"
import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = "roblox-ai-studio-secure-key-2024"

export type { User }

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
          .single()

        if (profile) {
          // Update last IP
          const userIP = this.getUserIP()
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
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return { success: false, error: 'Email already registered' }
      }

      // Check if IP is banned
      const userIP = this.getUserIP()
      const ipBanResult = await this.checkIPBan(userIP)
      if (ipBanResult.banned) {
        return { success: false, error: 'Your IP address is banned' }
      }

      // Hash password
      const passwordHash = CryptoJS.SHA256(password + ENCRYPTION_KEY).toString()

      // Create user in database first
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          username,
          nickname,
          password_hash: passwordHash,
          is_admin: false,
          role: 'user',
          last_ip: userIP,
        })
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      // Create Supabase auth user (this will send confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_id: newUser.id,
          }
        }
      })

      if (authError) {
        // If auth signup fails, we should probably delete the user we just created
        // But for now, return the error
        return { success: false, error: authError.message }
      }

      return { success: true, user: newUser }
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

  getUserIP: (): string => {
    if (typeof window === "undefined") return "unknown"
    // In production, this would be fetched from server
    let ip = localStorage.getItem("user_ip")
    if (!ip) {
      ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      localStorage.setItem("user_ip", ip)
    }
    return ip
  },
}
