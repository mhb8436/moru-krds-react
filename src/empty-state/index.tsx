import { UiLink } from '../lib/link';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsIcon, type KrdsTone } from '../lib/krds';

/**
 * 빈 상태 상자 — KRDS 에 없다. shadcn `Empty` 형태에 KRDS 토큰을 입힌 보충 부품이다.
 *
 * 「보여 줄 것이 없다」를 알린다 — 등록된 것이 없음 · 조건에 맞는 것이 없음 · 권한 없음 · 불러오기 실패.
 * 「알아 둘 것이 있다」는 `Alert`, 표 안 한 행짜리 빈 칸은 `ui/table` 의 `TableEmpty` 다.
 * **막다른 골목을 만들지 마라** — `hints` 나 `actions` 중 하나는 준다.
 * 검색 결과 없음은 규격이 문구와 대안 4개까지 못 박았으므로 {@link SearchEmptyState} 를 쓴다.
 *
 * @example
 * <EmptyState reason="no-results" actions={<Button onClick={reset}>조건 초기화</Button>} />
 * <EmptyState reason="forbidden" layout="inline" />
 * <SearchEmptyState query={q} count={0} helpHref="/help/search" />
 *
 * 자세히: docs/krds/09-부품-노트.md#빈상태
 */

/** 왜 비었는가. 색·아이콘·기본 문구가 여기서 갈린다. */
export type EmptyStateReason =
  /** 아직 등록된 것이 없다(조건 문제가 아니다) */
  | 'empty'
  /** 검색어·필터에 맞는 것이 없다 */
  | 'no-results'
  /** 볼 권한이 없다 */
  | 'forbidden'
  /** 불러오지 못했다 */
  | 'error';

/** 색. `KrdsTone` 에서 이 상자가 쓰는 넷만 좁힌 것이다. */
export type EmptyStateTone = Extract<KrdsTone, 'gray' | 'information' | 'warning' | 'danger'>;

/**
 * 배치. `panel` 은 목록이 있던 넓은 자리(가운데 정렬), `inline` 은 폼 옆·카드 안처럼 좁은 자리다.
 * 테두리는 둘 다 같은 사방 점선이고 정렬과 여백만 다르다.
 */
export type EmptyStateLayout = 'panel' | 'inline';

/** 사유별 기본값. `forbidden` 에 아이콘이 없는 것은 일부러다 — 킷에 자물쇠·경고 아이콘이 없다. */
const REASON: Record<EmptyStateReason, { tone: EmptyStateTone; icon: KrdsIcon | null; title: string }> = {
  empty: { tone: 'gray', icon: 'file', title: '등록된 자료가 없습니다.' },
  'no-results': { tone: 'gray', icon: 'sch', title: '조건에 맞는 결과가 없습니다.' },
  forbidden: { tone: 'warning', icon: null, title: '이 내용을 볼 권한이 없습니다.' },
  error: { tone: 'danger', icon: 'error-fill', title: '불러오지 못했습니다.' },
};

/** 색조별 유틸리티. 선 `border-*-line` · 면 `bg-*-surface` · mask 아이콘 색 `tint`. */
const TONE: Record<EmptyStateTone, { line: string; surface: string; tint: string }> = {
  gray: { line: 'border-line', surface: 'bg-surface-subtler', tint: 'bg-fg-disabled' },
  information: { line: 'border-information-line', surface: 'bg-information-surface', tint: 'bg-information' },
  warning: { line: 'border-warning-line', surface: 'bg-warning-surface', tint: 'bg-warning' },
  danger: { line: 'border-danger-line', surface: 'bg-danger-surface', tint: 'bg-danger' },
};

export type EmptyStateProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** 기본 `empty`. 색·아이콘·기본 문구가 여기서 정해진다. */
  reason?: EmptyStateReason;
  /** 사유의 기본 색을 덮는다. 굳이 필요할 때만. */
  tone?: EmptyStateTone;
  /** 기본 `panel`. 좁은 자리에는 `inline`. */
  layout?: EmptyStateLayout;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 사유 기본값을 덮는다. `null` 이면 그리지 않는다. */
  icon?: KrdsIcon | null;
  /** 제목 한 줄. 생략하면 사유의 기본 문구. */
  title?: ReactNode;
  /** 제목 위에 오는 줄. 검색 결과 수처럼 제목보다 먼저 와야 하는 것이 여기 온다. */
  lead?: ReactNode;
  /** 제목 아래 보충 설명. */
  description?: ReactNode;
  /** 대안 행동 목록. 결과 없음에는 반드시 채운다 — 막다른 골목을 만들지 않는다. */
  hints?: ReactNode[];
  /** 아래쪽 단추 자리(`ui/button` 의 Button·LinkButton 을 넣는다). */
  actions?: ReactNode;
  /**
   * `role="status"` 를 붙인다. 클라이언트에서 목록이 바뀌는 화면에서만 켠다 —
   * 이때 상자는 내용이 바뀌기 전부터 DOM 에 있어야 낭독된다.
   */
  live?: boolean;
  children?: ReactNode;
};

export function EmptyState({
  reason = 'empty',
  tone,
  layout = 'panel',
  icon,
  title,
  lead,
  description,
  hints,
  actions,
  live,
  className,
  children,
  ...rest
}: EmptyStateProps) {
  const preset = REASON[reason];
  const t = TONE[tone ?? preset.tone];
  const panel = layout === 'panel';

  // `undefined` 는 「기본값을 쓴다」, `null` 은 「아이콘을 그리지 않는다」. 둘을 구분해야 한다.
  const iconName = icon === undefined ? preset.icon : icon;
  // `-fill` 아이콘은 background-image 라 색을 못 바꾼다 — 색 유틸리티를 붙이지 않는다(함정 1).
  const iconNode = iconName ? (
    <i
      className={cx(
        'svg-icon',
        `ico-${iconName}`,
        panel ? 'size-12' : 'size-6 shrink-0',
        !iconName.endsWith('-fill') && t.tint,
      )}
      aria-hidden="true"
    />
  ) : null;

  const hintList =
    hints && hints.length > 0 ? (
      // 킷 전역 `ol,ul{list-style:none}` 때문에 목록 의미가 떨어진다 — `ui/text-list` 와 같이 role 을 명시한다.
      <ul role="list" className={cx('krds-info-list dash', panel && 'w-fit text-left')}>
        {hints.map((hint, i) => (
          <li key={i} role="listitem">
            {hint}
          </li>
        ))}
      </ul>
    ) : null;

  // shadcn `EmptyHeader` 자리 — 아이콘·제목·설명이 한 덩이로 `gap-2`(8px) 씩 벌어진다.
  // panel 은 아이콘이 글 **위**에 서고(shadcn `EmptyMedia`), inline 은 좁은 자리라 글 **왼쪽**에 선다.
  const header = (
    <div className={cx('flex flex-col gap-2', panel && 'items-center text-center')}>
      {panel && iconNode}
      {lead && <p className="m-0 text-sm text-fg-subtle">{lead}</p>}
      <p className={cx('m-0 font-bold text-fg', panel ? 'text-heading-xs' : 'text-sm')}>{title ?? preset.title}</p>
      {description && <p className="m-0 text-sm text-fg-subtle">{description}</p>}
    </div>
  );

  const body = (
    <>
      {header}
      {hintList}
      {children}
      {/* shadcn `EmptyContent` 자리 — 단추 줄. */}
      {actions && <div className={cx('flex flex-wrap items-center gap-2', panel && 'justify-center')}>{actions}</div>}
    </>
  );

  return (
    <div
      role={live ? 'status' : undefined}
      className={cx(
        // shadcn `Empty` — 점선 사방 테두리 + 둥글기. `border-solid` 가 아니라 `border-dashed` 라야
        // 선이 그려진다(preflight 가 없어 border-style 기본값이 none 이다. `ui/separator` 함정 2).
        'rounded-lg border border-dashed',
        panel
          ? // 가운데 정렬 + 세로 흐름 `gap-6`(24px). 위아래 40px 은 킷 `.no-results` 실측(`--krds-padding-10`).
            'flex flex-col items-center gap-6 px-6 py-10 text-center'
          : // 좁은 자리 — 아이콘을 왼쪽에 세우고 글은 왼쪽 정렬. 여백 24/16px.
            'flex items-start gap-2 px-6 py-4 text-left',
        t.line,
        t.surface,
        className,
      )}
      {...rest}
    >
      {panel ? (
        body
      ) : (
        <>
          {iconNode}
          <div className="flex min-w-0 flex-1 flex-col gap-4">{body}</div>
        </>
      )}
    </div>
  );
}

/**
 * 검색 결과 없음 — KRDS 가 문구와 대안까지 못 박은 화면이다.
 *
 * 결과 수 0 · 규격 문구 · 대안 4개(철자 확인 · 다른 검색어 · 더 일반적인 검색어 · 검색 도움말)를
 * 기본값으로 담는다. `<SearchEmptyState query={q} />` 만으로 규격을 채운다.
 *
 * **`helpHref` 를 주지 않으면 대안 ④가 갈 곳 없는 문장으로 남는다** —
 * 도움말 문서가 아직 없다면 `hints` 를 직접 넘겨 그 화면에서 할 수 있는 행동으로 바꿔라.
 */

/** 규격이 든 안내 문구 그대로. 바꾸지 마라. */
export const SEARCH_NO_RESULT_MESSAGE = '검색어와 일치하는 결과를 찾을 수 없습니다.';

/** 규격 대안 4개 중 링크가 필요 없는 셋. ④는 `helpHref` 에 따라 아래에서 만든다. */
export const SEARCH_NO_RESULT_HINTS: readonly string[] = [
  '검색어의 철자가 정확한지 확인해 보세요.',
  '다른 검색어로 다시 검색해 보세요.',
  '더 일반적인 검색어를 사용해 보세요.',
];

export type SearchEmptyStateProps = Omit<EmptyStateProps, 'reason' | 'lead'> & {
  /** 사용자가 넣은 검색어. 결과 수 줄에 굵게 되짚어 준다. */
  query?: string;
  /** 결과 수. 규격상 0을 반드시 표시한다. 화면 위쪽에서 이미 세고 있으면 `null` 로 숨긴다. */
  count?: number | null;
  /** 검색 도움말 문서 주소. 규격 대안 ④가 링크가 되려면 있어야 한다. */
  helpHref?: string;
  /** 도움말 링크 글자. 기본 「검색 도움말」 — 바꾸면 뒤따르는 조사가 어긋날 수 있다. */
  helpLabel?: string;
};

export function SearchEmptyState({
  query,
  count = 0,
  helpHref,
  helpLabel = '검색 도움말',
  hints,
  title = SEARCH_NO_RESULT_MESSAGE,
  ...rest
}: SearchEmptyStateProps) {
  // 킷에 문장 속 텍스트 링크 클래스가 없어(그쪽은 높이가 박힌 버튼이다) 유틸리티로 보충한다.
  const helpLink = helpHref ? (
    helpHref.startsWith('/') ? (
      <UiLink href={helpHref} className="text-link underline hover:text-link-hover">
        {helpLabel}
      </UiLink>
    ) : (
      <a href={helpHref} className="text-link underline hover:text-link-hover">
        {helpLabel}
      </a>
    )
  ) : null;

  const specHints: ReactNode[] = [
    ...SEARCH_NO_RESULT_HINTS,
    helpLink ? <>{helpLink}을 참고하세요.</> : `${helpLabel}을 참고하세요.`,
  ];

  return (
    <EmptyState
      reason="no-results"
      title={title}
      // 규격 순서: 결과 수 → 안내 메시지 → 대안. 그래서 결과 수는 제목 위(`lead`)에 온다.
      lead={
        count === null ? undefined : (
          <>
            {query ? <>「<b className="text-fg">{query}</b>」에 대한 검색 결과 </> : '검색 결과 '}
            <b className="text-fg">{count.toLocaleString('ko-KR')}</b>건
          </>
        )
      }
      hints={hints ?? specHints}
      {...rest}
    />
  );
}
