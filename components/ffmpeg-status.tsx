"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { testFFmpeg } from "@/lib/ffmpeg-utils"

export function FFmpegStatus() {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "partial">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [conversionMethod, setConversionMethod] = useState<"web-audio" | "ffmpeg" | "none">("none")

  const checkConversionCapabilities = useCallback(async () => {
    setStatus("loading")
    setErrorMessage(null)
    setIsRetrying(true)

    try {
      // Check if Web Audio API is available
      if (typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined") {
        setStatus("ready")
        setConversionMethod("web-audio")
        setIsRetrying(false)
        return
      }

      // If Web Audio API is not available, check FFmpeg
      const isFFmpegWorking = await testFFmpeg()

      if (isFFmpegWorking) {
        setStatus("ready")
        setConversionMethod("ffmpeg")
      } else {
        setStatus("partial")
        setConversionMethod("none")
        setErrorMessage("Audio conversion may not be fully functional in your browser.")
      }
    } catch (error) {
      console.error("Failed to initialize conversion capabilities:", error)
      setStatus("error")
      setConversionMethod("none")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to initialize audio conversion. PNG to JPG conversion will still work.",
      )
    } finally {
      setIsRetrying(false)
    }
  }, [])

  useEffect(() => {
    checkConversionCapabilities()
  }, [checkConversionCapabilities])

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Media Conversion Status</CardTitle>
        <CardDescription>Audio and image conversion capabilities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === "loading" && (
              <>
                <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                <span className="text-sm">Checking conversion capabilities...</span>
              </>
            )}
            {status === "ready" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  Full conversion capabilities available
                  {conversionMethod === "web-audio" && " (using Web Audio API)"}
                  {conversionMethod === "ffmpeg" && " (using FFmpeg)"}
                </span>
              </>
            )}
            {status === "partial" && (
              <>
                <CheckCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Basic conversion available (PNG to JPG only)</span>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="text-sm">Limited conversion available (PNG to JPG only)</span>
              </>
            )}
          </div>

          {(status === "error" || status === "partial") && (
            <Button variant="outline" size="sm" onClick={checkConversionCapabilities} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </Button>
          )}
        </div>

        {(status === "error" || status === "partial") && (
          <div className="mt-3 text-xs text-muted-foreground">
            <p className="font-medium">Note:</p>
            <p>
              PNG to JPG conversion will work in all browsers. Audio conversion depends on your browser's capabilities.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

