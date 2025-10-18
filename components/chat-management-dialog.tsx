"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Plus, Pencil, Trash2, Check, X } from "lucide-react"
import type { ChatThread } from "@/lib/project-storage"

interface ChatManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatThreads: ChatThread[]
  activeThreadId: string
  onCreateThread: (name: string) => void
  onSelectThread: (threadId: string) => void
  onRenameThread: (threadId: string, newName: string) => void
  onDeleteThread: (threadId: string) => void
}

export function ChatManagementDialog({
  open,
  onOpenChange,
  chatThreads,
  activeThreadId,
  onCreateThread,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
}: ChatManagementDialogProps) {
  const [newChatName, setNewChatName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const handleCreate = () => {
    if (newChatName.trim()) {
      onCreateThread(newChatName.trim())
      setNewChatName("")
      // Dialog will be closed by parent component
    }
  }

  const handleStartEdit = (thread: ChatThread) => {
    setEditingId(thread.id)
    setEditingName(thread.name)
  }

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onRenameThread(editingId, editingName.trim())
      setEditingId(null)
      setEditingName("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-2xl animate-in fade-in zoom-in duration-300">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 animate-in slide-in-from-top duration-500">
            <MessageSquare className="w-5 h-5 text-[#007acc]" />
            Manage Chat Threads
          </DialogTitle>
          <DialogDescription className="text-[#858585]">
            Create, rename, and organize your chat conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 animate-in slide-in-from-left duration-500">
            <Input
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New chat name..."
              className="flex-1 bg-[#3c3c3c] border-[#3e3e42] text-white"
            />
            <Button
              onClick={handleCreate}
              disabled={!newChatName.trim()}
              className="bg-[#007acc] hover:bg-[#005a9e] text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-lg border border-[#3e3e42] p-2">
            <div className="space-y-2">
              {chatThreads.map((thread, index) => (
                <div
                  key={thread.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-right ${
                    thread.id === activeThreadId
                      ? "bg-gradient-to-r from-[#094771] to-[#073a5c] border-[#007acc] shadow-lg"
                      : "bg-[#3c3c3c] border-[#3e3e42] hover:border-[#007acc]"
                  }`}
                >
                  {editingId === thread.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit()
                          if (e.key === "Escape") handleCancelEdit()
                        }}
                        className="flex-1 bg-[#252526] border-[#3e3e42] text-white h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="h-8 w-8 p-0 bg-[#2ea043] hover:bg-[#26843b]"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCancelEdit}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          onSelectThread(thread.id)
                          onOpenChange(false)
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-sm">{thread.name}</div>
                        <div className="text-xs text-[#858585] mt-1">
                          {thread.messages.length} messages • Last modified{" "}
                          {new Date(thread.lastModified).toLocaleDateString()}
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(thread)}
                          className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteThread(thread.id)}
                          className="h-8 w-8 p-0 hover:bg-[#3e3e42] hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
