const HARMFUL_PATTERNS = [
  /\b(hack|exploit|cheat|virus|malware)\b/i,
  /\b(steal|password|credit\s*card)\b/i,
  /\b(inappropriate|nsfw|adult)\b/i,
  /\b(violence|weapon|bomb)\b/i,
]

const SAFE_CONTEXTS = [/anti[- ]?cheat/i, /security/i, /protection/i, /prevent/i]

export interface FilterResult {
  isAllowed: boolean
  reason?: string
  filteredContent?: string
  flagged?: boolean
}

export interface FlaggedMessage {
  id: string
  userId: string
  message: string
  reason: string
  timestamp: number
}

const FLAGGED_MESSAGES_KEY = "roblox_ai_flagged_messages"

export function filterContent(content: string, userId?: string): FilterResult {
  // Check if content is in a safe context
  const hasSafeContext = SAFE_CONTEXTS.some((pattern) => pattern.test(content))

  if (hasSafeContext) {
    return { isAllowed: true }
  }

  // Check for harmful patterns
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(content)) {
      const reason = "Content contains potentially harmful or inappropriate material"

      if (userId) {
        trackFlaggedMessage(userId, content, reason)
      }

      return {
        isAllowed: false,
        reason,
        flagged: true,
      }
    }
  }

  return { isAllowed: true }
}

export function filterAIResponse(response: string): FilterResult {
  const result = filterContent(response)

  if (!result.isAllowed) {
    return {
      isAllowed: false,
      reason: result.reason,
      filteredContent:
        "I cannot provide assistance with that request as it may involve harmful or inappropriate content. Please ask something else related to Roblox game development.",
      flagged: result.flagged,
    }
  }

  return { isAllowed: true }
}

function trackFlaggedMessage(userId: string, message: string, reason: string): void {
  if (typeof window === "undefined") return

  const flagged: FlaggedMessage = {
    id: `flag-${Date.now()}-${Math.random()}`,
    userId,
    message,
    reason,
    timestamp: Date.now(),
  }

  const existing = getFlaggedMessages()
  existing.push(flagged)
  localStorage.setItem(FLAGGED_MESSAGES_KEY, JSON.stringify(existing))
}

export function getFlaggedMessages(): FlaggedMessage[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(FLAGGED_MESSAGES_KEY)
  return data ? JSON.parse(data) : []
}

export function getFlaggedMessagesByUser(userId: string): FlaggedMessage[] {
  return getFlaggedMessages().filter((m) => m.userId === userId)
}

export function removeFlaggedMessage(messageId: string): void {
  if (typeof window === "undefined") return
  const messages = getFlaggedMessages()
  const filtered = messages.filter((m) => m.id !== messageId)
  localStorage.setItem(FLAGGED_MESSAGES_KEY, JSON.stringify(filtered))
}

export function clearUserFlags(userId: string): void {
  if (typeof window === "undefined") return
  const messages = getFlaggedMessages()
  const filtered = messages.filter((m) => m.userId !== userId)
  localStorage.setItem(FLAGGED_MESSAGES_KEY, JSON.stringify(filtered))
}

export function getUserFlagCount(userId: string): number {
  return getFlaggedMessagesByUser(userId).length
}
