// FFmpeg utility module for handling media conversions

import { convertAudioToWav, isConvertibleAudio } from "./audio-utils"

// Keep track of the FFmpeg instance to avoid reloading
let ffmpegInstance: any = null

/**
 * Loads FFmpeg and returns an instance
 * @returns Promise resolving to an FFmpeg instance
 */
export async function loadFFmpeg(): Promise<any> {
  // Return existing instance if already loaded
  if (ffmpegInstance) {
    return ffmpegInstance
  }

  try {
    // Import FFmpeg modules
    const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg")

    // Create FFmpeg instance with CDN path for reliability
    const ffmpeg = createFFmpeg({
      log: true,
      corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
    })

    // Load FFmpeg
    await ffmpeg.load()

    // Add fetchFile to the instance for convenience
    ffmpeg.fetchFile = fetchFile

    // Store the instance for reuse
    ffmpegInstance = ffmpeg

    return ffmpeg
  } catch (error) {
    console.error("Error loading FFmpeg:", error)
    throw new Error(`Failed to load FFmpeg: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Converts PNG image to JPG using Canvas API (no FFmpeg needed)
 * @param file The PNG file to convert
 * @returns Promise resolving to the converted JPG file
 */
export async function convertPngToJpg(file: File): Promise<File> {
  console.log(`Starting PNG to JPG conversion for: ${file.name}, type: ${file.type}`)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      console.log(`Image loaded successfully, dimensions: ${img.width}x${img.height}`)

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      // Draw image on canvas
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        const error = new Error("Could not get canvas context")
        console.error(error)
        reject(error)
        return
      }

      // Draw with white background (JPG doesn't support transparency)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Convert to JPG blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const error = new Error("Could not create blob")
            console.error(error)
            reject(error)
            return
          }

          // Create new file
          const fileName = file.name.replace(/\.png$/i, ".jpg")
          const newFile = new File([blob], fileName, { type: "image/jpeg" })
          console.log(`PNG to JPG conversion successful, new filename: ${newFile.name}`)
          resolve(newFile)
        },
        "image/jpeg",
        0.9,
      )
    }

    img.onerror = (error) => {
      console.error(`Failed to load image: ${file.name}`, error)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    // Load image from file
    const objectUrl = URL.createObjectURL(file)
    console.log(`Created object URL for image: ${objectUrl}`)
    img.src = objectUrl

    // Clean up object URL when done (in both success and error cases)
    img.onload = () => {
      console.log("Image loaded, processing conversion...")
      URL.revokeObjectURL(objectUrl)

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      // Draw image on canvas
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        const error = new Error("Could not get canvas context")
        console.error(error)
        reject(error)
        return
      }

      // Draw with white background (JPG doesn't support transparency)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Convert to JPG blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const error = new Error("Could not create blob")
            console.error(error)
            reject(error)
            return
          }

          // Create new file
          const fileName = file.name.replace(/\.png$/i, ".jpg")
          const newFile = new File([blob], fileName, { type: "image/jpeg" })
          console.log(`PNG to JPG conversion successful, new filename: ${newFile.name}`)
          resolve(newFile)
        },
        "image/jpeg",
        0.9,
      )
    }

    img.onerror = () => {
      console.error(`Failed to load image: ${file.name}`)
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
  })
}

const MAX_CONVERSION_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Checks if a file can be converted
 * @param file The file to check
 * @returns Boolean indicating if the file can be converted
 */
export function canConvertFile(file: File, maxSize = MAX_CONVERSION_SIZE): boolean {
  // Check file size first
  if (file.size > maxSize) {
    console.log(`File too large for conversion: ${file.name}, size: ${file.size} bytes`)
    return false
  }

  // Support PNG to JPG conversion
  if (file.type === "image/png") {
    console.log(`PNG file detected, can be converted: ${file.name}`)
    return true
  }

  // Support audio conversion
  if (isConvertibleAudio(file)) {
    console.log(`Convertible audio file detected: ${file.name}, type: ${file.type}`)
    return true
  }

  // Special case for m4a files with incorrect MIME type
  if (file.name.toLowerCase().endsWith(".m4a")) {
    console.log(`Detected M4A file by extension: ${file.name}`)
    return true
  }

  console.log(`File cannot be converted: ${file.name}, type: ${file.type}`)
  return false
}

/**
 * Converts a file based on its type
 * @param file The file to convert
 * @returns Promise resolving to the converted file
 */
export async function convertFile(file: File): Promise<File> {
  console.log(`Starting conversion for file: ${file.name}, type: ${file.type}`)

  if (file.type === "image/png") {
    console.log(`Converting PNG to JPG: ${file.name}`)
    try {
      const result = await convertPngToJpg(file)
      console.log(`PNG to JPG conversion completed successfully: ${result.name}`)
      return result
    } catch (error) {
      console.error(`PNG to JPG conversion failed: ${file.name}`, error)
      throw error
    }
  }

  if (isConvertibleAudio(file) || file.name.toLowerCase().endsWith(".m4a")) {
    try {
      // First try with Web Audio API
      console.log(`Starting audio conversion for: ${file.name}`)
      const convertedFile = await convertAudioToWav(file)
      console.log(`Conversion successful, new filename: ${convertedFile.name}`)
      return convertedFile
    } catch (error) {
      console.warn(`Web Audio API conversion failed for ${file.name}:`, error)

      // If it's an m4a file and Web Audio API failed, try FFmpeg as fallback
      if (file.name.toLowerCase().endsWith(".m4a") && typeof window !== "undefined") {
        console.log(`Attempting FFmpeg fallback for ${file.name}`)
        try {
          const { convertM4aToWavWithFFmpeg } = await import("./audio-utils")
          const convertedFile = await convertM4aToWavWithFFmpeg(file)
          console.log(`FFmpeg conversion successful, new filename: ${convertedFile.name}`)
          return convertedFile
        } catch (ffmpegError) {
          console.error(`FFmpeg fallback also failed for ${file.name}:`, ffmpegError)
          throw new Error(`Could not convert ${file.name}. Both conversion methods failed.`)
        }
      }

      // For other audio files or if FFmpeg is not available, rethrow the original error
      throw error
    }
  }

  // Return original file if no conversion needed
  console.log(`No conversion needed for file: ${file.name}`)
  return file
}

/**
 * Tests if audio conversion is available and working
 * @returns Promise resolving to a boolean indicating if conversion is working
 */
export async function testFFmpeg(): Promise<boolean> {
  try {
    // First check if Web Audio API is available
    if (typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined") {
      // Web Audio API is available, no need to test FFmpeg
      return true
    }

    // Only try FFmpeg as a fallback if Web Audio API is not available
    try {
      const ffmpeg = await loadFFmpeg()
      // Create a simple test file
      ffmpeg.FS("writeFile", "test.txt", new Uint8Array([72, 101, 108, 108, 111])) // "Hello" in ASCII
      // Read it back to verify filesystem works
      const data = ffmpeg.FS("readFile", "test.txt")
      const text = new TextDecoder().decode(data)
      // Clean up
      ffmpeg.FS("unlink", "test.txt")
      // If we got here, FFmpeg is working
      return text === "Hello"
    } catch (error) {
      console.error("FFmpeg test failed:", error)
      // FFmpeg failed, but Web Audio API might still work for basic conversions
      return false
    }
  } catch (error) {
    console.error("Audio conversion capability test failed:", error)
    return false
  }
}

