"use client"

import { useState, useEffect, useRef } from "react"

interface ScriptEditorProps {
  script: {
    name: string
    path: string
    type: string
    content: string
  }
  onContentChange?: (path: string, content: string) => void
}

export function ScriptEditor({ script, onContentChange }: ScriptEditorProps) {
  const [content, setContent] = useState(script.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(script.content)
  }, [script.content])

  const handleChange = (newContent: string) => {
    setContent(newContent)
    if (onContentChange) {
      onContentChange(script.path, newContent)
    }
  }

  const lines = content.split("\n")

  return (
    <div className="h-full flex bg-[#1e1e1e] overflow-hidden">
      <div className="bg-[#1e1e1e] border-r border-[#3e3e42] px-3 py-3 text-right select-none min-w-[50px] overflow-y-auto">
        {lines.map((_, index) => (
          <div key={index} className="text-xs text-[#858585] leading-6 font-mono">
            {index + 1}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-full min-h-full p-3 bg-transparent text-[#d4d4d4] code-editor resize-none focus:outline-none border-none"
          spellCheck={false}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            lineHeight: "1.6",
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
}
