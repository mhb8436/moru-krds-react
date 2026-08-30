/**
 * `process.env.NODE_ENV` 만을 위한 최소 선언.
 *
 * 부품 몇 개가 개발 중에만 콘솔 경고를 낸다(예: `<table>` 에 display 를 바꾸는 클래스가 붙었을 때).
 * 번들러(Next·Vite·webpack)가 이 값을 빌드 때 문자열로 갈아 끼우므로 운영 번들에는 남지 않는다.
 *
 * `@types/node` 를 통째로 끌어오지 않는 이유 — 이것은 브라우저에서 도는 UI 부품 묶음이라
 * Node 전역(`Buffer`·`__dirname` 등)이 타입에 보이면 잘못 쓰기 쉽다.
 */
declare const process: { env: { NODE_ENV?: string } };
