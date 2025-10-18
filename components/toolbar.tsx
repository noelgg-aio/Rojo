"use client"

import { Users, Zap, Command, LogOut, MessageSquare, Shield } from "lucide-react"

export function Toolbar({
  onInviteClick,
  onCommandsClick,
  onQuickActionsClick,
  onExitClick,
  onChatsClick,
  onAdminClick,
  onLogoutClick,
  isAdmin,
}: {
  onInviteClick: () => void
  onCommandsClick: () => void
  onQuickActionsClick: () => void
  onExitClick: () => void
  onChatsClick: () => void
  onAdminClick?: () => void
  onLogoutClick?: () => void
  isAdmin?: boolean
}) {
  return (
    <div className="flex items-center gap-2 pointer-events-auto" style={{ pointerEvents: "auto" }}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onExitClick()
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        className="h-9 px-3 text-xs text-[#cccccc] hover:text-white hover:bg-[#3e3e42] transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-transparent hover:border-[#3e3e42]"
      >
        <LogOut className="w-4 h-4" />
        Exit
      </button>

      <div className="w-px h-6 bg-[#3e3e42]" />

      {onLogoutClick && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onLogoutClick()
            }}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
            className="h-9 px-3 text-xs text-[#ef4444] hover:text-white hover:bg-[#ef4444]/20 transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-[#ef4444]/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <div className="w-px h-6 bg-[#3e3e42]" />
        </>
      )}

      {isAdmin && onAdminClick && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAdminClick()
            }}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
            className="h-9 px-3 text-xs text-[#f59e0b] hover:text-white hover:bg-[#f59e0b]/20 transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-[#f59e0b]/30"
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
          <div className="w-px h-6 bg-[#3e3e42]" />
        </>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onInviteClick()
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        className="h-9 px-3 text-xs text-[#cccccc] hover:text-white hover:bg-[#3e3e42] transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-transparent hover:border-[#3e3e42]"
      >
        <Users className="w-4 h-4" />
        Invite
      </button>

      <div className="w-px h-6 bg-[#3e3e42]" />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onCommandsClick()
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        className="h-9 px-3 text-xs text-white bg-[#007acc] hover:bg-[#005a9e] transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 shadow-lg"
      >
        <Command className="w-4 h-4" />
        <span className="hidden sm:inline">Commands</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onQuickActionsClick()
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        className="h-9 px-3 text-xs text-[#cccccc] hover:text-white hover:bg-[#3e3e42] transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-transparent hover:border-[#3e3e42]"
      >
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Quick Actions</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onChatsClick()
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
        className="h-9 px-3 text-xs text-[#cccccc] hover:text-white hover:bg-[#3e3e42] transition-all duration-200 hover:scale-105 rounded-md flex items-center gap-1.5 border border-transparent hover:border-[#3e3e42]"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Chats</span>
      </button>
    </div>
  )
}
