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
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 모달(대화 상자) — KRDS `krds-modal`.
 *
 * **최후의 수단이다.** 폼 오류·성공은 `Field` 의 인라인 문구, 저장 결과는 `Toast` 로 낸다.
 * 폭은 `size` 3단에서 고르고 픽셀을 손으로 넘기지 않는다.
 * 확정·취소는 `Modal.Footer` 에 두고 제출이 가장 오른쪽이다.
 * 승인이 필요한 모달에는 `Modal.Close` 를 두지 않고 `dismissible={false}` 로 Esc 도 막는다.
 * 옆에서 미끄러져 나오는 패널은 `ui/drawer` 다.
 *
 * @example
 * <Modal.Root open={open} onClose={close} size="medium">
 *   <Modal.Header>정말 삭제할까요?</Modal.Header>
 *   <Modal.Body>지운 글은 되살릴 수 없습니다.</Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="tertiary" onClick={close}>아니요</Button>
 *     <Button variant="primary" onClick={remove}>예</Button>
 *   </Modal.Footer>
 *   <Modal.Close />
 * </Modal.Root>
 *
 * 자세히: docs/krds/09-부품-노트.md#모달
 */

/** 폭 3단 — 400 / 560 / 760px. 픽셀을 손으로 넘기지 말고 여기서 고른다. */
export type ModalSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

const SIZE_CLASS: Record<ModalSize, string> = {
  small: 'modal-sm',
  medium: 'modal-md',
  large: 'modal-lg',
};

/** 유형. `bottom-sheet` 는 킷 안에서 모바일 주메뉴가 쓰던 형태다 — 범용 서랍 대용으로 쓰지 마라. */
export type ModalType = 'dialog' | 'full' | 'bottom-sheet';

/**
 * 킷 JS 가 쓰는 지연값. 킷 CSS transition 과 짝이라 임의로 줄이면 어긋난다.
 * `.in` 전까지 `visibility:hidden` 이라 초점 이동도 기다려야 한다.
 */
const ENTER_DELAY = 150;
const FOCUS_DELAY = 350;
const LEAVE_DELAY = 350;

/** 초점 가둠 대상. 킷 JS 보다 넓게 잡았다. */
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

/** 열려 있는 모달 수. 겹쳐 열릴 때 z-index 와 딤 중복을 킷 JS 와 같은 방식으로 처리한다. */
let openModals = 0;

/**
 * 뒤 문서 스크롤 잠금. 킷의 `body.scroll-no` 는 CSS 규칙이 없어 `body.style.overflow` 를 직접 다룬다.
 * 겹쳐 열릴 수 있으니 셈해서 마지막 하나가 닫힐 때만 되돌린다.
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

type ModalContextValue = {
  /** 제목 요소의 id. `Modal.Header` 가 붙이고 `Modal.Root` 가 `aria-labelledby` 로 가리킨다. */
  titleId: string;
  close: () => void;
  /** 제목이 실제로 있는지 알린다 — 없으면 `aria-labelledby` 가 허공을 가리키게 되므로 붙이지 않는다. */
  registerTitle: (has: boolean) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(name: string): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error(`<${name}> 은 <Modal.Root> 안에서만 쓸 수 있다.`);
  return ctx;
}

export type ModalRootProps = ComponentPropsWithRef<'section'> & {
  /** 열림 여부. 상태는 화면 쪽이 쥔다. */
  open: boolean;
  /** 닫아 달라는 요청 — Esc·`Modal.Close`·(켰다면) 딤 클릭에서 온다. */
  onClose: () => void;
  /** 기본 medium(560px). 3단에서 고른다. */
  size?: ModalSize;
  /** 유형. 기본 `dialog`. */
  type?: ModalType;
  /** Esc 로 닫을 수 있는가. 승인이 필요한 모달에서는 false. */
  dismissible?: boolean;
  /** 딤을 눌렀을 때 닫는가. 기본 false 가 킷 동작이다(초점만 되돌린다). */
  closeOnBackdrop?: boolean;
  /** 열릴 때 첫 초점. 기본 `dialog`(보조기술이 이름부터 읽는다) · `first` 는 첫 초점 요소로 보낸다. */
  initialFocus?: 'dialog' | 'first';
  /** 포털 대상. 기본 `document.body`. */
  container?: Element | null;
  /** `.modal-dialog` 에 붙일 클래스. */
  dialogClassName?: string;
  /** `.modal-content` 에 붙일 클래스. */
  contentClassName?: string;
  children?: ReactNode;
};

/**
 * 모달 바깥틀. 포털·초점 가둠·Esc·스크롤 잠금·초점 복귀를 모두 여기서 한다.
 *
 * `Modal.Header` 를 두면 `aria-labelledby` 가 자동으로 붙는다. 헤더 없이 쓸 거면
 * `aria-label` 을 직접 넘겨라 — 대화상자에는 반드시 이름이 있어야 한다.
 */
export function ModalRoot({
  open,
  onClose,
  size = 'medium',
  type = 'dialog',
  dismissible = true,
  closeOnBackdrop = false,
  initialFocus = 'dialog',
  container,
  dialogClassName,
  contentClassName,
  className,
  style,
  children,
  onKeyDown,
  onMouseDown,
  ...rest
}: ModalRootProps) {
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  /** `.shown` — display:block. 닫힌 뒤에도 사라지는 동안 유지한다. */
  const [shown, setShown] = useState(false);
  /** `.in` — opacity·visibility·z-index. */
  const [entered, setEntered] = useState(false);
  const [hasTitle, setHasTitle] = useState(false);
  /** 몇 번째로 열린 모달인가(1부터). */
  const [stack, setStack] = useState(1);

  // 초점 정책이 도중에 바뀌어도 열림 효과가 다시 돌지 않게 ref 로 읽는다.
  const initialFocusRef = useRef(initialFocus);
  initialFocusRef.current = initialFocus;

  // 서버에서는 포털을 만들지 않는다(hydration 어긋남 방지).
  useEffect(() => {
    setMounted(true);
  }, []);

  // 열림 — 스크롤 잠금 · 상태 클래스 · 초점 이동. 정리 단계에서 잠금 해제와 초점 복귀.
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    openModals += 1;
    setStack(openModals);
    setShown(true);
    lockScroll();

    const enterTimer = window.setTimeout(() => setEntered(true), ENTER_DELAY);
    const focusTimer = window.setTimeout(() => {
      const content = contentRef.current;
      if (!content) return;
      if (initialFocusRef.current === 'first') {
        const first = focusables(content)[0];
        if (first) {
          first.focus();
          return;
        }
      }
      content.focus();
    }, FOCUS_DELAY);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(focusTimer);
      openModals = Math.max(0, openModals - 1);
      setEntered(false);
      unlockScroll();
      // 모달을 열었던 요소로 초점 복귀 — 킷 `returnFocusToTrigger` 에 해당한다.
      restore?.focus?.();
    };
  }, [open]);

  // 닫힘 — `.in` 을 뗀 뒤 transition 만큼 기다렸다가 `.shown`(=DOM)을 뗀다.
  useEffect(() => {
    if (open || !shown) return;
    const timer = window.setTimeout(() => setShown(false), LEAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  const ctx = useMemo<ModalContextValue>(
    () => ({ titleId, close: onClose, registerTitle: setHasTitle }),
    [titleId, onClose],
  );

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      if (!dismissible) return;
      // 겹쳐 열린 경우 바깥 모달까지 닫히지 않도록 여기서 끊는다.
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const content = contentRef.current;
    if (!content) return;
    const nodes = focusables(content);
    if (nodes.length === 0) {
      event.preventDefault();
      content.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === content)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleMouseDown(event: ReactMouseEvent<HTMLElement>) {
    onMouseDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.modal-content')) return;
    if (closeOnBackdrop && dismissible) {
      onClose();
      return;
    }
    // 킷 기본 동작 — 바깥을 눌러도 닫지 않고 초점만 대화상자로 되돌린다.
    contentRef.current?.focus();
  }

  if (!mounted || !shown) return null;

  return createPortal(
    <ModalContext.Provider value={ctx}>
      <section
        // `fade` 는 샘플이 늘 붙이지만 킷 CSS 에 규칙이 없다(실측 0건). 샘플 충실도로 남긴다.
        className={cx('krds-modal', 'fade', shown && 'shown', entered && 'in', className)}
        role="dialog"
        // 킷 샘플에는 없다. 대화상자 밖을 보조기술이 읽지 않게 하는 표준 속성이라 더했다.
        // (킷 JS 는 대신 `#wrap` 에 inert 를 건다 — 겹쳐 열릴 때 어긋나므로 쓰지 않았다.)
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        data-type={type === 'dialog' ? undefined : type}
        // 겹쳐 열릴 때만 킷 `updateZIndex` 와 같은 값을 준다(기본은 킷 CSS 의 1010).
        style={stack > 1 ? { zIndex: 1010 + stack, ...style } : style}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        {...rest}
      >
        <div className={cx('modal-dialog', SIZE_CLASS[size], dialogClassName)}>
          {/* tabIndex -1 — 초점을 받되 Tab 순서에는 들어가지 않는다. 킷 CSS 에 `:focus` 테두리가 있다. */}
          <div className={cx('modal-content', contentClassName)} ref={contentRef} tabIndex={-1}>
            {children}
          </div>
        </div>
        {/* 딤. 겹쳐 열린 두 번째부터는 킷과 같이 켜지 않는다(딤이 겹쳐 어두워지는 것을 막는다). */}
        <div className={cx('modal-back', entered && stack === 1 && 'in')} />
      </section>
    </ModalContext.Provider>,
    container ?? document.body,
  );
}

export type ModalHeaderProps = ComponentPropsWithRef<'div'> & {
  /** 제목 태그 단계. 기본 h2 — 화면의 제목 위계에 맞춘다. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 제목을 눈에서만 감춘다. 이름 자체는 남는다. */
  hideTitle?: boolean;
  /** 제목 요소에 붙일 클래스. */
  titleClassName?: string;
  /** 제목 오른쪽에 놓을 것. 바텀시트 헤더가 space-between 이라 쓸모 있다. */
  extra?: ReactNode;
};

/** 제목 줄 — 킷 `modal-header > .modal-title`. **한 줄로 잘리므로 긴 제목을 넣지 마라.** */
export function ModalHeader({
  level = 2,
  hideTitle,
  titleClassName,
  extra,
  className,
  children,
  ...rest
}: ModalHeaderProps) {
  const { titleId, registerTitle } = useModalContext('Modal.Header');

  useEffect(() => {
    registerTitle(true);
    return () => registerTitle(false);
  }, [registerTitle]);

  const Heading = `h${level}` as 'h2';

  return (
    <div className={cx('modal-header', className)} {...rest}>
      <Heading id={titleId} className={cx(hideTitle ? 'sr-only' : 'modal-title', titleClassName)}>
        {children}
      </Heading>
      {extra}
    </div>
  );
}

export type ModalBodyProps = ComponentPropsWithRef<'div'> & {
  /** 안쪽 `conts-area` 에 붙일 클래스. 바깥 `modal-conts` 는 `className` 이 받는다. */
  areaClassName?: string;
};

/** 본문 — 킷 `modal-conts > .conts-area`. 스크롤이 생기면 `tabindex="0"` 을 붙인다. */
export function ModalBody({ className, areaClassName, children, ref, ...rest }: ModalBodyProps) {
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
      className={cx('modal-conts', className)}
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
      }}
      {...rest}
    >
      <div className={cx('conts-area', areaClassName)}>{children}</div>
    </div>
  );
}

export type ModalFooterProps = ComponentPropsWithRef<'div'> & {
  /** 좌우로 갈라 놓는다(킷 `multi-conts`). 왼쪽 보조 액션, 오른쪽 확정 액션. */
  split?: boolean;
};

/**
 * 푸터 — 확정·취소 액션 자리. 제출(primary)이 가장 오른쪽이다.
 * 정렬·간격·버튼 최소폭은 킷이 잡는다 — 여백을 손으로 붙이지 마라.
 */
export function ModalFooter({ split, className, children, ...rest }: ModalFooterProps) {
  return (
    <div className={cx('modal-btn', 'btn-wrap', split && 'multi-conts', className)} {...rest}>
      {children}
    </div>
  );
}

export type ModalCloseProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  /** 스크린리더가 읽을 이름. 아이콘만 있는 버튼이라 반드시 있어야 한다. */
  label?: string;
  size?: KrdsSize;
};

/**
 * 오른쪽 위 닫기 버튼. **`Modal.Root` 의 마지막 자식으로 두어라** —
 * 그래야 Tab 순서에서 본문·푸터를 지난 뒤 마지막에 닿는다.
 * 승인이 필요한 모달에는 이 버튼을 두지 않는다.
 */
export function ModalClose({
  label = '닫기',
  size = 'medium',
  className,
  onClick,
  type = 'button',
  ...rest
}: ModalCloseProps) {
  const { close } = useModalContext('Modal.Close');

  return (
    <button
      type={type}
      className={cx('krds-btn', size, 'icon', 'btn-close', className)}
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
export const Modal = {
  Root: ModalRoot,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
};
