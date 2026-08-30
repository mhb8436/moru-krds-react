/**
 * dist 의 상대 import 에 `.js` 를 붙인다.
 *
 * `bundle: false` 로 내보내면 `import { cx } from '../lib/krds'` 가 그대로 남는다.
 * 번들러(Next·Vite)는 알아서 찾지만 Node 의 ESM 해석기는 확장자를 요구한다.
 * `"type": "module"` 인 패키지가 Node 에서 그냥 깨지지 않게 여기서 붙여 준다.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const DIST = new URL('../dist/', import.meta.url).pathname;

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = await walk(DIST);
let touched = 0;

for (const file of files) {
  const src = await readFile(file, 'utf8');
  const next = src.replace(/(\bfrom\s*['"])(\.[^'"]*?)(['"])/g, (whole, a, spec, b) => {
    if (/\.(js|json|css)$/.test(spec)) return whole;
    const abs = resolve(dirname(file), spec);
    // 디렉터리를 가리키면 그 안의 index.js 로
    if (existsSync(abs) && !existsSync(`${abs}.js`)) return `${a}${spec}/index.js${b}`;
    return `${a}${spec}.js${b}`;
  });
  if (next !== src) { await writeFile(file, next); touched += 1; }
}

console.log(`상대 import 에 확장자를 붙였다 — ${touched}/${files.length} 파일`);
