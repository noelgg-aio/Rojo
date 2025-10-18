"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Users, Share2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface CollaborationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteCode: string
}

export function CollaborationDialog({ open, onOpenChange, inviteCode }: CollaborationDialogProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast({
      title: "Invite code copied!",
      description: "Share this code with your teammates to collaborate.",
      duration: 3000,
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // Mock collaborators
  const collaborators = [{ name: "You", email: "you@example.com", color: "#007acc", active: true }]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-[#007acc]" />
            Collaborate in Real-Time
          </DialogTitle>
          <DialogDescription className="text-[#858585]">
            Share your invite code with teammates to collaborate
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[#2d2d30]">
            <TabsTrigger value="share">Share Code</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#cccccc]">Project Invite Code</label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="bg-[#3c3c3c] border-[#3e3e42] text-[#2ea043] font-mono text-lg text-center flex-1 tracking-wider"
                />
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className="bg-[#007acc] hover:bg-[#005a9e] transition-all duration-200 px-4"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Share2 className="w-4 h-4 text-[#007acc] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-[#cccccc] space-y-1">
                    <p className="font-medium">How to invite teammates:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[#858585]">
                      <li>Copy the invite code above</li>
                      <li>Share it with your teammates</li>
                      <li>They can enter it on the project selection screen</li>
                      <li>Start collaborating in real-time!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#cccccc]">Active Collaborators</label>
              <div className="space-y-2">
                {collaborators.map((collab, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg bg-[#2d2d30] border border-[#3e3e42] transition-all duration-200 hover:border-[#007acc]"
                  >
                    <Avatar className="w-8 h-8" style={{ backgroundColor: collab.color }}>
                      <AvatarFallback className="text-white text-xs font-semibold">
                        {collab.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{collab.name}</div>
                      <div className="text-xs text-[#858585]">{collab.email}</div>
                    </div>
                    {collab.active && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#2ea043] animate-pulse" />
                        <span className="text-xs text-[#2ea043]">Active</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
