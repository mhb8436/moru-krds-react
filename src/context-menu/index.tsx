'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Button } from '../button';
import { cx, type KrdsIcon, type KrdsSize } from '../lib/krds';

/**
 * 상황 메뉴(더보기 · 우클릭) — KRDS 에 없는 보충 부품이다.
 *
 * 모양은 킷 드롭다운(`krds-drop-wrap`), 동작은 WAI-ARIA APG 의 Menu Button 패턴이다.
 * 표 한 칸에 늘어선 행 동작을 하나로 접을 때 쓴다 — 「삭제」는 `danger` 로 표시하고
 * 구분선(`{ separator: true }`)으로 나머지와 떼어 놓는다.
 * **동작 목록에만 쓴다.** 메뉴는 Tab 을 가로막으므로 언어 전환·화면 크기처럼 Tab 으로 닿아야
 * 하는 목록에는 `ui/resize` 의 드롭다운을 쓴다. 하위 메뉴(2단)는 지원하지 않는다.
 *
 * @example
 * <ContextMenu
 *   label={`${row.name} 행 더보기`}
 *   items={[
 *     { id: 'edit', label: '수정', icon: 'setting', onSelect: () => edit(row) },
 *     { separator: true },
 *     { id: 'delete', label: '삭제', icon: 'delete', danger: true, onSelect: () => remove(row) },
 *   ]}
 * />
 *
 * 자세히: docs/krds/09-부품-노트.md#컨텍스트메뉴
 */

/* ────────────────────────────────────────────────────────────────────────
 * 1. 항목
 * ──────────────────────────────────────────────────────────────────────── */

/** 실행 항목. `href` 가 있으면 링크(`<a>`), 없으면 단추(`<button>`)로 그린다. */
export type ContextMenuAction = {
  id: string;
  label: ReactNode;
  /** 글자 탐색에 쓸 문자열. `label` 이 문자열이면 필요 없다. */
  text?: string;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 예: `delete` · `setting` · `download` */
  icon?: KrdsIcon;
  /** 이동이면 링크로 그린다. 동작에는 주지 않는다. */
  href?: string;
  target?: string;
  /** 초점은 받되 실행되지 않는다(`aria-disabled`). */
  disabled?: boolean;
  /** 되돌릴 수 없는 동작(삭제 등). 글자를 위험색으로 물들인다. */
  danger?: boolean;
  /** 현재 상태 표시(킷 `.active`). 정렬 기준처럼 「지금 이것」을 보일 때. */
  active?: boolean;
  onSelect?: (id: string) => void;
  separator?: never;
};

/** 구분선. 「삭제」처럼 되돌릴 수 없는 항목을 나머지와 떼어 놓는다. */
export type ContextMenuSeparatorItem = {
  separator: true;
  /** 목록 key 용. 없으면 순번으로 만든다. */
  id?: string;
};

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparatorItem;

/** 킷의 드롭다운 정렬 클래스(`.drop-left` · `.drop-right`). 생략하면 가운데(킷 기본). */
export type ContextMenuAlign = 'left' | 'center' | 'right';

/** 정렬 → 킷 클래스. `center` 는 킷 기본값이라 클래스가 없다. */
function alignClass(align: ContextMenuAlign | undefined): string | undefined {
  return align === 'left' || align === 'right' ? `drop-${align}` : undefined;
}

/** 글자 탐색에 쓸 문자열을 뽑는다. */
function itemText(item: ContextMenuAction): string {
  return (item.text ?? (typeof item.label === 'string' ? item.label : '')).trim().toLowerCase();
}

/* ────────────────────────────────────────────────────────────────────────
 * 2. 여닫기·초점 — 두 부품이 함께 쓴다
 * ──────────────────────────────────────────────────────────────────────── */

/** 열 때 어느 항목에 초점을 둘지. ↑ 로 열면 마지막 항목이다(APG). */
type InitialFocus = 'first' | 'last';

/** 글자 탐색 버퍼가 살아 있는 시간(ms). APG 예제가 쓰는 값이다. */
const TYPEAHEAD_RESET_MS = 500;

/** 커서 메뉴가 화면 아래로 넘칠 때 남길 여유(px). KRDS 눈금에 없어 그림자가 잘리지 않을 값으로 정했다. */
const VIEWPORT_GUTTER_PX = 8;

function useMenuController() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  /** 닫을 때 초점을 돌려줄 곳. 열기 직전에 채운다. */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  /** 열린 직후 초점을 둘 자리. */
  const initialFocusRef = useRef<InitialFocus>('first');

  /** 지금 메뉴 안에 있는 항목들. 구분선은 걸리지 않는다. */
  const items = useCallback(
    () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
    [],
  );

  /** 연다. `returnTo` 를 주지 않으면 열기 직전 초점이 있던 곳으로 돌아간다. */
  const openMenu = useCallback((initial: InitialFocus = 'first', returnTo?: HTMLElement | null) => {
    initialFocusRef.current = initial;
    returnFocusRef.current = returnTo ?? (document.activeElement as HTMLElement | null) ?? null;
    setOpen(true);
  }, []);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) returnFocusRef.current?.focus();
  }, []);

  // 열린 직후 첫(또는 마지막) 항목으로 초점을 옮긴다 — APG 의 Menu Button 규정이다.
  useEffect(() => {
    if (!open) return;
    const list = items();
    if (!list.length) return;
    (initialFocusRef.current === 'last' ? list[list.length - 1] : list[0]).focus();
  }, [open, items]);

  // 바깥을 누르면 닫는다. 초점은 돌려주지 않는다(누른 곳으로 가는 게 자연스럽다).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return { open, openMenu, close, wrapRef, menuRef, items };
}

/** 밖에서 온 ref 와 부품 내부 ref 를 함께 채운다. 감싸개 ref 를 삼키지 않으려고 둔다. */
function mergeRef<T>(inner: { current: T | null }, outer: Ref<T> | undefined) {
  return (node: T | null) => {
    inner.current = node;
    if (typeof outer === 'function') outer(node);
    else if (outer) outer.current = node;
  };
}

/** 열림이 바뀔 때만 알린다. 인라인 콜백이 매 렌더 새 함수라 ref 에 담아 의존성에서 뺀다. */
function useOpenChange(open: boolean, onOpenChange?: (open: boolean) => void) {
  const latest = useRef(onOpenChange);
  const mounted = useRef(false);
  useEffect(() => {
    latest.current = onOpenChange;
  });
  useEffect(() => {
    // 붙자마자 `false` 를 알리지 않는다 — 바뀐 것이 없다.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    latest.current?.(open);
  }, [open]);
}

/* ────────────────────────────────────────────────────────────────────────
 * 3. 목록 그리기
 * ──────────────────────────────────────────────────────────────────────── */

type MenuListProps = {
  id: string;
  items: ReadonlyArray<ContextMenuItem>;
  /** 메뉴 이름. 여는 단추가 있으면 그 id 를 `labelledBy` 로 준다. */
  label?: string;
  labelledBy?: string;
  menuRef: Ref<HTMLUListElement>;
  onKeyDown: (e: ReactKeyboardEvent<HTMLUListElement>) => void;
  onActivate: (item: ContextMenuAction) => void;
};

function MenuList({ id, items, label, labelledBy, menuRef, onKeyDown, onActivate }: MenuListProps) {
  return (
    <ul
      ref={menuRef}
      id={id}
      // ★ role="menu" 는 이 <ul> 에 준다. 바깥 .drop-menu 에 주면 ul/li 가 허용되지 않는 자식이 된다.
      role="menu"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className="drop-list"
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => {
        if (item.separator) {
          // 킷에 구분선 클래스가 없다 — 유틸리티로 그린다. 킷 목록 간격(--krds-gap-3=8px)에 맞춰 my-1(4px)씩.
          return (
            <li
              key={item.id ?? `separator-${index}`}
              role="separator"
              className="my-1 h-px bg-divider"
            />
          );
        }

        const { id: itemId, label: itemLabel, icon, href, target, disabled, danger, active } = item;
        const cls = cx(
          'item-link',
          active && 'active',
          // 킷에 위험·비활성 항목 모양이 없다 — 유틸리티로 보충한다.
          danger && !disabled && 'text-danger',
          disabled && 'text-fg-disabled cursor-not-allowed hover:bg-transparent',
        );
        const iconNode = icon ? (
          <i
            // .svg-icon 은 background-color 를 mask 색으로 쓴다 — 글자색과 맞추려면 bg-* 를 얹는다.
            className={cx(
              'svg-icon',
              `ico-${icon}`,
              danger && !disabled && 'bg-danger',
              disabled && 'bg-fg-disabled',
            )}
            aria-hidden="true"
          />
        ) : null;

        const shared = {
          role: 'menuitem' as const,
          // 메뉴 안에서는 ↑↓ 로만 오간다(roving tabindex). 초점은 부품이 옮긴다.
          tabIndex: -1,
          className: cls,
          // 비활성은 disabled 속성이 아니라 aria-disabled 다 — 초점은 받아야 한다(APG).
          'aria-disabled': disabled || undefined,
          'aria-current': active ? ('true' as const) : undefined,
        };

        return (
          <li key={itemId} role="none">
            {href !== undefined ? (
              <a
                {...shared}
                // 비활성 링크는 href 를 떼어 이동을 막는다. tabIndex=-1 이라 초점은 그대로 받는다.
                href={disabled ? undefined : href}
                target={target}
                // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구.
                title={target === '_blank' ? '새 창 열림' : undefined}
                onClick={(e) => {
                  if (disabled) {
                    e.preventDefault();
                    return;
                  }
                  onActivate(item);
                }}
              >
                {iconNode}
                {itemLabel}
              </a>
            ) : (
              <button
                {...shared}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onActivate(item);
                }}
              >
                {iconNode}
                {itemLabel}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * 4. 키보드 — APG Menu Button
 * ──────────────────────────────────────────────────────────────────────── */

type Nav = {
  items: () => HTMLElement[];
  close: (refocus?: boolean) => void;
};

/**
 * 메뉴 안 키 처리(APG) — ↓↑ 는 끝에서 돌고, Home/End 는 양 끝, Esc 는 닫고 초점 복귀,
 * Tab 은 닫고 흘려보내며, 글자를 치면 그 글자로 시작하는 다음 항목으로 간다.
 */
function useMenuKeyDown({ items, close }: Nav, entries: ReadonlyArray<ContextMenuItem>) {
  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 딸린 타이머는 부품이 사라질 때 반드시 끈다.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const focusAt = (list: HTMLElement[], index: number) => {
    if (!list.length) return;
    list[(index + list.length) % list.length].focus();
  };

  return (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(list, at + 1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(list, at - 1);
        return;
      case 'Home':
        e.preventDefault();
        focusAt(list, 0);
        return;
      case 'End':
        e.preventDefault();
        focusAt(list, list.length - 1);
        return;
      case 'Escape':
        // 바깥(모달 등)이 같은 Esc 를 받지 않도록 여기서 멈춘다.
        e.stopPropagation();
        e.preventDefault();
        close(true);
        return;
      case 'Tab':
        // APG: Tab 은 메뉴를 닫고 초점을 다음 요소로 넘긴다. preventDefault 하지 않는다.
        close();
        return;
      default:
        break;
    }

    // 글자 탐색. 조합키가 걸린 입력은 단축키이므로 건드리지 않는다.
    if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === ' ' && !buffer.current) return; // Space 는 실행(기본 동작)이다

    e.preventDefault();
    buffer.current += key;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      buffer.current = '';
    }, TYPEAHEAD_RESET_MS);

    // 구분선을 뺀 실제 항목 순서로 견준다 — DOM 순서(list)와 짝이 맞는다.
    const actions = entries.filter((i): i is ContextMenuAction => !i.separator);
    const from = at < 0 ? 0 : at + (buffer.current.length > 1 ? 0 : 1);
    for (let n = 0; n < actions.length; n += 1) {
      const i = (from + n) % actions.length;
      if (itemText(actions[i]).startsWith(buffer.current)) {
        focusAt(list, i);
        return;
      }
    }
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * 5. 더보기 단추 — ContextMenu
 * ──────────────────────────────────────────────────────────────────────── */

export type ContextMenuProps = Omit<ComponentPropsWithRef<'div'>, 'onSelect'> & {
  items: ReadonlyArray<ContextMenuItem>;
  /** 단추의 이름(`sr-only`). 표 안에서는 어느 행인지까지 담는다 — 「홍길동 행 더보기」. */
  label: string;
  /** 글자가 있는 단추로 그린다. 주면 아이콘 대신 「글자 + ico-toggle」이 된다. */
  triggerLabel?: ReactNode;
  /** 아이콘만인 단추의 아이콘. 기본 `more`(킷 `ico_more.svg`). */
  icon?: KrdsIcon;
  /** 단추 크기. 기본 small(40px) — 표 안 행 동작 자리에 맞춘 값이다. */
  size?: KrdsSize;
  /** 메뉴가 펼쳐지는 쪽. 기본 `right`(오른쪽 끝 열에 놓이는 자리라 왼쪽으로 편다). */
  align?: ContextMenuAlign;
  /** 항목별 `onSelect` 와 별개로, 무엇을 골랐든 한 번 부른다. */
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** 여는 단추에 붙일 클래스. */
  triggerClassName?: string;
};

/** 더보기 메뉴 — 표 행 동작·카드 우상단처럼 「이 대상에 대한 동작 묶음」을 접는다. */
export function ContextMenu({
  items,
  label,
  triggerLabel,
  icon = 'more',
  size = 'small',
  align = 'right',
  onSelect,
  onOpenChange,
  triggerClassName,
  className,
  ref,
  ...rest
}: ContextMenuProps) {
  const ctl = useMenuController();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const menuId = `${baseId}-menu`;
  const triggerId = `${baseId}-trigger`;

  const onKeyDownMenu = useMenuKeyDown({ items: ctl.items, close: ctl.close }, items);
  useOpenChange(ctl.open, onOpenChange);

  const toggle = () => {
    // 마우스로 눌렀을 때 Safari 는 단추에 초점을 주지 않는다 — 돌려줄 자리를 직접 지정한다.
    if (ctl.open) ctl.close(true);
    else ctl.openMenu('first', triggerRef.current);
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    // APG: ↓ 로 열면 첫 항목, ↑ 로 열면 마지막 항목에 초점.
    ctl.openMenu(e.key === 'ArrowDown' ? 'first' : 'last', triggerRef.current);
  };

  const triggerProps = {
    id: triggerId,
    ref: triggerRef,
    size,
    variant: 'text' as const,
    // drop-btn 은 킷 CSS 에 없는 손잡이 클래스지만 샘플에 있으므로 남긴다.
    className: cx('drop-btn', triggerClassName),
    'aria-haspopup': 'true' as const,
    'aria-expanded': ctl.open,
    'aria-controls': menuId,
    onClick: toggle,
    onKeyDown: onTriggerKeyDown,
  };

  return (
    <div
      {...rest}
      ref={mergeRef(ctl.wrapRef, ref)}
      className={cx('krds-drop-wrap', alignClass(align), className)}
      // 초점이 여는 단추에 있을 때의 Esc. 목록 안에서는 <ul> 이 먼저 받아 여기까지 오지 않는다.
      onKeyDown={(e) => {
        if (e.key === 'Escape' && ctl.open) {
          e.stopPropagation();
          ctl.close(true);
        }
      }}
    >
      {triggerLabel === undefined ? (
        <Button iconOnly icon={icon} label={label} {...triggerProps} />
      ) : (
        <Button icon="toggle" {...triggerProps}>
          {triggerLabel}
        </Button>
      )}

      {/*
        킷은 `.drop-menu{display:none}` 만 두고 여는 클래스를 주지 않는다 — 인라인으로 연다.
        접힌 동안 display:none 이라 스크린리더도 읽지 않는다(별도 hidden 처리가 필요 없다).
      */}
      <div className="drop-menu" style={ctl.open ? { display: 'block' } : undefined}>
        <div className="drop-in">
          <MenuList
            id={menuId}
            items={items}
            labelledBy={triggerId}
            menuRef={ctl.menuRef}
            onKeyDown={onKeyDownMenu}
            onActivate={(item) => {
              ctl.close(true);
              item.onSelect?.(item.id);
              onSelect?.(item.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * 6. 우클릭 영역 — ContextMenuArea
 * ──────────────────────────────────────────────────────────────────────── */

export type ContextMenuAreaProps = Omit<ComponentPropsWithRef<'div'>, 'onSelect'> & {
  items: ReadonlyArray<ContextMenuItem>;
  /** 메뉴 이름. 여는 단추가 없으니 여기서 준다 — 「목록 항목 동작」처럼. */
  label: string;
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** 우클릭을 가로채지 않는다(브라우저 기본 메뉴가 뜬다). */
  disabled?: boolean;
};

/**
 * 우클릭 메뉴 — 영역 안에서 오른쪽 단추(또는 Shift+F10 · ContextMenu 키)로 연다.
 *
 * **브라우저 기본 메뉴를 가린다.** 「새 탭에서 열기」를 빼앗으므로 꼭 필요한 곳에만 쓰고,
 * 같은 동작을 여는 눈에 보이는 단추(`ContextMenu`)를 함께 둔다.
 *
 * @example
 * <ContextMenuArea label="목록 항목 동작" items={rowActions}>
 *   <ul>…</ul>
 * </ContextMenuArea>
 */
export function ContextMenuArea({
  items,
  label,
  onSelect,
  onOpenChange,
  disabled,
  className,
  children,
  ref,
  ...rest
}: ContextMenuAreaProps) {
  const ctl = useMenuController();
  const menuId = useId();
  /** 감싸개 왼쪽 위를 원점으로 한 앵커 좌표(px). */
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState<'left' | 'right'>('left');
  const anchorRef = useRef<HTMLDivElement>(null);

  const onKeyDownMenu = useMenuKeyDown({ items: ctl.items, close: ctl.close }, items);
  useOpenChange(ctl.open, onOpenChange);

  // 화면 아래로 넘치면 그만큼 끌어올린다. 상태가 아니라 앵커의 style.top 을 직접 쓴다 —
  // 재고 나서 상태를 바꾸면 한 프레임이 잘못된 자리에 그려진다. 위로 뒤집지는 않는다(꼭지가 거꾸로 선다).
  useEffect(() => {
    if (!ctl.open) return;
    const anchor = anchorRef.current;
    const box = anchor?.firstElementChild?.getBoundingClientRect();
    if (!anchor || !box) return;
    const over = box.bottom - (window.innerHeight - VIEWPORT_GUTTER_PX);
    if (over > 0) anchor.style.top = `${pos.y - over}px`;
  }, [ctl.open, pos.x, pos.y]);

  /** 감싸개 기준 좌표로 옮겨 담고 연다. */
  const openAt = (clientX: number, clientY: number) => {
    const rect = ctl.wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: clientX - rect.left, y: clientY - rect.top });
    // 오른쪽 절반에서 열면 메뉴를 왼쪽으로 편다.
    setSide(clientX > window.innerWidth / 2 ? 'right' : 'left');
    ctl.openMenu('first');
  };

  const onContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    openAt(e.clientX, e.clientY);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // 메뉴가 열려 있으면 목록 쪽 처리에 맡긴다.
    if (ctl.open) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        ctl.close(true);
      }
      return;
    }
    if (disabled) return;
    // 키보드로 상황 메뉴를 여는 표준 두 가지.
    if (e.key !== 'ContextMenu' && !(e.key === 'F10' && e.shiftKey)) return;
    e.preventDefault();
    // 초점이 있는 요소의 왼쪽 아래에 띄운다 — 커서가 없으니 그 자리가 기준이다.
    const box = (e.target as HTMLElement).getBoundingClientRect?.();
    if (box) openAt(box.left, box.bottom);
  };

  return (
    <div
      {...rest}
      ref={mergeRef(ctl.wrapRef, ref)}
      // 킷 감싸개는 inline-flex 다 — 영역을 감싸는 쓰임이라 block 으로 되돌린다.
      className={cx('krds-drop-wrap block', ctl.open && `drop-${side}`, className)}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
    >
      {children}

      {ctl.open && (
        // 0 크기 앵커. 메뉴의 기준점일 뿐이라 화면에도 스크린리더에도 잡히지 않는다.
        <div
          ref={anchorRef}
          className="absolute"
          style={{ left: pos.x, top: pos.y, width: 0, height: 0 }}
        >
          <div className="drop-menu" style={{ display: 'block' }}>
            <div className="drop-in">
              <MenuList
                id={menuId}
                items={items}
                label={label}
                menuRef={ctl.menuRef}
                onKeyDown={onKeyDownMenu}
                onActivate={(item) => {
                  ctl.close(true);
                  item.onSelect?.(item.id);
                  onSelect?.(item.id);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
