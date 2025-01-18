import { ensureDir, emptyDir } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

const dirsToClean = [
  // Temp directories
  "/tmp/test_tmp",
  "/tmp/deno_dir",
  
  // Coverage directories
  "./coverage",
  "./cov",
  
  // Test fixtures and dynamic content
  "./tests/fixtures/dynamic",
  "./tests/fixtures/generated",
  "./tests/fixtures/tmp",
  
  // Cache directories
  "./.deno",
  
  // Locale directories that will be regenerated
  "./src/locales",
  "./locales"
];

const dirsToKeep = [
  "./tests",
  "./tests/fixtures",
  "./src",
  "./src/types"
];

async function cleanTestEnv() {
  try {
    // Ensure essential directories exist
    for (const dir of dirsToKeep) {
      await ensureDir(dir);
    }

    // Clean directories that need to be emptied/removed
    for (const dir of dirsToClean) {
      try {
        const normalizedPath = join(Deno.cwd(), dir.replace(/^\.\//, ""));
        
        // Check if directory exists before attempting to clean
        try {
          await Deno.stat(normalizedPath);
        } catch (error) {
          if (error instanceof Deno.errors.NotFound) {
            console.log(`Skipping non-existent directory: ${dir}`);
            continue;
          }
          throw error;
        }

        // Empty directory contents
        await emptyDir(normalizedPath);
        console.log(`Cleaned directory: ${dir}`);
        
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          console.error(`Error cleaning ${dir}:`, error);
        }
      }
    }

    console.log("Test environment cleaned successfully");
    
  } catch (error) {
    console.error("Failed to clean test environment:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await cleanTestEnv();
}
