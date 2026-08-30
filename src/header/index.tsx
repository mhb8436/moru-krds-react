import { UiLink } from '../lib/link';
import { Children, isValidElement, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx, type KrdsIcon } from '../lib/krds';

/**
 * 헤더 — KRDS `#krds-header`.
 *
 * 조각을 규격 순서대로 조립한다 — 유틸리티 링크 그룹 → 서비스 아이덴티티(로고) → 주요 기능 버튼
 * → 주메뉴. 그 앞의 건너뛰기 링크(`ui/skip-link`)와 공식 배너(`ui/masthead`)는 `<header>` 밖이라
 * 셸에서 순서를 지켜야 한다.
 * **`HeaderNaviButton`·`HeaderNaviLink` 의 `icon` 은 킷에 있는 5종뿐이다** — 다른 이름을 주면
 * 검은 네모가 나온다. 그 밖의 기능은 `ui/button` 의 `Button` 을 쓴다.
 * 드롭다운 열림 상태는 이 부품이 쥐지 않는다(화면 쪽 클라이언트 부품이 `open` 으로 내려 준다).
 * 좁은 화면 숨김·표시는 킷이 처리하므로 미디어쿼리를 따로 쓰지 않는다.
 *
 * @example
 * <Header mobileNav={<MainMenuMobile items={menu} open={open} onClose={close} />}>
 *   <HeaderContainer>
 *     <HeaderUtility>
 *       <HeaderUtilityLink href="/en" icon="global">English</HeaderUtilityLink>
 *     </HeaderUtility>
 *     <HeaderBranding>
 *       <HeaderLogo name="○○기관" src="/site/logo.svg" />
 *       <HeaderActions>
 *         <HeaderNaviLink icon="login" href="/login">로그인</HeaderNaviLink>
 *         <HeaderNaviButton icon="all" onClick={openNav}>전체메뉴</HeaderNaviButton>
 *       </HeaderActions>
 *     </HeaderBranding>
 *   </HeaderContainer>
 *   <MainMenu items={menu} />
 * </Header>
 *
 * 자세히: docs/krds/09-부품-노트.md#헤더
 */

/** 유틸리티 링크가 이 수 이상이면 드롭다운으로 묶는다(규격). */
export const HEADER_UTILITY_DROPDOWN_THRESHOLD = 5;

/* ────────────────────────────────────────────────────────────────────────── */
/* 뿌리                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export type HeaderProps = Omit<ComponentPropsWithRef<'header'>, 'id'> & {
  /** `.header-in` 안에 들어갈 것 — `HeaderContainer` 와 `MainMenu`. */
  children?: ReactNode;
  /** 모바일 전체메뉴(`MainMenuMobile`). `.header-in` 밖에 놓여야 헤더 띠에 갇히지 않는다. */
  mobileNav?: ReactNode;
};

export function Header({ children, mobileNav, className, ...rest }: HeaderProps) {
  return (
    <header
      // 모양이 `#krds-header` 아이디에 걸려 있어 뿌리에는 킷 클래스가 없다. 빈 class 를 남기지 않는다.
      className={cx(className) || undefined}
      {...rest}
      // 킷 CSS 가 물고 있는 선택자다. rest 로 덮이지 않도록 마지막에 고정한다.
      id="krds-header"
    >
      <div className="header-in">{children}</div>
      {mobileNav}
    </header>
  );
}

/**
 * 헤더 상단 줄 — 킷 `.header-container > .inner`. 본문과 같은 최대 너비·좌우 여백을 킷이 준다.
 * `className` 은 바깥(`.header-container`)에 붙는다.
 */
export function HeaderContainer({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('header-container', className)} {...rest}>
      <div className="inner">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 유틸리티 링크 그룹                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * 유틸리티 링크 그룹 — 킷 `.header-utility > ul.utility-list`.
 *
 * 자식을 **부품이 `<li>` 로 감싼다** — 직접 `<li>` 를 넣지 마라.
 * **1023px 이하에서 킷이 통째로 감춘다** — 언어 전환처럼 반드시 닿아야 하는 것은
 * 모바일 전체메뉴에도 한 벌 더 둔다. 5개 이상이면 `HeaderDropdown` 으로 묶는다(규격).
 */
export type HeaderUtilityProps = ComponentPropsWithRef<'div'> & { children?: ReactNode };

export function HeaderUtility({ className, children, ...rest }: HeaderUtilityProps) {
  const items = Children.toArray(children);

  if (
    process.env.NODE_ENV !== 'production' &&
    items.length >= HEADER_UTILITY_DROPDOWN_THRESHOLD
  ) {
    // 규격: 「유틸리티 링크가 5개 이상 필요한 경우 드롭다운 메뉴를 사용한다」.
    console.warn(
      `[HeaderUtility] 유틸리티 링크가 ${items.length}개다. ` +
        `${HEADER_UTILITY_DROPDOWN_THRESHOLD}개 이상이면 비슷한 것끼리 HeaderDropdown 으로 묶어라(KRDS 02_03).`,
    );
  }

  return (
    <div className={cx('header-utility', className)} {...rest}>
      <ul className="utility-list">
        {items.map((child, i) => (
          <li key={(isValidElement(child) && child.key) || i}>{child}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 유틸리티 링크 한 칸 — 킷 `krds-btn small text`(밑줄 없는 작은 글자 버튼).
 * 여기에 `ui/button` 의 `LinkButton` 을 쓰지 마라 — 그쪽은 밑줄 있는 `link` 변형이다.
 */
export type HeaderUtilityLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  href: string;
  /** 글자 앞 아이콘(`ico-` 뺀 이름). 예: 언어 전환의 `global`. */
  icon?: KrdsIcon;
  /** 새 창으로 여는 바깥 주소. `UiLink` 대신 맨 `<a>` 로 그리고 `ico-go` 를 뒤에 붙인다. */
  external?: boolean;
};

/** 새 창 안내 문구. `ui/button` 과 맞춰 하나로 통일한다. */
const NEW_WINDOW_TITLE = '새 창 열림';

export function HeaderUtilityLink({
  href,
  icon,
  external,
  className,
  children,
  title,
  ...rest
}: HeaderUtilityLinkProps) {
  const cls = cx('krds-btn', 'small', 'text', className);
  const inner = (
    <>
      {icon && <i className={`svg-icon ico-${icon}`} aria-hidden="true" />}
      {children}
      {external && <i className="svg-icon ico-go" aria-hidden="true" />}
    </>
  );

  return external ? (
    <a
      className={cls}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title ?? NEW_WINDOW_TITLE}
      {...rest}
    >
      {inner}
    </a>
  ) : (
    <UiLink className={cls} href={href} title={title} {...rest}>
      {inner}
    </UiLink>
  );
}

/** 유틸리티 버튼 한 칸 — 화면을 옮기지 않고 레이어·모달을 여는 것(글자·화면 설정 등)에 쓴다. */
export type HeaderUtilityButtonProps = ComponentPropsWithRef<'button'> & { icon?: KrdsIcon };

export function HeaderUtilityButton({
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: HeaderUtilityButtonProps) {
  return (
    <button type={type} className={cx('krds-btn', 'small', 'text', className)} {...rest}>
      {icon && <i className={`svg-icon ico-${icon}`} aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 드롭다운                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * 헤더 드롭다운 — 킷 `.krds-drop-wrap`. 언어 전환·개인 메뉴 자리다.
 *
 * **열림 상태를 쥐지 않는다** — `open` 을 받아 그리기만 한다.
 * 바깥 클릭·Esc 로 닫는 것은 화면 쪽 클라이언트 부품이 맡는다.
 * 표 행 동작처럼 키보드 메뉴 규약이 필요한 자리는 `ui/context-menu` 다.
 */
export type HeaderDropdownProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 여는 단추 글자. */
  label: ReactNode;
  /** 열렸는가. 화면 쪽에서 쥔 상태를 내려 준다. */
  open?: boolean;
  /** 여는 단추를 눌렀을 때. */
  onToggle?: () => void;
  /** 단추 모양. `utility` 는 유틸리티 줄, `navi` 는 `.header-actions` 의 개인 메뉴다. */
  trigger?: 'utility' | 'navi';
  /** `utility` 일 때 글자 앞 아이콘. 예: 언어 전환의 `global`. */
  icon?: KrdsIcon;
  /** `navi` 일 때 쓸 `.btn-navi` 아이콘. 기본 `my`. */
  naviIcon?: HeaderNaviIcon;
  /** 메뉴 정렬. 기본은 단추 가운데 정렬. */
  align?: 'left' | 'center' | 'right';
  /** 목록 위 영역 — 개인 메뉴의 이름·남은 시간 등. */
  top?: ReactNode;
  /** 목록 아래 영역 — 로그아웃·초기화 등. */
  bottom?: ReactNode;
  /** `HeaderDropdownItem` 들. */
  children?: ReactNode;
};

export function HeaderDropdown({
  label,
  open = false,
  onToggle,
  trigger = 'utility',
  icon,
  naviIcon = 'my',
  align = 'center',
  top,
  bottom,
  className,
  children,
  ...rest
}: HeaderDropdownProps) {
  const navi = trigger === 'navi';

  return (
    <div
      className={cx(
        'krds-drop-wrap',
        // `.my-drop` 은 1023px 이하에서 킷이 감춘다 — 개인 메뉴는 모바일 전체메뉴 쪽에도 둔다.
        navi && 'my-drop',
        align === 'left' && 'drop-left',
        align === 'right' && 'drop-right',
        className,
      )}
      {...rest}
    >
      <button
        type="button"
        className={
          navi
            ? cx('btn-navi', naviIcon, 'drop-btn')
            : cx('krds-btn', 'small', 'text', 'drop-btn')
        }
        aria-expanded={open}
        onClick={onToggle}
      >
        {!navi && icon && <i className={`svg-icon ico-${icon}`} aria-hidden="true" />}
        {label}
        {/* 킷 샘플: 유틸리티 드롭다운만 뒤에 여닫음 화살표를 둔다. `.btn-navi` 는 ::before 아이콘이 이미 있다. */}
        {!navi && <i className="svg-icon ico-toggle" aria-hidden="true" />}
      </button>
      <div className="drop-menu" style={{ display: open ? 'block' : 'none' }}>
        <div className="drop-in">
          {top !== undefined && <div className="drop-top">{top}</div>}
          {children !== undefined && <ul className="drop-list">{children}</ul>}
          {bottom !== undefined && <div className="drop-bottom">{bottom}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * 드롭다운 한 줄 — 킷 `li > .item-link`. `href` 가 없으면 `<button>` 으로 그린다.
 * 고른 항목에는 `.active` 와 함께 「선택됨」 안내가 붙는다(색만으로 알리지 않기 위해).
 */
export type HeaderDropdownItemProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  /** 없으면 `<button type="button">` 이 된다. */
  href?: string;
  /** 지금 고른 항목. `.active` + 「선택됨」 안내가 붙는다. */
  active?: boolean;
  /** 새 창으로 여는 바깥 주소. */
  external?: boolean;
  /** 단추일 때의 클릭 처리. */
  onSelect?: () => void;
};

export function HeaderDropdownItem({
  href,
  active,
  external,
  onSelect,
  className,
  children,
  title,
  ...rest
}: HeaderDropdownItemProps) {
  const cls = cx('item-link', active && 'active', className);
  const inner = (
    <>
      {children}
      {external && <i className="svg-icon ico-go" aria-hidden="true" />}
      {active && <span className="sr-only">선택됨</span>}
    </>
  );

  if (!href) {
    return (
      <li>
        <button
          type="button"
          className={cls}
          onClick={onSelect}
          // `<a>` 용 props 를 `<button>` 에 흘리지 않는다 — lang·aria-* 만 쓰이는 자리다.
          {...(rest as ComponentPropsWithRef<'button'>)}
        >
          {inner}
        </button>
      </li>
    );
  }

  return (
    <li>
      {external ? (
        <a
          className={cls}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title ?? NEW_WINDOW_TITLE}
          {...rest}
        >
          {inner}
        </a>
      ) : (
        <UiLink className={cls} href={href} title={title} {...rest}>
          {inner}
        </UiLink>
      )}
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 서비스 아이덴티티 · 주요 기능                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/** 로고와 주요 기능 버튼을 담는 줄 — 킷 `.header-branding`. */
export function HeaderBranding({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('header-branding', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * 서비스 아이덴티티(로고) — 킷 `.logo > a`. 메인 화면으로 가는 링크다.
 *
 * **`src` 를 주지 않으면 킷의 KRDS 로고가 그대로 뜬다.** 로고 칸은 137×56px 고정이라
 * 비율이 다른 파일은 여백이 생긴다 — 파일 쪽에서 맞춘다.
 * 대체 텍스트에 「로고」라는 단어를 넣지 마라(규격).
 */
export type HeaderLogoProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'children'> & {
  /** 스크린리더가 읽을 기관/서비스 이름. 「로고」라는 단어를 넣지 마라. */
  name: string;
  /** 이동 주소. 규격상 메인 화면. */
  href?: string;
  /** 기관 로고 이미지 주소. 없고 `wordmark` 도 없으면 킷의 KRDS 로고가 그대로 뜬다. */
  src?: string;
  /** 로고 파일이 없을 때 글자로 대신한다. 배경 이미지와 고정 너비를 끈다. */
  wordmark?: ReactNode;
  /** 감쌀 제목 태그. 기본 `h2` — 로고가 그 화면의 최상위 제목이면 `h1`, 목차에 안 넣으려면 `div`. */
  heading?: 'h1' | 'h2' | 'div';
};

export function HeaderLogo({
  name,
  href = '/',
  src,
  wordmark,
  heading = 'h2',
  className,
  style,
  ...rest
}: HeaderLogoProps) {
  const Heading = heading;
  // 글자 로고는 킷의 고정 너비에 갇히면 잘린다. 아이디 선택자를 이기려면 인라인이어야 한다.
  const headingStyle = wordmark ? { width: 'auto' } : undefined;
  const linkStyle = {
    ...(src ? { backgroundImage: `url("${src}")` } : null),
    ...(wordmark && !src ? { backgroundImage: 'none' } : null),
    ...style,
  };

  return (
    <Heading className={cx('logo', className)} style={headingStyle}>
      <UiLink
        href={href}
        style={Object.keys(linkStyle).length ? linkStyle : undefined}
        // 보이는 글자가 이름에 포함되도록 넘긴다(WCAG 2.5.3 Label in Name).
        aria-label={wordmark ? name : undefined}
        {...rest}
      >
        {wordmark ?? <span className="sr-only">{name}</span>}
      </UiLink>
    </Heading>
  );
}

/** 주요 기능 버튼 묶음 — 킷 `.header-actions`. 킷이 오른쪽에 붙인다. */
export function HeaderActions({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('header-actions', className)} {...rest}>
      {children}
    </div>
  );
}

/** `.btn-navi` 가 아이콘을 가진 5종. 다른 이름을 주면 마스크 없는 검은 네모가 남는다. */
export type HeaderNaviIcon = 'sch' | 'login' | 'join' | 'my' | 'all';

type NaviBase = {
  /** 킷에 있는 5종 중 하나. 필수 — 빠지면 아이콘 자리가 검은 네모가 된다. */
  icon: HeaderNaviIcon;
  /** 가로형 — 아이콘과 글자를 한 줄에. 기본은 세로형이고, 한 헤더 안에서 섞지 마라. */
  row?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * 헤더 주요 기능 버튼 — 킷 `.btn-navi`. 레이어·전체메뉴를 여는 자리다.
 *
 * 좁은 화면에서 `join`·`my` 를, 1024px 이상에서 `all` 을 킷이 감춘다 —
 * 미디어쿼리를 따로 쓰지 마라. `icon="all"` 이면 `aria-controls="mobile-nav"` 가 자동으로 붙는다.
 */
export type HeaderNaviButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & NaviBase;

export function HeaderNaviButton({
  icon,
  row,
  className,
  children,
  type = 'button',
  'aria-controls': ariaControls,
  ...rest
}: HeaderNaviButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn-navi', icon, row && 'navi-row', className)}
      // 킷 샘플: 전체메뉴 버튼은 모바일 전체메뉴를 가리킨다. 직접 준 값이 있으면 그것을 쓴다.
      aria-controls={ariaControls ?? (icon === 'all' ? 'mobile-nav' : undefined)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** 헤더 주요 기능 링크 — 화면을 옮기는 것(로그인 등)만 링크로 둔다. 레이어는 `HeaderNaviButton`. */
export type HeaderNaviLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href' | 'children'> &
  NaviBase & {
    href: string;
    /** 새 창으로 여는 바깥 주소. */
    external?: boolean;
  };

export function HeaderNaviLink({
  icon,
  row,
  href,
  external,
  className,
  children,
  title,
  ...rest
}: HeaderNaviLinkProps) {
  const cls = cx('btn-navi', icon, row && 'navi-row', className);

  return external ? (
    <a
      className={cls}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title ?? NEW_WINDOW_TITLE}
      {...rest}
    >
      {children}
    </a>
  ) : (
    <UiLink className={cls} href={href} title={title} {...rest}>
      {children}
    </UiLink>
  );
}
