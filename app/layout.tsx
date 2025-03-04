import type React from "react"
import "@/styles/globals.css"
import { Toaster } from "@/components/toaster"
import { ThemeProvider } from "./theme-provider"
import type { Metadata } from "next"

// Define the metadata for SEO
export const metadata: Metadata = {
  title: "File Renaming Tool",
  description:
    "Upload files and rename them according to your naming convention. Preview and download with new filenames.",
  keywords: ["file renamer", "batch rename", "file organization", "media renaming", "filename convention"],
  authors: [{ name: "filename.website" }],
  openGraph: {
    title: "File Renaming Tool",
    description:
      "Upload files and rename them according to your naming convention. Preview and download with new filenames.",
    url: "https://filename.website",
    siteName: "filename.website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 1200,
        alt: "filename.website - File Renaming Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "File Renaming Tool",
    description:
      "Upload files and rename them according to your naming convention. Preview and download with new filenames.",
    images: ["/api/og"],
  },
  icons: {
    icon: "/api/favicon",
    apple: "/api/favicon",
  },
  manifest: "/site.webmanifest",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'