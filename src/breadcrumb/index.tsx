import { UiLink } from '../lib/link';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 브레드크럼 — KRDS `krds-breadcrumb-wrap`.
 *
 * 홈은 부품이 늘 앞에 붙이므로 `items` 에는 **홈 다음부터**의 경로만 넣는다.
 * 주소가 없는 칸(`href` 생략)은 링크가 아니라 계층 표시로만 그려진다.
 * 메인·랜딩 화면과 1수준 사이트에는 쓰지 않는다 — `items` 가 비면 아무것도 그리지 않는다.
 * 여백은 킷이 잡으므로 `mb-*` 를 더하지 마라.
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: '정보공개', href: '/open' },
 *     { label: '사전정보공표' },
 *   ]}
 * />
 *
 * 자세히: docs/krds/09-부품-노트.md#브레드크럼
 */

/** 경로 한 칸. */
export type BreadcrumbItem = {
  /** 화면에 보이는 이름. */
  label: ReactNode;
  /** 이동 주소. 없으면 링크로 그리지 않는다 — 마지막 칸은 현재 화면, 가운데 칸은 흐린 글자가 된다. */
  href?: string;
  /** 바깥 주소 — `UiLink` 대신 맨 `<a>` 로 그린다. */
  external?: boolean;
};

export type BreadcrumbProps = Omit<ComponentPropsWithRef<'nav'>, 'children'> & {
  /** 홈 다음부터의 경로. 홈은 부품이 늘 앞에 붙인다. */
  items: BreadcrumbItem[];
  /** 홈 칸 이름. 다국어는 화면에서 넘긴다. */
  homeLabel?: string;
  /** 홈 칸 주소. */
  homeHref?: string;
  /** `<nav>` 의 이름. 기본 「현재 경로」(킷 샘플 문구). */
  label?: string;
  /** PC 에서 보일 최대 칸 수 — 홈 포함. 기본 4. 넘으면 말줄임으로 줄이되 계층은 `sr-only` 로 남는다. */
  maxItems?: number;
  className?: string;
};

export function Breadcrumb({
  items,
  homeLabel = '홈',
  homeHref = '/',
  label = '현재 경로',
  maxItems = 4,
  className,
  ...rest
}: BreadcrumbProps) {
  // 규격: 메인 화면에는 브레드크럼을 쓰지 않는다. 홈 하나만 남는 경우가 그것이다.
  if (!items.length) return null;

  // 홈 한 칸은 반드시 남으므로 최소 2. 뒤에 남길 칸 수 = 상한 - 홈.
  const max = Math.max(2, Math.floor(maxItems));
  const tail = max - 1;
  // 홈까지 세어 상한을 넘으면 줄인다. 예) 상한 4 · items 4개 → 홈 · … · 뒤 3개.
  const collapsed = items.length > tail;
  const hidden = collapsed ? items.slice(0, items.length - tail) : [];
  const shown = collapsed ? items.slice(items.length - tail) : items;

  const crumb = (item: BreadcrumbItem, key: string, isLast: boolean, offscreen: boolean) => {
    const { label: text, href, external } = item;

    // 주소가 없으면 `<span class="txt">` 다(킷의 `a.txt.disabled` 는 밑줄이 남아 쓰지 않는다).
    // 흐린 글자색만 보충한다 — 배경·둥글기·여백은 `li .txt` 가 span 에도 걸어 준다.
    const inner = href ? (
      external ? (
        <a className="txt" href={href}>
          {text}
        </a>
      ) : (
        <UiLink className="txt" href={href}>
          {text}
        </UiLink>
      )
    ) : (
      <span
        // 링크가 아닌 중간 단계. `text-fg-disabled`(#8a949e, 흰 바탕 3.08:1)는 **비활성 컨트롤 전용**이라
        // 읽으라고 둔 글자에 쓰면 WCAG 1.4.3(4.5:1) 위반이다 — axe 실측으로 걸렸다. 흐리게는 `subtle`(8.68:1)로.
        className={cx('txt', !isLast && 'text-fg-subtle')}
        aria-current={isLast ? 'page' : undefined}
      >
        {text}
      </span>
    );

    return (
      <li key={key} className={cx(offscreen && 'sr-only')}>
        {inner}
      </li>
    );
  };

  return (
    <nav className={cx('krds-breadcrumb-wrap', className)} aria-label={label} {...rest}>
      <ol className="breadcrumb">
        {/* 홈 — 집 아이콘은 킷이 `.home .txt::before` 로 그린다. */}
        <li className="home">
          <UiLink className="txt" href={homeHref}>
            {homeLabel}
          </UiLink>
        </li>

        {hidden.map((item, i) => crumb(item, `hidden-${i}`, false, true))}

        {collapsed && (
          // PC 말줄임 칸. 킷에는 PC 용 말줄임 규칙이 없어 `ico-ellipsis` 로 직접 그린다.
          // 계층은 위의 `sr-only` 칸들이 읽어 주므로 이 칸은 장식이다.
          <li aria-hidden="true">
            <i className="svg-icon ico-ellipsis size-4" />
          </li>
        )}

        {shown.map((item, i) => crumb(item, `shown-${i}`, i === shown.length - 1, false))}
      </ol>
    </nav>
  );
}
