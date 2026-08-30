'use client';

import { UiLink } from '../lib/link';
import {
  createContext,
  useContext,
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
 * 사이드 메뉴(LNB) — KRDS `krds-side-navigation`.
 *
 * 서비스 정보구조를 왼쪽에 펼친다. 조각을 조립해 쓴다 —
 * `SideNav`(제목) → `SideNavList` → `SideNavLink`·`SideNavButton`·`SideNavGroup`·`SideNavPopup`.
 * 깊이는 문맥이 세므로 `depth` 를 손으로 넘기지 않는다.
 * **현재 화면 표시는 `current`(→ 킷 `.selected`)다** — 킷 샘플의 `.active` 는 열림 표시일 뿐이다.
 * `lnb-tit`(= `SideNav` 의 `title`)은 LNB **전체**의 제목이라 한 번만 쓴다. 묶음 제목은 `SideNavSection`.
 * 같은 화면 안의 섹션 목차는 `ui/in-page-navigation` 이다.
 *
 * @example
 * <SideNav title="정보공개">
 *   <SideNavList>
 *     <SideNavLink href="/open/list" current>공표목록</SideNavLink>
 *     <SideNavGroup label="청구·처리" defaultOpen>
 *       <SideNavLink href="/open/request">청구 안내</SideNavLink>
 *     </SideNavGroup>
 *   </SideNavList>
 * </SideNav>
 *
 * 자세히: docs/krds/09-부품-노트.md#사이드내비게이션
 */

/** 깊이. 킷은 깊이마다 `<li>` 클래스가 다르다: 1 `lnb-item` · 2 `lnb-subitem` · 3 없음. */
type Depth = 1 | 2 | 3;

/** 깊이 문맥. 화면 쪽에서 깊이를 손으로 세지 않게 한다 — 잘못 세면 없어야 할 구분선이 생긴다. */
const DepthContext = createContext<Depth>(1);

function itemClass(depth: Depth): string | undefined {
  return depth === 1 ? 'lnb-item' : depth === 2 ? 'lnb-subitem' : undefined;
}

/* ────────────────────────────────────────────────────────────────────────── */

export type SideNavProps = Omit<ComponentPropsWithRef<'nav'>, 'title'> & {
  /** LNB **전체**의 제목. 대메뉴 이름 하나다 — 묶음마다 쓰면 위계가 뒤집힌다. */
  title?: ReactNode;
  /** `<nav>` 의 이름. 기본 「사이드 메뉴」(가이드가 명시한 문구). */
  label?: string;
};

export function SideNav({ title, label = '사이드 메뉴', className, children, ...rest }: SideNavProps) {
  return (
    <nav className={cx('krds-side-navigation', className)} aria-label={label} {...rest}>
      {title != null && <h2 className="lnb-tit">{title}</h2>}
      {children}
    </nav>
  );
}

/**
 * 메뉴 목록 — 킷 `lnb-list`. 여기 담긴 항목이 1뎁스다.
 *
 * `role="menubar"` 는 킷 샘플 그대로지만 메뉴 위젯의 키보드 규약은 구현하지 않는다 —
 * 목록 탐색으로 두려면 `role="list"` 를 넘겨 덮는다.
 */
export function SideNavList({ className, children, ...rest }: ComponentPropsWithRef<'ul'>) {
  return (
    <DepthContext value={1}>
      <ul className={cx('lnb-list', className)} role="menubar" {...rest}>
        {children}
      </ul>
    </DepthContext>
  );
}

/**
 * 묶음 — 목록 여러 개를 제목으로 나눌 때(관리자 화면처럼).
 * 킷에 이 자리의 클래스가 없어 작은 글머리(`<h3>`)로 보충했다 — `lnb-tit` 을 재사용하면 위계가 뒤집힌다.
 */
export type SideNavSectionProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  title: ReactNode;
};

export function SideNavSection({ title, className, children, ...rest }: SideNavSectionProps) {
  return (
    <div className={cx(className)} {...rest}>
      <h3 className="px-2 pt-6 pb-1 text-xs font-bold tracking-wider text-fg-subtle">{title}</h3>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

type ItemBaseProps = {
  /** 지금 보고 있는 화면인가. 킷 `.selected` 와 `aria-current` 가 함께 붙는다. */
  current?: boolean;
  /** `<li>` 에 얹을 클래스. `className` 은 링크/버튼 쪽으로 간다. */
  itemClassName?: string;
};

export type SideNavLinkProps = ComponentPropsWithRef<'a'> &
  ItemBaseProps & {
    href: string;
    /** 바깥 사이트. 새 창으로 열고 `UiLink` 대신 맨 `<a>` 로 그린다. */
    external?: boolean;
  };

/**
 * 메뉴 링크 — 킷 `lnb-btn lnb-link`. `<li role="none">` 과 `<a role="menuitem">` 을 함께 그린다.
 * 깊이에 맞는 `<li>` 클래스도 문맥에서 붙는다.
 */
export function SideNavLink({
  href,
  current,
  external,
  itemClassName,
  className,
  children,
  ...rest
}: SideNavLinkProps) {
  const depth = useContext(DepthContext);
  const cls = cx('lnb-btn', depth < 3 && 'lnb-link', current && 'selected', className);
  const aria = {
    role: 'menuitem',
    'aria-current': current ? ('page' as const) : undefined,
  };

  return (
    <li className={cx(itemClass(depth), current && 'active', itemClassName)} role="none">
      {external ? (
        <a
          href={href}
          className={cls}
          target="_blank"
          rel="noopener noreferrer"
          // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구.
          title="새 창 열림"
          {...aria}
          {...rest}
        >
          {children}
        </a>
      ) : (
        <UiLink href={href} className={cls} {...aria} {...rest}>
          {children}
        </UiLink>
      )}
    </li>
  );
}

export type SideNavButtonProps = ComponentPropsWithRef<'button'> & ItemBaseProps;

/**
 * 이동이 아니라 **화면 안에서 갈아 끼우는** 메뉴(관리자 탭). 모양은 링크와 같다.
 * 주소가 바뀌는 이동이라면 `SideNavLink` 를 쓴다.
 */
export function SideNavButton({
  current,
  itemClassName,
  className,
  children,
  type = 'button',
  ...rest
}: SideNavButtonProps) {
  const depth = useContext(DepthContext);
  return (
    <li className={cx(itemClass(depth), current && 'active', itemClassName)} role="none">
      <button
        type={type}
        className={cx('lnb-btn', depth < 3 && 'lnb-link', current && 'selected', className)}
        role="menuitem"
        aria-current={current ? 'page' : undefined}
        {...rest}
      >
        {children}
      </button>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

export type SideNavGroupProps = Omit<ComponentPropsWithRef<'li'>, 'title'> & {
  /** 접기 버튼에 쓸 글자. */
  label: ReactNode;
  /** 열려 있는가(제어형). 주면 이 값이 곧 상태다. */
  open?: boolean;
  /** 처음 열려 있는가(비제어형). **현재 화면을 품은 묶음은 열어 둔다.** */
  defaultOpen?: boolean;
  /** 여닫을 때. */
  onOpenChange?: (open: boolean) => void;
  /** 이 묶음 자체가 현재 위치인가. */
  current?: boolean;
};

/**
 * 접히는 묶음 — 킷 `lnb-btn lnb-toggle` + `lnb-submenu`.
 * **1뎁스에서만 펴진다** — 2뎁스에 또 접기를 넣으면 킷에 규칙이 없어 열리지 않는다.
 * 3뎁스 아래는 {@link SideNavPopup} 으로 푼다.
 */
export function SideNavGroup({
  label,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  current,
  className,
  children,
  ...rest
}: SideNavGroupProps) {
  const depth = useContext(DepthContext);
  const menuId = useId();
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const open = openProp ?? selfOpen;

  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setSelfOpen(next);
    onOpenChange?.(next);
  };

  return (
    <li className={cx(itemClass(depth), open && 'active', className)} role="none" {...rest}>
      <button
        type="button"
        className={cx('lnb-btn', 'lnb-toggle', open && 'active', current && 'selected')}
        role="menuitem"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={toggle}
      >
        {label}
      </button>
      <div className="lnb-submenu">
        <ul id={menuId} role="menu">
          <DepthContext value={2}>{children}</DepthContext>
        </ul>
      </div>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

export type SideNavPopupProps = Omit<ComponentPropsWithRef<'li'>, 'title'> & {
  /** 여는 버튼의 글자(3뎁스 메뉴 이름). */
  label: ReactNode;
  /** 패널 머리의 되돌아가기 버튼 글자. 없으면 `label` 을 쓴다. */
  title?: ReactNode;
};

/**
 * 4뎁스 팝업 — 킷 `lnb-btn lnb-toggle-popup` + `lnb-submenu-lv2`.
 *
 * LNB 폭을 통째로 덮으며 왼쪽에서 밀려 들어오는 패널이다 — 4뎁스는 접기가 아니라 화면 전환이다.
 * 열면 패널 머리 버튼으로 초점이 가고, 되돌아가기 버튼과 Esc 로 닫으면 원래 버튼으로 돌아온다.
 */
export function SideNavPopup({
  label,
  title,
  className,
  children,
  ...rest
}: SideNavPopupProps) {
  const depth = useContext(DepthContext);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);

  // 열리면 패널 머리로 초점을 옮긴다.
  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  const closeAndReturn = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleBlur = (e: ReactFocusEvent<HTMLDivElement>) => {
    if (!open) return;
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeAndReturn();
    }
  };

  return (
    <li className={cx(itemClass(depth), className)} role="none" {...rest}>
      <button
        ref={triggerRef}
        type="button"
        className="lnb-btn lnb-toggle-popup"
        role="menuitem"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <div
        id={menuId}
        className={cx('lnb-submenu-lv2', open && 'active')}
        role="menu"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <button ref={titleRef} type="button" className="lnb-btn-tit" onClick={closeAndReturn}>
          {title ?? label}
        </button>
        <ul>
          <DepthContext value={3}>{children}</DepthContext>
        </ul>
      </div>
    </li>
  );
}
