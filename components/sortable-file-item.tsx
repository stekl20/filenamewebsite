"use client"

import type React from "react"

import { useState, useEffect, type KeyboardEvent } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, X, Check, Pencil, FileType, Loader2 } from "lucide-react"
import type { FileWithPreview } from "./file-renamer"

interface SortableFileItemProps {
  file: FileWithPreview
  onRemove: () => void
  onUpdateTitle: (id: string, newTitle: string) => void
  onUpdateFileName: (id: string, newFileName: string) => void
  onConvertFile?: (id: string) => void
  canConvertFile?: (file: File) => boolean
}

export function SortableFileItem({
  file,
  onRemove,
  onUpdateTitle,
  onUpdateFileName,
  onConvertFile,
  canConvertFile,
}: SortableFileItemProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingFileName, setEditingFileName] = useState(false)
  const [titleValue, setTitleValue] = useState(file.customTitle || file.originalTitle || "")
  const [fileNameValue, setFileNameValue] = useState(file.newName)
  const [imageError, setImageError] = useState(false)

  // Update the filename value when the file's newName changes
  useEffect(() => {
    setFileNameValue(file.newName)
  }, [file.newName])

  // Update the title value when the file's customTitle or originalTitle changes
  useEffect(() => {
    setTitleValue(file.customTitle || file.originalTitle || "")
  }, [file.customTitle, file.originalTitle])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  const isImage = file.file.type.startsWith("image/")
  const fileSize = formatFileSize(file.file.size)

  // Determine the final extension after potential conversion
  const extension = file.file.name.split(".").pop()?.toLowerCase() || ""
  const displayName = file.customFileName || file.newName

  // Determine if file can be converted
  const canBeConverted = canConvertFile ? canConvertFile(file.file) && typeof window !== "undefined" : false

  // Determine conversion target format
  const getConversionTarget = () => {
    if (file.file.type === "image/png") return "JPG"
    if (file.file.type.startsWith("audio/") || file.file.name.toLowerCase().endsWith(".m4a")) return "WAV"
    return ""
  }

  const handleTitleSave = () => {
    onUpdateTitle(file.id, titleValue.toUpperCase())
    setEditingTitle(false)
  }

  const handleFileNameSave = () => {
    onUpdateFileName(file.id, fileNameValue)
    setEditingFileName(false)
  }

  const handleTitleCancel = () => {
    setTitleValue(file.customTitle || file.originalTitle || "")
    setEditingTitle(false)
  }

  const handleFileNameCancel = () => {
    setFileNameValue(file.customFileName || file.newName)
    setEditingFileName(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-capitalize the input
    setTitleValue(e.target.value.toUpperCase())
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === "Escape") {
      handleTitleCancel()
    }
  }

  const handleFileNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleFileNameSave()
    } else if (e.key === "Escape") {
      handleFileNameCancel()
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleConvert = () => {
    if (onConvertFile) {
      onConvertFile(file.id)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="relative mb-3 group">
      <div
        className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
              {isImage && !imageError ? (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <img
                    src={file.preview || "/placeholder.svg"}
                    alt={file.file.name}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-xs font-medium uppercase">{extension}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-medium break-words">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">{fileSize}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onRemove}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>

              <div className="mt-1 space-y-2">
                {/* Title editing */}
                <div className="flex items-center gap-1">
                  {editingTitle ? (
                    <div className="flex items-center gap-1 w-full">
                      <Input
                        value={titleValue}
                        onChange={handleTitleChange}
                        onKeyDown={handleTitleKeyDown}
                        className="h-7 text-xs py-1"
                        autoFocus
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleTitleSave}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleTitleCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p
                        className="text-xs text-green-600 break-words pr-2 cursor-pointer hover:underline"
                        onClick={() => setEditingTitle(true)}
                      >
                        Title: {file.customTitle || file.originalTitle || "None"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                        onClick={() => setEditingTitle(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Filename preview/editing */}
                <div className="flex items-center gap-1">
                  {editingFileName ? (
                    <div className="flex items-center gap-1 w-full">
                      <Input
                        value={fileNameValue}
                        onChange={(e) => setFileNameValue(e.target.value)}
                        onKeyDown={handleFileNameKeyDown}
                        className="h-7 text-xs py-1"
                        autoFocus
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFileNameSave}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFileNameCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p
                        className="text-xs text-primary break-words pr-2 cursor-pointer hover:underline"
                        onClick={() => setEditingFileName(true)}
                      >
                        New: {displayName}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                        onClick={() => setEditingFileName(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Conversion options */}
                {canBeConverted && onConvertFile && (
                  <div className="flex items-center justify-between w-full">
                    {file.converting ? (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Converting...
                      </div>
                    ) : file.conversionError ? (
                      <p className="text-xs text-destructive break-words">Error: {file.conversionError}</p>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2 py-0" onClick={handleConvert}>
                        <FileType className="h-3 w-3 mr-1" />
                        Convert to {getConversionTarget()}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

