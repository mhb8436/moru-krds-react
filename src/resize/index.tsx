'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../lib/krds';

/**
 * 화면 크기 조정 — KRDS `krds-drop-wrap krds-resize`.
 * 선명한 화면 모드 전환({@link ViewModeSwitch}) — 같은 드롭다운 껍데기를 쓰는 우리 부품이다.
 *
 * 헤더 유틸리티 줄에 놓는다. 배율은 문서 루트 글자 크기로 걸리므로 화면 전체가 따라온다.
 * 첫 화면이 기본 모드로 번쩍이지 않게 `<head>` 에 {@link ViewSettingsScript} 를 두고 **nonce 를 넘긴다**.
 * `ViewModeSwitch` 는 `<html data-krds-mode>` 를 붙이는 **유일한 곳**이다 —
 * 이것 없이는 킷의 고대비 규칙이 통째로 죽은 코드로 남는다.
 *
 * @example
 * // app/layout.tsx <head>
 * <ViewSettingsScript nonce={nonce} />
 * // 헤더 유틸리티 줄
 * <HeaderUtility>
 *   <Resize />
 *   <ViewModeSwitch />
 * </HeaderUtility>
 *
 * 자세히: docs/krds/09-부품-노트.md#크기조절
 */

/* ────────────────────────────────────────────────────────────────────────
 * 1. 배율
 * ──────────────────────────────────────────────────────────────────────── */

/** 킷의 5단. 클래스 이름(`.item-link.sm` …)과 값이 같아야 한다. */
export type ResizeScale = 'sm' | 'md' | 'lg' | 'xlg' | 'xxlg';

/** 5단의 레이블과 배율 — 작게 90% · 보통 100% · 조금 크게 110% · 크게 130% · 가장 크게 150%. */
export const RESIZE_SCALES: ReadonlyArray<{
  value: ResizeScale;
  label: string;
  percent: number;
}> = [
  { value: 'sm', label: '작게', percent: 90 },
  { value: 'md', label: '보통', percent: 100 },
  { value: 'lg', label: '조금 크게', percent: 110 },
  { value: 'xlg', label: '크게', percent: 130 },
  { value: 'xxlg', label: '가장 크게', percent: 150 },
];

/** 킷 기본 루트 글자 크기. */
const ROOT_FONT_BASE_PERCENT = 62.5;

/** 기본 배율(킷의 `.active` 가 붙어 있는 단). */
const DEFAULT_SCALE: ResizeScale = 'md';

function scaleInfo(scale: ResizeScale) {
  return RESIZE_SCALES.find((s) => s.value === scale) ?? RESIZE_SCALES[1];
}

/**
 * 그 배율에서 문서 루트에 넣을 글자 크기. %(브라우저 기본 글자 크기의 비율)라
 * 사용자의 브라우저 글꼴 설정을 덮지 않는다.
 *
 * @example
 * rootFontSize('lg') // '68.75%'
 */
export function rootFontSize(scale: ResizeScale): string {
  return `${(ROOT_FONT_BASE_PERCENT * scaleInfo(scale).percent) / 100}%`;
}

/**
 * 배율을 문서에 건다 — `<html>` 인라인 글자 크기 · `data-krds-scale` 표시 ·
 * 확대(100% 초과)일 때 `krds-scaled-layout`(목차의 고정 위치를 푼다).
 */
export function applyScale(scale: ResizeScale): void {
  const root = document.documentElement;
  root.style.fontSize = rootFontSize(scale);
  root.dataset.krdsScale = scale;
  document.body?.classList.toggle('krds-scaled-layout', scaleInfo(scale).percent > 100);
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. 선명한 화면 모드
 * ──────────────────────────────────────────────────────────────────────── */

/** 화면 모드. `light` 는 속성을 떼는 것이고, 나머지 둘은 `<html data-krds-mode>` 값이다. */
export type ViewMode = 'light' | 'high-contrast' | 'theme';

/** 모드 레이블. 「고대비」 대신 KRDS 용어인 「선명한 화면」을 쓴다. */
export const VIEW_MODES: ReadonlyArray<{ value: ViewMode; label: string }> = [
  { value: 'light', label: '기본 화면' },
  { value: 'high-contrast', label: '선명한 화면' },
  { value: 'theme', label: '기기 설정 따름' },
];

/** 화면 모드를 `<html>` 에 건다. 킷 선택자가 후손 선택자라 반드시 루트에 붙어야 한다. */
export function applyViewMode(mode: ViewMode): void {
  const root = document.documentElement;
  if (mode === 'light') delete root.dataset.krdsMode;
  else root.dataset.krdsMode = mode;
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. 저장 — 브라우저가 막아도 화면은 떠야 한다
 * ──────────────────────────────────────────────────────────────────────── */

/** 배율 저장 키. */
export const SCALE_STORAGE_KEY = 'krds.scale';
/** 화면 모드 저장 키. */
export const VIEW_MODE_STORAGE_KEY = 'krds.view-mode';

/** 사생활 보호 모드·쿠키 차단에서는 접근만 해도 예외가 난다 — try/catch 로 감싼다. */
function readStored<T extends string>(key: string, allowed: ReadonlyArray<T>): T | null {
  try {
    const v = window.localStorage.getItem(key);
    return v && (allowed as ReadonlyArray<string>).includes(v) ? (v as T) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 저장이 막힌 브라우저 — 이번 방문에만 적용된다 */
  }
}

/** 저장된 배율. 없거나 못 읽으면 null. */
export function readStoredScale(): ResizeScale | null {
  return readStored(
    SCALE_STORAGE_KEY,
    RESIZE_SCALES.map((s) => s.value),
  );
}

/** 저장된 화면 모드. 없거나 못 읽으면 null. */
export function readStoredViewMode(): ViewMode | null {
  return readStored(
    VIEW_MODE_STORAGE_KEY,
    VIEW_MODES.map((m) => m.value),
  );
}

/** 첫 그림 전에 저장값을 거는 인라인 스크립트 본문. `RESIZE_SCALES` 에서 만들어 낸다. */
const BOOT_SCRIPT = ((): string => {
  const map: Record<string, string> = {};
  for (const s of RESIZE_SCALES) map[s.value] = rootFontSize(s.value);
  return (
    '(function(){try{var d=document.documentElement,' +
    `m=${JSON.stringify(map)},` +
    `s=localStorage.getItem(${JSON.stringify(SCALE_STORAGE_KEY)});` +
    'if(s&&m[s]){d.style.fontSize=m[s];d.dataset.krdsScale=s;}' +
    `var v=localStorage.getItem(${JSON.stringify(VIEW_MODE_STORAGE_KEY)});` +
    "if(v==='high-contrast'||v==='theme'){d.dataset.krdsMode=v;}" +
    '}catch(e){}})();'
  );
})();

/**
 * 첫 그림 전에 저장된 배율·화면 모드를 거는 인라인 스크립트. 없으면 첫 화면이 한 번 번쩍인다.
 * `<head>` 안, 스타일시트 뒤에 놓는다.
 *
 * **`nonce` 를 반드시 넘겨라** — CSP 가 nonce 없는 인라인 스크립트를 막는다.
 *
 * @example
 * const nonce = await requestNonce();
 * <ViewSettingsScript nonce={nonce ?? undefined} />
 */
export function ViewSettingsScript({ nonce }: { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />;
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. 드롭다운 껍데기 — 두 부품이 함께 쓴다
 * ──────────────────────────────────────────────────────────────────────── */

/** 드롭다운 정렬. 생략하면 가운데(킷 기본). */
export type DropAlign = 'left' | 'right';

type DropOption<T extends string> = {
  value: T;
  label: string;
  /** 항목에 덧붙일 킷 클래스. 화면 크기 조정의 `sm`~`xxlg` 미리보기 아이콘이 여기로 온다. */
  itemClass?: string;
  /** 항목에 붙일 `data-adjust-scale` 값(킷 샘플의 손잡이). */
  data?: string;
};

type DropdownShellProps<T extends string> = {
  /** 껍데기 종류 클래스. `krds-resize` 처럼 킷에 실재하는 것만 넣는다. */
  wrapClass?: string;
  /** 버튼 글자(구조 ①). */
  triggerLabel: string;
  /** 버튼 앞 아이콘 이름(`ico-` 뺀 것). 없으면 글자만. */
  leadingIcon?: string;
  options: ReadonlyArray<DropOption<T>>;
  value: T;
  onSelect: (value: T) => void;
  align?: DropAlign;
  /**
   * `.drop-bottom` 자리. 여기서 일어난 클릭은 **목록을 닫고 버튼으로 초점을 돌린다**
   * — 초기화처럼 값을 바꾸는 동작이 들어오는 자리라 옵션을 고른 것과 같이 다룬다.
   */
  footer?: ReactNode;
  className?: string;
  /** 감싸개에 붙일 `data-adjust` 값(킷 샘플의 손잡이). */
  dataAdjust?: string;
  wrapProps: Omit<ComponentPropsWithRef<'div'>, 'children'>;
};

/**
 * 드롭다운 껍데기. 상호작용은 10_02 원문 그대로 — Esc 는 접고 버튼으로 초점 복귀,
 * 접힌 상태의 ↑↓ 는 **선택값 자체를** 옮기고, 목록 안에서는 초점만 옮긴다.
 * `role="menu"` 를 쓰지 않는다 — 가이드가 Tab 으로 항목에 닿을 것을 요구한다.
 */
function DropdownShell<T extends string>({
  wrapClass,
  triggerLabel,
  leadingIcon,
  options,
  value,
  onSelect,
  align,
  footer,
  className,
  dataAdjust,
  wrapProps,
}: DropdownShellProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // 바깥을 누르면 접는다(가이드라인: 「레이블, 컨테이너, 옵션 목록이 아닌 영역을 Click 하면 축소」).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  /** 목록 안 n 번째 항목으로 초점을 옮긴다. */
  const focusItem = (index: number) => {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('.item-link');
    if (!items?.length) return;
    const i = (index + items.length) % items.length;
    items[i]?.focus();
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (open) {
      // 펼쳐져 있으면 목록으로 들어간다.
      focusItem(e.key === 'ArrowDown' ? 0 : options.length - 1);
      return;
    }
    // 접혀 있으면 **선택값 자체가** 이전/다음으로 바뀐다(가이드라인 원문).
    const at = options.findIndex((o) => o.value === value);
    const next = e.key === 'ArrowDown' ? at + 1 : at - 1;
    if (next >= 0 && next < options.length) onSelect(options[next].value);
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('.item-link') ?? [],
    );
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(at + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(at - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusItem(items.length - 1);
    }
  };

  // Esc 는 감싸개에서 한 번에 받는다 — 버튼에 있든 항목에 있든 접고 버튼으로 돌아간다.
  const onWrapKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      close(true);
    }
  };

  // Tab 으로 껍데기 밖으로 나가면 접는다. relatedTarget 이 없으면(브라우저 UI 로 이동 등) 그대로 둔다.
  const onBlurCapture = (e: ReactFocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) setOpen(false);
  };

  const current = options.find((o) => o.value === value);

  return (
    <div
      // 밖에서 온 props 를 먼저 편다 — 아래 넷은 부품이 도는 데 꼭 필요한 배선이라 덮이면 안 된다.
      {...wrapProps}
      ref={wrapRef}
      className={cx('krds-drop-wrap', wrapClass, align && `drop-${align}`, className)}
      data-adjust={dataAdjust}
      onKeyDown={onWrapKeyDown}
      onBlurCapture={onBlurCapture}
    >
      {/* 킷은 앞뒤로 아이콘 둘을 두는데 `Button` 은 하나만 받아 여기서는 마크업을 그대로 쓴다. */}
      <button
        ref={triggerRef}
        type="button"
        className="krds-btn small text drop-btn"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        {leadingIcon && <i className={`svg-icon ico-${leadingIcon}`} aria-hidden="true" />}
        {triggerLabel}
        {/* 구조 ③ 「선택값」 — 킷 샘플은 목록의 .active 로만 보여 준다. 스크린리더에도 알린다. */}
        <span className="sr-only">현재 {current?.label ?? ''}</span>
        <i className="svg-icon ico-toggle" aria-hidden="true" />
      </button>

      {/* 킷에 여는 클래스가 없어 인라인 display 로 연다. 접힌 동안은 스크린리더도 읽지 않는다. */}
      <div
        ref={menuRef}
        id={menuId}
        className="drop-menu"
        style={open ? { display: 'block' } : undefined}
        onKeyDown={onMenuKeyDown}
      >
        <div className="drop-in">
          <ul className="drop-list">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={cx(
                    'item-link',
                    option.itemClass,
                    option.value === value && 'active',
                  )}
                  data-adjust-scale={option.data}
                  // 고른 값 표시. 목록이 role=listbox 가 아니므로 aria-selected 가 아니라 aria-current 다.
                  aria-current={option.value === value ? 'true' : undefined}
                  onClick={() => {
                    onSelect(option.value);
                    close(true);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
          {footer && (
            <div className="drop-bottom" onClick={() => close(true)}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * 5. 부품
 * ──────────────────────────────────────────────────────────────────────── */

export type ResizeProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'onSelect'> & {
  /** 버튼 글자. 기본 「화면 크기」. */
  label?: string;
  /** 초기화 버튼 글자. 기본 「초기화」. */
  resetLabel?: string;
  /** 드롭다운 정렬. */
  align?: DropAlign;
  /** 저장값이 없을 때의 배율. 기본 `md`(100%). */
  defaultScale?: ResizeScale;
  /** localStorage 기억. 기본 켬. */
  persist?: boolean;
  /** 배율이 바뀔 때. 서버에 남기고 싶을 때 쓴다. */
  onScaleChange?: (scale: ResizeScale) => void;
};

/**
 * 화면 크기 조정 — 헤더 유틸리티 줄에 놓는다. 5단(90~150%)에서 고른다.
 * 저장값은 붙은 뒤에 읽는다 — 그 한 프레임의 번쩍임은 {@link ViewSettingsScript} 가 없앤다.
 */
export function Resize({
  label = '화면 크기',
  resetLabel = '초기화',
  align,
  defaultScale = DEFAULT_SCALE,
  persist = true,
  onScaleChange,
  className,
  ...rest
}: ResizeProps) {
  const [scale, setScale] = useState<ResizeScale>(defaultScale);

  useEffect(() => {
    const initial = (persist && readStoredScale()) || defaultScale;
    setScale(initial);
    applyScale(initial);
  }, [persist, defaultScale]);

  const select = useCallback(
    (next: ResizeScale) => {
      setScale(next);
      applyScale(next);
      if (persist) writeStored(SCALE_STORAGE_KEY, next);
      onScaleChange?.(next);
    },
    [persist, onScaleChange],
  );

  return (
    <DropdownShell
      wrapClass="krds-resize"
      dataAdjust="scale"
      triggerLabel={label}
      options={RESIZE_SCALES.map((s) => ({
        value: s.value,
        label: s.label,
        // 킷이 이 클래스로 목록 앞 글자 미리보기 아이콘 크기(2.2~3.0rem)를 그린다.
        itemClass: s.value,
        data: s.value,
      }))}
      value={scale}
      onSelect={select}
      align={align}
      footer={
        // 킷 샘플 그대로 `krds-btn medium text` + ico-reset. 아이콘이 글자 앞에 온다.
        // 목록을 닫는 일은 껍데기(`.drop-bottom` 의 클릭)가 맡는다.
        <button
          type="button"
          className="krds-btn medium text"
          data-adjust-scale={DEFAULT_SCALE}
          onClick={() => select(DEFAULT_SCALE)}
        >
          <i className="svg-icon ico-reset" aria-hidden="true" /> {resetLabel}
        </button>
      }
      className={className}
      wrapProps={rest}
    />
  );
}

export type ViewModeSwitchProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'onSelect'> & {
  /** 버튼 글자. 기본 「화면 모드」. */
  label?: string;
  /** 드롭다운 정렬. */
  align?: DropAlign;
  /** 저장값이 없을 때의 모드. 기본 `light`. */
  defaultMode?: ViewMode;
  /** localStorage 기억. 기본 켬. */
  persist?: boolean;
  /**
   * 「기기 설정 따름」을 옵션에 넣는다. **기본 끔** — 보충 층이 그 모드를 재정의하지 않아
   * 킷 부품만 어두워지고 유틸리티로 그린 부분은 밝게 남는다.
   */
  systemOption?: boolean;
  /** 모드가 바뀔 때. */
  onModeChange?: (mode: ViewMode) => void;
};

/**
 * 선명한 화면 모드 전환 — 킷에 이름이 없는 우리 부품이다. 껍데기와 아이콘은 킷 것을 쓴다.
 *
 * **`<html data-krds-mode>` 를 붙이는 유일한 곳이다** — 이것 없이는 킷의 고대비 규칙이
 * 통째로 죽은 코드로 남는다.
 */
export function ViewModeSwitch({
  label = '화면 모드',
  align,
  defaultMode = 'light',
  persist = true,
  systemOption = false,
  onModeChange,
  className,
  ...rest
}: ViewModeSwitchProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const saved = (persist && readStoredViewMode()) || defaultMode;
    // 목록에서 뺀 값이 저장돼 있으면 기본 화면으로 되돌린다 — 고를 수도 끌 수도 없는 상태를 막는다.
    const initial: ViewMode = saved === 'theme' && !systemOption ? 'light' : saved;
    setMode(initial);
    applyViewMode(initial);
  }, [persist, defaultMode, systemOption]);

  const select = useCallback(
    (next: ViewMode) => {
      setMode(next);
      applyViewMode(next);
      if (persist) writeStored(VIEW_MODE_STORAGE_KEY, next);
      onModeChange?.(next);
    },
    [persist, onModeChange],
  );

  const options = VIEW_MODES.filter((m) => systemOption || m.value !== 'theme');

  return (
    <DropdownShell
      wrapClass={undefined}
      triggerLabel={label}
      leadingIcon="view-mode"
      options={options.map((m) => ({ value: m.value, label: m.label }))}
      value={mode}
      onSelect={select}
      align={align}
      className={className}
      wrapProps={rest}
    />
  );
}
