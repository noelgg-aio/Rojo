"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Users,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Mail,
  Upload,
  Ban,
  UserCog,
  Lock,
  Clock,
  AlertTriangle,
  X,
  Sparkles,
  TrendingUp,
  Activity,
  GripVertical,
  UserPlus,
  Filter,
} from "lucide-react"
import { rateLimiter } from "@/lib/rate-limiter"
import { secureStorage, verify2FA, type User, type GlobalMessage, type IPBan } from "@/lib/secure-storage"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getUserFlagCount,
  getFlaggedMessagesByUser,
  removeFlaggedMessage,
  clearUserFlags,
  type FlaggedMessage,
} from "@/lib/content-filter"

interface AdminPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
}

const ROLE_DEFINITIONS = {
  user: {
    name: "User",
    description: "Standard user with basic access",
    color: "#858585",
    permissions: ["Chat with AI", "Create projects", "Basic features"],
  },
  helper: {
    name: "Helper",
    description: "Community helper with support privileges",
    color: "#2ea043",
    permissions: ["All user permissions", "Help other users", "Access to helper tools"],
  },
  tester: {
    name: "Tester",
    description: "Beta tester with early feature access",
    color: "#007acc",
    permissions: ["All user permissions", "Test new features", "Submit bug reports"],
  },
  early_access: {
    name: "Early Access",
    description: "VIP user with exclusive early access",
    color: "#f59e0b",
    permissions: ["All user permissions", "Exclusive features", "Priority support", "Special badges"],
  },
  vip: {
    name: "VIP",
    description: "Premium member with all benefits",
    color: "#d946ef",
    permissions: ["All permissions", "Unlimited requests", "Custom themes", "Priority queue"],
  },
  moderator: {
    name: "Moderator",
    description: "Community moderator with moderation powers",
    color: "#8b5cf6",
    permissions: ["All user permissions", "Ban users", "Delete content", "Moderate chat"],
  },
}

type ExtendedRole = keyof typeof ROLE_DEFINITIONS

export function AdminPanel({ open, onOpenChange, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [requestsToAdd, setRequestsToAdd] = useState<string>("1")
  const [globalMessage, setGlobalMessage] = useState("")
  const [globalMessageType, setGlobalMessageType] = useState<"info" | "warning" | "success">("info")
  const [twoFACode, setTwoFACode] = useState("")
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [pending2FAAction, setPending2FAAction] = useState<(() => void) | null>(null)

  const [banDuration, setBanDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [banReason, setBanReason] = useState("")
  const [ipBans, setIPBans] = useState<IPBan[]>([])
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [updateNotes, setUpdateNotes] = useState("")
  const [pendingUpdate, setPendingUpdate] = useState(false)
  const [selectedFlaggedUser, setSelectedFlaggedUser] = useState<User | null>(null)
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([])

  const [roleAssignEmail, setRoleAssignEmail] = useState("")
  const [roleAssignNickname, setRoleAssignNickname] = useState("")
  const [roleToAssign, setRoleToAssign] = useState<ExtendedRole>("user")

  const [selectedRoles, setSelectedRoles] = useState<ExtendedRole[]>([])
  const [roleMessage, setRoleMessage] = useState("")
  const [roleMessageType, setRoleMessageType] = useState<"info" | "warning" | "success">("info")

  const [panelWidth, setPanelWidth] = useState(80)
  const [panelHeight, setPanelHeight] = useState(90)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      loadUsers()
      loadIPBans()
    }
  }, [open])

  const loadUsers = () => {
    const allUsers = secureStorage.getAllUsers().filter((u) => !u.isAdmin)
    setUsers(allUsers)
  }

  const loadIPBans = () => {
    const bans = secureStorage.getAllIPBans()
    setIPBans(bans)
  }

  const require2FA = (action: () => void) => {
    setPending2FAAction(() => action)
    setShow2FADialog(true)
  }

  const handle2FASubmit = () => {
    console.log("[v0] 2FA code entered:", twoFACode)
    if (verify2FA(twoFACode)) {
      setShow2FADialog(false)
      setTwoFACode("")
      if (pending2FAAction) {
        pending2FAAction()
        setPending2FAAction(null)
      }
    } else {
      console.log("[v0] 2FA verification failed")
      alert("Invalid 2FA code! The correct code is: 27053A (case-insensitive)")
    }
  }

  const handleSendGlobalMessage = () => {
    if (!globalMessage.trim()) return

    require2FA(() => {
      const message: GlobalMessage = {
        id: Date.now().toString(),
        message: globalMessage,
        type: globalMessageType,
        createdAt: Date.now(),
        createdBy: currentUser.id,
      }

      secureStorage.addGlobalMessage(message)
      setGlobalMessage("")
      alert("Global message sent to all users!")
    })
  }

  const handleSendRoleMessage = () => {
    if (!roleMessage.trim() || selectedRoles.length === 0) {
      alert("Please select at least one role and enter a message")
      return
    }

    require2FA(() => {
      const roleNames = selectedRoles.map((r) => ROLE_DEFINITIONS[r].name).join(", ")
      const message: GlobalMessage = {
        id: Date.now().toString(),
        message: `[To ${roleNames}] ${roleMessage}`,
        type: roleMessageType,
        createdAt: Date.now(),
        createdBy: currentUser.id,
      }

      secureStorage.addGlobalMessage(message)
      setRoleMessage("")
      setSelectedRoles([])
      alert(`Message sent to ${roleNames}!`)
    })
  }

  const handleAssignRole = () => {
    if (!roleAssignEmail.trim() || !roleAssignNickname.trim()) {
      alert("Please enter both email and nickname")
      return
    }

    require2FA(() => {
      const user = users.find((u) => u.email === roleAssignEmail && u.nickname === roleAssignNickname)
      if (!user) {
        alert("User not found with that email and nickname combination")
        return
      }

      secureStorage.updateUserRole(user.id, roleToAssign as any)
      loadUsers()
      setRoleAssignEmail("")
      setRoleAssignNickname("")
      alert(`Role ${ROLE_DEFINITIONS[roleToAssign].name} assigned to ${user.nickname}!`)
    })
  }

  const handleBanUser = () => {
    if (!selectedUser || !banReason) {
      alert("Please select a user and provide a reason")
      return
    }

    const user = users.find((u) => u.id === selectedUser)
    if (!user || !user.lastIp) {
      alert("User IP not found")
      return
    }

    require2FA(() => {
      const durationMs =
        banDuration.days * 24 * 60 * 60 * 1000 +
        banDuration.hours * 60 * 60 * 1000 +
        banDuration.minutes * 60 * 1000 +
        banDuration.seconds * 1000

      if (durationMs === 0) {
        alert("Please set a ban duration")
        return
      }

      secureStorage.banIP(user.lastIp!, user.id, banReason, durationMs, currentUser.id)
      loadIPBans()
      setBanReason("")
      setBanDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      alert(`User banned for ${formatDuration(durationMs)}`)
    })
  }

  const handleUnbanIP = (ip: string) => {
    require2FA(() => {
      secureStorage.unbanIP(ip)
      loadIPBans()
      alert("IP unbanned successfully")
    })
  }

  const handleUpdateRole = (userId: string, role: User["role"]) => {
    require2FA(() => {
      secureStorage.updateUserRole(userId, role)
      loadUsers()
      alert("User role updated successfully")
    })
  }

  const handleDeleteGlobalMessage = (msgId: string) => {
    require2FA(() => {
      secureStorage.deleteGlobalMessage(msgId)
      alert("Global message deleted successfully")
    })
  }

  const handleSendEmail = () => {
    require2FA(() => {
      alert("Email notification generated successfully")
    })
  }

  const handlePublishUpdate = () => {
    if (!updateNotes.trim()) {
      alert("Please enter update notes")
      return
    }

    setPendingUpdate(true)
    require2FA(() => {
      // Send global message about the update
      const message: GlobalMessage = {
        id: Date.now().toString(),
        message: `🚀 New Update Published: ${updateNotes}`,
        type: "success",
        createdAt: Date.now(),
        createdBy: currentUser.id,
      }
      secureStorage.addGlobalMessage(message)

      setPendingUpdate(false)
      setUpdateNotes("")
      alert("Update published successfully! All users will be notified.")
    })
  }

  const handleDeleteUser = (userId: string) => {
    require2FA(() => {
      secureStorage.deleteUser(userId)
      clearUserFlags(userId)
      loadUsers()
      alert("User account deleted successfully")
    })
  }

  const handleViewFlaggedUser = (user: User) => {
    const messages = getFlaggedMessagesByUser(user.id)
    setFlaggedMessages(messages)
    setSelectedFlaggedUser(user)
  }

  const handleRemoveFlaggedMessage = (messageId: string) => {
    removeFlaggedMessage(messageId)
    if (selectedFlaggedUser) {
      const messages = getFlaggedMessagesByUser(selectedFlaggedUser.id)
      setFlaggedMessages(messages)
      loadUsers()
    }
  }

  const handleClearAllFlags = (userId: string) => {
    require2FA(() => {
      clearUserFlags(userId)
      setSelectedFlaggedUser(null)
      setFlaggedMessages([])
      loadUsers()
      alert("All flags cleared for user")
    })
  }

  const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.join(" ")
  }

  const globalMessages = secureStorage.getAllGlobalMessages()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={panelRef}
          style={{
            width: `${panelWidth}vw`,
            height: `${panelHeight}vh`,
            maxWidth: `${panelWidth}vw`,
            maxHeight: `${panelHeight}vh`,
          }}
          className="bg-gradient-to-br from-[#1a1a1a] via-[#252526] to-[#1e1e1e] border-[#3e3e42] text-white overflow-hidden animate-in fade-in zoom-in duration-300 p-0"
        >
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center hover:bg-[#007acc]/20 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
              const startX = e.clientX
              const startY = e.clientY
              const startWidth = panelWidth
              const startHeight = panelHeight

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = ((e.clientX - startX) / window.innerWidth) * 100
                const deltaY = ((e.clientY - startY) / window.innerHeight) * 100
                setPanelWidth(Math.max(50, Math.min(95, startWidth + deltaX)))
                setPanelHeight(Math.max(50, Math.min(95, startHeight + deltaY)))
              }

              const handleMouseUp = () => {
                setIsResizing(false)
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
              }

              document.addEventListener("mousemove", handleMouseMove)
              document.addEventListener("mouseup", handleMouseUp)
            }}
          >
            <GripVertical className="w-4 h-4 text-[#007acc]" />
          </div>

          <div className="h-full flex flex-col overflow-hidden p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-3xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center animate-pulse">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <span className="bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent font-bold">
                  Admin Control Panel
                </span>
                <Badge className="ml-auto text-xs">Resizable</Badge>
              </DialogTitle>
              <DialogDescription className="text-[#858585]">
                Manage users, roles, bans, messages, and system updates. All actions require 2FA verification.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 mb-6 animate-in slide-in-from-bottom duration-500">
              <Card className="bg-gradient-to-br from-[#007acc]/20 to-[#005a9e]/20 border-[#007acc]/30 p-6 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#007acc]/30 rounded-lg flex items-center justify-center">
                    <Users className="w-7 h-7 text-[#007acc]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#007acc]">{users.length}</p>
                    <p className="text-sm text-[#858585]">Total Users</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[#f48771]/20 to-[#d16a5a]/20 border-[#f48771]/30 p-6 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#f48771]/30 rounded-lg flex items-center justify-center">
                    <Ban className="w-7 h-7 text-[#f48771]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#f48771]">{ipBans.length}</p>
                    <p className="text-sm text-[#858585]">Active Bans</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[#2ea043]/20 to-[#238636]/20 border-[#2ea043]/30 p-6 hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#2ea043]/30 rounded-lg flex items-center justify-center">
                    <Activity className="w-7 h-7 text-[#2ea043]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#2ea043]">{globalMessages.length}</p>
                    <p className="text-sm text-[#858585]">Global Messages</p>
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="users" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-[#2d2d30] border-b border-[#3e3e42] w-full justify-start">
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Roles
                </TabsTrigger>
                <TabsTrigger
                  value="bans"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  IP Bans
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="updates"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#007acc] data-[state=active]:to-[#005a9e] transition-all duration-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Updates
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="users" className="space-y-4 m-0 animate-in fade-in duration-500">
                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc] flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      User Management
                    </h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {users.map((user, index) => {
                        const info = rateLimiter.getRateLimitInfo(user.id)
                        const flagCount = getUserFlagCount(user.id)
                        const isFlagged = flagCount > 0

                        return (
                          <div
                            key={user.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-left ${
                              isFlagged
                                ? "bg-gradient-to-r from-[#4a1f1f] to-[#3a1515] border-[#f48771] cursor-pointer hover:from-[#5a2525] hover:to-[#4a1f1f]"
                                : "bg-gradient-to-r from-[#3c3c3c] to-[#2d2d30] border-[#3e3e42] hover:border-[#007acc]"
                            }`}
                            onClick={() => isFlagged && handleViewFlaggedUser(user)}
                          >
                            <div className="flex-1">
                              <p className={`font-medium text-lg ${isFlagged ? "text-[#f48771]" : ""}`}>
                                {user.username}
                                {isFlagged && (
                                  <Badge variant="destructive" className="ml-2">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {flagCount} flags
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-[#007acc]">Nickname: {user.nickname}</p>
                              <p className="text-xs text-[#858585]">{user.email}</p>
                              <p className="text-xs text-[#858585]">IP: {user.lastIp || "Unknown"}</p>
                            </div>
                            <div className="text-right space-y-1 flex flex-col items-end gap-2">
                              <div className="flex gap-2">
                                <Badge variant={user.role === "user" ? "secondary" : "default"}>{user.role}</Badge>
                                <Badge variant={info.requestsUsed >= info.requestsLimit ? "destructive" : "default"}>
                                  {info.requestsUsed} / {info.requestsLimit}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete user ${user.nickname}? This cannot be undone.`)) {
                                      handleDeleteUser(user.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl animate-in slide-in-from-bottom duration-500">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Add Requests
                    </h3>
                    <div className="space-y-3">
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="bg-[#3c3c3c] border-[#3e3e42] text-white">
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-white">
                              {user.nickname} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={requestsToAdd}
                        onChange={(e) => setRequestsToAdd(e.target.value)}
                        placeholder="Number of requests"
                        className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                      />
                      <Button
                        onClick={() => {
                          if (selectedUser) {
                            rateLimiter.addRequests(selectedUser, Number.parseInt(requestsToAdd))
                            alert("Requests added!")
                            loadUsers()
                          }
                        }}
                        className="w-full bg-[#2ea043] hover:bg-[#238636]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Requests
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4 m-0">
                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc] flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Assign Role by Email & Nickname
                    </h3>
                    <div className="space-y-3">
                      <Input
                        value={roleAssignEmail}
                        onChange={(e) => setRoleAssignEmail(e.target.value)}
                        placeholder="Enter user email..."
                        className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                      />
                      <Input
                        value={roleAssignNickname}
                        onChange={(e) => setRoleAssignNickname(e.target.value)}
                        placeholder="Enter user nickname..."
                        className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                      />
                      <Select value={roleToAssign} onValueChange={(v) => setRoleToAssign(v as ExtendedRole)}>
                        <SelectTrigger className="bg-[#3c3c3c] border-[#3e3e42] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                          {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                            <SelectItem key={key} value={key} className="text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssignRole} className="w-full bg-[#007acc] hover:bg-[#005a9e]">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Role
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc] flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Role Definitions
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                        <div
                          key={key}
                          className="p-4 bg-[#3c3c3c] rounded-lg border border-[#3e3e42] hover:border-[#007acc] transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                            <h4 className="font-semibold text-lg" style={{ color: role.color }}>
                              {role.name}
                            </h4>
                          </div>
                          <p className="text-sm text-[#cccccc] mb-2">{role.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((perm, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Manage User Roles</h3>
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-[#3c3c3c] rounded border border-[#3e3e42]"
                        >
                          <div>
                            <p className="font-medium text-lg">{user.nickname}</p>
                            <p className="text-xs text-[#858585]">{user.email}</p>
                          </div>
                          <Select value={user.role} onValueChange={(role) => handleUpdateRole(user.id, role as any)}>
                            <SelectTrigger className="w-[180px] bg-[#3c3c3c] border-[#3e3e42] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                              {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                                <SelectItem key={key} value={key} className="text-white">
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="bans" className="space-y-4 m-0">
                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Ban User by IP</h3>
                    <div className="space-y-3">
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="bg-[#3c3c3c] border-[#3e3e42] text-white">
                          <SelectValue placeholder="Select user to ban..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-white">
                              {user.nickname} - IP: {user.lastIp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-[#cccccc]">Days</label>
                          <Input
                            type="number"
                            min="0"
                            value={banDuration.days}
                            onChange={(e) =>
                              setBanDuration({ ...banDuration, days: Number.parseInt(e.target.value) || 0 })
                            }
                            className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#cccccc]">Hours</label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={banDuration.hours}
                            onChange={(e) =>
                              setBanDuration({ ...banDuration, hours: Number.parseInt(e.target.value) || 0 })
                            }
                            className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#cccccc]">Minutes</label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={banDuration.minutes}
                            onChange={(e) =>
                              setBanDuration({ ...banDuration, minutes: Number.parseInt(e.target.value) || 0 })
                            }
                            className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#cccccc]">Seconds</label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={banDuration.seconds}
                            onChange={(e) =>
                              setBanDuration({ ...banDuration, seconds: Number.parseInt(e.target.value) || 0 })
                            }
                            className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                          />
                        </div>
                      </div>

                      <Textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Ban reason..."
                        className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                      />

                      <Button onClick={handleBanUser} className="w-full bg-[#f48771] hover:bg-[#d16a5a]">
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Active IP Bans</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {ipBans.map((ban) => {
                        const user = users.find((u) => u.id === ban.userId)
                        const timeLeft = ban.expiresAt - Date.now()
                        return (
                          <div key={ban.ip} className="p-4 bg-[#3c3c3c] rounded border border-[#3e3e42] relative group">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnbanIP(ban.ip)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-[#2ea043]" />
                            </Button>
                            <p className="font-medium text-[#f48771]">IP: {ban.ip}</p>
                            <p className="text-sm">User: {user?.nickname || "Unknown"}</p>
                            <p className="text-sm text-[#858585]">Reason: {ban.reason}</p>
                            <p className="text-xs text-[#858585] flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Expires in: {formatDuration(timeLeft)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4 m-0">
                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Send Global Message</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Message Type</label>
                        <select
                          value={globalMessageType}
                          onChange={(e) => setGlobalMessageType(e.target.value as any)}
                          className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="success">Success</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Message</label>
                        <Textarea
                          value={globalMessage}
                          onChange={(e) => setGlobalMessage(e.target.value)}
                          placeholder="Enter your message to all users..."
                          className="bg-[#3c3c3c] border-[#3e3e42] text-white min-h-[100px]"
                        />
                      </div>
                      <Button onClick={handleSendGlobalMessage} className="w-full bg-[#007acc] hover:bg-[#005a9e]">
                        <Send className="w-4 h-4 mr-2" />
                        Send to All Users
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl">
                    <h3 className="font-semibold mb-4 text-xl text-[#d946ef] flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Send Message to Specific Roles
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Select Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 p-2 bg-[#3c3c3c] rounded border border-[#3e3e42] hover:border-[#007acc] transition-all cursor-pointer"
                              onClick={() => {
                                if (selectedRoles.includes(key as ExtendedRole)) {
                                  setSelectedRoles(selectedRoles.filter((r) => r !== key))
                                } else {
                                  setSelectedRoles([...selectedRoles, key as ExtendedRole])
                                }
                              }}
                            >
                              <Checkbox checked={selectedRoles.includes(key as ExtendedRole)} />
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                              <span className="text-sm">{role.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Message Type</label>
                        <select
                          value={roleMessageType}
                          onChange={(e) => setRoleMessageType(e.target.value as any)}
                          className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-3 py-2 text-white"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="success">Success</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Message</label>
                        <Textarea
                          value={roleMessage}
                          onChange={(e) => setRoleMessage(e.target.value)}
                          placeholder="Enter your message to selected roles..."
                          className="bg-[#3c3c3c] border-[#3e3e42] text-white min-h-[100px]"
                        />
                      </div>
                      <Button
                        onClick={handleSendRoleMessage}
                        disabled={selectedRoles.length === 0}
                        className="w-full bg-[#d946ef] hover:bg-[#c026d3]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to Selected Roles ({selectedRoles.length})
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Active Global Messages</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {globalMessages.map((msg) => (
                        <div key={msg.id} className="p-4 bg-[#3c3c3c] rounded border border-[#3e3e42] relative group">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGlobalMessage(msg.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4 text-[#f48771]" />
                          </Button>
                          <Badge
                            variant={
                              msg.type === "warning" ? "destructive" : msg.type === "success" ? "default" : "secondary"
                            }
                            className="mb-2"
                          >
                            {msg.type}
                          </Badge>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs text-[#858585] mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 m-0">
                  <Card className="bg-[#2d2d30] border-[#3e3e42] p-6">
                    <h3 className="font-semibold mb-4 text-xl text-[#007acc]">Send Email Notification to Yourself</h3>
                    <p className="text-sm text-[#858585] mb-4">
                      Generate email notifications for early tester updates or important alerts. Only you will receive
                      these.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Subject</label>
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Early Tester Update - New Features Available"
                          className="bg-[#3c3c3c] border-[#3e3e42] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Email Body</label>
                        <Textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Enter your email content..."
                          className="bg-[#3c3c3c] border-[#3e3e42] text-white min-h-[150px]"
                        />
                      </div>
                      <Button onClick={handleSendEmail} className="w-full bg-[#2ea043] hover:bg-[#238636]">
                        <Mail className="w-4 h-4 mr-2" />
                        Generate Email Notification
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="updates" className="space-y-4 m-0">
                  <Card className="bg-gradient-to-br from-[#2d2d30] to-[#1e1e1e] border-[#3e3e42] p-6 shadow-xl">
                    <h3 className="font-semibold mb-4 text-xl text-[#f59e0b] flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Publish Update
                    </h3>
                    <p className="text-sm text-[#858585] mb-4">
                      Publish updates to notify all users. A global message will be sent to everyone.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-[#cccccc] mb-2 block">Update Notes</label>
                        <Textarea
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          placeholder="Describe what's new in this update..."
                          className="bg-[#3c3c3c] border-[#3e3e42] text-white min-h-[150px]"
                        />
                      </div>
                      <Button
                        onClick={handlePublishUpdate}
                        disabled={pendingUpdate || !updateNotes.trim()}
                        className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-lg py-6"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        {pendingUpdate ? "Publishing..." : "Publish Update"}
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#f59e0b]" />
              2FA Verification Required
            </DialogTitle>
            <DialogDescription className="text-[#858585]">
              Enter your 2FA code to proceed with this admin action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-xs text-[#858585]">Code: 27053A</p>
            <Input
              type="text"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.toUpperCase())}
              placeholder="Enter 2FA code (27053A)"
              className="bg-[#3c3c3c] border-[#3e3e42] text-white"
              onKeyDown={(e) => e.key === "Enter" && handle2FASubmit()}
            />
            <Button onClick={handle2FASubmit} className="w-full bg-[#007acc] hover:bg-[#005a9e]">
              Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedFlaggedUser} onOpenChange={() => setSelectedFlaggedUser(null)}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#f48771]" />
              Flagged User: {selectedFlaggedUser?.nickname}
            </DialogTitle>
            <DialogDescription className="text-[#858585]">
              Review flagged messages and take action on this user account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => selectedFlaggedUser && handleClearAllFlags(selectedFlaggedUser.id)}
                className="bg-[#2ea043] hover:bg-[#238636]"
              >
                Clear All Flags
              </Button>
              <Button
                onClick={() => {
                  if (selectedFlaggedUser && confirm(`Ban user ${selectedFlaggedUser.nickname}?`)) {
                    setSelectedUser(selectedFlaggedUser.id)
                    setSelectedFlaggedUser(null)
                  }
                }}
                className="bg-[#f48771] hover:bg-[#d16a5a]"
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
              <Button
                onClick={() => {
                  if (
                    selectedFlaggedUser &&
                    confirm(`Delete user ${selectedFlaggedUser.nickname}? This cannot be undone.`)
                  ) {
                    handleDeleteUser(selectedFlaggedUser.id)
                    setSelectedFlaggedUser(null)
                  }
                }}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>

            <Card className="bg-[#2d2d30] border-[#3e3e42] p-4">
              <h3 className="font-semibold mb-4 text-[#f48771]">Flagged Messages ({flaggedMessages.length})</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {flaggedMessages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-[#3c3c3c] rounded border border-[#f48771] relative group">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFlaggedMessage(msg.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4 text-[#2ea043]" />
                    </Button>
                    <p className="text-sm text-[#f48771] font-medium mb-2">Reason: {msg.reason}</p>
                    <p className="text-sm text-white mb-2">{msg.message}</p>
                    <p className="text-xs text-[#858585]">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
