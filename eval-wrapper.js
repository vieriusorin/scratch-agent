import { spawnSync } from 'child_process'

// Get the argument
const arg = process.argv[2]

// Run the actual script with proper ESM path handling
const result = spawnSync('npx', ['tsx', 'src/evals/run.ts', arg], {
  stdio: 'inherit',
  shell: true,
})

process.exit(result.status)
