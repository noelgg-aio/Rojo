"use client"

import { useState } from "react"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileCode,
  Zap,
  Box,
  Settings,
  Plus,
  Search,
  FolderPlus,
  FilePlus,
  Trash2,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ExplorerItem {
  name: string
  type:
    | "service"
    | "folder"
    | "script"
    | "localscript"
    | "modulescript"
    | "remoteevent"
    | "remotefunction"
    | "part"
    | "model"
  children?: ExplorerItem[]
  path: string
  icon?: any
  content?: string
}

interface ExplorerPanelProps {
  onItemSelect: (item: ExplorerItem) => void
  onScriptOpen: (script: any) => void
  explorerData: ExplorerItem[]
  onExplorerUpdate: (data: ExplorerItem[]) => void
}

export function ExplorerPanel({ onItemSelect, onScriptOpen, explorerData, onExplorerUpdate }: ExplorerPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["game.StarterPlayer"]))
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const getIcon = (item: ExplorerItem) => {
    if (item.icon) return item.icon

    switch (item.type) {
      case "service":
        return Settings
      case "folder":
        return Folder
      case "script":
      case "localscript":
      case "modulescript":
        return FileCode
      case "remoteevent":
      case "remotefunction":
        return Zap
      default:
        return Box
    }
  }

  const handleItemClick = (item: ExplorerItem) => {
    setSelectedPath(item.path)
    onItemSelect(item)
    if (item.type === "script" || item.type === "localscript" || item.type === "modulescript") {
      onScriptOpen({
        name: item.name,
        path: item.path,
        type: item.type,
        content: item.content || `-- ${item.name}\n-- Path: ${item.path}\n\nprint("Hello from ${item.name}")\n`,
      })
    }
  }

  const addItemToParent = (parentPath: string | null, itemType: "folder" | "script", itemName: string) => {
    const newItem: ExplorerItem = {
      name: itemName,
      type: itemType,
      path: parentPath ? `${parentPath}.${itemName}` : `game.${itemName}`,
      ...(itemType === "folder" ? { children: [] } : {}),
      ...(itemType === "script"
        ? {
            content: `-- ${itemName}\n-- Path: ${parentPath ? `${parentPath}.${itemName}` : `game.${itemName}`}\n\nprint("Hello from ${itemName}")`,
          }
        : {}),
    }

    if (!parentPath) {
      onExplorerUpdate([...explorerData, newItem])
    } else {
      const addToChildren = (items: ExplorerItem[]): ExplorerItem[] => {
        return items.map((item) => {
          if (item.path === parentPath) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            }
          }
          if (item.children) {
            return {
              ...item,
              children: addToChildren(item.children),
            }
          }
          return item
        })
      }
      onExplorerUpdate(addToChildren(explorerData))
      setExpandedItems(new Set([...expandedItems, parentPath]))
    }

    if (itemType === "script") {
      onScriptOpen({
        name: newItem.name,
        path: newItem.path,
        type: newItem.type,
        content: newItem.content,
      })
    }
  }

  const handleAddFolder = (parentPath: string | null = null) => {
    const folderName = prompt("Enter folder name:")
    if (!folderName) return
    addItemToParent(parentPath, "folder", folderName)
  }

  const handleAddScript = (parentPath: string | null = null) => {
    const scriptName = prompt("Enter script name:")
    if (!scriptName) return
    addItemToParent(parentPath, "script", scriptName)
  }

  const handleDelete = (itemPath: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    const deleteFromChildren = (items: ExplorerItem[]): ExplorerItem[] => {
      return items
        .filter((item) => item.path !== itemPath)
        .map((item) => {
          if (item.children) {
            return {
              ...item,
              children: deleteFromChildren(item.children),
            }
          }
          return item
        })
    }

    onExplorerUpdate(deleteFromChildren(explorerData))
  }

  const renderItem = (item: ExplorerItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.path)
    const isSelected = selectedPath === item.path
    const Icon = getIcon(item)
    const canHaveChildren = item.type === "service" || item.type === "folder"
    const isService = item.type === "service"
    const canBeDeleted = item.type !== "service"

    return (
      <div key={item.path}>
        <div
          className={`explorer-item flex items-center gap-1 px-2 py-1 cursor-pointer text-sm hover:bg-muted/50 transition-colors group ${
            isSelected ? "bg-[#37373d]" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleItemClick(item)}
        >
          {(hasChildren || canHaveChildren) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(item.path)
              }}
              className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded transition-all"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 transition-transform" />
              ) : (
                <ChevronRight className="w-3 h-3 transition-transform" />
              )}
            </button>
          )}
          {!hasChildren && !canHaveChildren && <div className="w-4" />}
          <Icon className="w-4 h-4 text-primary" />
          <span className="flex-1">{item.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            {canHaveChildren && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-[#cccccc] hover:text-white hover:bg-[#3e3e42]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#2d2d30] border-[#3e3e42] text-white">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddFolder(item.path)
                    }}
                    className="hover:bg-[#3e3e42] cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddScript(item.path)
                    }}
                    className="hover:bg-[#3e3e42] cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4 mr-2" />
                    Add Script
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canBeDeleted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-[#cccccc] hover:text-red-500 hover:bg-[#3e3e42]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(item.path)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        {(hasChildren || canHaveChildren) && isExpanded && (
          <div>{item.children && item.children.map((child) => renderItem(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedItems(newExpanded)
  }

  const filterItems = (items: ExplorerItem[], query: string): ExplorerItem[] => {
    if (!query) return items
    return items
      .map((item) => {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
        const filteredChildren = item.children ? filterItems(item.children, query) : []
        if (matchesQuery || filteredChildren.length > 0) {
          return { ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children }
        }
        return null
      })
      .filter((item): item is ExplorerItem => item !== null)
  }

  const filteredData = filterItems(explorerData, searchQuery)

  return (
    <div className="h-full flex flex-col bg-[#252526] border-r border-[#3e3e42]">
      <div className="border-b border-[#3e3e42] bg-[#2d2d30]">
        <div className="h-10 flex items-center px-3 justify-between">
          <h2 className="font-semibold text-sm text-white">Explorer</h2>
        </div>
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#858585]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-7 pl-7 text-xs bg-[#3c3c3c] border-[#3e3e42] text-white placeholder:text-[#858585]"
            />
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">{filteredData.map((item) => renderItem(item))}</div>
      </ScrollArea>
    </div>
  )
}
