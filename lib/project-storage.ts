export interface ChatThread {
  id: string
  name: string
  messages: any[]
  createdAt: number
  lastModified: number
}

export interface Project {
  id: string
  name: string
  createdAt: number
  lastModified: number
  explorerData: any[]
  openScripts: any[]
  inviteCode: string
  collaborators: string[]
  chatThreads: ChatThread[]
  activeThreadId: string
  userId: string
}

export const projectStorage = {
  getProjects: (userId?: string): Project[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("roblox-ai-projects")
    const allProjects = stored ? JSON.parse(stored) : []
    return userId
      ? allProjects.filter((p: Project) => p.userId === userId || p.collaborators.includes(userId))
      : allProjects
  },

  saveProject: (project: Project) => {
    const projects = projectStorage.getProjects()
    const index = projects.findIndex((p) => p.id === project.id)
    if (index >= 0) {
      projects[index] = { ...project, lastModified: Date.now() }
    } else {
      projects.push(project)
    }
    localStorage.setItem("roblox-ai-projects", JSON.stringify(projects))
  },

  deleteProject: (projectId: string) => {
    const projects = projectStorage.getProjects().filter((p) => p.id !== projectId)
    localStorage.setItem("roblox-ai-projects", JSON.stringify(projects))
  },

  getProjectByInviteCode: (inviteCode: string): Project | null => {
    const projects = projectStorage.getProjects()
    return projects.find((p) => p.inviteCode === inviteCode) || null
  },

  generateInviteCode: (): string => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  },

  createChatThread: (projectId: string, name: string): ChatThread => {
    const thread: ChatThread = {
      id: Date.now().toString(),
      name,
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    }
    return thread
  },

  updateChatThread: (project: Project, threadId: string, messages: any[]) => {
    const updatedThreads = project.chatThreads.map((thread) =>
      thread.id === threadId ? { ...thread, messages, lastModified: Date.now() } : thread,
    )
    projectStorage.saveProject({ ...project, chatThreads: updatedThreads })
  },

  renameChatThread: (project: Project, threadId: string, newName: string) => {
    const updatedThreads = project.chatThreads.map((thread) =>
      thread.id === threadId ? { ...thread, name: newName, lastModified: Date.now() } : thread,
    )
    projectStorage.saveProject({ ...project, chatThreads: updatedThreads })
  },

  deleteChatThread: (project: Project, threadId: string) => {
    const updatedThreads = project.chatThreads.filter((thread) => thread.id !== threadId)
    const newActiveThreadId =
      project.activeThreadId === threadId && updatedThreads.length > 0 ? updatedThreads[0].id : project.activeThreadId
    projectStorage.saveProject({ ...project, chatThreads: updatedThreads, activeThreadId: newActiveThreadId })
  },
}
