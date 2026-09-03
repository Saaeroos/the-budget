#!/usr/bin/env node
/** Rule 08 / docs 24 §2: the dev auth bypass must be impossible outside development. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const env = process.env.EXPO_PUBLIC_ENV ?? 'development';
const errors = [];

if (env !== 'development' && process.env.EXPO_PUBLIC_SKIP_AUTH === '1') {
  errors.push(`EXPO_PUBLIC_SKIP_AUTH is set while EXPO_PUBLIC_ENV=${env}`);
}

const easPath = join(ROOT, 'apps/mobile/eas.json');
if (existsSync(easPath)) {
  const eas = JSON.parse(readFileSync(easPath, 'utf8'));
  for (const profile of ['preview', 'production']) {
    const e = eas.build?.[profile]?.env ?? {};
    if (e.EXPO_PUBLIC_SKIP_AUTH) errors.push(`eas.json: ${profile} profile sets EXPO_PUBLIC_SKIP_AUTH`);
  }
}

const devAuth = join(ROOT, 'apps/mobile/src/lib/devAuth.ts');
if (existsSync(devAuth)) {
  const src = readFileSync(devAuth, 'utf8');
  for (const guard of ['__DEV__', 'EXPO_PUBLIC_ENV', 'EXPO_PUBLIC_SKIP_AUTH']) {
    if (!src.includes(guard)) errors.push(`devAuth.ts is missing the ${guard} guard`);
  }
}

if (errors.length > 0) {
  console.error('dev-auth guard failed:\n');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('dev-auth guard ok');
