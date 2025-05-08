import 'dotenv/config'
import { join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'
import { readdir, access } from 'fs/promises'
import { constants } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Checks if a file exists
 */
const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Safely imports a module ensuring Windows compatibility
 */
const safeImport = async (path: string) => {
  // Ensure the path is absolute
  const absolutePath = resolve(path)
  
  // Check if file exists before attempting to import
  if (await fileExists(absolutePath)) {
    // Convert to proper file URL for Windows compatibility
    const fileUrl = pathToFileURL(absolutePath).href
    return import(fileUrl)
  } else {
    throw new Error(`File not found: ${absolutePath}`)
  }
}

const main = async () => {
  const evalName = process.argv[2]
  
  // Using resolve for more robust path handling
  const experimentsDir = resolve(__dirname, 'experiments')

  try {
    if (evalName) {
      console.log(`Running eval: ${evalName}`)
      const evalPath = join(experimentsDir, `${evalName}.eval.ts`)
      
      // Check if specific eval exists
      if (await fileExists(evalPath)) {
        await safeImport(evalPath)
      } else {
        throw new Error(`Eval '${evalName}' not found at ${evalPath}`)
      }
    } else {
      console.log('Running all evals')
      const files = await readdir(experimentsDir)
      const evalFiles = files.filter((file) => file.endsWith('.eval.ts'))

      if (evalFiles.length === 0) {
        console.log('No eval files found in', experimentsDir)
        return
      }

      for (const evalFile of evalFiles) {
        const evalPath = join(experimentsDir, evalFile)
        console.log(`Running ${evalFile}...`)
        await safeImport(evalPath)
      }
    }
    
    console.log('Eval(s) completed successfully')
  } catch (error) {
    console.error(
      `Failed to run eval${evalName ? ` '${evalName}'` : 's'}:`,
      error
    )
    process.exit(1)
  }
}

main()