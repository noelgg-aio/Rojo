"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sparkles, Newspaper, ChevronRight, Trash2, Plus } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { authStorage, type User } from "@/lib/auth-storage"

interface AuthScreenProps {
  onAuthenticated: (user: any) => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("") // Added nickname field
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [showNews, setShowNews] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [changelogs, setChangelogs] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddChangelog, setShowAddChangelog] = useState(false)
  const [newVersion, setNewVersion] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")

  useEffect(() => {
    loadChangelogs()
  }, [])

  const loadChangelogs = async () => {
    // For now, we'll keep using secureStorage for changelogs until we migrate that too
    const { secureStorage } = await import("@/lib/secure-storage")
    const logs = secureStorage.getAllChangelogs()
    setChangelogs(logs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!isLogin && (!username || !nickname)) {
      // Require nickname for signup
      setError("Please enter both username and nickname")
      setIsLoading(false)
      return
    }

    try {
      if (isLogin) {
        const result = await authStorage.login(email, password)
        if (result.success && result.user) {
          setIsAdmin(result.user.isAdmin)
          if (result.user.isAdmin) {
            alert("Hello Owner Noel! Welcome back to your Roblox AI Studio.")
          }
          onAuthenticated(result.user)
        } else {
          setError(result.error || "Login failed")
        }
      } else {
        const result = await authStorage.signup(email, username, nickname, password)
        if (result.success && result.user) {
          alert("Account created successfully! You can now sign in.")
          setIsLogin(true)
          setPassword("")
          setConfirmPassword("")
          setNickname("")
        } else {
          setError(result.error || "Registration failed")
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddChangelog = async () => {
    if (!newVersion || !newTitle || !newDescription) return

    const currentUser = await authStorage.getCurrentUser()
    if (!currentUser) return

    const { secureStorage } = await import("@/lib/secure-storage")
    secureStorage.addChangelog(newVersion, newTitle, newDescription, currentUser.id)
    await loadChangelogs()
    setNewVersion("")
    setNewTitle("")
    setNewDescription("")
    setShowAddChangelog(false)
  }

  const handleDeleteChangelog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this changelog?")) return
    const { secureStorage } = await import("@/lib/secure-storage")
    secureStorage.deleteChangelog(id)
    await loadChangelogs()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#252526] to-[#1e1e1e] flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div className="absolute top-8 right-8 z-10">
        <Button
          onClick={() => setShowNews(true)}
          variant="outline"
          className="border-[#007acc] text-[#007acc] hover:bg-[#007acc] hover:text-white transition-all duration-300"
        >
          <Newspaper className="w-4 h-4 mr-2" />
          News & Updates
        </Button>
      </div>

      <Card className="w-full max-w-md bg-[#2d2d30] border-[#3e3e42] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#007acc] to-[#2ea043] rounded-2xl mb-4 shadow-2xl animate-in zoom-in duration-700">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-[#007acc] to-[#2ea043] bg-clip-text text-transparent">
            Roblox AI Studio
          </h1>
          <p className="text-[#858585]">
            {isLogin ? "Welcome back! Sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[#cccccc] mb-2 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc] transition-all"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-sm text-[#cccccc] mb-2 block">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc] transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-[#cccccc] mb-2 block">Nickname (AI will call you this)</label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your preferred name"
                  className="bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc] transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm text-[#cccccc] mb-2 block">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc] transition-all"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-sm text-[#cccccc] mb-2 block">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="bg-[#3c3c3c] border-[#3e3e42] text-white focus:border-[#007acc] transition-all"
              />
            </div>
          )}

          {error && (
            <div className="bg-[#f48771]/10 border border-[#f48771] text-[#f48771] px-4 py-2 rounded text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#007acc] to-[#005a9e] hover:from-[#005a9e] hover:to-[#004578] text-white h-11 transition-all duration-300 hover:scale-105"
          >
            {isLoading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
              setPassword("")
              setConfirmPassword("")
              setNickname("") // Reset nickname on toggle
            }}
            className="text-[#007acc] hover:text-[#2ea043] transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>

      <Dialog open={showNews} onOpenChange={setShowNews}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-[#007acc]" />
                News & Changelogs
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowAddChangelog(true)} className="bg-[#2ea043] hover:bg-[#238636]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </DialogTitle>
            <DialogDescription className="text-[#858585]">
              Stay updated with the latest features and improvements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {changelogs.map((log, idx) => (
              <div
                key={log.id}
                className="border border-[#3e3e42] rounded-lg p-4 bg-[#2d2d30] animate-in fade-in slide-in-from-bottom-2 relative group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteChangelog(log.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-[#f48771]/20"
                  >
                    <Trash2 className="w-4 h-4 text-[#f48771]" />
                  </Button>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#007acc]">{log.version}</h3>
                  <span className="text-sm text-[#858585]">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-medium text-white mb-2">{log.title}</h4>
                <p className="text-sm text-[#cccccc] whitespace-pre-wrap">{log.description}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddChangelog} onOpenChange={setShowAddChangelog}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle>Add New Changelog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-[#cccccc] mb-2 block">Version</label>
              <Input
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="v1.3.0"
                className="bg-[#3c3c3c] border-[#3e3e42] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-[#cccccc] mb-2 block">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New Features and Improvements"
                className="bg-[#3c3c3c] border-[#3e3e42] text-white"
              />
            </div>
            <div>
              <label className="text-sm text-[#cccccc] mb-2 block">Description</label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="List of changes..."
                className="bg-[#3c3c3c] border-[#3e3e42] text-white min-h-[120px]"
              />
            </div>
            <Button
              onClick={handleAddChangelog}
              disabled={!newVersion || !newTitle || !newDescription}
              className="w-full bg-[#2ea043] hover:bg-[#238636]"
            >
              Add Changelog
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
