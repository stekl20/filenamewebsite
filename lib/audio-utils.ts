/**
 * Audio conversion utilities using Web Audio API
 * This provides a more reliable way to convert audio in the browser
 */

// Cache for the AudioContext to avoid creating multiple instances
let audioContext: AudioContext | null = null

/**
 * Get or create an AudioContext
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

/**
 * Convert an audio file to WAV format using Web Audio API
 * @param file The audio file to convert
 * @returns Promise resolving to the converted WAV file
 */
export async function convertAudioToWav(file: File): Promise<File> {
  // Check if file is an audio file
  if (!file.type.startsWith("audio/")) {
    throw new Error("Not an audio file")
  }

  try {
    // Create an audio context
    const context = getAudioContext()

    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    console.log(`Starting conversion of ${file.name} (${file.type}), size: ${file.size} bytes`)

    // Special handling for m4a files
    if (file.type === "audio/mp4" || file.type === "audio/x-m4a" || file.name.toLowerCase().endsWith(".m4a")) {
      console.log(`Detected M4A file: ${file.name}`)
    }

    // Decode the audio data
    try {
      const audioBuffer = await context.decodeAudioData(arrayBuffer)
      console.log(
        `Successfully decoded audio data: channels=${audioBuffer.numberOfChannels}, duration=${audioBuffer.duration}s, sample rate=${audioBuffer.sampleRate}Hz`,
      )

      // Convert to WAV
      const wavBuffer = audioBufferToWav(audioBuffer)
      console.log(`Successfully converted to WAV format, size: ${wavBuffer.byteLength} bytes`)

      // Create a new file with WAV format - ensure extension is changed
      const fileName = file.name.toLowerCase().endsWith(".m4a")
        ? file.name.replace(/\.m4a$/i, ".wav")
        : file.name.replace(/\.[^/.]+$/, ".wav")
      console.log(`New filename after conversion: ${fileName}`)
      return new File([wavBuffer], fileName, { type: "audio/wav" })
    } catch (decodeError) {
      console.error(`Audio decoding error for ${file.name}:`, decodeError)
      throw new Error(
        `Failed to decode audio data: ${decodeError instanceof Error ? decodeError.message : "Unknown decode error"}`,
      )
    }
  } catch (error) {
    console.error(`Audio conversion error for ${file.name}:`, error)
    throw new Error(`Failed to convert audio: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Check if a file is a convertible audio file
 * @param file The file to check
 * @returns Boolean indicating if the file can be converted
 */
export function isConvertibleAudio(file: File): boolean {
  // Support common audio formats that browsers can decode
  const supportedTypes = [
    "audio/mpeg", // MP3
    "audio/mp4", // M4A, AAC
    "audio/aac", // AAC
    "audio/ogg", // OGG
    "audio/webm", // WEBM audio
  ]

  return supportedTypes.includes(file.type)
}

/**
 * Convert AudioBuffer to WAV format
 * @param audioBuffer The AudioBuffer to convert
 * @returns ArrayBuffer containing WAV data
 */
function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  // Extract the audio data
  const channelData: Float32Array[] = []
  for (let channel = 0; channel < numOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel))
  }

  // Calculate the total buffer size
  const dataLength = channelData[0].length * numOfChannels * (bitDepth / 8)
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, "WAVE")

  // "fmt " sub-chunk
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true) // audio format (PCM)
  view.setUint16(22, numOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numOfChannels * (bitDepth / 8), true) // byte rate
  view.setUint16(32, numOfChannels * (bitDepth / 8), true) // block align
  view.setUint16(34, bitDepth, true)

  // "data" sub-chunk
  writeString(view, 36, "data")
  view.setUint32(40, dataLength, true)

  // Write the PCM samples
  const offset = 44
  let pos = offset

  // Interleave the channels and convert to 16-bit PCM
  for (let i = 0; i < channelData[0].length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      // Convert float to 16-bit PCM
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]))
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(pos, value, true)
      pos += 2
    }
  }

  return buffer
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

// Add a fallback method for problematic .m4a files
export async function convertM4aToWavWithFFmpeg(file: File): Promise<File> {
  try {
    // Import FFmpeg utilities
    const { loadFFmpeg } = await import("./ffmpeg-utils")
    const ffmpeg = await loadFFmpeg()
    const { fetchFile } = ffmpeg

    console.log(`Using FFmpeg fallback for ${file.name}`)

    // Write the file to FFmpeg's virtual file system
    const data = await fetchFile(file)
    ffmpeg.FS("writeFile", file.name, data)

    // Run FFmpeg command to convert to WAV
    await ffmpeg.run("-i", file.name, "-c:a", "pcm_s16le", "output.wav")

    // Read the result
    const output = ffmpeg.FS("readFile", "output.wav")

    // Clean up
    ffmpeg.FS("unlink", file.name)
    ffmpeg.FS("unlink", "output.wav")

    // Create a new file with proper WAV extension
    const fileName = file.name.toLowerCase().endsWith(".m4a")
      ? file.name.replace(/\.m4a$/i, ".wav")
      : file.name.replace(/\.[^/.]+$/, ".wav")
    console.log(`New filename after FFmpeg conversion: ${fileName}`)
    return new File([output.buffer], fileName, { type: "audio/wav" })
  } catch (error) {
    console.error(`FFmpeg fallback conversion error for ${file.name}:`, error)
    throw new Error(`Failed to convert with FFmpeg: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

