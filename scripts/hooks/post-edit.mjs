#!/usr/bin/env node
/** Claude Code PostToolUse hook: fast rule checks after every edit. */
import { execSync } from 'node:child_process';
try {
  execSync('node scripts/lines-check.mjs', { stdio: 'inherit' });
} catch {
  process.exit(2); // blocks and feeds stderr back to the agent
}
