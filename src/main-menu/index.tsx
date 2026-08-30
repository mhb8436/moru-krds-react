'use client';

import { UiLink } from '../lib/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../lib/krds';

/**
 * 주메뉴(GNB) — KRDS `krds-main-menu`(PC) · `krds-main-menu-mobile`(모바일).
 *
 * 같은 `items` 를 두 부품에 넘긴다. 킷 CSS 가 1023px 이하에서 PC 메뉴를, 1024px 이상에서
 * 모바일 서랍을 감추므로 미디어쿼리를 따로 쓰지 않는다.
 * 계층은 **최대 3수준**이고 타입이 그것을 강제한다 — {@link MainMenuTop} → {@link MainMenuGroup}
 * → {@link MainMenuLink}. `items` 가 없는 단계는 드롭다운 없는 단순 링크가 된다.
 * **마우스오버로 열리지 않는다**(규격 금지) — 클릭·키보드로만 연다.
 * 화면 안쪽의 하위 메뉴는 `ui/side-navigation` 이다.
 *
 * @example
 * const menu: MainMenuTop[] = [
 *   { label: '기관소개', href: '/about' },
 *   {
 *     label: '정보공개',
 *     items: [
 *       {
 *         label: '사전정보공표',
 *         shortcut: { href: '/open' },
 *         items: [{ label: '공표목록', href: '/open/list', current: true }],
 *       },
 *     ],
 *   },
 * ];
 * <MainMenu items={menu} />
 * <MainMenuMobile items={menu} open={open} onClose={close} header={<AuthLinks />} />
 *
 * 자세히: docs/krds/09-부품-노트.md#주메뉴
 */

/** 새 창으로 열리는 링크에 붙일 안내 문구. */
const NEW_WINDOW_TITLE = '새 창 열림';

/** 링크가 이 문서 밖을 가리키는가. `/` 로 시작하지 않으면 `UiLink` 를 쓰지 않고 맨 <a> 로 그린다. */
function isExternalHref(href: string): boolean {
  return !href.startsWith('/');
}

/** `useId()` 는 특수문자를 담는다 — id·href 조각으로 쓸 수 있게 깎는다. */
function idBase(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'gnb';
}

type MenuActionProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** 없으면 `<button type="button">` 으로 그린다(킷 샘플이 링크와 버튼을 둘 다 허용한다). */
  href?: string;
  newWindow?: boolean;
  'data-trigger'?: string;
  children: ReactNode;
};

/** 메뉴 한 칸을 링크(`href` 있음)나 버튼으로 그린다. 새 창이면 안내 `title` 을 붙인다. */
function MenuAction({ href, newWindow, children, ...rest }: MenuActionProps) {
  if (!href) {
    return (
      <button type="button" {...rest}>
        {children}
      </button>
    );
  }

  if (newWindow || isExternalHref(href)) {
    return (
      <a
        href={href}
        target={newWindow ? '_blank' : undefined}
        rel={newWindow ? 'noopener noreferrer' : undefined}
        title={newWindow ? NEW_WINDOW_TITLE : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <UiLink href={href} {...rest}>
      {children}
    </UiLink>
  );
}

/** 마지막 단(3뎁스) 항목. 여기서 트리가 끝난다 — 규격의 「최대 3수준」을 타입으로 막은 자리다. */
export type MainMenuLink = {
  /** React key. 없으면 차례를 쓴다. */
  id?: string;
  /** 메뉴 이름. */
  label: ReactNode;
  /** 이동 주소. 없으면 버튼이 된다. */
  href?: string;
  /** 새 창으로 연다. 외부 링크면 화살표 아이콘이 함께 붙는다. */
  newWindow?: boolean;
  /** 지금 보고 있는 화면. `aria-current="page"` 가 붙는다. */
  current?: boolean;
  /** 메뉴 설명. 한 목록에 하나라도 있으면 그 목록 전체가 킷의 설명형으로 바뀐다. */
  description?: string;
  /** 눌렀을 때. */
  onSelect?: () => void;
};

/** 드롭다운 오른쪽(또는 아래)의 신규 서비스 배너 — 킷 `gnb-sub-banner`. */
export type MainMenuBanner = {
  /** 배지 글자. 배지는 대화형이 아니므로 글자만 넣는다. */
  badge?: ReactNode;
  /** 배너 글자. */
  label: ReactNode;
  /** 이동 주소. */
  href?: string;
  /** 새 창으로 연다. */
  newWindow?: boolean;
  /** 배너를 오른쪽 칸에 세운다. 기본은 목록 아래. */
  side?: boolean;
  /** 눌렀을 때. */
  onSelect?: () => void;
};

/** 2뎁스. `items` 가 없으면 왼쪽 칸에 링크 한 줄로만 놓인다. */
export type MainMenuGroup = {
  /** React key. 없으면 차례를 쓴다. */
  id?: string;
  /** 메뉴 이름. */
  label: ReactNode;
  /** 이동 주소. `items` 가 없을 때 쓰인다. */
  href?: string;
  /** 새 창으로 연다. */
  newWindow?: boolean;
  /** 지금 보고 있는 화면. */
  current?: boolean;
  /** 드롭다운 제목. 생략하면 `label` 을 쓴다 — 제목 없는 드롭다운은 만들 수 없다. */
  title?: ReactNode;
  /** 제목 옆 「바로가기」 링크. */
  shortcut?: { href: string; label?: ReactNode; newWindow?: boolean };
  /** 신규 서비스 배너. */
  banner?: MainMenuBanner;
  /** 3뎁스 항목. */
  items?: MainMenuLink[];
  /** 눌렀을 때. */
  onSelect?: () => void;
};

/** 1뎁스. `items` 가 없으면 드롭다운 없는 단순 링크다. */
export type MainMenuTop = {
  /** React key. 없으면 차례를 쓴다. */
  id?: string;
  /** 메뉴 이름. */
  label: ReactNode;
  /** 이동 주소. `items` 가 없을 때 쓰인다. */
  href?: string;
  /** 새 창으로 연다. */
  newWindow?: boolean;
  /** 지금 보고 있는 화면. */
  current?: boolean;
  /** 2뎁스 항목. */
  items?: MainMenuGroup[];
  /** 눌렀을 때. */
  onSelect?: () => void;
};

/** 드롭다운 제목의 헤딩 단계. 화면의 제목 위계에 맞춘다. */
export type MainMenuTitleLevel = 2 | 3 | 4 | 5 | 6;

const key = (item: { id?: string }, index: number) => item.id ?? index;

/** 하위가 있는 첫 2뎁스. 없으면 -1(오른쪽 판을 펼치지 않는다). */
function firstPanelIndex(groups: MainMenuGroup[]): number {
  return groups.findIndex((group) => (group.items?.length ?? 0) > 0);
}

function hasItems(group: MainMenuGroup): boolean {
  return (group.items?.length ?? 0) > 0;
}

/** 드롭다운 한 판의 내용 — 킷 `gnb-sub-content` + `gnb-sub-banner`. 열 배치는 킷이 잡는다. */
function GroupPanel({
  group,
  titleLevel,
}: {
  group: MainMenuGroup;
  titleLevel: MainMenuTitleLevel;
}) {
  const Title = `h${titleLevel}` as 'h2';
  const DescTitle = `h${Math.min(titleLevel + 1, 6)}` as 'h3';
  const items = group.items ?? [];
  const described = items.some((item) => item.description);
  const shortcut = group.shortcut;

  return (
    <>
      <div className="gnb-sub-content">
        <Title className="sub-title">
          {shortcut ? (
            <>
              {group.title ?? group.label}
              <MenuAction
                href={shortcut.href}
                newWindow={shortcut.newWindow}
                className="krds-btn link basic small"
              >
                <span className="underline">{shortcut.label ?? '바로가기'}</span>
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </MenuAction>
            </>
          ) : (
            <span>{group.title ?? group.label}</span>
          )}
        </Title>

        <ul className={cx(described && 'type-description')}>
          {items.map((item, index) => {
            const external = item.newWindow || (item.href ? isExternalHref(item.href) : false);
            if (described) {
              return (
                <li key={key(item, index)}>
                  <DescTitle className="tit">
                    <MenuAction
                      href={item.href}
                      newWindow={item.newWindow}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={item.onSelect}
                    >
                      {item.label}
                      {external && <i className="svg-icon ico-go" aria-hidden="true" />}
                    </MenuAction>
                  </DescTitle>
                  {item.description && <p className="txt">{item.description}</p>}
                </li>
              );
            }
            return (
              <li key={key(item, index)}>
                <MenuAction
                  href={item.href}
                  newWindow={item.newWindow}
                  className={cx(item.current && 'active')}
                  aria-current={item.current ? 'page' : undefined}
                  onClick={item.onSelect}
                >
                  {item.label}
                </MenuAction>
              </li>
            );
          })}
        </ul>
      </div>

      {group.banner && (
        <div className="gnb-sub-banner">
          {group.banner.badge && (
            <span className="krds-badge bg-secondary">{group.banner.badge}</span>
          )}
          <MenuAction
            href={group.banner.href}
            newWindow={group.banner.newWindow}
            className="krds-btn medium text"
            onClick={group.banner.onSelect}
          >
            {group.banner.label}
            <i className="svg-icon ico-angle right" aria-hidden="true" />
          </MenuAction>
        </div>
      )}
    </>
  );
}

export type MainMenuProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & {
  /** 메뉴 트리(최대 3수준). */
  items: MainMenuTop[];
  /** `<nav>` 의 이름. 규격 권장 문구가 「메인 메뉴」다. */
  label?: string;
  /** 드롭다운 제목의 헤딩 단계. 기본 2. */
  titleLevel?: MainMenuTitleLevel;
  /** 딤을 깔고 본문 스크롤을 잠근다. 기본 켬 — 헤더 안 좁은 드롭다운으로 쓸 때만 끈다. */
  backdrop?: boolean;
};

/**
 * 주메뉴(PC) — 킷 `krds-main-menu`. **1023px 이하에서는 킷이 이 요소를 숨긴다** —
 * 좁은 화면은 {@link MainMenuMobile} 이 맡는다.
 */
export function MainMenu({
  items,
  label = '메인 메뉴',
  titleLevel = 2,
  backdrop = true,
  className,
  onKeyDown,
  onBlur,
  ref,
  ...rest
}: MainMenuProps) {
  const uid = idBase(useId());
  const navRef = useRef<HTMLElement | null>(null);
  const listRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  /** 1뎁스 차례 → 펼쳐 둔 2뎁스 차례. 없으면 `firstPanelIndex` 를 쓴다. */
  const [activeGroup, setActiveGroup] = useState<Record<number, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpenIndex(null), []);

  const triggerAt = useCallback((index: number): HTMLElement | null => {
    const triggers = navRef.current?.querySelectorAll<HTMLElement>('.gnb-main-trigger');
    return triggers?.[index] ?? null;
  }, []);

  // 딤이 떠 있는 동안 본문 스크롤 잠금. 스크롤바가 사라지며 생기는 폭 차이는 킷이 메운다.
  useEffect(() => {
    if (openIndex === null || !backdrop) return;
    const needsGutter = document.body.scrollHeight > window.innerHeight;
    document.body.classList.add('is-gnb-web');
    if (needsGutter) document.body.classList.add('hasScrollY');
    return () => {
      document.body.classList.remove('is-gnb-web');
      if (needsGutter) document.body.classList.remove('hasScrollY');
    };
  }, [openIndex, backdrop]);

  // 메뉴 밖을 누르면 닫는다(킷 JS 와 같다).
  useEffect(() => {
    if (openIndex === null) return;
    function handleDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [openIndex, close]);

  // Esc — 펼쳐진 드롭다운을 전부 접고 **그 1뎁스 메뉴로 초점을 되돌린다**(규격).
  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      const trigger = triggerAt(openIndex as number);
      close();
      trigger?.focus();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openIndex, close, triggerAt]);

  // 오른쪽 판은 절대 배치라 왼쪽 칸의 높이를 밀어내지 못한다 — 킷 JS 처럼 min-height 로 옮긴다.
  // 이 값이 있어야 70% 상한을 넘겼을 때 드롭다운이 스스로 스크롤한다.
  useEffect(() => {
    if (openIndex === null) return;
    const list = listRefs.current[openIndex];
    if (!list) return;
    const panel = list.querySelector<HTMLElement>('.gnb-sub-list.active');
    list.style.minHeight = panel ? `${panel.scrollHeight}px` : '';
    return () => {
      list.style.minHeight = '';
    };
  }, [openIndex, activeGroup, items]);

  function toggleTop(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  /** 키보드 이동 — Home/End 는 1뎁스의 처음·끝으로, ←→↑↓ 는 같은 목록의 형제 트리거로 간다. */
  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const target = event.target as HTMLElement | null;
    if (!target || target.dataset?.trigger !== 'gnb') return;

    const move = (direction: 'next' | 'prev') => {
      const sibling =
        direction === 'next'
          ? target.closest('li')?.nextElementSibling
          : target.closest('li')?.previousElementSibling;
      sibling?.querySelector<HTMLElement>('[data-trigger]')?.focus();
    };

    switch (event.key) {
      case 'Home':
        event.preventDefault();
        triggerAt(0)?.focus();
        break;
      case 'End':
        event.preventDefault();
        triggerAt(items.length - 1)?.focus();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        move('next');
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        move('prev');
        break;
      default:
        break;
    }
  }

  /** Tab 으로 초점이 메뉴 밖으로 나가면 닫는다. 초점이 사라지는 경우(null)는 바깥 클릭이 맡는다. */
  function handleBlur(event: ReactFocusEvent<HTMLElement>) {
    onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (next && !event.currentTarget.contains(next)) close();
  }

  return (
    <>
      <nav
        // 바깥에서 넘긴 ref 도 살린다 — 안쪽 navRef 는 바깥 클릭·초점 판정에 쓴다.
        ref={(node) => {
          navRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cx('krds-main-menu', className)}
        aria-label={label}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        {...rest}
      >
        <div className="inner">
          <ul className="gnb-menu">
            {items.map((top, index) => {
              const groups = top.items ?? [];

              // 하위가 없으면 단순 링크다 — 킷 `gnb-main-trigger is-link`(펼침 화살표가 지워진다).
              if (groups.length === 0) {
                return (
                  <li key={key(top, index)}>
                    <MenuAction
                      href={top.href}
                      newWindow={top.newWindow}
                      className="gnb-main-trigger is-link"
                      data-trigger="gnb"
                      aria-current={top.current ? 'page' : undefined}
                      onClick={top.onSelect}
                    >
                      {top.label}
                    </MenuAction>
                  </li>
                );
              }

              const open = openIndex === index;
              const panelId = `${uid}-gnb-${index}`;
              const activeIndex = activeGroup[index] ?? firstPanelIndex(groups);
              /** 2뎁스가 하나뿐이면 왼쪽 칸 없이 한 판만 편다 — 킷 `single-list`. */
              const single = groups.length === 1 && hasItems(groups[0]);

              return (
                <li key={key(top, index)}>
                  <button
                    type="button"
                    className={cx('gnb-main-trigger', open && 'active')}
                    data-trigger="gnb"
                    aria-expanded={open}
                    aria-haspopup
                    aria-controls={panelId}
                    aria-current={open ? 'true' : top.current ? 'page' : undefined}
                    onClick={() => toggleTop(index)}
                  >
                    {top.label}
                  </button>

                  {/* 규격: 드롭다운 최대 높이는 뷰포트의 70%. 킷 CSS 에 없어 유틸리티로 보충한다. */}
                  <div
                    id={panelId}
                    className={cx(
                      'gnb-toggle-wrap',
                      open && 'is-open',
                      'max-h-[70vh] overflow-y-auto',
                    )}
                  >
                    <div
                      className="gnb-main-list"
                      data-has-submenu={single ? undefined : 'true'}
                      ref={(node) => {
                        listRefs.current[index] = node;
                      }}
                    >
                      {single ? (
                        <div
                          className={cx(
                            'gnb-sub-list',
                            'single-list',
                            groups[0].banner?.side && 'between',
                          )}
                        >
                          <GroupPanel group={groups[0]} titleLevel={titleLevel} />
                        </div>
                      ) : (
                        <ul>
                          {groups.map((group, groupIndex) => {
                            if (!hasItems(group)) {
                              const external =
                                group.newWindow ||
                                (group.href ? isExternalHref(group.href) : false);
                              return (
                                <li key={key(group, groupIndex)}>
                                  <MenuAction
                                    href={group.href}
                                    newWindow={group.newWindow}
                                    className={cx(
                                      'gnb-sub-trigger',
                                      'is-link',
                                      external && 'external-link',
                                    )}
                                    data-trigger="gnb"
                                    aria-current={group.current ? 'page' : undefined}
                                    onClick={group.onSelect}
                                  >
                                    {group.label}
                                  </MenuAction>
                                </li>
                              );
                            }

                            const active = activeIndex === groupIndex;
                            const subId = `${panelId}-sub-${groupIndex}`;

                            return (
                              <li key={key(group, groupIndex)}>
                                <button
                                  type="button"
                                  className={cx('gnb-sub-trigger', active && 'active')}
                                  data-trigger="gnb"
                                  aria-expanded={active}
                                  aria-haspopup
                                  aria-controls={subId}
                                  onClick={() => {
                                    setActiveGroup((current) => ({
                                      ...current,
                                      [index]: groupIndex,
                                    }));
                                    group.onSelect?.();
                                  }}
                                >
                                  {group.label}
                                </button>
                                <div
                                  id={subId}
                                  className={cx(
                                    'gnb-sub-list',
                                    active && 'active',
                                    group.banner?.side && 'between',
                                  )}
                                >
                                  <GroupPanel group={group} titleLevel={titleLevel} />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* 딤. 킷 JS 도 body 끝에 붙인다 — 헤더의 z-index·overflow 에 갇히지 않게 포털로 낸다. */}
      {backdrop && mounted
        ? createPortal(
            <div className={cx('gnb-backdrop', openIndex !== null && 'active')} aria-hidden="true" />,
            document.body,
          )
        : null}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/** 킷 JS 의 지연값. CSS transition 과 짝이라 임의로 줄이면 어긋난다. */
const MOBILE_ENTER_DELAY = 100;
const MOBILE_LEAVE_DELAY = 400;

/** 킷 CSS 가 PC 주메뉴를 되살리는 폭. 이보다 넓어지면 모바일 서랍을 닫는다. */
const PC_MIN_WIDTH = 1024;

/** 초점 가둠 대상. 킷보다 넓게 잡았다. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0,
  );
}

export type MainMenuMobileProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'id'> & {
  /** 메뉴 트리. PC 주메뉴와 같은 값을 넘긴다. */
  items: MainMenuTop[];
  /** 열림 여부. 상태는 화면 쪽이 쥔다. */
  open: boolean;
  /** 닫아 달라는 요청 — Esc·닫기 단추·PC 폭으로 넓어질 때 온다. */
  onClose: () => void;
  /** 서랍의 id. 여는 단추의 `aria-controls` 와 짝이다. **한 화면에 하나만 둔다.** */
  id?: string;
  /** 서랍의 이름(`aria-label`). 기본 「전체 메뉴」. */
  label?: string;
  /** 닫기 단추의 이름. */
  closeLabel?: string;
  /** 판 제목의 헤딩 단계. 기본 2. */
  titleLevel?: MainMenuTitleLevel;
  /** 서랍 머리 자리 — 유틸 링크·로그인·검색칸. */
  header?: ReactNode;
  /** 서랍 바닥 자리 — 정책 링크 등. */
  bottom?: ReactNode;
};

/**
 * 전체메뉴(모바일) — 킷 `krds-main-menu-mobile`. 초점을 가두는 대화상자다.
 *
 * 왼쪽 1뎁스는 탭이 아니라 **앵커**다 — 누르면 오른쪽이 그 자리로 스크롤하고 선택 표시가 따라간다.
 * **1024px 이상에서는 킷이 이 요소를 숨긴다** — PC 는 {@link MainMenu} 가 맡는다.
 * 화면이 PC 폭으로 넓어지면 스스로 닫는다(그대로 두면 닫을 길이 사라진다).
 */
export function MainMenuMobile({
  items,
  open,
  onClose,
  id = 'mobile-nav',
  label = '전체 메뉴',
  closeLabel = '전체메뉴 닫기',
  titleLevel = 2,
  header,
  bottom,
  className,
  style,
  onKeyDown,
  ...rest
}: MainMenuMobileProps) {
  const uid = idBase(useId());
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  /** `display:block` — 닫히는 동안에도 유지한다. */
  const [shown, setShown] = useState(false);
  /** `.is-open` · `.is-backdrop` — transition 을 태우는 클래스. */
  const [entered, setEntered] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openDepth3, setOpenDepth3] = useState<Record<string, boolean>>({});

  const tabId = (index: number) => `${uid}-m-tab-${index}`;
  const panelId = (index: number) => `${uid}-m-panel-${index}`;

  // 열림 — 스크롤 잠금 · 상태 클래스 · 초점 이동. 정리 단계에서 잠금 해제와 초점 복귀.
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    setShown(true);
    document.body.classList.add('is-gnb-mobile');

    const enterTimer = window.setTimeout(() => {
      setEntered(true);
      wrapRef.current?.focus();
    }, MOBILE_ENTER_DELAY);

    return () => {
      window.clearTimeout(enterTimer);
      setEntered(false);
      document.body.classList.remove('is-gnb-mobile');
      restore?.focus?.();
    };
  }, [open]);

  // 닫힘 — 클래스를 뗀 뒤 transition 만큼 기다렸다가 DOM 에서 감춘다.
  useEffect(() => {
    if (open || !shown) return;
    const timer = window.setTimeout(() => setShown(false), MOBILE_LEAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  // 화면이 PC 폭으로 넓어지면 닫는다 — 킷 CSS 가 이 서랍을 숨겨 버려 닫을 길이 사라지기 때문이다.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(`(min-width: ${PC_MIN_WIDTH}px)`);
    const handle = () => {
      if (query.matches) onClose();
    };
    handle();
    query.addEventListener('change', handle);
    return () => query.removeEventListener('change', handle);
  }, [open, onClose]);

  /** 오른쪽이 스크롤하면 왼쪽 선택 표시를 따라 옮긴다 — 킷 `setupAnchorScroll`. */
  useEffect(() => {
    const body = bodyRef.current;
    if (!open || !body) return;
    const handle = () => {
      const bottomReached = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
      if (bottomReached) {
        setActiveTab(items.length - 1);
        return;
      }
      let next = 0;
      items.forEach((_, index) => {
        const panel = document.getElementById(panelId(index));
        if (panel && body.scrollTop >= panel.offsetTop) next = index;
      });
      setActiveTab(next);
    };
    body.addEventListener('scroll', handle, { passive: true });
    return () => body.removeEventListener('scroll', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items]);

  function handleTabClick(event: ReactMouseEvent<HTMLAnchorElement>, index: number) {
    event.preventDefault();
    setActiveTab(index);
    const panel = document.getElementById(panelId(index));
    if (panel) bodyRef.current?.scrollTo({ top: panel.offsetTop, left: 0, behavior: 'smooth' });
  }

  /** Esc 로 닫고, Tab 초점을 서랍 안에 가둔다. */
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const wrap = wrapRef.current;
    if (!wrap) return;
    const nodes = focusables(wrap);
    if (nodes.length === 0) {
      event.preventDefault();
      wrap.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const Title = `h${titleLevel}` as 'h2';

  return (
    <div
      id={id}
      className={cx('krds-main-menu-mobile', entered && 'is-open', entered && 'is-backdrop', className)}
      style={{ display: shown ? 'block' : 'none', ...style }}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div
        ref={wrapRef}
        className="gnb-wrap"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {header && <div className="gnb-header">{header}</div>}

        <div className="gnb-body" ref={bodyRef}>
          {/* 규격 권장 문구 — 컨테이너에 「메인 메뉴」. 바깥 대화상자 이름과 겹치지 않게 나눈다. */}
          <div className="gnb-menu" role="navigation" aria-label="메인 메뉴">
            <div className="menu-wrap">
              <ul role="tablist">
                {items.map((top, index) => (
                  <li key={key(top, index)} role="none">
                    <a
                      href={`#${panelId(index)}`}
                      id={tabId(index)}
                      className={cx('gnb-main-trigger', activeTab === index && 'active')}
                      role="tab"
                      aria-selected={activeTab === index}
                      aria-controls={panelId(index)}
                      onClick={(event) => handleTabClick(event, index)}
                    >
                      {top.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="submenu-wrap">
              {items.map((top, index) => (
                <div
                  key={key(top, index)}
                  id={panelId(index)}
                  className="gnb-sub-list"
                  role="tabpanel"
                  aria-labelledby={tabId(index)}
                >
                  <Title className="sub-title">{top.label}</Title>
                  <ul>
                    {(top.items ?? []).map((group, groupIndex) => {
                      const groupKey = `${index}-${groupIndex}`;
                      const items3 = group.items ?? [];

                      if (items3.length === 0) {
                        return (
                          <li key={key(group, groupIndex)}>
                            <MenuAction
                              href={group.href}
                              newWindow={group.newWindow}
                              className={cx('gnb-sub-trigger', group.current && 'selected')}
                              aria-current={group.current ? 'page' : undefined}
                              onClick={group.onSelect}
                            >
                              {group.label}
                            </MenuAction>
                          </li>
                        );
                      }

                      const expanded = openDepth3[groupKey] ?? false;
                      const depth3Id = `${panelId(index)}-d3-${groupIndex}`;

                      return (
                        <li key={key(group, groupIndex)}>
                          <button
                            type="button"
                            className={cx(
                              'gnb-sub-trigger',
                              'has-depth3',
                              expanded && 'active',
                              group.current && 'selected',
                            )}
                            aria-expanded={expanded}
                            aria-controls={depth3Id}
                            onClick={() => {
                              setOpenDepth3((current) => ({
                                ...current,
                                [groupKey]: !expanded,
                              }));
                              group.onSelect?.();
                            }}
                          >
                            {group.label}
                          </button>
                          <div id={depth3Id} className={cx('depth3-wrap', expanded && 'is-open')}>
                            <ul>
                              {items3.map((item, itemIndex) => (
                                <li key={key(item, itemIndex)}>
                                  <MenuAction
                                    href={item.href}
                                    newWindow={item.newWindow}
                                    className={cx('depth3-trigger', item.current && 'active')}
                                    aria-current={item.current ? 'page' : undefined}
                                    onClick={item.onSelect}
                                  >
                                    {item.label}
                                  </MenuAction>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {bottom && <div className="gnb-bottom">{bottom}</div>}
        </div>

        {/* 킷 CSS 가 `#close-nav` 아이디로 위치를 잡는다 — 바꾸면 단추가 제자리에 놓이지 않는다. */}
        <button type="button" className="krds-btn medium icon" id="close-nav" onClick={onClose}>
          <span className="sr-only">{closeLabel}</span>
          <i className="svg-icon ico-popup-close" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
