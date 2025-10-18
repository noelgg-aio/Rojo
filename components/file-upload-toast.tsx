"use client"

import { CheckCircle2, FileText, ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FileUploadToastProps {
  fileName: string
  fileType: string
  onClose: () => void
}

export function FileUploadToast({ fileName, fileType, onClose }: FileUploadToastProps) {
  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-[#1a472a] border-[#2ea043] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#2ea043] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-[#2ea043] mb-1">File Uploaded Successfully!</div>
          <div className="flex items-center gap-2 text-sm text-[#cccccc]">
            {fileType.startsWith("image/") ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            <span className="truncate">{fileName}</span>
          </div>
          <p className="text-xs text-[#858585] mt-2">AI can now read and reference this file</p>
        </div>
        <button onClick={onClose} className="text-[#858585] hover:text-white transition-colors text-lg leading-none">
          ×
        </button>
      </div>
    </Card>
  )
}
