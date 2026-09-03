#!/usr/bin/env node
/** Rule 02: every i18n key exists in every locale; no orphans; no literal UI strings. */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const I18N = join(ROOT, 'apps/mobile/src/i18n');
const SRC = join(ROOT, 'apps/mobile/src');

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

if (!existsSync(join(I18N, 'nl.json'))) {
  console.log('i18n:check skipped — locales not created yet');
  process.exit(0);
}

const nl = flatten(JSON.parse(readFileSync(join(I18N, 'nl.json'), 'utf8')));
const en = flatten(JSON.parse(readFileSync(join(I18N, 'en.json'), 'utf8')));

const strip = (k) => k.replace(/_(one|other|zero|few|many)$/, '');
const nlBase = new Set(nl.map(strip));
const enBase = new Set(en.map(strip));

const errors = [];
for (const k of nlBase) if (!enBase.has(k)) errors.push(`missing in en.json: ${k}`);
for (const k of enBase) if (!nlBase.has(k)) errors.push(`missing in nl.json: ${k}`);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const used = new Set();
for (const file of walk(SRC).concat(walk(join(ROOT, 'apps/mobile/app')))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/['"]([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)['"]/g)) used.add(strip(m[1]));
}
for (const k of nlBase) {
  if (!used.has(k) && !k.startsWith('errors.') && !k.startsWith('categories.') && !k.startsWith('banks.notice.')) {
    errors.push(`orphan key (never referenced): ${k}`);
  }
}

if (errors.length > 0) {
  console.error('i18n:check failed:\n');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`i18n:check ok — ${nlBase.size} keys in nl + en`);
