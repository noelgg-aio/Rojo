"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Folder, Trash2, Edit2, Clock, Users, LogOut } from "lucide-react"
import type { Project } from "@/lib/project-storage"
import { projectStorage } from "@/lib/project-storage"
import type { User } from "@/lib/auth-storage"

interface ProjectSelectorProps {
  onProjectSelect: (project: Project) => void
  currentUser: User
  onLogout: () => void
}

export function ProjectSelector({ onProjectSelect, currentUser, onLogout }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>(projectStorage.getProjects(currentUser.id))
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      explorerData: [],
      openScripts: [],
      inviteCode: projectStorage.generateInviteCode(),
      collaborators: [],
      chatThreads: [],
      activeThreadId: "",
      userId: currentUser.id,
    }

    projectStorage.saveProject(newProject)
    setProjects(projectStorage.getProjects(currentUser.id))
    setNewProjectName("")
    setShowCreateDialog(false)
    onProjectSelect(newProject)
  }

  const handleJoinProject = () => {
    if (!joinCode.trim()) return

    const project = projectStorage.getProjectByInviteCode(joinCode.toUpperCase())
    if (project) {
      if (!project.collaborators.includes(currentUser.id)) {
        project.collaborators.push(currentUser.id)
        projectStorage.saveProject(project)
      }
      onProjectSelect(project)
      setJoinCode("")
      setShowJoinDialog(false)
    } else {
      alert("Invalid invite code. Please check and try again.")
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      projectStorage.deleteProject(projectId)
      setProjects(projectStorage.getProjects(currentUser.id))
    }
  }

  const handleRenameProject = (projectId: string) => {
    if (!editName.trim()) return

    const project = projects.find((p) => p.id === projectId)
    if (project) {
      project.name = editName
      projectStorage.saveProject(project)
      setProjects(projectStorage.getProjects(currentUser.id))
      setEditingProject(null)
      setEditName("")
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#252526] to-[#1e1e1e] flex items-center justify-center p-8">
      <div className="absolute top-8 right-8">
        <Button
          onClick={onLogout}
          variant="outline"
          className="border-[#f48771] text-[#f48771] hover:bg-[#f48771] hover:text-white transition-all duration-300 bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="w-full max-w-5xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#007acc] to-[#2ea043] rounded-2xl mb-6 shadow-2xl">
            <Folder className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-[#007acc] to-[#2ea043] bg-clip-text text-transparent">
            Welcome back, {currentUser.username}!
          </h1>
          <p className="text-[#858585] text-lg">Select a project or create a new one to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="h-16 bg-gradient-to-r from-[#007acc] to-[#005a9e] hover:from-[#005a9e] hover:to-[#004578] text-white shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Project
          </Button>

          <Button
            onClick={() => setShowJoinDialog(true)}
            size="lg"
            variant="outline"
            className="h-16 border-2 border-[#007acc] text-[#007acc] hover:bg-[#007acc] hover:text-white shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Users className="w-5 h-5 mr-2" />
            Join with Invite Code
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {projects.map((project, idx) => (
              <Card
                key={project.id}
                className="bg-[#2d2d30] border-[#3e3e42] hover:border-[#007acc] transition-all duration-300 hover:scale-105 cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="p-6">
                  {editingProject === project.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameProject(project.id)
                          if (e.key === "Escape") {
                            setEditingProject(null)
                            setEditName("")
                          }
                        }}
                        className="bg-[#3c3c3c] border-[#007acc] text-white"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRenameProject(project.id)}
                          className="flex-1 bg-[#2ea043] hover:bg-[#238636]"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProject(null)
                            setEditName("")
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1" onClick={() => onProjectSelect(project)}>
                          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#007acc] transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#858585]">
                            <Clock className="w-3 h-3" />
                            {formatDate(project.lastModified)}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProject(project.id)
                              setEditName(project.name)
                            }}
                            className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                          >
                            <Edit2 className="w-4 h-4 text-[#007acc]" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProject(project.id)
                            }}
                            className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                          >
                            <Trash2 className="w-4 h-4 text-[#f48771]" />
                          </Button>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-[#3e3e42]">
                        <div className="text-xs text-[#858585] mb-1">Invite Code</div>
                        <code className="text-sm font-mono text-[#2ea043] bg-[#1a472a] px-2 py-1 rounded">
                          {project.inviteCode}
                        </code>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#2d2d30] border-[#3e3e42] p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <Folder className="w-16 h-16 text-[#858585] mx-auto mb-4" />
            <p className="text-[#858585] text-lg">No projects yet. Create your first project to get started!</p>
          </Card>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription className="text-[#858585]">
              Give your Roblox project a name to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              placeholder="My Awesome Game"
              className="bg-[#3c3c3c] border-[#3e3e42] text-white"
              autoFocus
            />
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="w-full bg-[#007acc] hover:bg-[#005a9e]"
            >
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle>Join Project</DialogTitle>
            <DialogDescription className="text-[#858585]">
              Enter the invite code shared by your teammate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinProject()}
              placeholder="ABC12345"
              className="bg-[#3c3c3c] border-[#3e3e42] text-white font-mono"
              autoFocus
            />
            <Button
              onClick={handleJoinProject}
              disabled={!joinCode.trim()}
              className="w-full bg-[#2ea043] hover:bg-[#238636]"
            >
              Join Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
