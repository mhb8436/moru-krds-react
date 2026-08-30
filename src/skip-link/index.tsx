import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 건너뛰기 링크 — KRDS `#krds-skip-link`.
 *
 * `<body>` 를 열자마자, 문서의 가장 첫 요소로 둔다. 링크는 3개까지고 첫 번째가 핵심 영역이다.
 * 목적지에는 브레드크럼·사이드 메뉴 같은 반복 영역이 들어가면 안 된다 —
 * 본문에 별도 앵커를 두고 `skipTargetProps()`(또는 `SkipTarget`)로 `tabIndex={-1}` 을 붙인다.
 * 킷이 아이디 선택자로 모양을 잡으므로 한 문서에 하나만 둔다.
 *
 * @example
 * <SkipLink links={[{ href: '#content', label: '본문 바로가기' }]} />
 * <div {...skipTargetProps('content')}>…본문…</div>
 *
 * 자세히: docs/krds/09-부품-노트.md#건너뛰기링크
 */

/** 건너뛰기 링크 한 줄. */
export type SkipLinkItem = {
  /** 목적지 앵커. `#` 로 시작한다. */
  href: string;
  /** 링크 글자. 예: 「본문 바로가기」 */
  label: string;
};

export type SkipLinkProps = Omit<ComponentPropsWithRef<'div'>, 'id' | 'children'> & {
  /** 링크 목록. 첫 번째가 핵심 영역이다. 3개를 넘기면 개발 모드에서 경고하고 앞 3개만 그린다. */
  links: SkipLinkItem[];
  /** 탐색 랜드마크 이름. 기본 「건너뛰기 링크」. */
  label?: string;
};

/** 규격이 정한 상한. */
const MAX_LINKS = 3;

export function SkipLink({ links, label = '건너뛰기 링크', className, ...rest }: SkipLinkProps) {
  const shown = links.slice(0, MAX_LINKS);

  if (process.env.NODE_ENV !== 'production' && links.length > MAX_LINKS) {
    // 규격: 「개수는 3개 이내」. 조용히 자르지 않고 알린다.
    console.warn(
      `[SkipLink] 건너뛰기 링크는 3개 이내여야 한다(받은 개수 ${links.length}). 앞 ${MAX_LINKS}개만 그린다.`,
    );
  }

  return (
    <div
      // 킷이 이 id 에 모양을 전부 걸어 두어 기본 클래스가 없다 — 빈 class 를 남기지 않는다.
      className={cx(className) || undefined}
      role="navigation"
      aria-label={label}
      {...rest}
      // id 는 킷 CSS 가 물고 있는 선택자다. rest 로 덮이지 않도록 마지막에 고정한다.
      id="krds-skip-link"
    >
      {shown.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </div>
  );
}

/**
 * 건너뛰기 목적지에 붙일 속성. `tabIndex={-1}` 이 있어야 앵커 이동이 초점까지 옮긴다.
 *
 * @example
 * <div {...skipTargetProps('content')}>…본문…</div>
 */
export function skipTargetProps(id: string): { id: string; tabIndex: number } {
  return { id, tabIndex: -1 };
}

/** 목적지 감싸개 — {@link skipTargetProps} 를 바로 쓰는 형태. 클래스는 붙이지 않는다. */
export type SkipTargetProps = ComponentPropsWithRef<'div'> & {
  id: string;
  children?: ReactNode;
};

export function SkipTarget({ id, className, children, ...rest }: SkipTargetProps) {
  return (
    // tabIndex 는 규격이 요구하는 것이라 rest 로 덮이지 않게 뒤에 둔다.
    <div className={cx(className) || undefined} {...rest} {...skipTargetProps(id)}>
      {children}
    </div>
  );
}
