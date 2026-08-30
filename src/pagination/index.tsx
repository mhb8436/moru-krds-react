import { UiLink } from '../lib/link';
import type { ComponentPropsWithRef } from 'react';
import { cx } from '../lib/krds';

/**
 * 페이지네이션 — KRDS `krds-pagination`.
 *
 * 쪽 번호는 **화면에 보이는 그대로 1부터** 센다. 전체 쪽이 1 이하면 아무것도 그리지 않는다.
 * 쪽이 주소에 실리면 `href`, 상태로만 있으면 `onPageChange` 를 준다(둘 중 하나만).
 * 전체 쪽을 다 그리지 않고 `maxLinks`(기본 10) 안에서 말줄임으로 줄인다 — 규격 상한은 11 이다.
 * 여백은 킷이 잡으므로 `mt-*` 를 더하지 마라. 한 화면에 하나만 둔다.
 *
 * @example
 * <Pagination page={page} totalPages={total} href={(p) => `?page=${p}`} label="공지사항 페이지네이션" />
 * <Pagination page={page} totalPages={total} onPageChange={setPage} maxLinks={7} />
 *
 * 자세히: docs/krds/09-부품-노트.md#페이지네이션
 */

/** 숫자 칸 하나. 숫자이거나 말줄임(`null`)이다. */
export type PageSlot = number | null;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * 그릴 칸을 고른다 — 첫 쪽·마지막 쪽은 항상, 가운데는 현재 쪽 둘레만, 나머지는 말줄임(`null`).
 * `totalPages > maxLinks` 이면 길이가 정확히 `maxLinks` 다.
 *
 * @example
 * pageSlots(4, 99)  // [1,2,3,4,5,6,7,8,null,99]
 * pageSlots(50, 99) // [1,null,48,49,50,51,52,53,null,99]
 */
export function pageSlots(page: number, totalPages: number, maxLinks = 10): PageSlot[] {
  const total = Math.max(1, Math.floor(totalPages));
  const cur = Math.min(Math.max(1, Math.floor(page)), total);
  // 첫 쪽·말줄임·현재 쪽·말줄임·마지막 쪽 — 최소 5칸은 있어야 한다.
  const n = Math.max(5, Math.floor(maxLinks));

  if (total <= n) return range(1, total);

  // 가운데 창 = 전체 칸 - (첫·마지막 숫자 2 + 말줄임 2)
  const win = n - 4;
  let start = cur - Math.floor((win - 1) / 2);
  let end = start + win - 1;

  if (start <= 3) {
    // 앞쪽에 붙었다 — 왼쪽 말줄임이 필요 없으니 창이 한 칸 넓어진다.
    start = 2;
    end = start + (n - 3) - 1;
    return [1, ...range(start, end), null, total];
  }
  if (end >= total - 2) {
    // 뒤쪽에 붙었다.
    end = total - 1;
    start = end - (n - 3) + 1;
    return [1, null, ...range(start, end), total];
  }
  return [1, null, ...range(start, end), null, total];
}

type PaginationBaseProps = {
  /** 현재 쪽. 화면에 보이는 번호 그대로 1부터 센다. */
  page: number;
  /** 전체 쪽수. 1 이하면 아무것도 그리지 않는다. */
  totalPages: number;
  /** 말줄임을 포함한 숫자 칸 최대 개수. 기본 10(규격 상한 11, 좁은 화면 권장 7). */
  maxLinks?: number;
  /** `<nav>` 의 이름. 「공지사항 페이지네이션」처럼 어떤 목록인지 담는다. */
  label?: string;
  /** 이전 단추 글자. */
  prevLabel?: string;
  /** 다음 단추 글자. */
  nextLabel?: string;
  /** `<nav>` 에 붙일 클래스. */
  className?: string;
};

/** 링크 방식(기본). 쪽이 주소에 실릴 때 — 공유·뒤로가기가 되어야 하는 목록. */
export type PaginationLinkProps = PaginationBaseProps & {
  /** 1부터 센 쪽 번호를 받아 주소를 돌려준다. 서버가 0부터 세면 여기서 낮춘다. */
  href: (page: number) => string;
  onPageChange?: never;
};

/** 단추 방식. 쪽이 주소에 없고 상태로만 있을 때. 부르는 쪽이 클라이언트 컴포넌트여야 한다. */
export type PaginationButtonProps = PaginationBaseProps & {
  /** 쪽을 옮길 때. */
  onPageChange: (page: number) => void;
  href?: never;
};

export type PaginationProps = Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> &
  (PaginationLinkProps | PaginationButtonProps);

/** 위 합집합을 안에서 풀어 쓰기 위한 형태. */
type ResolvedPaginationProps = PaginationBaseProps &
  Omit<ComponentPropsWithRef<'nav'>, 'children' | 'className'> & {
    href?: (page: number) => string;
    onPageChange?: (page: number) => void;
  };

export function Pagination(props: PaginationProps) {
  const {
    page,
    totalPages,
    maxLinks = 10,
    label = '페이지네이션',
    prevLabel = '이전',
    nextLabel = '다음',
    href,
    onPageChange,
    className,
    ...rest
  } = props as ResolvedPaginationProps;

  const total = Math.max(0, Math.floor(totalPages));
  // 규격: 전체 데이터가 적을 때(화면이 하나뿐일 때)는 페이지네이션을 쓰지 않는다.
  if (total <= 1) return null;

  const cur = Math.min(Math.max(1, Math.floor(page)), total);

  // 현재 쪽만 `href` 를 빼고 `aria-current="true"` 를 준다(규격). 이름은 가이드 예문 그대로다.
  const renderPage = (n: number) => {
    if (n === cur) {
      return (
        <a className="page-link active" aria-current="true">
          <span className="sr-only">현재페이지 </span>
          {n}
        </a>
      );
    }
    const name = n === total ? `마지막 페이지, ${n}` : `페이지 ${n}`;
    return href ? (
      <UiLink className="page-link" href={href(n)} aria-label={name}>
        {n}
      </UiLink>
    ) : (
      <button type="button" className="page-link" aria-label={name} onClick={() => onPageChange?.(n)}>
        {n}
      </button>
    );
  };

  // 이전/다음. 끝에 닿으면 킷 샘플대로 `<span class="disabled">` 다.
  // hover 배경은 킷이 없는 토큰을 참조하는 결함이 있어 킷의 자기 토큰으로 되돌린다.
  //
  // `aria-disabled` 를 반드시 붙인다. 킷 글자색이 흐려(#8a949e, 배경 #f4f5f6 위 2.82:1) 그냥 두면
  // axe 가 「읽으라고 둔 글자인데 대비가 모자라다」로 본다(WCAG 1.4.3). 비활성 컨트롤은 대비 요구에서
  // 빠지지만, `<span>` 만으로는 「비활성」임을 알릴 방법이 없어 판정에 걸린다 — 실측으로 잡은 것이다.
  const renderNavi = (dir: 'prev' | 'next') => {
    const to = dir === 'prev' ? cur - 1 : cur + 1;
    const text = dir === 'prev' ? prevLabel : nextLabel;
    const off = dir === 'prev' ? cur <= 1 : cur >= total;
    if (off) {
      return (
        <span
          aria-disabled="true"
          className={cx(
            'page-navi',
            dir,
            'disabled',
            'hover:bg-[var(--krds-pagination--color-action)] active:bg-[var(--krds-pagination--color-action)]',
          )}
        >
          {text}
        </span>
      );
    }
    return href ? (
      <UiLink className={cx('page-navi', dir)} href={href(to)}>
        {text}
      </UiLink>
    ) : (
      <button type="button" className={cx('page-navi', dir)} onClick={() => onPageChange?.(to)}>
        {text}
      </button>
    );
  };

  return (
    <nav aria-label={label} className={cx('krds-pagination', className)} {...rest}>
      {renderNavi('prev')}
      <ul className="page-links">
        {pageSlots(cur, total, maxLinks).map((slot, i) => (
          <li key={slot === null ? `dot-${i}` : slot}>
            {slot === null ? (
              <span className="page-link link-dot" aria-hidden="true" />
            ) : (
              renderPage(slot)
            )}
          </li>
        ))}
      </ul>
      {renderNavi('next')}
    </nav>
  );
}
