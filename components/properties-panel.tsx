"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PropertiesPanelProps {
  selectedItem: any
}

export function PropertiesPanel({ selectedItem }: PropertiesPanelProps) {
  if (!selectedItem) {
    return (
      <div className="h-full flex flex-col bg-card border-l border-border">
        <div className="h-10 border-b border-border flex items-center px-3">
          <h2 className="font-semibold text-sm">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select an item to view properties
        </div>
      </div>
    )
  }

  const properties = [
    { name: "Name", value: selectedItem.name, type: "string" },
    { name: "ClassName", value: selectedItem.type, type: "string" },
    { name: "Parent", value: selectedItem.path.split(".").slice(0, -1).join("."), type: "string" },
  ]

  // Add type-specific properties
  if (selectedItem.type === "part") {
    properties.push(
      { name: "Position", value: "0, 0, 0", type: "vector3" },
      { name: "Size", value: "4, 1, 2", type: "vector3" },
      { name: "Color", value: "163, 162, 165", type: "color3" },
      { name: "Material", value: "Plastic", type: "enum" },
      { name: "Transparency", value: "0", type: "number" },
      { name: "CanCollide", value: "true", type: "boolean" },
      { name: "Anchored", value: "true", type: "boolean" },
    )
  }

  if (selectedItem.type === "script" || selectedItem.type === "localscript") {
    properties.push(
      { name: "Enabled", value: "true", type: "boolean" },
      { name: "RunContext", value: "Legacy", type: "enum" },
    )
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-10 border-b border-border flex items-center px-3">
        <h2 className="font-semibold text-sm">Properties</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {properties.map((prop, index) => (
            <div key={index} className="property-row space-y-1.5 p-2 rounded">
              <Label className="text-xs text-muted-foreground">{prop.name}</Label>
              <Input value={prop.value} readOnly className="h-7 text-xs bg-input border-border" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
