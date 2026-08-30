/**
 * KRDS(디지털정부서비스 UI/UX 가이드라인) React 부품.
 *
 * 두 갈래다.
 *  1. **KRDS 부품** — 킷(`krds-uiux`)의 클래스를 그대로 쓰는 껍데기.
 *     모양·색·크기는 전부 킷에서 오고, 이 층은 마크업 구조와 접근성 속성을 고정한다.
 *  2. **보충 부품** — KRDS 가 다루지 않는 업무시스템(백오피스)용. KRDS 토큰으로 그린다.
 *     KRDS 는 국민용 누리집이 대상이라 표 정렬·콤보박스·서랍·토스트 같은 것이 없다.
 *
 */

/* ── 공통 타입 ─────────────────────────────────────────────── */
export * from './lib/krds';

/* ── 액션 ─────────────────────────────────────────────────── */
export * from './button';

/* ── 폼 ───────────────────────────────────────────────────── */
export * from './field';
export * from './text-input';
export * from './textarea';
export * from './select';
export * from './checkbox';
export * from './radio';
export * from './file-upload';
export * from './combobox';
export * from './input-group';

/* ── 표현 ─────────────────────────────────────────────────── */
export * from './badge';
export * from './tag';
export * from './table';
export * from './data-table';
export * from './structured-list';
export * from './text-list';
export * from './critical-alert';
export * from './alert';
export * from './empty-state';

/* ── 탐색 ─────────────────────────────────────────────────── */
export * from './skip-link';
export * from './masthead';
export * from './header';
export * from './main-menu';
export * from './breadcrumb';
export * from './side-navigation';
export * from './in-page-navigation';
export * from './pagination';
export * from './footer';
export * from './identifier';

/* ── 열고 닫기 ─────────────────────────────────────────────── */
export * from './accordion';
export * from './disclosure';
export * from './tab';
export * from './modal';
export * from './drawer';
export * from './tooltip';
export * from './context-menu';

/* ── 피드백 ───────────────────────────────────────────────── */
export * from './spinner';
export * from './step-indicator';
export * from './progress';
export * from './skeleton';
export * from './toast';

/* ── 그 밖 ────────────────────────────────────────────────── */
export * from './avatar';
export * from './separator';
export * from './scroll-area';
export * from './resize';
