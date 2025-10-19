"use client"

import { useState, useEffect, useRef } from "react"
import { ExplorerPanel } from "@/components/explorer-panel"
import { ScriptEditor } from "@/components/script-editor"
import { ChatPanel } from "@/components/chat-panel"
import { Toolbar } from "@/components/toolbar"
import { CollaborationDialog } from "@/components/collaboration-dialog"
import { ProjectSelector } from "@/components/project-selector"
import { CommandPalette } from "@/components/command-palette"
import { ChatManagementDialog } from "@/components/chat-management-dialog"
import { AuthScreen } from "@/components/auth-screen"
import { GlobalMessageBanner } from "@/components/global-message-banner"
import { RateLimitBanner } from "@/components/rate-limit-banner"
import { AdminPanel } from "@/components/admin-panel"
import { AnimatedMessage } from "@/components/animated-message"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Sparkles } from "lucide-react"
import type { Project } from "@/lib/project-storage"
import { projectStorage } from "@/lib/project-storage"
import { authStorage, type User } from "@/lib/auth-storage"
import { secureStorage } from "@/lib/secure-storage"

const initialExplorerData = [
  {
    name: "Workspace",
    type: "service" as const,
    path: "game.Workspace",
    children: [],
  },
  {
    name: "Players",
    type: "service" as const,
    path: "game.Players",
    children: [],
  },
  {
    name: "ReplicatedStorage",
    type: "service" as const,
    path: "game.ReplicatedStorage",
    children: [],
  },
  {
    name: "ServerScriptService",
    type: "service" as const,
    path: "game.ServerScriptService",
    children: [],
  },
  {
    name: "ServerStorage",
    type: "service" as const,
    path: "game.ServerStorage",
    children: [],
  },
  {
    name: "StarterGui",
    type: "service" as const,
    path: "game.StarterGui",
    children: [],
  },
  {
    name: "StarterPack",
    type: "service" as const,
    path: "game.StarterPack",
    children: [],
  },
  {
    name: "StarterPlayer",
    type: "service" as const,
    path: "game.StarterPlayer",
    children: [
      {
        name: "StarterCharacterScripts",
        type: "folder" as const,
        path: "game.StarterPlayer.StarterCharacterScripts",
        children: [],
      },
      {
        name: "StarterPlayerScripts",
        type: "folder" as const,
        path: "game.StarterPlayer.StarterPlayerScripts",
        children: [],
      },
    ],
  },
  {
    name: "Lighting",
    type: "service" as const,
    path: "game.Lighting",
    children: [],
  },
  {
    name: "SoundService",
    type: "service" as const,
    path: "game.SoundService",
    children: [],
  },
]

export default function RobloxAIStudio() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [openScripts, setOpenScripts] = useState<any[]>([])
  const [activeScript, setActiveScript] = useState<string | null>(null)
  const [explorerData, setExplorerData] = useState<any[]>(initialExplorerData)
  const [showCollabDialog, setShowCollabDialog] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; content: string; type: string }>>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [showChatManagement, setShowChatManagement] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string>("")
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [animatedMessage, setAnimatedMessage] = useState<{
    message: string
    type: "owner" | "admin" | "global"
  } | null>(null)

  const isUpdatingProject = useRef(false)

  useEffect(() => {
    const user = authStorage.getCurrentUser()
    if (user) {
      // Check if user account still exists
      const userExists = secureStorage.getUserById(user.id)
      if (!userExists) {
        // User account was deleted
        authStorage.logout()
        setCurrentUser(null)
        setIsLoading(false)
        return
      }

      // Check if user's IP is banned
      const userIP = user.lastIp || localStorage.getItem("user_ip") || "unknown"
      if (secureStorage.isIPBanned(userIP)) {
        // User is banned, log them out
        authStorage.logout()
        setCurrentUser(null)
        setIsLoading(false)
        setAnimatedMessage({
          message: "Your account has been locked. Please contact support.",
          type: "global",
        })
        return
      }

      // User is valid, re-save to ensure persistence
      localStorage.setItem("roblox-ai-current-user", JSON.stringify(user))
      setCurrentUser(user)

      // Restore current project state if available
      const savedProjectId = localStorage.getItem("roblox-ai-current-project")
      if (savedProjectId) {
        const projects = projectStorage.getProjects(user.id)
        const currentProjectData = projects.find(p => p.id === savedProjectId)
        if (currentProjectData) {
          isUpdatingProject.current = true
          setCurrentProject(currentProjectData)
          setActiveThreadId(currentProjectData.activeThreadId || currentProjectData.chatThreads[0]?.id || "")
          setExplorerData(currentProjectData.explorerData.length > 0 ? currentProjectData.explorerData : initialExplorerData)
          setOpenScripts(currentProjectData.openScripts || [])

          const activeThread = currentProjectData.chatThreads.find(t => t.id === (currentProjectData.activeThreadId || currentProjectData.chatThreads[0]?.id))
          setChatMessages(activeThread?.messages || [])
          isUpdatingProject.current = false
        }
      }
    }
    setIsLoading(false)
  }, [])

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    authStorage.logout()
    setCurrentUser(null)
    setCurrentProject(null)
    setOpenScripts([])
    setActiveScript(null)
    setChatMessages([])
    setExplorerData(initialExplorerData)
    // Clear current project ID when logging out
    localStorage.removeItem("roblox-ai-current-project")
  }

  const handleProjectSelect = (project: Project) => {
    if (!project.chatThreads || project.chatThreads.length === 0) {
      const defaultThread = projectStorage.createChatThread(project.id, "Main Chat")
      project.chatThreads = [defaultThread]
      project.activeThreadId = defaultThread.id
    }
    isUpdatingProject.current = true
    setCurrentProject(project)
    setActiveThreadId(project.activeThreadId || project.chatThreads[0].id)
    setExplorerData(project.explorerData.length > 0 ? project.explorerData : initialExplorerData)
    setOpenScripts(project.openScripts || [])
    projectStorage.saveProject(project)
    // Save current project ID for persistence on refresh
    localStorage.setItem("roblox-ai-current-project", project.id)
    isUpdatingProject.current = false

    const activeThread = project.chatThreads.find((t) => t.id === (project.activeThreadId || project.chatThreads[0].id))
    setChatMessages(activeThread?.messages || [])
  }

  const handleExitProject = () => {
    setCurrentProject(null)
    setExplorerData(initialExplorerData)
    setOpenScripts([])
    setActiveScript(null)
    setChatMessages([])
    // Clear current project ID when exiting
    localStorage.removeItem("roblox-ai-current-project")
  }

  const handleItemSelect = (item: any) => {
    setSelectedItem(item)
  }

  const handleScriptOpen = (script: any) => {
    const exists = openScripts.find((s) => s.path === script.path)
    if (!exists) {
      setOpenScripts([...openScripts, script])
    }
    setActiveScript(script.path)
  }

  const handleScriptClose = (scriptPath: string) => {
    setOpenScripts(openScripts.filter((s) => s.path !== scriptPath))
    if (activeScript === scriptPath) {
      setActiveScript(openScripts.length > 1 ? openScripts[0].path : null)
    }
  }

  const handleScriptCreate = (script: any) => {
    handleScriptOpen(script)
  }

  const handleScriptUpdate = (scriptPath: string, newContent: string) => {
    setOpenScripts(openScripts.map((s) => (s.path === scriptPath ? { ...s, content: newContent } : s)))
  }

  const handleExplorerUpdate = (newData: any[]) => {
    setExplorerData(newData)
  }

  const handleCommand = (command: string) => {
    console.log("[v0] Command executed:", command)
  }

  const handleCreateThread = (name: string) => {
    if (!currentProject) return
    isUpdatingProject.current = true
    const newThread = projectStorage.createChatThread(currentProject.id, name)
    const updatedProject = {
      ...currentProject,
      chatThreads: [...currentProject.chatThreads, newThread],
      activeThreadId: newThread.id,
    }
    setCurrentProject(updatedProject)
    setActiveThreadId(newThread.id)
    setChatMessages([])
    projectStorage.saveProject(updatedProject)
    isUpdatingProject.current = false
    // Close the dialog after creating
    setShowChatManagement(false)
  }

  const handleSelectThread = (threadId: string) => {
    if (!currentProject) return
    isUpdatingProject.current = true
    const thread = currentProject.chatThreads.find((t) => t.id === threadId)
    if (thread) {
      setActiveThreadId(threadId)
      setChatMessages(thread.messages)
      const updatedProject = { ...currentProject, activeThreadId: threadId }
      setCurrentProject(updatedProject)
      projectStorage.saveProject(updatedProject)
    }
    isUpdatingProject.current = false
  }

  const handleRenameThread = (threadId: string, newName: string) => {
    if (!currentProject) return
    isUpdatingProject.current = true
    const updatedThreads = currentProject.chatThreads.map((thread) =>
      thread.id === threadId ? { ...thread, name: newName } : thread,
    )
    const updatedProject = { ...currentProject, chatThreads: updatedThreads }
    setCurrentProject(updatedProject)
    projectStorage.saveProject(updatedProject)
    isUpdatingProject.current = false
  }

  const handleDeleteThread = (threadId: string) => {
    if (!currentProject) return
    isUpdatingProject.current = true
    const updatedThreads = currentProject.chatThreads.filter((thread) => thread.id !== threadId)
    if (updatedThreads.length === 0) {
      const defaultThread = projectStorage.createChatThread(currentProject.id, "Main Chat")
      updatedThreads.push(defaultThread)
    }
    const newActiveThreadId = activeThreadId === threadId ? updatedThreads[0].id : activeThreadId
    const updatedProject = {
      ...currentProject,
      chatThreads: updatedThreads,
      activeThreadId: newActiveThreadId,
    }
    setCurrentProject(updatedProject)
    if (activeThreadId === threadId) {
      setActiveThreadId(newActiveThreadId)
      setChatMessages(updatedThreads[0].messages)
    }
    projectStorage.saveProject(updatedProject)
    isUpdatingProject.current = false
  }

  const handleOwnerClick = () => {
    setAnimatedMessage({
      message: "Hello Owner Noel welcome Back!",
      type: "owner",
    })
  }

  const handleAdminClick = () => {
    setAnimatedMessage({
      message: "Admin Panel Opening...",
      type: "admin",
    })
    setShowAdminPanel(true)
  }

  const handleGlobalMessage = (message: string) => {
    setAnimatedMessage({
      message: message,
      type: "global",
    })
  }

  useEffect(() => {
    if (currentProject && activeThreadId && !isUpdatingProject.current) {
      isUpdatingProject.current = true
      const updatedThreads = currentProject.chatThreads.map((thread) =>
        thread.id === activeThreadId ? { ...thread, messages: chatMessages, lastModified: Date.now() } : thread,
      )
      const updatedProject = {
        ...currentProject,
        chatThreads: updatedThreads,
        explorerData,
        openScripts,
        lastModified: Date.now(),
      }
      setCurrentProject(updatedProject)
      projectStorage.saveProject(updatedProject)
      isUpdatingProject.current = false
    }
  }, [chatMessages, activeThreadId, currentProject, explorerData, openScripts])

  useEffect(() => {
    if (currentProject && !isUpdatingProject.current) {
      isUpdatingProject.current = true
      const updatedProject = {
        ...currentProject,
        explorerData,
        openScripts,
        lastModified: Date.now(),
      }
      setCurrentProject(updatedProject)
      projectStorage.saveProject(updatedProject)
      isUpdatingProject.current = false
    }
  }, [explorerData, openScripts, currentProject])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007acc]" />
      </div>
    )
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (!currentProject) {
    return <ProjectSelector onProjectSelect={handleProjectSelect} currentUser={currentUser} onLogout={handleLogout} />
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      <GlobalMessageBanner isAdmin={currentUser.isAdmin} onMessage={handleGlobalMessage} />
      <RateLimitBanner userId={currentUser.id} />

      {animatedMessage && (
        <AnimatedMessage
          message={animatedMessage.message}
          type={animatedMessage.type}
          onClose={() => setAnimatedMessage(null)}
        />
      )}

      <header className="h-16 bg-gradient-to-r from-[#1a1a1a] via-[#252526] to-[#1a1a1a] border-b border-[#3e3e42] flex items-center px-6 gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#007acc]/5 via-transparent to-[#2ea043]/5 animate-pulse pointer-events-none" />
        <div className="flex items-center gap-3 relative z-20">
          <div className="w-12 h-12 bg-gradient-to-br from-[#007acc] via-[#005a9e] to-[#2ea043] rounded-xl flex items-center justify-center font-bold text-white shadow-lg transform transition-transform hover:scale-110 duration-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">{currentProject.name}</h1>
            <p className="text-xs text-[#858585] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-pulse" />
              Code: <span className="font-mono text-[#2ea043]">{currentProject.inviteCode}</span>
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 relative z-20">
          {currentUser.isAdmin && (
            <>
              <button
                type="button"
                onClick={handleOwnerClick}
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                className="h-9 px-4 text-xs font-medium text-[#f59e0b] hover:text-white hover:bg-[#f59e0b]/20 transition-all duration-200 hover:scale-105 border border-[#f59e0b]/30 rounded-md flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Owner
              </button>
              <div className="w-px h-6 bg-[#3e3e42]" />
            </>
          )}
          <Toolbar
            onInviteClick={() => setShowCollabDialog(true)}
            onCommandsClick={() => setShowCommandPalette(true)}
            onQuickActionsClick={() => console.log("[v0] Quick actions clicked")}
            onExitClick={handleExitProject}
            onChatsClick={() => setShowChatManagement(true)}
            onAdminClick={handleAdminClick}
            onLogoutClick={handleLogout}
            isAdmin={currentUser.isAdmin}
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={18} minSize={12} maxSize={25}>
            <ExplorerPanel
              onItemSelect={handleItemSelect}
              onScriptOpen={handleScriptOpen}
              explorerData={explorerData}
              onExplorerUpdate={handleExplorerUpdate}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-[#3e3e42] hover:bg-[#007acc] transition-all duration-300" />

          <ResizablePanel defaultSize={47} minSize={30}>
            <div className="h-full flex flex-col bg-[#1e1e1e]">
              {openScripts.length > 0 ? (
                <>
                  <Tabs value={activeScript || ""} onValueChange={setActiveScript} className="flex-1 flex flex-col">
                    <TabsList className="w-full justify-start rounded-none bg-[#2d2d30] border-b border-[#3e3e42] h-11 p-0">
                      {openScripts.map((script) => (
                        <TabsTrigger
                          key={script.path}
                          value={script.path}
                          className="rounded-none border-r border-[#3e3e42] data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t-2 data-[state=active]:border-t-[#007acc] relative group px-4 text-[#cccccc] data-[state=active]:text-white transition-all duration-200 cursor-pointer"
                        >
                          <span className="text-sm">{script.name}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              handleScriptClose(script.path)
                            }}
                            className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-[#3e3e42] rounded px-1 transition-all duration-200 cursor-pointer"
                          >
                            ×
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {openScripts.map((script) => (
                      <TabsContent key={script.path} value={script.path} className="flex-1 m-0">
                        <ScriptEditor script={script} onContentChange={handleScriptUpdate} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#858585]">
                  <div className="text-center space-y-4 animate-in fade-in duration-500">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#007acc]/20 to-[#2ea043]/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-[#007acc]" />
                    </div>
                    <div>
                      <p className="text-lg mb-2 font-medium">No scripts open</p>
                      <p className="text-sm">Select a script from the Explorer or ask the AI to create one</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-[#3e3e42] hover:bg-[#007acc] transition-all duration-300" />

          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <ChatPanel
              onScriptCreate={handleScriptCreate}
              onExplorerUpdate={handleExplorerUpdate}
              explorerData={explorerData}
              uploadedFiles={uploadedFiles}
              initialMessages={chatMessages}
              onMessagesChange={setChatMessages}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <CollaborationDialog
        open={showCollabDialog}
        onOpenChange={setShowCollabDialog}
        inviteCode={currentProject.inviteCode}
      />

      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} onCommand={handleCommand} />

      <ChatManagementDialog
        open={showChatManagement}
        onOpenChange={setShowChatManagement}
        chatThreads={currentProject.chatThreads}
        activeThreadId={activeThreadId}
        onCreateThread={handleCreateThread}
        onSelectThread={handleSelectThread}
        onRenameThread={handleRenameThread}
        onDeleteThread={handleDeleteThread}
      />

      <AdminPanel open={showAdminPanel} onOpenChange={setShowAdminPanel} currentUser={currentUser} />
    </div>
  )
}
