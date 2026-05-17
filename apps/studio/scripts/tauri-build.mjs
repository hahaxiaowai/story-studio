import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const env = {
  ...process.env,
  CARGO_BUILD_JOBS: process.env.CARGO_BUILD_JOBS ?? '1',
  CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? join(tmpdir(), 'story-studio-tauri-target'),
}

const result = spawnSync('pnpm', ['exec', 'tauri', 'build'], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
