'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../lib/krds';

/**
 * 서랍(측면 패널) — KRDS 에 없다. 모양은 KRDS 토큰, 동작은 `Modal` 과 같은 보충 부품이다.
 *
 * 목록 옆에서 필터·상세를 여는 자리. 폭은 `size` 3단에서 고른다(픽셀을 넘기지 마라).
 * 확정·취소는 `Drawer.Footer` 에 두고 제출이 가장 오른쪽이다.
 * 뒤 화면을 계속 쓸 수 있어야 하면 `modal={false}` — 이때는 초점을 가두지 않는다.
 * 화면 한복판에 띄우는 대화상자는 `ui/modal` 이다.
 *
 * @example
 * <Drawer.Root open={open} onClose={close} side="right" size="small">
 *   <Drawer.Header extra={<Drawer.Close />}>검색 조건</Drawer.Header>
 *   <Drawer.Body>…필터 폼…</Drawer.Body>
 *   <Drawer.Footer split>
 *     <Button variant="text" onClick={reset}>초기화</Button>
 *     <Button variant="primary" onClick={apply}>적용</Button>
 *   </Drawer.Footer>
 * </Drawer.Root>
 *
 * 자세히: docs/krds/09-부품-노트.md#서랍
 */

/** 어느 쪽에서 나오는가. 아래에서 올라오는 것은 킷의 바텀시트(`ui/modal` 의 `type`) 자리다. */
export type DrawerSide = 'left' | 'right';

/** 폭 3단 — 400 / 560 / 760px. 킷 모달과 같은 눈금이다. */
export type DrawerSize = 'small' | 'medium' | 'large';

const WIDTH: Record<DrawerSize, string> = {
  small: '40rem', // 400px — 킷 --krds-modal--size-small
  medium: '56rem', // 560px — 킷 --krds-modal--size-medium
  large: '76rem', // 760px — 킷 --krds-modal--size-large
};

/** 전환 시간(ms). 킷 `--krds-transition-base` 와 같은 값이고 `duration-400` 과 짝이다. */
const TRANSITION_MS = 400;

/** 겹침 층. 킷 모달과 같은 값이라 서랍과 모달이 함께 열려도 순서가 뒤집히지 않는다. */
const Z_BASE = 1010;

/** 초점 가둠 대상. `Modal` 과 같은 목록이다. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details > summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('inert') &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0),
  );
}

/** 열려 있는 서랍 수. 겹쳐 열릴 때 z-index 를 킷 모달과 같은 방식으로 올린다. */
let openDrawers = 0;

/**
 * 뒤 문서 스크롤 잠금. 킷의 `body.scroll-no` 는 CSS 규칙이 없어 `body.style.overflow` 를 직접 다룬다.
 * 셈은 이 모듈 안에서만 유효하다 — 모달과 겹쳐 열리면 어긋날 수 있다.
 */
let scrollLocks = 0;
let savedOverflow = '';

function lockScroll() {
  if (scrollLocks++ > 0) return;
  savedOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks > 0) return;
  document.body.style.overflow = savedOverflow;
}

type DrawerContextValue = {
  /** 제목 요소의 id. `Drawer.Header` 가 붙이고 `Drawer.Root` 가 `aria-labelledby` 로 가리킨다. */
  titleId: string;
  close: () => void;
  /** 제목이 실제로 있는지 알린다 — 없으면 `aria-labelledby` 가 허공을 가리킨다. */
  registerTitle: (has: boolean) => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(name: string): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error(`<${name}> 은 <Drawer.Root> 안에서만 쓸 수 있다.`);
  return ctx;
}

export type DrawerRootProps = ComponentPropsWithRef<'div'> & {
  /** 열림 여부. 상태는 화면 쪽이 쥔다. */
  open: boolean;
  /** 닫아 달라는 요청 — Esc·딤 클릭·`Drawer.Close` 에서 온다. */
  onClose: () => void;
  /** 나오는 방향. 기본 오른쪽. */
  side?: DrawerSide;
  /** 기본 small(400px). 3단에서 고른다. */
  size?: DrawerSize;
  /** 딤을 깔고 초점을 가두는가. 기본 true — false 면 뒤 화면을 계속 쓸 수 있다. */
  modal?: boolean;
  /** Esc 로 닫을 수 있는가. */
  dismissible?: boolean;
  /** 딤을 눌렀을 때 닫는가. 기본 true — 값을 잃으면 곤란한 서랍에서는 꺼라. */
  closeOnBackdrop?: boolean;
  /** 열릴 때 첫 초점. 기본 `panel`(보조기술이 이름부터 읽는다) · `first` 는 첫 초점 요소로 보낸다. */
  initialFocus?: 'panel' | 'first';
  /** 포털 대상. 기본 `document.body`. */
  container?: Element | null;
  /** 패널(흰 면)에 붙일 클래스. 바깥틀은 `className` 이 받는다. */
  panelClassName?: string;
  /** 패널에 붙일 인라인 style. 폭을 3단 밖으로 바꿔야 할 때. */
  panelStyle?: CSSProperties;
  children?: ReactNode;
};

/**
 * 서랍 바깥틀. 포털 · 초점 가둠 · Esc · 스크롤 잠금 · 초점 복귀를 여기서 한다.
 *
 * `Drawer.Header` 를 두면 `aria-labelledby` 가 자동으로 붙는다. 헤더 없이 쓸 거면
 * `aria-label` 을 직접 넘겨라 — 대화상자에는 반드시 이름이 있어야 한다.
 */
export function DrawerRoot({
  open,
  onClose,
  side = 'right',
  size = 'small',
  modal = true,
  dismissible = true,
  closeOnBackdrop = true,
  initialFocus = 'panel',
  container,
  panelClassName,
  panelStyle,
  className,
  style,
  children,
  onKeyDown,
  onMouseDown,
  ...rest
}: DrawerRootProps) {
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  /** DOM 에 붙어 있는가. 닫힌 뒤에도 미끄러져 나가는 동안 유지한다. */
  const [present, setPresent] = useState(false);
  /** 다 들어왔는가(= 딤이 보이고 패널이 제자리). 첫 그림 뒤에 켜야 전환이 돈다. */
  const [entered, setEntered] = useState(false);
  const [hasTitle, setHasTitle] = useState(false);
  /** 몇 번째로 열린 서랍인가(1부터). */
  const [stack, setStack] = useState(1);

  // 초점 정책이 도중에 바뀌어도 열림 효과가 다시 돌지 않게 ref 로 읽는다.
  const initialFocusRef = useRef(initialFocus);
  initialFocusRef.current = initialFocus;
  const modalRef = useRef(modal);
  modalRef.current = modal;

  // 서버에서는 포털을 만들지 않는다(hydration 어긋남 방지).
  useEffect(() => {
    setMounted(true);
  }, []);

  // 열림 — 스크롤 잠금 · 상태 · 초점 이동. 정리 단계에서 잠금 해제와 초점 복귀.
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    openDrawers += 1;
    setStack(openDrawers);
    setPresent(true);
    // 잠갔는지를 지역 변수로 들고 있는다 — 열려 있는 동안 `modal` 이 바뀌어도
    // 잠금과 해제가 짝을 이루게 한다(ref 를 정리 단계에서 다시 읽으면 한쪽만 돌 수 있다).
    const didLock = modalRef.current;
    if (didLock) lockScroll();

    // 프레임을 두 번 넘겨야 브라우저가 「밖 → 안」을 전환으로 본다.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });

    // 서랍은 visibility 를 쓰지 않아 전환을 기다리지 않고 바로 초점을 줄 수 있다.
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      if (initialFocusRef.current === 'first') {
        const first = focusables(panel)[0];
        if (first) {
          first.focus();
          return;
        }
      }
      panel.focus();
    }, 0);

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.clearTimeout(focusTimer);
      openDrawers = Math.max(0, openDrawers - 1);
      setEntered(false);
      if (didLock) unlockScroll();
      // 서랍을 열었던 요소로 초점 복귀 — 킷 도움 패널의 `lastFocusedButton.focus()` 에 해당한다.
      restore?.focus?.();
    };
  }, [open]);

  // 닫힘 — 전환이 끝난 뒤에 DOM 에서 뗀다.
  useEffect(() => {
    if (open || !present) return;
    const timer = window.setTimeout(() => setPresent(false), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [open, present]);

  const ctx = useMemo<DrawerContextValue>(
    () => ({ titleId, close: onClose, registerTitle: setHasTitle }),
    [titleId, onClose],
  );

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      if (!dismissible) return;
      // 겹쳐 열린 경우 바깥 서랍·모달까지 닫히지 않도록 여기서 끊는다.
      event.stopPropagation();
      onClose();
      return;
    }

    // 딤 없는 서랍은 가두지 않는다 — 뒤 화면을 계속 쓸 수 있어야 하므로 Tab 이 나가야 한다.
    if (!modal) return;
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = focusables(panel);
    if (nodes.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    onMouseDown?.(event);
    if (event.defaultPrevented) return;
    if (!modal) return;
    // 패널 안을 누른 것은 딤 클릭이 아니다. `mousedown` 으로 보는 이유는 킷 모달과 같다 —
    // 패널 안에서 시작해 딤에서 끝나는 드래그를 「바깥 클릭」으로 오해하지 않기 위해서다.
    const target = event.target as Node | null;
    if (target && panelRef.current?.contains(target)) return;
    if (closeOnBackdrop && dismissible) {
      onClose();
      return;
    }
    // 닫지 않기로 했으면 초점만 되돌린다 — 킷 모달의 바깥 클릭 동작이 이것이다.
    panelRef.current?.focus();
  }

  if (!mounted || !present) return null;

  const slideOut = side === 'right' ? 'translate-x-full' : '-translate-x-full';

  return createPortal(
    <DrawerContext.Provider value={ctx}>
      <div
        role="dialog"
        aria-modal={modal ? true : undefined}
        aria-labelledby={hasTitle ? titleId : undefined}
        // 딤이 없을 때는 바깥틀이 화면을 덮은 채 클릭을 먹지 않게 한다(뒤 화면을 계속 쓴다).
        className={cx('fixed inset-0', !modal && 'pointer-events-none', className)}
        style={{ zIndex: Z_BASE + stack, ...style }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        {...rest}
      >
        {modal && (
          <div
            aria-hidden="true"
            className={cx(
              'absolute inset-0 bg-bg-dim transition-opacity duration-400 ease-in-out motion-reduce:transition-none',
              entered ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}
        {/*
          패널. tabIndex -1 로 초점만 받고 Tab 순서에는 들어가지 않는다.
          `:focus` 테두리는 킷 모달(`.modal-content:focus`)과 같은 토큰
          `--krds-box-shadow-outline-inset` 을 그대로 쓴다. 표기는 `ui/radio` 와 맞춘 임의 속성 형태다.
          (선명한 화면 모드에서 이 토큰 색이 안 바뀌는 것은 킷 결함이다 —
           `[data-krds-mode=high-contrast] :root` 는 :root 가 자기 후손일 수 없어 맞지 않는다.
           킷 컴포넌트 전부가 같은 상태라 여기서만 따로 고치지 않는다. `ui/resize` 주석 참조.)
        */}
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cx(
            'pointer-events-auto absolute inset-y-0 flex h-full max-w-full flex-col bg-surface text-fg',
            'transition-transform duration-400 ease-in-out motion-reduce:transition-none',
            'focus:[box-shadow:var(--krds-box-shadow-outline-inset)] focus:outline-none',
            side === 'right' ? 'right-0 border-l border-line' : 'left-0 border-r border-line',
            !entered && slideOut,
            panelClassName,
          )}
          style={{ width: WIDTH[size], ...panelStyle }}
        >
          {children}
        </div>
      </div>
    </DrawerContext.Provider>,
    container ?? document.body,
  );
}

export type DrawerHeaderProps = ComponentPropsWithRef<'div'> & {
  /** 제목 태그 단계. 기본 h2 — 화면의 제목 위계에 맞춘다. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 제목을 눈에서만 감춘다. 이름 자체는 남는다. */
  hideTitle?: boolean;
  /** 제목 요소에 붙일 클래스. */
  titleClassName?: string;
  /** 제목 오른쪽 자리. 닫기 버튼(`Drawer.Close`)을 여기에 둔다. */
  extra?: ReactNode;
};

/**
 * 제목 줄. 이 부품을 두면 서랍의 접근 가능한 이름이 자동으로 이어진다.
 *
 * @example
 * <Drawer.Header extra={<Drawer.Close />}>검색 조건</Drawer.Header>
 */
export function DrawerHeader({
  level = 2,
  hideTitle,
  titleClassName,
  extra,
  className,
  children,
  ...rest
}: DrawerHeaderProps) {
  const { titleId, registerTitle } = useDrawerContext('Drawer.Header');

  useEffect(() => {
    registerTitle(true);
    return () => registerTitle(false);
  }, [registerTitle]);

  const Heading = `h${level}` as 'h2';

  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-5 md:px-10',
        className,
      )}
      {...rest}
    >
      <Heading
        id={titleId}
        className={cx(
          hideTitle ? 'sr-only' : 'truncate text-heading-sm font-bold text-fg-bolder',
          titleClassName,
        )}
      >
        {children}
      </Heading>
      {extra}
    </div>
  );
}

/** 본문. 스크롤이 생기면 `tabindex="0"` 을 붙여 키보드로도 굴릴 수 있게 한다. */
export function DrawerBody({ className, children, ref, ...rest }: ComponentPropsWithRef<'div'>) {
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    const sync = () => {
      if (node.scrollHeight > node.clientHeight) node.setAttribute('tabindex', '0');
      else node.removeAttribute('tabindex');
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cx('min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10', className)}
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export type DrawerFooterProps = ComponentPropsWithRef<'div'> & {
  /** 좌우로 갈라 놓는다. 왼쪽에 보조 액션, 오른쪽에 확정 액션을 둘 때. */
  split?: boolean;
};

/**
 * 푸터 — 확정·취소 액션 자리. 제출(primary)이 가장 오른쪽이다.
 * `split` 을 주면 왼쪽 보조 액션과 오른쪽 확정 액션으로 갈라 놓는다.
 */
export function DrawerFooter({ split, className, children, ...rest }: DrawerFooterProps) {
  return (
    <div
      className={cx(
        'btn-wrap flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-4 py-5 md:px-10',
        split ? 'justify-between' : 'justify-end',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type DrawerCloseProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  /** 스크린리더가 읽을 이름. 아이콘만 있는 버튼이라 반드시 있어야 한다. */
  label?: string;
};

/**
 * 닫기 버튼 — 킷 `krds-btn small icon` + `ico-popup-close`.
 * **모달과 달리 `Drawer.Header` 의 `extra` 에 넣는다.**
 *
 * @example
 * <Drawer.Header extra={<Drawer.Close />}>필터</Drawer.Header>
 */
export function DrawerClose({
  label = '닫기',
  className,
  onClick,
  type = 'button',
  ...rest
}: DrawerCloseProps) {
  const { close } = useDrawerContext('Drawer.Close');

  return (
    <button
      type={type}
      // small(40px) — 헤더 한 줄에 들어가야 해서 모달의 medium(48px)보다 한 단 작다.
      className={cx('krds-btn small icon shrink-0', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...rest}
    >
      <span className="sr-only">{label}</span>
      <i className="svg-icon ico-popup-close" aria-hidden="true" />
    </button>
  );
}

/** 합성용 묶음. `Root` · `Header` · `Body` · `Footer` · `Close`. */
export const Drawer = {
  Root: DrawerRoot,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
};
