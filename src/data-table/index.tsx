import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsTone } from '../lib/krds';

/**
 * 데이터 표 — 킷 `krds-table-wrap` + `tbl data` 위에 정렬·고정 헤더·빈 상태를 얹은 것.
 *
 * 열을 `columns` 로 넘겨 목록을 그린다. 표를 손으로 짤 때는 `ui/table` 의 조각을 쓴다.
 * `caption` 은 **화면에 보이지 않는 보조기기 설명**이다 — 보이는 제목은 `heading` 이다.
 * 정렬 버튼은 `onSortChange` 를 주었을 때만 그려지고, 행 강조는 `rowTone` 으로만 준다
 * (`<tr>` 배경은 킷 셀 배경에 덮인다). 빈 셀에는 `-` 가 자동으로 들어간다.
 *
 * @example
 * <DataTable
 *   caption="공지사항 목록 표로 번호, 제목, 작성자, 등록일 순으로 구성되어 있다."
 *   heading="공지사항"
 *   columns={[
 *     { key: 'title', header: '제목', cell: (r) => r.title, sortable: true },
 *     { key: 'hit', header: '조회', cell: (r) => r.hit, numeric: true },
 *   ]}
 *   rows={rows}
 *   rowKey={(r) => r.id}
 *   sort={sort}
 *   onSortChange={setSort}
 * />
 *
 * 자세히: docs/krds/09-부품-노트.md#데이터표
 */

/** 정렬 방향. */
export type SortDirection = 'asc' | 'desc';

/** 지금 어느 열을 어느 방향으로 정렬하고 있는가. */
export type SortState = {
  /** 열의 `sortKey`(없으면 `key`). */
  key: string;
  direction: SortDirection;
};

export type DataColumn<T> = {
  /** React key 이자 기본 정렬 키. */
  key: string;
  /** 열 제목. `<th scope="col">` 안에 들어간다. */
  header: ReactNode;
  /** 한 칸의 내용. */
  cell: (row: T, index: number) => ReactNode;
  /** `cell` 이 빈 값을 돌려줬을 때 넣을 것. 기본 `-`. 정말 비우려면 `null` 을 준다. */
  empty?: ReactNode;
  /** 양적 데이터(개수·퍼센트·용량). 오른쪽 정렬 + 자릿수 고정. 날짜·전화번호에는 주지 마라. */
  numeric?: boolean;
  /** `<colgroup><col style="width:…">` 로 나간다. */
  width?: number | string;
  /** 이 열로 정렬할 수 있는가. `onSortChange` 가 없으면 무시한다. */
  sortable?: boolean;
  /** 정렬 키를 열 `key` 와 다르게 둘 때(예: 화면은 `author`, 질의는 `author_name`). */
  sortKey?: string;
  /** 이 열을 행 머리글(`<th scope="row">`)로 낸다. 표 단위 `rowHeader` 보다 우선한다. */
  rowHeader?: boolean;
  /** 열 제목 칸에만 더할 클래스. */
  headerClassName?: string;
  /** 이 열의 데이터 칸에 더할 클래스. */
  cellClassName?: string;
};

export type DataTableProps<T> = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 보조기기가 읽을 표 설명. 화면에는 보이지 않는다 — 열 이름을 모두 담아 한 문장으로 적는다. */
  caption: string;
  /** 화면에 보이는 제목. 표 바깥에 그린다. */
  heading?: ReactNode;
  /** 제목을 어떤 태그로 낼지. 문서 목차에 넣으려면 `h2`~`h5` 를 준다. */
  headingAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'p' | 'div';
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  /** 행이 하나도 없을 때 표 안에 그릴 것. 셀 하나가 빈 것은 `column.empty` 가 맡는다. */
  empty?: ReactNode;
  /** 첫 열을 행 머리글(`<th scope="row">`)로 낸다. 행마다 이름이 있는 표에 쓴다. */
  rowHeader?: boolean;
  /** 행 강조색. 「편집 중」·「실패」처럼 뜻이 있는 강조에만 쓴다. 셀마다 칠한다. */
  rowTone?: (row: T, index: number) => KrdsTone | undefined;
  /** `<tr>` 에 더할 클래스. 배경색은 여기 주지 마라 — 킷 셀 배경에 덮인다(`rowTone` 을 쓴다). */
  rowClassName?: (row: T, index: number) => string | undefined;
  /** 지금 정렬 상태. `null`/생략이면 정렬 안 함. */
  sort?: SortState | null;
  /**
   * 정렬 헤더를 눌렀을 때. **이 콜백이 있어야 정렬 버튼이 그려진다.**
   * 정렬 뒤에는 `rows` 만 갈아 끼운다 — 표를 통째로 다시 마운트하면 초점이 날아간다.
   */
  onSortChange?: (next: SortState) => void;
  /** 열 제목 줄을 위에 붙박는다. `maxHeight` 와 같이 줘야 표 안에서 스크롤된다. */
  stickyHeader?: boolean;
  /** 표 영역 최대 높이. 주면 세로 스크롤이 생긴다. */
  maxHeight?: number | string;
  /** 좁은 화면에서 셀을 줄바꿈하지 않고 가로로 스크롤(킷 `mob-scroll`). 기본 참. */
  mobileScroll?: boolean;
  /** 넓은 화면에서도 가로 스크롤(킷 `scroll`). `maxHeight` 와 같이 쓰면 무시한다. */
  horizontalScroll?: boolean;
};

/** 행 강조색 → 유틸리티. 넓은 면이라 `surface` 축이고, gray 만 짝이 없어 중립 면 토큰을 쓴다. */
const ROW_TONE: Record<KrdsTone, string> = {
  primary: 'bg-primary-surface',
  secondary: 'bg-secondary-surface',
  gray: 'bg-surface-subtler',
  point: 'bg-point-surface',
  danger: 'bg-danger-surface',
  warning: 'bg-warning-surface',
  success: 'bg-success-surface',
  information: 'bg-information-surface',
};

/** `-` 로 바꿔야 하는 빈 값인가. `0` 과 `false` 는 값이다. `ui/table` 의 `Td` 와 같은 판정이다. */
function isBlank(value: ReactNode): boolean {
  if (value === null || value === undefined || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

/** 빈 셀의 대시 플레이스홀더. `empty` 를 `null` 로 주면 정말 비운다. */
function withPlaceholder(value: ReactNode, empty: ReactNode): ReactNode {
  if (!isBlank(value)) return value;
  return empty === undefined ? '-' : empty;
}

/** 정렬 버튼이 스크린리더에 읽어 줄 현재 상태와 다음 동작. */
function sortHint(direction: SortDirection | undefined): string {
  if (direction === 'asc') return '오름차순 정렬됨, 누르면 내림차순 정렬';
  if (direction === 'desc') return '내림차순 정렬됨, 누르면 오름차순 정렬';
  return '정렬 안 함, 누르면 오름차순 정렬';
}

export function DataTable<T>({
  caption,
  heading,
  headingAs: Heading = 'div',
  columns,
  rows,
  rowKey,
  empty = '자료가 없습니다.',
  rowHeader = false,
  rowTone,
  rowClassName,
  sort,
  onSortChange,
  stickyHeader = false,
  maxHeight,
  mobileScroll = true,
  horizontalScroll = false,
  className,
  ...rest
}: DataTableProps<T>) {
  const hasWidth = columns.some((c) => c.width !== undefined);
  const scrolls = maxHeight !== undefined;

  return (
    <div className={cx('flex flex-col gap-2', className)} {...rest}>
      {heading != null && (
        <Heading className="text-heading-xxs font-bold text-fg-bolder">{heading}</Heading>
      )}

      <div
        className={cx(
          'krds-table-wrap',
          mobileScroll && 'mob-scroll',
          // 킷 `.scroll` 은 overflow-y 를 hidden 으로 잠근다 — 세로 스크롤과 같이 쓸 수 없다.
          horizontalScroll && !scrolls && 'scroll',
          scrolls && 'overflow-auto',
        )}
        style={scrolls ? { maxHeight } : undefined}
      >
        {/* 가로로 스크롤되는 표는 열 폭을 내용에 맞춘다.
            킷이 `table{table-layout:fixed}` 를 전역으로 못 박아 두어, 폭을 안 주면 열이 전부 같은 너비로 쪼개진다.
            그 상태에서 `whitespace-nowrap` 을 준 칸(날짜·조작 단추)은 잘리지 않고 **옆 칸 위로 흘러넘쳐** 글자가 겹쳤다
            (관리자 콘텐츠 목록에서 게시일 141px 이 108px 칸을 넘어 출력기간과 포개졌다).
            스크롤 상자 안에서는 표가 넓어져도 되므로 `auto` 가 맞다(`mob-scroll` 도 데스크톱에서 overflow-x:auto 다 — 실측).
            스크롤이 아예 없는 표만 `fixed` 로 둔다 — 거기서는 한 열이 길어지면 나머지를 밀어내므로 균등 분배가 낫다.
            폭을 손으로 준 표(`hasWidth`)도 건드리지 않는다. */}
        <table className="tbl col data" style={(horizontalScroll || mobileScroll) && !hasWidth ? { tableLayout: 'auto' } : undefined}>
          {/* 킷이 !important 로 숨긴다 — 보조기기 전용이다. 보이는 제목은 위 `heading`. */}
          <caption>{caption}</caption>

          {hasWidth && (
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={col.width !== undefined ? { width: col.width } : undefined} />
              ))}
            </colgroup>
          )}

          <thead>
            <tr>
              {columns.map((col) => {
                const key = col.sortKey ?? col.key;
                const direction = sort && sort.key === key ? sort.direction : undefined;
                const active = direction !== undefined;
                const canSort = col.sortable === true && onSortChange !== undefined;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    // 정렬 가능한 열은 정렬 중이 아니어도 `none` 을 달아야 「정렬할 수 있는 열」임이 전달된다.
                    aria-sort={
                      canSort ? (active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none') : undefined
                    }
                    className={
                      cx(
                        col.numeric && 'text-right',
                        // 킷 thead 배경(`--krds-table--data-thead-surface`)이 불투명이라 그대로 붙박아도 비치지 않는다.
                        stickyHeader && 'sticky top-0 z-10',
                        col.headerClassName,
                      ) || undefined
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        // 킷이 button 을 `font:inherit;color:inherit;background:transparent` 로 되돌려 주므로
                        // 열 제목의 굵기·크기·색을 그대로 물려받는다. 배치만 잡으면 된다.
                        className={cx(
                          'inline-flex items-center gap-1 text-left',
                          col.numeric && 'w-full justify-end',
                        )}
                        onClick={() =>
                          onSortChange?.({ key, direction: direction === 'asc' ? 'desc' : 'asc' })
                        }
                      >
                        {col.header}
                        {/* size-4(16px) = KRDS `--krds-icon--size-small`. 킷 기본값 large(24px)는 15px 제목에 너무 크다. */}
                        <i
                          className={cx(
                            'svg-icon ico-angle size-4 shrink-0 bg-fg-bolder',
                            direction === 'asc' && 'up',
                            !active && 'opacity-40',
                          )}
                          aria-hidden="true"
                        />
                        <span className="sr-only">{sortHint(direction)}</span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                {/* KRDS 에 빈 상태 부품이 없다 — 유틸리티로 그린다. py-10 = KRDS padding 40. */}
                <td colSpan={columns.length} className="py-10 text-center text-fg-subtle">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const tone = rowTone?.(row, i);
                const toneClass = tone && ROW_TONE[tone];

                return (
                  <tr key={rowKey(row, i)} className={rowClassName?.(row, i)}>
                    {columns.map((col, j) => {
                      const asRowHeader = col.rowHeader ?? (rowHeader && j === 0);
                      const cellClass =
                        cx(col.numeric && 'text-right tabular-nums', toneClass, col.cellClassName) || undefined;
                      // 빈 셀에는 대시(-) — `Td` 와 같은 규칙이다(함정 ⑤).
                      const content = withPlaceholder(col.cell(row, i), col.empty);

                      // 킷은 tbody 의 th 도 regular 로 그린다 — 행 머리글은 굵게 되돌린다.
                      return asRowHeader ? (
                        <th key={col.key} scope="row" className={cx('font-bold', cellClass)}>
                          {content}
                        </th>
                      ) : (
                        <td key={col.key} className={cellClass}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
