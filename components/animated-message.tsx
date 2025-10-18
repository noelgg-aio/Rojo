"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnimatedMessageProps {
  message: string
  type?: "owner" | "admin" | "global"
  onClose: () => void
}

export function AnimatedMessage({ message, type = "global", onClose }: AnimatedMessageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50)

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const getStyles = () => {
    switch (type) {
      case "owner":
        return {
          bg: "bg-gradient-to-r from-[#f59e0b]/20 via-[#f59e0b]/30 to-[#f59e0b]/20",
          border: "border-[#f59e0b]",
          text: "text-[#f59e0b]",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
        }
      case "admin":
        return {
          bg: "bg-gradient-to-r from-[#007acc]/20 via-[#007acc]/30 to-[#007acc]/20",
          border: "border-[#007acc]",
          text: "text-[#007acc]",
          glow: "shadow-[0_0_30px_rgba(0,122,204,0.3)]",
        }
      default:
        return {
          bg: "bg-gradient-to-r from-[#2ea043]/20 via-[#2ea043]/30 to-[#2ea043]/20",
          border: "border-[#2ea043]",
          text: "text-[#2ea043]",
          glow: "shadow-[0_0_30px_rgba(46,160,67,0.3)]",
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isVisible && !isLeaving
          ? "opacity-100 translate-y-0 scale-100"
          : isLeaving
            ? "opacity-0 -translate-y-4 scale-95"
            : "opacity-0 translate-y-4 scale-95"
      }`}
    >
      <div
        className={`${styles.bg} ${styles.border} ${styles.glow} border-2 rounded-2xl px-8 py-4 backdrop-blur-xl relative overflow-hidden animate-pulse-slow`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <p className={`${styles.text} text-lg font-bold tracking-wide animate-in fade-in duration-700`}>
              {message}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className={`h-8 w-8 p-0 ${styles.text} hover:bg-white/10 transition-all duration-200`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Sparkle effects */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75 animation-delay-300" />
      </div>
    </div>
  )
}
