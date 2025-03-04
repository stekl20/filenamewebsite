"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import type { FileWithPreview } from "./file-renamer"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface FileUploaderProps {
  onFilesAdded: (files: FileWithPreview[]) => void
}

export function FileUploader({ onFilesAdded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const filesWithPreview = acceptedFiles.map((file) => {
        // Create preview URLs for images
        const isImage = file.type.startsWith("image/")

        // Create a preview URL for the file
        let preview = ""
        if (isImage) {
          preview = URL.createObjectURL(file)
        } else {
          preview = getFileIconByType(file.type)
        }

        console.log("Created preview URL:", preview, "for file:", file.name, "type:", file.type)

        // Create a unique ID for the file
        const id = `file-${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Extract title from filename
        const nameWithoutExtension = file.name.split(".").slice(0, -1).join(".")
        const extractedTitle = nameWithoutExtension
          .replace(/[_-]/g, " ")
          .replace(/^[0-9\W]+/, "")
          .replace(/\s*$$[^)]*$$/g, "") // Remove content in parentheses
          .replace(/\s*\[[^\]]*\]/g, "") // Remove content in brackets
          .replace(/\s*mix\s*/i, " ") // Remove the word "mix" (case insensitive)
          .trim()
          .toUpperCase()

        return {
          file,
          preview,
          newName: file.name.toUpperCase(), // Initial name is the same as original but capitalized
          id,
          originalTitle: extractedTitle,
        }
      })

      onFilesAdded(filesWithPreview)
    },
    [onFilesAdded],
  )

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Drag and drop files here</p>
          <p className="text-xs text-muted-foreground">or click the button below to select files</p>
        </div>
        <Button type="button" onClick={open} variant="secondary" size="sm">
          Select Files
        </Button>
      </div>
    </div>
  )
}

function getFileIconByType(mimeType: string): string {
  console.log("Getting icon for mime type:", mimeType)

  if (mimeType.startsWith("image/")) {
    return "/placeholder.svg?height=100&width=100"
  } else if (mimeType.startsWith("video/")) {
    return "/placeholder.svg?height=100&width=100"
  } else if (mimeType.startsWith("audio/")) {
    return "/placeholder.svg?height=100&width=100"
  } else {
    return "/placeholder.svg?height=100&width=100"
  }
}

