import { FileRenamer } from "@/components/file-renamer"
import { ThemeToggle } from "@/components/theme-toggle"

// Define the current version as a constant for easy updates
const CURRENT_VERSION = "v1.3"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1"></div>
        <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2 flex-1">
          File Renaming Tool
          <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
            {CURRENT_VERSION}
          </span>
        </h1>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
      </div>
      <p className="text-center mb-8 text-muted-foreground max-w-2xl mx-auto">
        Upload files and rename them according to your naming convention. Fill in the form fields below and preview the
        new filenames before downloading.
      </p>
      <FileRenamer />
    </main>
  )
}

