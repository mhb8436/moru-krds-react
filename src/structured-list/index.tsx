import { Children, isValidElement, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 구조화 목록 — KRDS `krds-structured-list`.
 *
 * 「유사하거나 관련된 콘텐츠 집합」을 카드로 늘어놓는다. 대부분은 {@link StructuredCard} 한 줄로 끝나고,
 * 순서를 바꾸거나 킷에 없는 것을 끼울 때만 조각(`StructuredItem*`)을 직접 조립한다.
 * 행·열이 있는 자료는 카드가 아니라 `ui/table` · `ui/data-table` 이다.
 * `meta`(부가 정보 줄)는 **전폭 배치 전용**이다 — `layout="grid"` 에서는 구분선이 걸리지 않는다.
 * 카드 안 버튼에는 `title` 로 어느 항목의 것인지 알린다(「신청하기」가 20개인 목록을 생각하라).
 * 목록이 비면 `StructuredList` 대신 {@link StructuredListEmpty} 를 그린다.
 *
 * @example
 * <StructuredListToolbar info={`전체 ${total}건`}>
 *   <SortSelect aria-label="정렬기준" options={sorts} />
 * </StructuredListToolbar>
 * <StructuredList layout="full">
 *   {rows.map((r) => (
 *     <StructuredCard
 *       key={r.id}
 *       href={`/board/notice/${r.id}`}
 *       title={r.title}
 *       summary={r.summary}
 *       dateLabel="등록일"
 *       dateValue={r.createdAt}
 *       badge={<Badge tone="primary">공지</Badge>}
 *       tags={r.tags}
 *     />
 *   ))}
 * </StructuredList>
 *
 * 자세히: docs/krds/09-부품-노트.md#구조화목록
 */

/**
 * 배치. `grid` 3열 격자(기본) · `full` 한 줄에 한 항목(제목이 커진다) · `compact` 전폭이되 제목은 그대로.
 */
export type StructuredListLayout = 'grid' | 'full' | 'compact';

/**
 * 크기. 바꾸는 것은 **항목 안쪽 여백**과 우상단 액션 버튼 위치다.
 * `layout="full"` 과 함께 주면 제목 크기는 배치 쪽이 이겨 여백만 줄어든다.
 */
export type StructuredListSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

const LAYOUT_CLASS: Record<StructuredListLayout, string | undefined> = {
  grid: undefined,
  full: 'type-full',
  compact: 'type2',
};

const SIZE_CLASS: Record<StructuredListSize, string> = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

export type StructuredListProps = ComponentPropsWithRef<'ul'> & {
  /** 배치. 기본 `grid`. */
  layout?: StructuredListLayout;
  /** 크기. 기본 `medium`. */
  size?: StructuredListSize;
  /** 항목마다 선택 체크박스가 있을 때 켠다 — 켜지 않으면 체크박스와 우상단 버튼이 겹친다. */
  selectable?: boolean;
};

/** 목록 껍데기 — 킷 `krds-structured-list`. 목록 이름이 필요하면 `aria-label` 을 넘긴다. */
export function StructuredList({
  layout = 'grid',
  size = 'medium',
  selectable,
  className,
  children,
  ...rest
}: StructuredListProps) {
  if (process.env.NODE_ENV !== 'production' && layout === 'grid') {
    // `meta` 의 킷 규칙은 전폭 배치 안에만 있어 격자에서는 조용히 맨 목록이 된다.
    // 배치를 아는 것은 목록뿐이라 여기서 자식의 `meta` 를 본다(직접 조립한 것은 못 잡는다).
    const withMeta = Children.toArray(children).some(
      (child) => isValidElement<{ meta?: unknown }>(child) && child.props.meta != null,
    );
    if (withMeta) {
      console.warn(
        '[krds-react StructuredList] layout="grid" 에 meta 를 준 카드가 있다 — 킷의 `.c-txt-ul` 규칙은 ' +
          '`.type-full`·`.type2` 안에만 있어 구분선도 색도 걸리지 않은 맨 목록이 나온다. ' +
          'layout="full" 이나 "compact" 로 두거나 meta 를 빼라.',
      );
    }
  }

  return (
    <ul
      className={cx(
        'krds-structured-list',
        LAYOUT_CLASS[layout],
        SIZE_CLASS[size],
        selectable && 'type-check',
        className,
      )}
      {...rest}
    >
      {children}
    </ul>
  );
}

export type StructuredItemProps = ComponentPropsWithRef<'li'> & {
  /** 선택됨. 체크박스의 `checked` 와 **따로** 준다 — 킷 CSS 가 `<li>` 클래스만 본다. */
  selected?: boolean;
  /** 항목 선택 체크박스. `<Checkbox>` 하나를 그대로 넘긴다 — `<CheckArea>` 로 감싸지 마라. */
  check?: ReactNode;
};

/** 항목 하나 — 킷 `structured-item`. 안쪽 `<div class="in">` 은 부품이 스스로 그린다. */
export function StructuredItem({
  selected,
  check,
  className,
  children,
  ...rest
}: StructuredItemProps) {
  return (
    <li className={cx('structured-item', selected && 'is-check', className)} {...rest}>
      <div className="in">
        {check != null && <div className="krds-check-area">{check}</div>}
        {children}
      </div>
    </li>
  );
}

/** 항목 머리 — 킷 `card-top`. 상태 배지 자리다. */
export function StructuredItemTop({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('card-top', className)} {...rest}>
      {children}
    </div>
  );
}

/** 항목 본문 — 킷 `card-body`. 탐색 링크와 CTA 가 들어간다(전폭 배치에서는 좌우로 벌어진다). */
export function StructuredItemBody({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('card-body', className)} {...rest}>
      {children}
    </div>
  );
}

/** 상세로 가는 탐색 링크 — 킷 `c-text`. 제목·요약·기간을 통째로 감싼다. */
export type StructuredItemLinkProps = ComponentPropsWithRef<'a'>;

export function StructuredItemLink({
  className,
  children,
  target,
  title,
  ...rest
}: StructuredItemLinkProps) {
  return (
    <a
      className={cx('c-text', className)}
      target={target}
      // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구(「실행 결과를 예측할 수 있어야 한다」).
      title={title ?? (target === '_blank' ? '새 창 열림' : undefined)}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * 제목 — 킷 `c-tit`. **한 줄로 잘린다.** 안쪽 `<span>` 감싸개는 부품이 그린다.
 * 오른쪽 화살표는 킷이 그리므로 아이콘을 직접 넣지 마라.
 */
export function StructuredItemTitle({ className, children, ...rest }: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('c-tit', className)} {...rest}>
      <span className="span">{children}</span>
    </p>
  );
}

/** 요약 — 킷 `c-txt`. 격자에서 3줄, 전폭에서 1줄로 잘린다. */
export function StructuredItemSummary({ className, children, ...rest }: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('c-txt', className)} {...rest}>
      {children}
    </p>
  );
}

export type StructuredItemDateProps = ComponentPropsWithRef<'p'> & {
  /** 항목 이름. 굵게 그려진다. 예: 「신청 기간」 */
  label: ReactNode;
};

/** 기간·날짜 한 줄 — 킷 `c-date`. 값이 비면 규격대로 대시(`-`)를 넣는다. */
export function StructuredItemDate({
  label,
  className,
  children,
  ...rest
}: StructuredItemDateProps) {
  const value = children == null || children === '' ? '-' : children;
  return (
    <p className={cx('c-date', className)} {...rest}>
      <strong className="key">{label}</strong>
      <span className="value">{value}</span>
    </p>
  );
}

export type StructuredItemMetaProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  /** 항목들. 사이사이에 세로 구분선이 그려진다. 빈 값에는 `-` 를 넣어 자리를 지킨다. */
  items: ReactNode[];
};

/**
 * 부가 정보 줄 — 킷 `c-txt-ul`. 「부서 · 등록일 · 조회수」처럼 짧은 값을 세로선으로 잇는다.
 * **전폭·compact 배치의 `card-body` 안에서만** 킷 규칙이 걸린다.
 */
export function StructuredItemMeta({ items, className, ...rest }: StructuredItemMetaProps) {
  return (
    <ul className={cx('c-txt-ul', className)} {...rest}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * CTA 자리 — 킷 `c-btn`. 항목과 관련된 **가장 중요한 행동 하나**만 넣는다(가이드 규정).
 * 어느 항목의 버튼인지 알도록 `title` 에 항목 제목을 준다.
 */
export function StructuredItemCta({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('c-btn', className)} {...rest}>
      {children}
    </div>
  );
}

/** 태그 줄 — 킷 `card-btm`. 위쪽 구분선은 킷이 그린다. */
export function StructuredItemTags({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('card-btm', className)} {...rest}>
      {children}
    </div>
  );
}

/** 태그 하나 — 킷 `tag`. **글자 앞의 `#` 는 킷이 붙인다** — 직접 쓰면 `##` 이 된다. */
export function StructuredItemTag({ className, children, ...rest }: ComponentPropsWithRef<'span'>) {
  return (
    <span className={cx('tag', className)} {...rest}>
      {children}
    </span>
  );
}

/**
 * 액션 버튼 묶음 — 킷 `card-btn`. 항목 우상단에 놓이는 보조 기능(공유·찜하기) 자리다.
 * 안에는 `krds-btn medium text` 를 쓴다(킷이 높이를 고정한다).
 */
export function StructuredItemActions({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('card-btn', className)} {...rest}>
      {children}
    </div>
  );
}

export type StructuredCardProps = Omit<StructuredItemProps, 'title'> & {
  /** 제목. 한 줄로 잘린다. */
  title: ReactNode;
  /** 상세 주소. 제목·요약·기간 전체가 이 링크가 된다. */
  href: string;
  /** `_blank` 면 「새 창 열림」을 `title` 로 알린다. */
  target?: string;
  /** 요약. 격자 3줄 · 전폭 1줄로 잘린다. */
  summary?: ReactNode;
  /** 기간 줄의 이름. 예: 「신청 기간」 */
  dateLabel?: ReactNode;
  /** 기간 줄의 값. 비면 `-` 가 들어간다. */
  dateValue?: ReactNode;
  /** 부가 정보(세로선 구분). **전폭·compact 목록에서만** 킷 규칙이 걸린다. */
  meta?: ReactNode[];
  /** 상태 배지. `<Badge>` 를 넣는다. */
  badge?: ReactNode;
  /** 태그. `#` 은 킷이 붙이므로 글자만 넣는다. */
  tags?: ReactNode[];
  /** 가장 중요한 행동 하나. `title` 에 항목 제목을 주는 것을 잊지 마라. */
  cta?: ReactNode;
  /** 우상단 보조 기능(공유·찜하기 등). */
  actions?: ReactNode;
};

/**
 * 카드 한 장을 통째로 — 조각들을 킷 샘플 순서대로 조립한다.
 * 순서를 바꾸거나 킷에 없는 것을 끼워야 할 때만 조각을 직접 쓴다.
 */
export function StructuredCard({
  title,
  href,
  target,
  summary,
  dateLabel,
  dateValue,
  meta,
  badge,
  tags,
  cta,
  actions,
  children,
  ...rest
}: StructuredCardProps) {
  return (
    <StructuredItem {...rest}>
      {badge != null && <StructuredItemTop>{badge}</StructuredItemTop>}
      <StructuredItemBody>
        <StructuredItemLink href={href} target={target}>
          <StructuredItemTitle>{title}</StructuredItemTitle>
          {summary != null && <StructuredItemSummary>{summary}</StructuredItemSummary>}
          {meta != null && meta.length > 0 && <StructuredItemMeta items={meta} />}
          {dateLabel != null && (
            <StructuredItemDate label={dateLabel}>{dateValue}</StructuredItemDate>
          )}
        </StructuredItemLink>
        {cta != null && <StructuredItemCta>{cta}</StructuredItemCta>}
      </StructuredItemBody>
      {tags != null && tags.length > 0 && (
        <StructuredItemTags>
          {tags.map((tag, i) => (
            <StructuredItemTag key={i}>{tag}</StructuredItemTag>
          ))}
        </StructuredItemTags>
      )}
      {actions != null && <StructuredItemActions>{actions}</StructuredItemActions>}
      {children}
    </StructuredItem>
  );
}

/**
 * 자료 없음 — 킷에 빈 목록 규칙이 없어 보충했다(표의 `TableEmpty` 와 같은 모양).
 * 목록이 비면 `StructuredList` 를 그리지 말고 이것을 그린다.
 * 대안 행동까지 곁들이려면 `ui/empty-state` 의 `EmptyState` 를 쓴다.
 */
export function StructuredListEmpty({
  className,
  children = '등록된 자료가 없습니다.',
  ...rest
}: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('py-14 text-center text-fg-subtle', className)} {...rest}>
      {children}
    </p>
  );
}

export type StructuredListToolbarProps = ComponentPropsWithRef<'div'> & {
  /** 왼쪽 — 결과 건수·전체 선택 등. `aria-live="polite"` 로 감싸 바뀐 건수를 읽어 준다. */
  info?: ReactNode;
};

/**
 * 목록 위 도구 막대 — 킷에 클래스가 없어 유틸리티로 그린 보충 부품이다.
 *
 * 왼쪽에 결과 건수, 오른쪽에 정렬·개수 도구를 둔다. 규격: **모든 화면에서 같은 자리에 같은 순서로.**
 * 정렬을 바꿀 때는 목록만 갈아 끼운다 — 초점을 옮기지 마라.
 */
export function StructuredListToolbar({
  info,
  className,
  children,
  ...rest
}: StructuredListToolbarProps) {
  return (
    <div
      className={cx('flex flex-wrap items-center justify-between gap-3 pb-5', className)}
      {...rest}
    >
      {info != null ? <div aria-live="polite">{info}</div> : <div />}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
