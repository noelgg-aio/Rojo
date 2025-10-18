"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, Brain, Loader2, Copy, Check, CheckCircle2, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: {
    steps: string[]
    duration: number
    isThinking: boolean
  }
  creationStatus?: {
    isCreating: boolean
    created: boolean
    items: string[]
  }
}

interface ChatPanelProps {
  onScriptCreate: (script: any) => void
  onExplorerUpdate: (data: any[]) => void
  explorerData: any[]
  uploadedFiles: Array<{ name: string; content: string; type: string }>
  initialMessages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
}

export function ChatPanel({
  onScriptCreate,
  onExplorerUpdate,
  explorerData,
  uploadedFiles,
  initialMessages,
  onMessagesChange,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: "1",
            role: "assistant",
            content:
              "Hello! I'm Rojo, your Roblox developer assistant. I can create scripts, RemoteEvents, and any Roblox objects you need. Just tell me what you want to build!\n\nTip: Use @ to mention files in your message!\n\nTry asking me:\n• Create a player join script\n• Make a coin collection system\n• Build a teleport pad\n• Create a RemoteEvent for player data",
          },
        ],
  )
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages)
    }
  }, [messages, onMessagesChange])

  const getAllFiles = (data: any[]): any[] => {
    let files: any[] = []
    data.forEach((item) => {
      if (item.type === "script") {
        files.push(item)
      }
      if (item.children) {
        files = [...files, ...getAllFiles(item.children)]
      }
    })
    return files
  }

  const allFiles = getAllFiles(explorerData)

  const handleInputChange = (value: string) => {
    setInput(value)
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true)
      setMentionSearch("")
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.slice(lastAtIndex + 1)
      if (!searchTerm.includes(" ")) {
        setShowMentions(true)
        setMentionSearch(searchTerm)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (file: any) => {
    const lastAtIndex = input.lastIndexOf("@")
    const newInput = input.slice(0, lastAtIndex) + `@${file.name} `
    setInput(newInput)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const filteredFiles = allFiles.filter((file) => file.name.toLowerCase().includes(mentionSearch.toLowerCase()))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const addItemToExplorer = (operation: any) => {
    const newExplorerData = [...explorerData]

    if (operation.action === "create") {
      const locationParts = operation.location.split(".")
      let currentLevel: any = newExplorerData

      for (let i = 0; i < locationParts.length; i++) {
        const part = locationParts[i]
        let found = currentLevel.find((item: any) => item.name === part)

        if (!found) {
          found = {
            name: part,
            type: i === 0 ? "service" : "folder",
            path: `game.${locationParts.slice(0, i + 1).join(".")}`,
            children: [],
          }
          currentLevel.push(found)
        }

        if (i < locationParts.length - 1) {
          if (!found.children) found.children = []
          currentLevel = found.children
        } else {
          if (!found.children) found.children = []

          const newItem: any = {
            name: operation.name,
            type: operation.itemType === "folder" ? "folder" : "script",
            path: `${found.path}.${operation.name}`,
          }

          if (operation.itemType === "folder") {
            newItem.children = []
          } else {
            newItem.content = operation.code || `-- ${operation.name}\nprint("Hello from ${operation.name}")`
          }

          const existingIndex = found.children.findIndex((child: any) => child.name === operation.name)
          if (existingIndex >= 0) {
            found.children[existingIndex] = newItem
          } else {
            found.children.push(newItem)
          }

          if (operation.itemType === "script") {
            onScriptCreate(newItem)
          }
        }
      }
    } else if (operation.action === "delete") {
      const deleteFromTree = (items: any[]): any[] => {
        return items
          .filter((item) => item.path !== operation.path)
          .map((item) => {
            if (item.children) {
              return {
                ...item,
                children: deleteFromTree(item.children),
              }
            }
            return item
          })
      }
      onExplorerUpdate(deleteFromTree(newExplorerData))
      return
    }

    onExplorerUpdate(newExplorerData)
  }

  const parseAIResponse = (response: string) => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*"type":\s*"file_operations"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.type === "file_operations" && parsed.operations) {
          return parsed
        }
      }
      const oldJsonMatch = response.match(/\{[\s\S]*"type":\s*"script_creation"[\s\S]*\}/)
      if (oldJsonMatch) {
        const parsed = JSON.parse(oldJsonMatch[0])
        if (parsed.type === "script_creation" && parsed.scripts) {
          return {
            type: "file_operations",
            operations: parsed.scripts.map((s: any) => ({
              action: "create",
              itemType: "script",
              name: s.name,
              location: s.location,
              code: s.code,
            })),
            explanation: parsed.explanation,
          }
        }
      }
    } catch (e) {
      // Not JSON, return as regular response
    }
    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsProcessing(true)

    const thinkingMessageId = (Date.now() + 1).toString()
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      role: "assistant",
      content: "",
      thinking: {
        steps: [],
        duration: 0,
        isThinking: true,
      },
    }

    setMessages((prev) => [...prev, thinkingMessage])

    const startTime = Date.now()

    try {
      const filesContext =
        uploadedFiles.length > 0
          ? `\n\nUploaded Files Context:\n${uploadedFiles.map((f) => `- ${f.name} (${f.type}): ${f.content.slice(0, 500)}...`).join("\n")}`
          : ""

      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput + filesContext,
          conversationHistory,
        }),
      })

      if (!response.ok) throw new Error("Failed to get AI response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""
      let thinkingSteps: string[] = []
      let inThinkingSection = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                const content = data.content || ""
                fullResponse += content

                if (fullResponse.includes("THINKING:") && !inThinkingSection) {
                  inThinkingSection = true
                }

                if (inThinkingSection && !fullResponse.includes("ANSWER:")) {
                  const thinkingMatch = fullResponse.match(/THINKING:([\s\S]*?)(?=ANSWER:|$)/)
                  if (thinkingMatch) {
                    const thinkingText = thinkingMatch[1]
                    const steps = thinkingText
                      .split("\n")
                      .map((s) => s.trim())
                      .filter((s) => s.startsWith("-"))
                      .map((s) => s.slice(1).trim())

                    if (steps.length > thinkingSteps.length) {
                      thinkingSteps = steps
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === thinkingMessageId
                            ? {
                                ...msg,
                                thinking: {
                                  ...msg.thinking!,
                                  steps: thinkingSteps,
                                },
                              }
                            : msg,
                        ),
                      )
                    }
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      const duration = Date.now() - startTime

      const answerMatch = fullResponse.match(/ANSWER:([\s\S]*)/)
      const answer = answerMatch ? answerMatch[1].trim() : fullResponse

      const parsed = parseAIResponse(answer)

      if (parsed && parsed.operations) {
        const itemNames = parsed.operations
          .filter((op: any) => op.action === "create")
          .map((op: any) => `${op.itemType === "folder" ? "📁" : "📄"} ${op.name}`)

        const deletedItems = parsed.operations
          .filter((op: any) => op.action === "delete")
          .map((op: any) => `🗑️ ${op.path.split(".").pop()}`)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === thinkingMessageId
              ? {
                  ...msg,
                  content: "",
                  thinking: {
                    ...msg.thinking!,
                    duration,
                    isThinking: false,
                  },
                  creationStatus: {
                    isCreating: true,
                    created: false,
                    items: [...itemNames, ...deletedItems],
                  },
                }
              : msg,
          ),
        )

        await new Promise((resolve) => setTimeout(resolve, 800))

        parsed.operations.forEach((operation: any) => {
          addItemToExplorer(operation)
        })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === thinkingMessageId
              ? {
                  ...msg,
                  content: parsed.explanation || "Operations completed successfully!",
                  creationStatus: {
                    isCreating: false,
                    created: true,
                    items: [...itemNames, ...deletedItems],
                  },
                }
              : msg,
          ),
        )
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === thinkingMessageId
              ? {
                  ...msg,
                  content: answer,
                  thinking: {
                    ...msg.thinking!,
                    duration,
                    isThinking: false,
                  },
                }
              : msg,
          ),
        )
      }
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const duration = Date.now() - startTime
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingMessageId
            ? {
                ...msg,
                content: "Sorry, I encountered an error. Please try again.",
                thinking: {
                  ...msg.thinking!,
                  duration,
                  isThinking: false,
                },
              }
            : msg,
        ),
      )
    }

    setIsProcessing(false)
  }

  return (
    <div className="h-full flex flex-col bg-[#252526] border-l border-[#3e3e42]">
      <div className="h-14 border-b border-[#3e3e42] flex items-center px-4 gap-2 bg-gradient-to-r from-[#2d2d30] to-[#252526]">
        <Sparkles className="w-5 h-5 text-[#007acc] animate-pulse" />
        <h2 className="font-semibold text-sm text-white">Rojo</h2>
        {uploadedFiles.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#2ea043] bg-[#1a472a] px-2 py-1 rounded-full">
            <FileText className="w-3 h-3" />
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} uploaded
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] ${message.role === "user" ? "" : "w-full"}`}>
                {message.thinking && (
                  <Card className="mb-3 p-4 bg-[#094771] border-[#007acc] shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <Brain
                        className={`w-5 h-5 text-[#007acc] mt-0.5 flex-shrink-0 ${message.thinking.isThinking ? "animate-pulse" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#007acc] mb-2 flex items-center gap-2">
                          {message.thinking.isThinking ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Thinking...
                            </>
                          ) : (
                            "Thought Process"
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {message.thinking.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className="text-sm text-[#cccccc] flex items-start gap-2 animate-in fade-in slide-in-from-left-1 duration-200"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <span className="text-[#007acc] font-mono text-xs mt-0.5">•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                        {!message.thinking.isThinking && (
                          <div className="text-xs text-[#858585] mt-3 pt-2 border-t border-[#3e3e42]">
                            ⚡ Completed in {(message.thinking.duration / 1000).toFixed(2)}s
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {message.creationStatus && (
                  <Card className="mb-3 p-4 bg-[#1a472a] border-[#2ea043] shadow-lg animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-start gap-3">
                      {message.creationStatus.isCreating ? (
                        <Loader2 className="w-5 h-5 text-[#2ea043] animate-spin flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-[#2ea043] flex-shrink-0 animate-in zoom-in-50 duration-300" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#2ea043] mb-2">
                          {message.creationStatus.isCreating ? "Creating..." : "Successfully Created!"}
                        </div>
                        <div className="space-y-1">
                          {message.creationStatus.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-[#cccccc] flex items-center gap-2">
                              {message.creationStatus.created && (
                                <Check className="w-3 h-3 text-[#2ea043] animate-in zoom-in-50 duration-200" />
                              )}
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {message.content && (
                  <div
                    className={`rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      message.role === "user"
                        ? "bg-[#007acc] text-white shadow-md"
                        : "bg-[#2d2d30] text-[#d4d4d4] border border-[#3e3e42]"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content, message.id)}
                        className="mt-2 h-7 text-xs text-[#858585] hover:text-white hover:bg-[#3e3e42]"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[#3e3e42] bg-[#2d2d30] relative">
        {showMentions && filteredFiles.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#2d2d30] border border-[#007acc] rounded-lg shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleMentionSelect(file)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#094771] transition-colors text-left border-b border-[#3e3e42] last:border-b-0"
              >
                <FileText className="w-4 h-4 text-[#007acc]" />
                <span className="text-sm text-white font-medium">{file.name}</span>
                <span className="text-xs text-[#858585] ml-auto">{file.path.split(".").slice(-2, -1)[0]}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !showMentions) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask me to create scripts... Use @ to mention files (Shift+Enter for new line)"
            disabled={isProcessing}
            className="flex-1 min-h-[60px] max-h-[200px] bg-[#3c3c3c] border-[#3e3e42] text-white placeholder:text-[#858585] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            size="lg"
            className="h-[60px] w-[60px] bg-[#007acc] hover:bg-[#005a9e] text-white shadow-lg"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        <p className="text-xs text-[#858585] mt-2 text-center">Use @ to mention files • Ctrl+K for commands</p>
      </div>
    </div>
  )
}
