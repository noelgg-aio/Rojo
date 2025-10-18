"use client"

import { useEffect, useState } from "react"
import { X, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { secureStorage, type GlobalMessage } from "@/lib/secure-storage"

export function GlobalMessageBanner({
  isAdmin,
  onMessage,
}: { isAdmin: boolean; onMessage?: (message: string) => void }) {
  const [messages, setMessages] = useState<GlobalMessage[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const activeMessages = messages.filter((m) => !dismissed.includes(m.id))
    if (activeMessages.length > 0 && onMessage) {
      activeMessages.forEach((msg) => {
        onMessage(msg.message)
      })
    }
  }, [messages, dismissed, onMessage])

  const loadMessages = () => {
    const allMessages = secureStorage.getAllGlobalMessages()
    setMessages(allMessages)
  }

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id])
  }

  const handleDelete = (id: string) => {
    secureStorage.deleteGlobalMessage(id)
    loadMessages()
  }

  const activeMessages = messages.filter((m) => !dismissed.includes(m.id))

  if (activeMessages.length === 0) return null

  return (
    <div className="space-y-2">
      {activeMessages.map((message, idx) => (
        <div
          key={message.id}
          className={`${
            message.type === "warning"
              ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706]"
              : message.type === "success"
                ? "bg-gradient-to-r from-[#2ea043] to-[#238636]"
                : "bg-gradient-to-r from-[#007acc] to-[#005a9e]"
          } text-white px-6 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-500`}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-center gap-3 flex-1">
            <Megaphone className="w-5 h-5 animate-pulse" />
            <p className="text-sm font-medium">{message.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(message.id)}
                className="h-8 px-2 hover:bg-white/20 text-white"
              >
                Delete
              </Button>
            )}
            <button
              onClick={() => handleDismiss(message.id)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
