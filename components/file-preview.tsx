import type { FileWithPreview } from "./file-renamer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import Image from "next/image"

interface FilePreviewProps {
  file: FileWithPreview
  onRemove: () => void
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.file.type.startsWith("image/")
  const fileSize = formatFileSize(file.file.size)

  // Remove the conversion logic and update the display name generation
  const displayName = file.newName

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
            {isImage ? (
              <Image src={file.preview || "/placeholder.svg"} alt={file.file.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-xs font-medium uppercase">
                  {file.file.name.split(".").pop()?.toLowerCase() || ""}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">{fileSize}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>

            <div className="mt-1">
              <p className="text-xs text-primary truncate">New: {displayName}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

