'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../lib/krds';

/**
 * 토스트 — 킷에 없다. KRDS 토큰으로 그리는 보충 부품이다.
 *
 * 저장·삭제 결과를 한 줄로 알리고 스스로 사라진다. `ToastProvider` 를 **레이아웃 한 곳에** 두고
 * 화면에서는 `useToast()` 로 띄운다.
 * **한 줄 짧은 문장만** 담는다 — 두 줄 이상 설명은 `ui/modal`, 되돌리기 같은 행동이 붙으면 스낵바다.
 * 폼 필드의 오류·성공은 토스트가 아니라 `ui/field` 의 인라인 문구다.
 * 재난·장애는 `ui/critical-alert`, 늘 떠 있는 안내는 `ui/alert` 다.
 * `duration: 0` 이면 자동으로 사라지지 않는다(닫기 단추로만 닫힌다).
 *
 * @example
 * // 레이아웃
 * <ToastProvider><App /></ToastProvider>
 * // 화면
 * const toast = useToast();
 * toast.success('저장했습니다.');
 * toast.error('저장하지 못했습니다.');
 *
 * 자세히: docs/krds/09-부품-노트.md#토스트
 */

/** 색조. 킷 상태 아이콘이 셋뿐이라 세 가지다 — 「주의·경고형」은 `danger` 를 쓴다. */
export type ToastTone = 'information' | 'success' | 'danger';

/** 색조 → 킷 아이콘. 킷의 `form-hint-*` 가 쓰는 짝 그대로다. */
const TONE_ICON: Record<ToastTone, string> = {
  information: 'ico-information-fill',
  success: 'ico-success-fill',
  danger: 'ico-error-fill',
};

/** 색조 → 테두리색. 의미 토큰이라 선명한 화면 모드도 따라간다. */
const TONE_BORDER: Record<ToastTone, string> = {
  information: 'border-information-line',
  success: 'border-success-line',
  danger: 'border-danger-line',
};

/** 가이드의 권장 노출 시간(ms). 정보형 2~3초 · 주의·경고형 3~4초 중 상한이다. */
const DEFAULT_DURATION: Record<ToastTone, number> = {
  information: 3000,
  success: 3000,
  danger: 4000,
};

/** 사라지는 동안의 시간(ms). 아래 `duration-200` 과 짝이라 한쪽만 바꾸면 어긋난다. */
const LEAVE_MS = 200;

/* ────────────────────────────────────────────────────────────────────────
 * 토스트 한 줄
 * ──────────────────────────────────────────────────────────────────── */

export type ToastProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 색조. 기본 `information`. */
  tone?: ToastTone;
  /** 한 줄 메시지. **일부러 `string` 이다** — 더 길거나 링크가 붙으면 토스트가 아니다. */
  children: string;
  /** 닫기 단추를 누름. 주지 않으면 닫기 단추를 그리지 않는다. */
  onClose?: () => void;
  /** 닫기 단추의 스크린리더 이름. 아이콘뿐이라 이 문구가 없으면 읽을 것이 없다. */
  closeLabel?: string;
};

/**
 * 토스트 막대 하나. 보통은 `useToast()` 로 띄우고 이것을 직접 쓰지 않는다.
 * **직접 쓰면 라이브 영역이 아니다** — 소리로는 알려지지 않는다.
 */
export function Toast({
  tone = 'information',
  children,
  onClose,
  closeLabel = '알림 닫기',
  className,
  ...rest
}: ToastProps) {
  return (
    <div
      data-tone={tone}
      className={cx(
        'flex max-w-full items-center gap-2 rounded-lg border bg-surface px-4 py-3 text-sm text-fg',
        // 킷 모달의 그림자 토큰 그대로(`--krds-modal--wrap-shadow`). 우리 눈금에 그림자 단계가 없어 값으로 적는다.
        'shadow-[0_0_0.2rem_0_var(--krds-light-color-alpha-shadow2),0_1.6rem_2.4rem_0_var(--krds-light-color-alpha-shadow3)]',
        TONE_BORDER[tone],
        className,
      )}
      {...rest}
    >
      {/* 색조는 아이콘과 테두리가 나른다. 글자는 본문색 그대로 둔다 — 한 줄 문장이라 색까지 입히면 읽기 나빠진다. */}
      <i className={cx('svg-icon shrink-0', TONE_ICON[tone])} aria-hidden="true" />
      <p className="m-0 min-w-0 flex-1">{children}</p>
      {onClose && (
        // 킷 아이콘 버튼 규격 그대로: `krds-btn icon` + sr-only 이름 + `ico-popup-close`(24px 정사각).
        <button type="button" className="krds-btn medium icon shrink-0" onClick={onClose}>
          <span className="sr-only">{closeLabel}</span>
          <i className="svg-icon ico-popup-close" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * 띄우고 지우는 쪽
 * ──────────────────────────────────────────────────────────────────── */

export type ToastOptions = {
  /** 색조. 기본 `information`. */
  tone?: ToastTone;
  /** 노출 시간(ms). 생략하면 색조별 권장값. **`0` 이면 자동으로 사라지지 않는다.** */
  duration?: number;
  /** 닫기 단추의 스크린리더 이름. */
  closeLabel?: string;
};

type ToastEntry = Required<Pick<ToastOptions, 'tone' | 'duration'>> & {
  id: string;
  message: string;
  closeLabel?: string;
  /** 사라지는 중. 화면에서 지우기 전 `LEAVE_MS` 동안만 참이다. */
  leaving?: boolean;
};

export type ToastApi = {
  /** 토스트를 띄우고 식별자를 돌려준다. */
  show(message: string, options?: ToastOptions): string;
  /** `show(message, { tone: 'information' })` */
  info(message: string, options?: Omit<ToastOptions, 'tone'>): string;
  /** `show(message, { tone: 'success' })` — 저장·삭제 성공 */
  success(message: string, options?: Omit<ToastOptions, 'tone'>): string;
  /** `show(message, { tone: 'danger' })` — 실패. 되풀이되면 토스트 말고 모달로 낸다. */
  error(message: string, options?: Omit<ToastOptions, 'tone'>): string;
  /** 하나를 지운다. */
  dismiss(id: string): void;
  /** 전부 즉시 지운다(사라지는 동작 없음). 화면을 옮길 때 쓴다. */
  dismissAll(): void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** 토스트를 띄운다. `<ToastProvider>` 안에서만 쓸 수 있다. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('useToast() 는 <ToastProvider> 안에서만 쓸 수 있다. 레이아웃에 넣었는지 확인하라.');
  }
  return api;
}

export type ToastProviderProps = {
  /** 앱 전체. */
  children?: ReactNode;
  /** 한 번에 띄울 최대 개수. 기본 3 — 넘으면 오래된 것부터 사라진다. */
  max?: number;
  /** 뷰포트에 붙는다. 하단 고정 요소와 겹칠 때 `bottom-*` 을 올리는 자리. */
  className?: string;
};

/**
 * 토스트 뷰포트 + 띄우는 함수를 공급한다. **레이아웃 한 곳에만 둔다.**
 * 뷰포트는 비어 있어도 그려진다 — 라이브 영역이 메시지보다 먼저 있어야 낭독된다.
 */
export function ToastProvider({ children, max = 3, className }: ToastProviderProps) {
  const [items, setItems] = useState<ToastEntry[]>([]);
  /** 포인터가 올라가 있거나 안에 초점이 있으면 참. 이때 자동 사라짐을 멈춘다(WCAG 2.2.1). */
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const seq = useRef(0);
  const leaveTimers = useRef(new Map<string, number>());

  useEffect(() => setMounted(true), []);

  // 화면을 떠날 때 남은 타이머를 정리한다.
  useEffect(() => {
    const timers = leaveTimers.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    if (leaveTimers.current.has(id)) return; // 이미 사라지는 중
    setItems((list) => list.map((it) => (it.id === id ? { ...it, leaving: true } : it)));
    const timer = window.setTimeout(() => {
      leaveTimers.current.delete(id);
      setItems((list) => list.filter((it) => it.id !== id));
    }, LEAVE_MS);
    leaveTimers.current.set(id, timer);
  }, []);

  const api = useMemo<ToastApi>(() => {
    const show = (message: string, options: ToastOptions = {}) => {
      const tone = options.tone ?? 'information';
      seq.current += 1;
      const id = `toast-${seq.current}`;
      const entry: ToastEntry = {
        id,
        message,
        tone,
        duration: options.duration ?? DEFAULT_DURATION[tone],
        closeLabel: options.closeLabel,
      };
      // 넘치면 오래된 것부터 버린다.
      setItems((list) => [...list, entry].slice(-max));
      return id;
    };
    return {
      show,
      info: (message, options) => show(message, { ...options, tone: 'information' }),
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      error: (message, options) => show(message, { ...options, tone: 'danger' }),
      dismiss,
      dismissAll: () => {
        leaveTimers.current.forEach((t) => window.clearTimeout(t));
        leaveTimers.current.clear();
        setItems([]);
      },
    };
  }, [dismiss, max]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            // 기본값이 true 라 토스트가 하나 늘 때마다 영역 전체가 다시 낭독된다.
            aria-atomic="false"
            className={cx(
              // 가이드: 「토스트는 화면 중앙 하단에 표시한다」.
              'pointer-events-none fixed bottom-10 left-1/2 z-[1030] -translate-x-1/2',
              'flex w-full max-w-[48rem] flex-col items-center gap-2 px-4',
              className,
            )}
            // 포인터가 올라가거나 초점이 들어오면 자동 사라짐을 멈춘다(WCAG 2.2.1).
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {items.map((item) => (
              <ToastRow key={item.id} item={item} paused={paused} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/** 뷰포트 안의 토스트 한 줄. 자기 타이머와 나타남/사라짐만 맡는다. */
function ToastRow({
  item,
  paused,
  onDismiss,
}: {
  item: ToastEntry;
  paused: boolean;
  onDismiss: (id: string) => void;
}) {
  const [entered, setEntered] = useState(false);

  // 붙자마자 한 프레임 뒤에 켠다 — 같은 프레임에 바꾸면 전이가 일어나지 않는다.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (paused || item.leaving || !item.duration) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
    // 멈췄다 풀리면 시간을 처음부터 다시 센다 — 남은 시간을 이어 세지 않는다.
    // 읽던 사람에게 더 넉넉한 쪽이라 그대로 뒀다.
  }, [paused, item.leaving, item.duration, item.id, onDismiss]);

  const shown = entered && !item.leaving;

  return (
    <Toast
      tone={item.tone}
      closeLabel={item.closeLabel}
      onClose={() => onDismiss(item.id)}
      className={cx(
        // 뷰포트가 pointer-events-none 이라 막대에서 되살린다 — 아래 화면을 가리지 않기 위해서다.
        'pointer-events-auto transition duration-200 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      {item.message}
    </Toast>
  );
}
