"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Clock, Users } from "lucide-react"
import { rateLimiter, type RateLimitInfo } from "@/lib/rate-limiter"
import { Badge } from "@/components/ui/badge"

export function RateLimitBanner({ userId }: { userId: string }) {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)

  useEffect(() => {
    const updateInfo = () => {
      const info = rateLimiter.getRateLimitInfo(userId)
      setRateLimitInfo(info)
    }

    updateInfo()
    const interval = setInterval(updateInfo, 1000)
    return () => clearInterval(interval)
  }, [userId])

  if (!rateLimitInfo) return null

  const remainingRequests = rateLimitInfo.requestsLimit - rateLimitInfo.requestsUsed
  const resetDate = new Date(rateLimitInfo.resetTime)
  const now = new Date()
  const minutesUntilReset = Math.max(0, Math.floor((resetDate.getTime() - now.getTime()) / 60000))

  const isLowOnRequests = remainingRequests <= 2 && remainingRequests > 0
  const isOutOfRequests = remainingRequests === 0

  if (!isLowOnRequests && !isOutOfRequests && !rateLimitInfo.isInQueue) return null

  return (
    <div
      className={`${
        isOutOfRequests || rateLimitInfo.isInQueue
          ? "bg-gradient-to-r from-[#f48771] to-[#da3633]"
          : "bg-gradient-to-r from-[#f59e0b] to-[#d97706]"
      } text-white px-6 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-center gap-3">
        {rateLimitInfo.isInQueue ? (
          <>
            <Users className="w-5 h-5 animate-pulse" />
            <div>
              <p className="text-sm font-semibold">You're in the queue</p>
              <p className="text-xs opacity-90">Position: #{rateLimitInfo.queuePosition} • Please wait for your turn</p>
            </div>
          </>
        ) : isOutOfRequests ? (
          <>
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <div>
              <p className="text-sm font-semibold">Request limit reached</p>
              <p className="text-xs opacity-90">
                Resets in {minutesUntilReset} minute{minutesUntilReset !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">Low on requests</p>
              <p className="text-xs opacity-90">
                {remainingRequests} request{remainingRequests !== 1 ? "s" : ""} remaining
              </p>
            </div>
          </>
        )}
      </div>
      <Badge variant="secondary" className="bg-white/20 text-white border-0">
        {rateLimitInfo.requestsUsed} / {rateLimitInfo.requestsLimit}
      </Badge>
    </div>
  )
}
