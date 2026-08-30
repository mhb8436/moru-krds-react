import { defineConfig } from 'tsup';

/**
 * 번들로 뭉치지 않고 파일 구조를 그대로 옮긴다(`bundle: false`).
 *
 * 45종 중 14종만 `'use client'` 다. 하나로 뭉치면 그 지시자가 파일 맨 위 한 곳에만 남아
 * **서버 컴포넌트 31종까지 전부 클라이언트로 넘어간다.** 파일을 나눠 두면 각자 자기 지시자를 갖는다.
 *
 * 타입은 tsc 가 따로 낸다(`build:types`). `bundle: false` 에서는 tsup 의 dts 가
 * 파일 구조를 보존하지 못한다.
 */
export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  outDir: 'dist',
  format: ['esm'],
  bundle: false,
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
});
