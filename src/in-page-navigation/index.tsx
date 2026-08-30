'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '../lib/krds';

/**
 * 콘텐츠 내 탐색(목차) — KRDS `krds-in-page-navigation-area`.
 *
 * 긴 상세 화면의 섹션 목차. 본문 섹션에 `id` 만 주면 스크롤 감시·부드러운 이동·초점 이동을
 * 이 부품이 한다(킷 JS 를 싣지 않는다). 항목 이름은 **연결된 섹션 제목과 같은 문구**로 쓴다.
 * 컨테이너에 {@link InPageNavigationLayout} 을 붙여야 목차 자리가 열린다 —
 * 목차에만 붙이면 고정된 목차가 본문 위를 덮는다.
 * 마크업 자리는 제목과 본문 **사이**다. 서비스 정보구조 탐색은 이것이 아니라 `ui/side-navigation` 이다.
 * `action` 에 넣은 버튼은 **모바일에서 킷이 숨기므로** 유일한 실행 수단을 여기 두지 마라.
 *
 * @example
 * <InPageNavigationLayout id="container">
 *   <div className="inner">
 *     <div className="contents">
 *       <InPageNavigation
 *         title="장애아동수당"
 *         items={[
 *           { id: 'sec-overview', label: '서비스 개요' },
 *           { id: 'sec-detail', label: '서비스 상세' },
 *         ]}
 *       />
 *       <section id="sec-overview"><h2>서비스 개요</h2>…</section>
 *     </div>
 *   </div>
 * </InPageNavigationLayout>
 *
 * 자세히: docs/krds/09-부품-노트.md#페이지내탐색
 */

/** 목차 한 줄. `id` 는 본문 섹션 요소의 `id`(`#` 없이). */
export type InPageNavigationItem = {
  /** 이동 대상 섹션의 `id`. `href="#{id}"` 로 나간다. */
  id: string;
  /** 목록에 보일 글자. 연결된 섹션 제목과 같은 문구여야 한다. 길면 두 줄로 접힌다. */
  label: ReactNode;
};

export type InPageNavigationProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> & {
  /** 목차 항목. 빈 배열이면 아무것도 그리지 않는다. 8개 안팎으로 줄인다. */
  items: InPageNavigationItem[];
  /** 머리말 위 작은 글자. 기본 「이 페이지의 구성」. `null` 을 주면 그리지 않는다. */
  caption?: ReactNode;
  /** 머리말 제목. 보통 현재 화면 이름. 제목 태그가 아니라 `<p>` 로 그린다. */
  title?: ReactNode;
  /** `<nav>` 의 접근 이름. 생략하면 `caption` 을 쓴다. */
  navLabel?: string;
  /** 목록 아래 실행 버튼. **모바일에서는 킷이 숨긴다.** */
  action?: ReactNode;
  /** 실행 버튼 아래 보조 문구. */
  info?: ReactNode;
  /** 활성 항목을 밖에서 정한다. 주면 스크롤 감시를 끄고 이 값만 따른다. */
  activeId?: string;
  /** 이동한 뒤 섹션 위에 남길 여백(px). 안 주면 마스트헤드 + 헤더 높이를 잰다. */
  offsetTop?: number;
};

/** 고정 헤더 높이. 킷 JS `calculateHeaderHeight()` 와 같은 계산이다. */
function headerHeight(): number {
  const masthead = document.getElementById('krds-masthead')?.clientHeight ?? 0;
  const headerIn =
    document.querySelector<HTMLElement>('#krds-header .header-in')?.clientHeight ?? 0;
  return masthead + headerIn;
}

/**
 * 지금 보고 있는 섹션을 고른다. 킷 JS `updateActiveSection()` 을 옮기되
 * 문서 기준 좌표로 재고, 섹션 사이 빈틈에서는 **지나온 마지막 섹션**을 고른다.
 */
function pickActiveId(ids: string[]): string | undefined {
  const found = ids
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((s): s is { id: string; el: HTMLElement } => s.el !== null);
  if (found.length === 0) return undefined;

  const y = window.scrollY;
  // 스크롤이 문서 끝에 닿으면 마지막 항목(짧은 마지막 섹션이 영영 활성화되지 못하는 것을 막는다).
  if (y + window.innerHeight >= document.documentElement.scrollHeight - 1) {
    return found[found.length - 1]!.id;
  }

  const guard = Math.ceil(window.innerHeight / 5); // 킷과 같은 「윈도우의 20%」
  let active = found[0]!.id;
  for (const { id, el } of found) {
    if (y >= el.getBoundingClientRect().top + y - guard) active = id;
  }
  return active;
}

export function InPageNavigation({
  items,
  caption = '이 페이지의 구성',
  title,
  navLabel,
  action,
  info,
  activeId,
  offsetTop,
  className,
  ...rest
}: InPageNavigationProps) {
  const [spyId, setSpyId] = useState<string | undefined>(undefined);
  const controlled = activeId !== undefined;
  const active = controlled ? activeId : spyId;

  // 항목 id 를 문자열 하나로 굳혀 effect 의존성에 쓴다(배열이 매번 새로 만들어져도 다시 붙지 않게).
  const idKey = items.map((it) => it.id).join(' ');

  useEffect(() => {
    if (controlled) return;
    const ids = idKey ? idKey.split(' ') : [];
    if (ids.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      setSpyId(pickActiveId(ids));
    };
    // 스크롤마다 레이아웃을 재는 계산이라 프레임당 한 번으로 묶는다.
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [controlled, idKey]);

  const goToSection = useCallback(
    (id: string): boolean => {
      const target = document.getElementById(id);
      if (!target) return false; // 대상이 없으면 브라우저 기본 앵커 이동에 맡긴다

      const gap = offsetTop ?? headerHeight();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        left: 0,
        top: target.getBoundingClientRect().top + window.scrollY - gap,
        behavior: reduced ? 'auto' : 'smooth',
      });

      // 스크롤만 하고 초점을 두면 규격 위반이다(「스크롤과 함께 목적지 섹션으로 Focus 이벤트」).
      // 킷은 `.sec-tit` 을 찾지만 그 클래스는 킷 CSS 에 없다 — 섹션의 첫 제목 태그를 쓴다.
      const focusTarget = target.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6') ?? target;
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
      return true;
    },
    [offsetTop],
  );

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    // 새 탭·새 창으로 여는 조작은 그대로 둔다(킷 JS 는 이것까지 막는다).
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if (goToSection(id)) {
      event.preventDefault();
      if (!controlled) setSpyId(id);
    }
  };

  if (items.length === 0) return null;

  const hasHeader = caption != null || title != null;

  return (
    <div className={cx('krds-in-page-navigation-area', className)} {...rest}>
      {hasHeader && (
        <div className="in-page-navigation-header">
          {caption != null && <p className="quick-caption">{caption}</p>}
          {/* 제목 태그가 아니라 `<p>` 다 — 본문 제목 계층을 흐리지 않으려는 킷 샘플 그대로. */}
          {title != null && <p className="quick-title">{title}</p>}
        </div>
      )}

      <nav
        className="in-page-navigation-list"
        aria-label={navLabel ?? (typeof caption === 'string' ? caption : '이 페이지의 구성')}
      >
        <ul>
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={isActive ? 'active' : undefined}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={(event) => handleClick(event, item.id)}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {(action != null || info != null) && (
        // 767px 이하에서 킷이 이 블록을 통째로 `display:none` 한다. 유일한 실행 수단을 여기 두지 마라.
        <div className="in-page-navigation-action">
          {action}
          {info != null && <p className="quick-info">{info}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * 목차가 있는 화면의 컨테이너 — 킷 `krds-in-page-navigation-type`.
 *
 * **목차가 아니라 컨테이너에 붙인다** — 이 클래스가 본문 오른쪽에 목차 자리를 파 준다.
 * 안쪽은 `.inner`(LNB 가 같이 있으면 `.inner.in-between`) → `.contents` 순서다.
 *
 * @example
 * <InPageNavigationLayout id="container">
 *   <div className="inner in-between">
 *     <SideNav … />
 *     <div className="contents">…<InPageNavigation … />…</div>
 *   </div>
 * </InPageNavigationLayout>
 */
export function InPageNavigationLayout({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('krds-in-page-navigation-type', className)} {...rest}>
      {children}
    </div>
  );
}
