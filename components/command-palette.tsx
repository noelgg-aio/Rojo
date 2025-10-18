"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Command, FileText, FolderPlus, Trash2, Save, Download } from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommand: (command: string) => void
}

export function CommandPalette({ open, onOpenChange, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState("")

  const commands = [
    { id: "create-script", label: "Create Script", icon: FileText, action: "create-script" },
    { id: "create-folder", label: "Create Folder", icon: FolderPlus, action: "create-folder" },
    { id: "delete-selected", label: "Delete Selected", icon: Trash2, action: "delete-selected" },
    { id: "save-project", label: "Save Project", icon: Save, action: "save-project" },
    { id: "export-project", label: "Export Project", icon: Download, action: "export-project" },
  ]

  const filteredCommands = commands.filter((cmd) => cmd.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252526] border-[#3e3e42] text-white p-0 max-w-2xl">
        <DialogDescription className="sr-only">
          Quick command palette to perform actions like creating scripts, folders, and managing your project.
        </DialogDescription>
        <div className="p-4 border-b border-[#3e3e42]">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#858585]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command..."
              className="border-0 bg-transparent text-white placeholder:text-[#858585] focus-visible:ring-0"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                onCommand(cmd.action)
                onOpenChange(false)
                setSearch("")
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2d2d30] transition-colors text-left"
            >
              <cmd.icon className="w-5 h-5 text-[#007acc]" />
              <span className="text-sm text-white">{cmd.label}</span>
            </button>
          ))}
          {filteredCommands.length === 0 && <div className="p-8 text-center text-[#858585]">No commands found</div>}
        </div>
        <div className="p-2 border-t border-[#3e3e42] text-xs text-[#858585] text-center">
          Press <kbd className="px-1.5 py-0.5 bg-[#3c3c3c] rounded">Ctrl+K</kbd> to open command palette
        </div>
      </DialogContent>
    </Dialog>
  )
}
