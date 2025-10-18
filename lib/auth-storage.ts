import { secureStorage, type User } from "./secure-storage"

export type { User }

export const authStorage = {
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("roblox-ai-current-user")
    return stored ? JSON.parse(stored) : null
  },

  login: (email: string, password: string): User | null => {
    const result = secureStorage.login(email, password)
    if (result.success && result.user) {
      localStorage.setItem("roblox-ai-current-user", JSON.stringify(result.user))
      return result.user
    }
    return null
  },

  signup: (email: string, username: string, nickname: string, password: string): User | null => {
    const result = secureStorage.register(email, username, nickname, password)
    if (result.success && result.user) {
      localStorage.setItem("roblox-ai-current-user", JSON.stringify(result.user))
      return result.user
    }
    return null
  },

  logout: () => {
    localStorage.removeItem("roblox-ai-current-user")
  },

  getAllUsers: (): User[] => {
    return secureStorage.getAllUsers()
  },
}
