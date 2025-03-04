"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import type { FileWithPreview } from "./file-renamer"
import { SortableFileItem } from "./sortable-file-item"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SortableFileListProps {
  files: FileWithPreview[]
  onRemoveFile: (index: number) => void
  onReorderFiles: (files: FileWithPreview[]) => void
  onUpdateTitle: (id: string, newTitle: string) => void
  onUpdateFileName: (id: string, newFileName: string) => void
  onConvertFile?: (id: string) => void
  canConvertFile?: (file: File) => boolean
}

export function SortableFileList({
  files,
  onRemoveFile,
  onReorderFiles,
  onUpdateTitle,
  onUpdateFileName,
  onConvertFile,
  canConvertFile,
}: SortableFileListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((file) => file.id === active.id)
      const newIndex = files.findIndex((file) => file.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFiles = [...files]
        const [movedFile] = newFiles.splice(oldIndex, 1)
        newFiles.splice(newIndex, 0, movedFile)
        onReorderFiles(newFiles)
      }
    }

    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <ScrollArea className="h-full rounded-md border pl-6">
        <div className="p-4 space-y-1">
          <SortableContext items={files.map((file) => file.id)} strategy={verticalListSortingStrategy}>
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(index)}
                onUpdateTitle={onUpdateTitle}
                onUpdateFileName={onUpdateFileName}
                onConvertFile={onConvertFile}
                canConvertFile={canConvertFile}
              />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </DndContext>
  )
}

