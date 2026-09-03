#!/usr/bin/env node
/** Rule 03: no source file over 400 lines; screens over 200 warn hard. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LIMITS = { default: 400, screen: 200 };
const SCAN = ['apps/mobile/src', 'apps/mobile/app', 'packages/shared/src', 'supabase/functions'];
const EXT = /\.(ts|tsx)$/;
const EXEMPT = /(\.gen\.ts$|__fixtures__|node_modules|\.test\.tsx?$|schema\.ts$)/;

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(p) && !EXEMPT.test(p)) out.push(p);
  }
  return out;
}

const violations = [];
for (const dir of SCAN) {
  for (const file of walk(join(ROOT, dir))) {
    const lines = readFileSync(file, 'utf8').split('\n').length;
    const rel = relative(ROOT, file);
    const isScreen = rel.includes(`${sep}screens${sep}`) || /Screen\.tsx$/.test(rel);
    const limit = isScreen ? LIMITS.screen : LIMITS.default;
    if (lines > limit) violations.push({ rel, lines, limit });
  }
}

if (violations.length > 0) {
  console.error('Rule 03 violated — split these files, do not raise the limit:\n');
  for (const v of violations) console.error(`  ${v.rel}  ${v.lines} lines (limit ${v.limit})`);
  process.exit(1);
}
console.log('lines:check ok');
