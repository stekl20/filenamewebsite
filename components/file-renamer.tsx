"use client"

import { useState, useEffect, useCallback } from "react"
import { FileUploader } from "./file-uploader"
import { SortableFileList } from "./sortable-file-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DownloadCloud, CalendarIcon, RefreshCw, Loader2, ExternalLink, RotateCcw, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
// Import our FFmpeg utility functions
import { canConvertFile, convertFile } from "@/lib/ffmpeg-utils"
import { FFmpegStatus } from "./ffmpeg-status"

// Maximum file size for conversion (50MB)
const MAX_CONVERSION_SIZE = 50 * 1024 * 1024 // 50MB in bytes

export interface FileWithPreview {
  file: File
  preview: string
  newName: string
  id: string
  originalTitle?: string
  customTitle?: string
  customFileName?: string
  converting?: boolean
  conversionError?: string
}

export function FileRenamer() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [artist, setArtist] = useState("")
  const [title, setTitle] = useState("")
  const [productionStage, setProductionStage] = useState("FINAL")
  const [entity, setEntity] = useState("PRAIRY")
  const [location, setLocation] = useState("")
  const [mediaType, setMediaType] = useState("audio")
  const [assetType, setAssetType] = useState("")
  const [creative1, setCreative1] = useState("")
  const [creative2, setCreative2] = useState("")
  const [uploader, setUploader] = useState("")
  const [includeDate, setIncludeDate] = useState(true)
  const [date, setDate] = useState<Date>(new Date())
  const [hasGeneratedFilenames, setHasGeneratedFilenames] = useState(false)
  const [isZipping, setIsZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [zipFileName, setZipFileName] = useState("renamed_files")
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [autoConvert, setAutoConvert] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false)
  const { toast } = useToast()

  // Detect Safari browser
  const [isSafari, setIsSafari] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  const locationOptions = [
    "ATLANTA",
    "AUSTIN",
    "BOSTON",
    "CALGARY",
    "CHICAGO",
    "DALLAS",
    "DENVER",
    "DETROIT",
    "HOUSTON",
    "LAS VEGAS",
    "LOS ANGELES",
    "MIAMI",
    "MINNEAPOLIS",
    "MONTREAL",
    "NASHVILLE",
    "NEW ORLEANS",
    "NEW YORK",
    "PHILADELPHIA",
    "PHOENIX",
    "PORTLAND",
    "SAN DIEGO",
    "SAN FRANCISCO",
    "SEATTLE",
    "ST. LOUIS",
    "TORONTO",
    "VANCOUVER",
    "WASHINGTON DC",
  ]

  useEffect(() => {
    // Check if browser is Safari
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    setIsSafari(isSafariBrowser)
  }, [])

  // Define asset type options based on media type (in alphabetical order)
  const assetTypeOptions = {
    audio: ["TRACK", "INSTRUMENTAL"],
    video: ["APPLE MOTION", "CONTENT", "LYRIC VIDEO", "MUSIC VIDEO", "SPOTIFY CANVAS", "TRAILER", "VISUALIZER"],
    image: ["COVER ART", "PRESS PHOTO"],
  }

  // Set default asset type when media type changes
  useEffect(() => {
    setAssetType(assetTypeOptions[mediaType as keyof typeof assetTypeOptions][0])
  }, [mediaType])

  // Handle file conversion for a specific file
  const handleConvertFile = async (fileId: string) => {
    // Find the file
    const fileIndex = files.findIndex((f) => f.id === fileId)
    if (fileIndex === -1) return

    const fileToConvert = files[fileIndex]

    // Check if file can be converted
    if (!canConvertFile(fileToConvert.file)) {
      toast({
        title: "Cannot Convert File",
        description: `File is too large (max ${MAX_CONVERSION_SIZE / (1024 * 1024)}MB) or not a supported format.`,
        variant: "destructive",
      })
      return
    }

    // Update file status to converting
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === fileId ? { ...f, converting: true, conversionError: undefined } : f)),
    )

    try {
      // Show toast for m4a files
      if (fileToConvert.file.name.toLowerCase().endsWith(".m4a")) {
        toast({
          title: "Converting M4A File",
          description: "M4A conversion may take longer. Please be patient.",
        })
      }

      // Convert the file
      let convertedFile = await convertFile(fileToConvert.file)
      console.log(`Conversion complete: ${fileToConvert.file.name} → ${convertedFile.name}`)

      // Verify the file extension was changed
      if (
        fileToConvert.file.name.toLowerCase().endsWith(".m4a") &&
        !convertedFile.name.toLowerCase().endsWith(".wav")
      ) {
        console.warn("Extension not properly changed, forcing .wav extension")
        const correctedName = convertedFile.name.replace(/\.[^/.]+$/, ".wav")
        const correctedFile = new File([convertedFile], correctedName, { type: "audio/wav" })
        convertedFile = correctedFile
      }

      // Create a preview URL for the converted file
      let preview = fileToConvert.preview
      if (convertedFile.type.startsWith("image/")) {
        // Revoke old preview URL if it's a blob
        if (fileToConvert.preview && fileToConvert.preview.startsWith("blob:")) {
          URL.revokeObjectURL(fileToConvert.preview)
        }
        preview = URL.createObjectURL(convertedFile)
      }

      // Update the file in the state
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                file: convertedFile,
                preview,
                newName: convertedFile.name.toUpperCase(),
                converting: false,
              }
            : f,
        ),
      )

      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${fileToConvert.file.name} to ${convertedFile.name}`,
      })
    } catch (error) {
      console.error("Conversion failed:", error)

      // Update file status to error
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                converting: false,
                conversionError: error instanceof Error ? error.message : "Unknown error",
              }
            : f,
        ),
      )

      // Provide more helpful error message for m4a files
      if (fileToConvert.file.name.toLowerCase().endsWith(".m4a")) {
        toast({
          title: "M4A Conversion Failed",
          description: "This M4A file couldn't be converted. Try a different format or use an external converter.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Conversion Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      }
    }
  }

  // Add a specific function to test PNG to JPG conversion
  const testPngToJpgConversion = async () => {
    // Find a PNG file
    const pngFile = files.find((f) => f.file.type === "image/png")

    if (!pngFile) {
      toast({
        title: "No PNG Files Found",
        description: "Upload a PNG file first to test the conversion.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Starting PNG Conversion",
        description: `Attempting to convert ${pngFile.file.name} to JPG...`,
      })

      console.log("Starting test conversion of PNG file:", pngFile.file.name)
      const { convertPngToJpg } = await import("@/lib/ffmpeg-utils")
      const convertedFile = await convertPngToJpg(pngFile.file)

      console.log("Conversion result:", convertedFile)

      // Update the file in the state
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === pngFile.id
            ? {
                ...f,
                file: convertedFile,
                preview: URL.createObjectURL(convertedFile),
                newName: convertedFile.name.toUpperCase(),
              }
            : f,
        ),
      )

      toast({
        title: "Conversion Successful",
        description: `Successfully converted ${pngFile.file.name} to ${convertedFile.name}`,
      })
    } catch (error) {
      console.error("PNG to JPG conversion test failed:", error)
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "Unknown error during PNG conversion",
        variant: "destructive",
      })
    }
  }

  // Add a new function to handle converting all eligible files
  const handleConvertAllFiles = async () => {
    // Find all files that can be converted
    const convertibleFiles = files.filter(
      (file) =>
        canConvertFile(file.file) &&
        !file.converting &&
        !file.file.name.toLowerCase().endsWith(".wav") &&
        !file.file.name.toLowerCase().endsWith(".jpg"),
    )

    if (convertibleFiles.length === 0) {
      toast({
        title: "No Files to Convert",
        description: "There are no eligible files that need conversion.",
      })
      return
    }

    setIsConverting(true)
    let convertedCount = 0
    let errorCount = 0

    // Process each file
    for (const file of convertibleFiles) {
      try {
        // Update file status to converting
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === file.id ? { ...f, converting: true, conversionError: undefined } : f)),
        )

        // Convert the file
        const convertedFile = await convertFile(file.file)

        // Create a preview URL for the converted file
        let preview = file.preview
        if (convertedFile.type.startsWith("image/")) {
          // Revoke old preview URL if it's a blob
          if (file.preview && file.preview.startsWith("blob:")) {
            URL.revokeObjectURL(file.preview)
          }
          preview = URL.createObjectURL(convertedFile)
        }

        // Update the file in the state
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  file: convertedFile,
                  preview,
                  newName: convertedFile.name.toUpperCase(),
                  converting: false,
                }
              : f,
          ),
        )

        convertedCount++
      } catch (error) {
        console.error("Conversion failed:", error)

        // Update file status to error
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  converting: false,
                  conversionError: error instanceof Error ? error.message : "Unknown error",
                }
              : f,
          ),
        )

        errorCount++
      }
    }

    setIsConverting(false)

    // Show result toast
    if (convertedCount > 0) {
      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${convertedCount} file${convertedCount !== 1 ? "s" : ""}${errorCount > 0 ? `, ${errorCount} failed` : ""}.`,
        variant: errorCount > 0 ? "default" : "default",
      })
    } else if (errorCount > 0) {
      toast({
        title: "Conversion Failed",
        description: `Failed to convert ${errorCount} file${errorCount !== 1 ? "s" : ""}.`,
        variant: "destructive",
      })
    }
  }

  const handleFilesAdded = useCallback(
    async (newFiles: FileWithPreview[]) => {
      if (autoConvert) {
        setIsConverting(true)
        const convertedFiles: FileWithPreview[] = []

        for (const file of newFiles) {
          try {
            if (canConvertFile(file.file)) {
              // Convert the file
              const convertedFile = await convertFile(file.file)

              // Create a preview URL for the converted file
              let preview = file.preview
              if (convertedFile.type.startsWith("image/")) {
                // Revoke old preview URL if it's a blob
                if (file.preview && file.preview.startsWith("blob:")) {
                  URL.revokeObjectURL(file.preview)
                }
                preview = URL.createObjectURL(convertedFile)
              }

              convertedFiles.push({
                ...file,
                file: convertedFile,
                preview,
                newName: convertedFile.name.toUpperCase(),
              })

              toast({
                title: "Auto-Conversion Complete",
                description: `Converted ${file.file.name} to ${convertedFile.type.split("/")[1].toUpperCase()}.`,
              })
            } else {
              convertedFiles.push(file)
            }
          } catch (error) {
            console.error("Auto-conversion failed:", error)
            convertedFiles.push({
              ...file,
              conversionError: error instanceof Error ? error.message : "Unknown error",
            })

            toast({
              title: "Auto-Conversion Failed",
              description: `Could not convert ${file.file.name}. Using original file.`,
              variant: "destructive",
            })
          }
        }

        setIsConverting(false)
        setFiles((prevFiles) => [...prevFiles, ...convertedFiles])
      } else {
        setFiles((prevFiles) => [...prevFiles, ...newFiles])
      }
    },
    [autoConvert, toast],
  )

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles]
      // Revoke the object URL to avoid memory leaks
      if (newFiles[index].preview && newFiles[index].preview.startsWith("blob:")) {
        URL.revokeObjectURL(newFiles[index].preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const handleReorderFiles = useCallback((reorderedFiles: FileWithPreview[]) => {
    setFiles(reorderedFiles)
  }, [])

  const handleUpdateTitle = useCallback((id: string, newTitle: string) => {
    setFiles((prevFiles) => prevFiles.map((file) => (file.id === id ? { ...file, customTitle: newTitle } : file)))
  }, [])

  const handleUpdateFileName = useCallback((id: string, newFileName: string) => {
    setFiles((prevFiles) => prevFiles.map((file) => (file.id === id ? { ...file, customFileName: newFileName } : file)))
  }, [])

  const generateFilenames = useCallback(() => {
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${date.getFullYear()}`

    setFiles((prevFiles) =>
      prevFiles.map((file, index) => {
        const fileTitle = title || file.customTitle || file.originalTitle || ""
        const fileId = (index + 1).toString()
        const extension = file.file.name.split(".").pop() || ""

        // Only include non-empty parameters in the filename with the new order
        const parts = [
          productionStage,
          entity,
          includeDate ? formattedDate : null,
          location ? location : null,
          artist,
          fileTitle,
          assetType,
          creative1 ? creative1 : null,
          creative2 ? creative2 : null,
          uploader ? uploader : null,
          fileId,
        ].filter(Boolean)

        // Join with hyphens instead of underscores
        const newName = `${parts.join("-")}.${extension}`.toUpperCase()

        return {
          ...file,
          newName,
        }
      }),
    )

    // Set flag to indicate filenames have been generated
    setHasGeneratedFilenames(true)

    // Show success toast
    toast({
      title: "Filenames generated",
      description: `Generated filenames for ${files.length} file${files.length !== 1 ? "s" : ""}.`,
    })
  }, [
    productionStage,
    entity,
    location,
    artist,
    title,
    assetType,
    creative1,
    creative2,
    uploader,
    includeDate,
    date,
    files.length,
    toast,
  ])

  // Clean up any existing download URL when component unmounts
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  const prepareDownload = async () => {
    if (files.length === 0) return

    // Prompt for ZIP filename
    const newZipName = prompt("Enter a name for your ZIP file:", zipFileName)
    if (newZipName) {
      setZipFileName(newZipName)
    }

    setIsZipping(true)
    setZipProgress(0)

    try {
      const zip = new JSZip()

      // Add each file to the zip with minimal compression for speed
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = file.customFileName || file.newName

        try {
          const fileData = await file.file.arrayBuffer()
          zip.file(fileName, fileData)

          // Update progress
          setZipProgress(Math.round(((i + 1) / files.length) * 100))
        } catch (error) {
          console.error(`Error adding file ${fileName} to zip:`, error)
        }
      }

      // Generate the zip file with minimal compression for speed
      const content = await zip.generateAsync({
        type: "blob",
        compression: "STORE", // No compression for maximum speed
      })

      // Clean up any existing URL
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }

      // Create a new URL for the blob
      const url = URL.createObjectURL(content)
      setDownloadUrl(url)

      // Show the download dialog
      setShowDownloadDialog(true)
    } catch (error) {
      console.error("Error creating zip file:", error)
      toast({
        title: "ZIP creation failed",
        description: "There was an error creating the ZIP file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsZipping(false)
    }
  }

  const handleDialogClose = () => {
    // Clean up the URL when dialog is closed
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
    setShowDownloadDialog(false)
  }

  // Reset function to clear all state and start fresh
  const resetAll = () => {
    // Clean up all preview URLs to avoid memory leaks
    files.forEach((file) => {
      if (file.preview && file.preview.startsWith("blob:")) {
        URL.revokeObjectURL(file.preview)
      }
    })

    // Clean up download URL if it exists
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
    }

    // Reset all state
    setFiles([])
    setArtist("")
    setTitle("")
    setLocation("")
    setCreative1("")
    setCreative2("")
    setUploader("")
    setProductionStage("FINAL")
    setEntity("PRAIRY")
    setMediaType("audio")
    setAssetType(assetTypeOptions.audio[0])
    setDate(new Date())
    setHasGeneratedFilenames(false)
    setZipFileName("renamed_files")
    setDownloadUrl(null)

    // Close any open dialogs
    setShowDownloadDialog(false)
    setShowResetConfirmDialog(false)

    // Show confirmation toast
    toast({
      title: "Reset Complete",
      description: "All files and settings have been cleared. You can start fresh now.",
    })
  }

  const [ffmpegReady, setFfmpegReady] = useState(false)
  const [ffmpegError, setFfmpegError] = useState<string | null>(null)

  useEffect(() => {
    const checkConversionCapabilities = async () => {
      try {
        // Check if Web Audio API is available
        if (typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined") {
          setFfmpegReady(true)
          return
        }

        // Only try to load FFmpeg if Web Audio API is not available
        const { loadFFmpeg } = await import("@/lib/ffmpeg-utils")
        await loadFFmpeg()
        setFfmpegReady(true)
      } catch (error) {
        console.error("Failed to initialize conversion capabilities:", error)
        // Don't show error if Web Audio API is available
        if (!(typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined")) {
          setFfmpegError(error instanceof Error ? error.message : "Limited conversion capabilities available.")
        }
      }
    }

    checkConversionCapabilities()
  }, [])

  return (
    <>
      <Card className="max-w-6xl mx-auto">
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Naming options */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Naming Options</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirmDialog(true)}
                className="flex items-center"
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Reset All
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="media-type">Media Type</Label>
                <RadioGroup id="media-type" value={mediaType} onValueChange={setMediaType} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="audio" id="audio" />
                    <Label htmlFor="audio">Audio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video">Video</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image">Image</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger id="asset-type" className="mt-1.5">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOptions[mediaType as keyof typeof assetTypeOptions].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="production-stage">Production Stage</Label>
                <Select value={productionStage} onValueChange={setProductionStage}>
                  <SelectTrigger id="production-stage" className="mt-1.5">
                    <SelectValue placeholder="Select production stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEMO">DEMO</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="FINAL">FINAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entity">Entity</Label>
                <Select value={entity} onValueChange={setEntity}>
                  <SelectTrigger id="entity" className="mt-1.5">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRAIRY">PRAIRY</SelectItem>
                    <SelectItem value="TRENCH HOUSE">TRENCH HOUSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setLocation(value)
                      setShowLocationDropdown(value.length >= 2)
                    }}
                    onFocus={() => {
                      if (location.length >= 2) {
                        setShowLocationDropdown(true)
                      }
                    }}
                    onBlur={() => {
                      // Use setTimeout to allow click events on dropdown items to fire first
                      setTimeout(() => setShowLocationDropdown(false), 200)
                    }}
                    placeholder="Enter location"
                    className="w-full"
                    autoComplete="off"
                  />
                  {showLocationDropdown && location.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                      {locationOptions
                        .filter((option) => option.includes(location))
                        .slice(0, 5)
                        .map((option) => (
                          <div
                            key={option}
                            className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onMouseDown={(e) => {
                              // Use onMouseDown instead of onClick to prevent the input's onBlur from closing the dropdown before the click registers
                              e.preventDefault()
                              setLocation(option)
                              setShowLocationDropdown(false)
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      {locationOptions.filter((option) => option.includes(location)).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No matches found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value.toUpperCase())}
                  placeholder="Enter artist name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="title">Default Title (Overrides individual title)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  placeholder="Enter title for all files"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="creative1">Creative 1</Label>
                <Input
                  id="creative1"
                  value={creative1}
                  onChange={(e) => setCreative1(e.target.value.toUpperCase())}
                  placeholder="Enter first creative name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="creative2">Creative 2</Label>
                <Input
                  id="creative2"
                  value={creative2}
                  onChange={(e) => setCreative2(e.target.value.toUpperCase())}
                  placeholder="Enter second creative name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="uploader">Uploader</Label>
                <Input
                  id="uploader"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value.toUpperCase())}
                  placeholder="Enter uploader name"
                  className="mt-1.5"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-date"
                    checked={includeDate}
                    onCheckedChange={(checked) => setIncludeDate(checked === true)}
                  />
                  <Label htmlFor="include-date">Include date in filename</Label>
                </div>

                {includeDate && (
                  <div className="mt-2">
                    <Label htmlFor="date-picker" className="mb-1.5 block">
                      Select Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-picker"
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "MMMM d, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => newDate && setDate(newDate)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="auto-convert"
                  checked={autoConvert}
                  onCheckedChange={(checked) => setAutoConvert(checked === true)}
                />
                <Label htmlFor="auto-convert">Auto-convert files (PNG → JPG, MP3/M4A → WAV)</Label>
              </div>
            </div>
          </div>

          {/* Right panel - Upload and file list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Upload Files</h3>
              <FileUploader onFilesAdded={handleFilesAdded} />
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Files ({files.length})</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConvertAllFiles}
                      variant="outline"
                      disabled={isConverting || files.length === 0}
                      className="flex items-center"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        "Convert All"
                      )}
                    </Button>
                    {files.some((f) => f.file.type === "image/png") && (
                      <Button
                        onClick={testPngToJpgConversion}
                        variant="outline"
                        disabled={isConverting}
                        className="flex items-center"
                      >
                        Test PNG → JPG
                      </Button>
                    )}
                    <Button onClick={generateFilenames} variant="outline">
                      {hasGeneratedFilenames ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate Names
                        </>
                      ) : (
                        "Generate Names"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="h-[calc(100vh-450px)] min-h-[300px]">
                  <SortableFileList
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    onReorderFiles={handleReorderFiles}
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateFileName
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateFileName={handleUpdateFileName}
                    onConvertFile={handleConvertFile}
                    canConvertFile={canConvertFile}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download section at the bottom */}
        {files.length > 0 && (
          <>
            <Separator />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium">Download Files</h3>
                  <p className="text-sm text-muted-foreground">Download all files as a ZIP archive</p>
                </div>
                <div className="flex-shrink-0">
                  <Button onClick={prepareDownload} size="lg" disabled={isZipping || isConverting}>
                    {isZipping ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating ZIP... {zipProgress}%
                      </>
                    ) : isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Converting Files...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-5 w-5" />
                        Download Files as ZIP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isSafari && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <p className="font-medium">Safari User Detected</p>
                  <p className="mt-1">Safari has stricter download security. If you have trouble downloading, try:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Checking your download settings in Safari preferences</li>
                    <li>Using Chrome or Firefox instead</li>
                    <li>Right-clicking the download link and selecting "Download Linked File"</li>
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your ZIP file is ready!</DialogTitle>
            <DialogDescription>
              {isSafari
                ? "Safari users: Click the link below, then right-click and select 'Download Linked File'."
                : "Click the button below to download your renamed files."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="grid w-full gap-2">
              <p className="text-sm font-medium leading-none">{zipFileName}.zip</p>
              <p className="text-sm text-muted-foreground">
                Contains {files.length} file{files.length !== 1 ? "s" : ""}
              </p>
            </div>

            {downloadUrl && (
              <div className="w-full mt-4">
                {isSafari ? (
                  <a
                    href={downloadUrl}
                    download={`${zipFileName}.zip`}
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Download Link
                  </a>
                ) : (
                  <a
                    href={downloadUrl}
                    download={`${zipFileName}.zip`}
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Now
                  </a>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleDialogClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Everything?</DialogTitle>
            <DialogDescription>
              This will clear all files and reset all settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowResetConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={resetAll}>
              Reset Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Conversion Status - moved to bottom */}
      <div className="max-w-6xl mx-auto mt-8">
        <FFmpegStatus />
      </div>
    </>
  )
}

