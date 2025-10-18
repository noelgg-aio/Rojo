export interface RateLimitInfo {
  userId: string
  requestsUsed: number
  requestsLimit: number
  resetTime: number
  queuePosition?: number
  isInQueue: boolean
}

export interface QueueEntry {
  userId: string
  timestamp: number
  requestId: string
}

const REQUESTS_PER_HOUR = 6
const HOUR_IN_MS = 60 * 60 * 1000
const MAX_CONCURRENT_REQUESTS = 3

class RateLimiter {
  private userRequests: Map<string, number[]> = new Map()
  private userLimits: Map<string, number> = new Map()
  private requestQueue: QueueEntry[] = []
  private activeRequests: Set<string> = new Set()

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  private loadFromStorage() {
    const stored = localStorage.getItem("roblox-ai-rate-limits")
    if (stored) {
      const data = JSON.parse(stored)
      this.userRequests = new Map(data.userRequests)
      this.userLimits = new Map(data.userLimits)
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "roblox-ai-rate-limits",
        JSON.stringify({
          userRequests: Array.from(this.userRequests.entries()),
          userLimits: Array.from(this.userLimits.entries()),
        }),
      )
    }
  }

  private cleanOldRequests(userId: string) {
    const now = Date.now()
    const requests = this.userRequests.get(userId) || []
    const validRequests = requests.filter((timestamp) => now - timestamp < HOUR_IN_MS)
    this.userRequests.set(userId, validRequests)
  }

  getUserLimit(userId: string): number {
    return this.userLimits.get(userId) || REQUESTS_PER_HOUR
  }

  setUserLimit(userId: string, limit: number) {
    this.userLimits.set(userId, limit)
    this.saveToStorage()
  }

  addRequests(userId: string, count: number) {
    const currentLimit = this.getUserLimit(userId)
    this.setUserLimit(userId, currentLimit + count)
  }

  getRateLimitInfo(userId: string): RateLimitInfo {
    this.cleanOldRequests(userId)
    const requests = this.userRequests.get(userId) || []
    const limit = this.getUserLimit(userId)
    const now = Date.now()
    const oldestRequest = requests[0] || now
    const resetTime = oldestRequest + HOUR_IN_MS

    const queuePosition = this.getQueuePosition(userId)

    return {
      userId,
      requestsUsed: requests.length,
      requestsLimit: limit,
      resetTime,
      queuePosition: queuePosition > 0 ? queuePosition : undefined,
      isInQueue: queuePosition > 0,
    }
  }

  canMakeRequest(userId: string): boolean {
    this.cleanOldRequests(userId)
    const requests = this.userRequests.get(userId) || []
    const limit = this.getUserLimit(userId)
    return requests.length < limit && this.activeRequests.size < MAX_CONCURRENT_REQUESTS
  }

  recordRequest(userId: string): boolean {
    if (!this.canMakeRequest(userId)) {
      this.addToQueue(userId)
      return false
    }

    const requests = this.userRequests.get(userId) || []
    requests.push(Date.now())
    this.userRequests.set(userId, requests)
    this.saveToStorage()
    return true
  }

  private addToQueue(userId: string) {
    const existingEntry = this.requestQueue.find((entry) => entry.userId === userId)
    if (!existingEntry) {
      this.requestQueue.push({
        userId,
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substring(7),
      })
    }
  }

  private getQueuePosition(userId: string): number {
    const index = this.requestQueue.findIndex((entry) => entry.userId === userId)
    return index >= 0 ? index + 1 : 0
  }

  processQueue() {
    if (this.activeRequests.size >= MAX_CONCURRENT_REQUESTS) return

    while (this.requestQueue.length > 0 && this.activeRequests.size < MAX_CONCURRENT_REQUESTS) {
      const entry = this.requestQueue.shift()
      if (entry && this.canMakeRequest(entry.userId)) {
        this.recordRequest(entry.userId)
      }
    }
  }

  startRequest(requestId: string) {
    this.activeRequests.add(requestId)
  }

  endRequest(requestId: string) {
    this.activeRequests.delete(requestId)
    this.processQueue()
  }

  resetUserRequests(userId: string) {
    this.userRequests.delete(userId)
    this.saveToStorage()
  }
}

export const rateLimiter = new RateLimiter()
