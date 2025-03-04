import { loadFFmpeg, canConvertFile } from "./ffmpeg-utils"
import { jest, describe, beforeEach, it, expect } from "@jest/globals"

// Mock the FFmpeg module
jest.mock("@ffmpeg/ffmpeg", () => {
  const mockFFmpeg = {
    load: jest.fn().mockResolvedValue(undefined),
    isLoaded: jest.fn().mockReturnValue(false),
    FS: jest.fn(),
    run: jest.fn().mockResolvedValue(undefined),
  }

  return {
    createFFmpeg: jest.fn().mockReturnValue(mockFFmpeg),
    fetchFile: jest.fn().mockImplementation((file) => file),
  }
})

describe("FFmpeg Utilities", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-url")
    global.URL.revokeObjectURL = jest.fn()
  })

  describe("loadFFmpeg", () => {
    it("should load FFmpeg successfully", async () => {
      const ffmpeg = await loadFFmpeg()
      expect(ffmpeg).toBeDefined()
      expect(ffmpeg.isLoaded).toBeDefined()
      expect(ffmpeg.fetchFile).toBeDefined()
    })

    it("should throw an error if FFmpeg fails to load", async () => {
      const mockError = new Error("Failed to load FFmpeg")
      require("@ffmpeg/ffmpeg").createFFmpeg().load.mockRejectedValueOnce(mockError)

      await expect(loadFFmpeg()).rejects.toThrow("Failed to load FFmpeg")
    })
  })

  describe("canConvertFile", () => {
    it("should return true for PNG files under size limit", () => {
      const file = new File(["test"], "test.png", { type: "image/png" })
      Object.defineProperty(file, "size", { value: 1024 * 1024 }) // 1MB

      expect(canConvertFile(file)).toBe(true)
    })

    it("should return true for MP3 files under size limit", () => {
      const file = new File(["test"], "test.mp3", { type: "audio/mpeg" })
      Object.defineProperty(file, "size", { value: 1024 * 1024 }) // 1MB

      expect(canConvertFile(file)).toBe(true)
    })

    it("should return false for files over size limit", () => {
      const file = new File(["test"], "test.png", { type: "image/png" })
      Object.defineProperty(file, "size", { value: 100 * 1024 * 1024 }) // 100MB

      expect(canConvertFile(file, 50 * 1024 * 1024)).toBe(false)
    })

    it("should return false for unsupported file types", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" })
      Object.defineProperty(file, "size", { value: 1024 }) // 1KB

      expect(canConvertFile(file)).toBe(false)
    })
  })
})

