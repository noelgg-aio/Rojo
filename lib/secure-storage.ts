import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = "roblox-ai-studio-secure-key-2024"
const USERS_KEY = "roblox_ai_users"
const CHANGELOGS_KEY = "roblox_ai_changelogs"
const GLOBAL_MESSAGES_KEY = "roblox_ai_global_messages"
const IP_BANS_KEY = "roblox_ai_ip_bans"

// Admin credentials
export const ADMIN_EMAIL = "admin@robloxstudio.dev"
export const ADMIN_PASSWORD = "Rb!0x$tud10#2024@Adm1n!Secur3"
const ENCRYPTED_2FA_CODE = "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIpGI8uebonQ=" // Encrypted: 27053A

// User management
export interface User {
  id: string
  email: string
  username: string
  nickname: string
  passwordHash: string
  isAdmin: boolean
  role: "user" | "helper" | "tester" | "early_access"
  createdAt: string  // Changed to string to match Supabase timestamp format
  lastIp?: string
}

export interface Changelog {
  id: string
  version: string
  title: string
  description: string
  createdAt: number
  createdBy: string
}

export interface GlobalMessage {
  id: string
  message: string
  type: "info" | "warning" | "success"
  createdAt: number
  createdBy: string
}

export interface IPBan {
  ip: string
  userId: string
  reason: string
  bannedAt: number
  expiresAt: number
  bannedBy: string
}

// Encryption helpers
function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

function decrypt(data: string): string {
  const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

const CORRECT_2FA_CODE = "27053A"

// Hash password
function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + ENCRYPTION_KEY).toString()
}

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

export function verify2FA(code: string): boolean {
  const inputCode = code.trim().toUpperCase()
  const expectedCode = CORRECT_2FA_CODE.toUpperCase()
  console.log("[v0] 2FA Debug - Expected:", expectedCode, "Got:", inputCode, "Match:", inputCode === expectedCode)
  return inputCode === expectedCode
}

export const secureStorage = {
  // Initialize admin user if not exists
  initializeAdmin(): void {
    const users = this.getAllUsers()
    const adminExists = users.some((u) => u.email === ADMIN_EMAIL)

    if (!adminExists) {
      const adminUser: User = {
        id: "admin-" + Date.now(),
        email: ADMIN_EMAIL,
        username: "Owner Noel",
        nickname: "Owner Noel",
        passwordHash: hashPassword(ADMIN_PASSWORD),
        isAdmin: true,
        role: "user",
        createdAt: new Date().toISOString(),
      }
      users.push(adminUser)
      this.saveUsers(users)
    } else {
      const admin = users.find((u) => u.email === ADMIN_EMAIL)
      if (admin) {
        const correctHash = hashPassword(ADMIN_PASSWORD)
        if (admin.passwordHash !== correctHash) {
          admin.passwordHash = correctHash
          admin.username = "Owner Noel"
          admin.nickname = "Owner Noel"
          this.saveUsers(users)
        }
      }
    }
  },

  // Get all users (decrypted)
  getAllUsers(): User[] {
    if (typeof window === "undefined") return []
    const encrypted = localStorage.getItem(USERS_KEY)
    if (!encrypted) return []
    try {
      const decrypted = decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch {
      return []
    }
  },

  // Save users (encrypted)
  saveUsers(users: User[]): void {
    if (typeof window === "undefined") return
    const encrypted = encrypt(JSON.stringify(users))
    localStorage.setItem(USERS_KEY, encrypted)
  },

  // Register new user
  register(
    email: string,
    username: string,
    nickname: string,
    password: string,
  ): { success: boolean; error?: string; user?: User } {
    const users = this.getAllUsers()
    const userIp = getUserIP()

    // Check if IP is banned
    if (this.isIPBanned(userIp)) {
      return { success: false, error: "Your IP address is banned" }
    }

    if (users.some((u) => u.email === email)) {
      return { success: false, error: "Email already registered" }
    }

    const newUser: User = {
      id: "user-" + Date.now(),
      email,
      username,
      nickname,
      passwordHash: hashPassword(password),
      isAdmin: false,
      role: "user",
      createdAt: new Date().toISOString(),
      lastIp: userIp,
    }

    users.push(newUser)
    this.saveUsers(users)

    return { success: true, user: newUser }
  },

  // Login user
  login(email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = this.getAllUsers()
    const userIp = getUserIP()

    // Check if IP is banned
    if (this.isIPBanned(userIp)) {
      return { success: false, error: "Your IP address is banned" }
    }

    const user = users.find((u) => u.email === email)

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const passwordHash = hashPassword(password)
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: "Invalid email or password" }
    }

    // Update last IP
    user.lastIp = userIp
    this.saveUsers(users)

    return { success: true, user }
  },

  // Get user by ID
  getUserById(id: string): User | null {
    const users = this.getAllUsers()
    return users.find((u) => u.id === id) || null
  },

  updateUserRole(userId: string, role: User["role"]): void {
    const users = this.getAllUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.role = role
      this.saveUsers(users)
    }
  },

  // Delete user account
  deleteUser(userId: string): void {
    const users = this.getAllUsers()
    const filtered = users.filter((u) => u.id !== userId)
    this.saveUsers(filtered)
  },

  // Changelog management
  getAllChangelogs(): Changelog[] {
    if (typeof window === "undefined") return []
    const encrypted = localStorage.getItem(CHANGELOGS_KEY)
    if (!encrypted) return []
    try {
      const decrypted = decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch {
      return []
    }
  },

  saveChangelogs(changelogs: Changelog[]): void {
    if (typeof window === "undefined") return
    const encrypted = encrypt(JSON.stringify(changelogs))
    localStorage.setItem(CHANGELOGS_KEY, encrypted)
  },

  addChangelog(version: string, title: string, description: string, userId: string): Changelog {
    const changelogs = this.getAllChangelogs()
    const newChangelog: Changelog = {
      id: "changelog-" + Date.now(),
      version,
      title,
      description,
      createdAt: Date.now(),
      createdBy: userId,
    }
    changelogs.unshift(newChangelog)
    this.saveChangelogs(changelogs)
    return newChangelog
  },

  deleteChangelog(id: string): void {
    const changelogs = this.getAllChangelogs()
    const filtered = changelogs.filter((c) => c.id !== id)
    this.saveChangelogs(filtered)
  },

  // Global messages management
  getAllGlobalMessages(): GlobalMessage[] {
    if (typeof window === "undefined") return []
    const encrypted = localStorage.getItem(GLOBAL_MESSAGES_KEY)
    if (!encrypted) return []
    try {
      const decrypted = decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch {
      return []
    }
  },

  saveGlobalMessages(messages: GlobalMessage[]): void {
    if (typeof window === "undefined") return
    const encrypted = encrypt(JSON.stringify(messages))
    localStorage.setItem(GLOBAL_MESSAGES_KEY, encrypted)
  },

  addGlobalMessage(messageObj: GlobalMessage): GlobalMessage {
    const messages = this.getAllGlobalMessages()
    messages.unshift(messageObj)
    this.saveGlobalMessages(messages)
    return messageObj
  },

  deleteGlobalMessage(id: string): void {
    const messages = this.getAllGlobalMessages()
    const filtered = messages.filter((m) => m.id !== id)
    this.saveGlobalMessages(filtered)
  },

  getLatestGlobalMessage(): GlobalMessage | null {
    const messages = this.getAllGlobalMessages()
    return messages.length > 0 ? messages[0] : null
  },

  // IP ban management
  getAllIPBans(): IPBan[] {
    if (typeof window === "undefined") return []
    const encrypted = localStorage.getItem(IP_BANS_KEY)
    if (!encrypted) return []
    try {
      const decrypted = decrypt(encrypted)
      return JSON.parse(decrypted)
    } catch {
      return []
    }
  },

  saveIPBans(bans: IPBan[]): void {
    if (typeof window === "undefined") return
    const encrypted = encrypt(JSON.stringify(bans))
    localStorage.setItem(IP_BANS_KEY, encrypted)
  },

  banIP(ip: string, userId: string, reason: string, durationMs: number, adminId: string): void {
    const bans = this.getAllIPBans()
    const newBan: IPBan = {
      ip,
      userId,
      reason,
      bannedAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      bannedBy: adminId,
    }
    bans.push(newBan)
    this.saveIPBans(bans)
  },

  unbanIP(ip: string): void {
    const bans = this.getAllIPBans()
    const filtered = bans.filter((b) => b.ip !== ip)
    this.saveIPBans(filtered)
  },

  isIPBanned(ip: string): boolean {
    const bans = this.getAllIPBans()
    const now = Date.now()
    const activeBan = bans.find((b) => b.ip === ip && b.expiresAt > now)
    return !!activeBan
  },

  getIPBan(ip: string): IPBan | null {
    const bans = this.getAllIPBans()
    const now = Date.now()
    return bans.find((b) => b.ip === ip && b.expiresAt > now) || null
  },
}

// Initialize admin on load
if (typeof window !== "undefined") {
  secureStorage.initializeAdmin()
}
