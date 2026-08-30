import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 표 — KRDS `krds-table-wrap` + `tbl data`.
 *
 * 표를 손으로 짜는 자리에서 쓴다. 열을 데이터로 넘기고 정렬·고정 헤더까지 필요하면
 * `ui/data-table` 의 `DataTable` 이 그 조립을 대신한다.
 * `caption` 은 **화면에 보이지 않는 보조기기 설명**이라 필수이고, 보이는 제목은 표 바깥에 따로 둔다.
 * `columnWidths` 를 주지 않으면 킷의 `table-layout:fixed` 때문에 모든 열이 같은 폭이 된다.
 * `<table>` 에 `grid`·`flex` 같은 display 클래스를 붙이면 행·열 관계가 사라진다.
 *
 * @example
 * <Table caption="사용자 목록 — 아이디, 이름, 권한 순으로 제공합니다." columnWidths={['30%', undefined, '20%']}>
 *   <thead>
 *     <tr><Th scope="col">아이디</Th><Th scope="col">이름</Th><Th scope="col">권한</Th></tr>
 *   </thead>
 *   <tbody>
 *     {rows.length === 0 ? <TableEmpty colSpan={3} /> : rows.map((r) => (
 *       <tr key={r.id}><Th scope="row">{r.id}</Th><Td>{r.name}</Td><Td>{r.role}</Td></tr>
 *     ))}
 *   </tbody>
 * </Table>
 *
 * 자세히: docs/krds/09-부품-노트.md#표
 */

/**
 * 표 감싸개 — 킷 `krds-table-wrap`. 킷의 표 스타일이 전부 이 감싸개의 자손 선택자다.
 *
 * `Table` 이 스스로 그리므로 보통은 직접 쓸 일이 없다 — `<table>` 을 맨손으로 짤 때만 쓴다.
 */
export type TableWrapProps = ComponentPropsWithRef<'div'> & {
  /** 좁은 화면에서 셀을 줄바꿈하지 않고 가로로 굴린다. 기본 켬 — 끄면 좁은 칸 안의 표가 삐져나온다. */
  mobScroll?: boolean;
  /** 폭에 상관없이 항상 가로 스크롤(킷 `scroll`). 열이 아주 많은 관리 표에. */
  scroll?: boolean;
};

export function TableWrap({ mobScroll = true, scroll, className, children, ...rest }: TableWrapProps) {
  return (
    <div
      className={cx(
        'krds-table-wrap',
        mobScroll && 'mob-scroll',
        scroll && 'scroll',
        // 킷의 `mob-scroll` 은 nowrap 만 걸고 스크롤은 모바일 미디어쿼리에만 있다.
        // PC 폭에서 열이 많은 표가 넘치면 글자가 옆 칸 위로 겹친다 — 여기서 스크롤을 켠다.
        mobScroll && 'overflow-x-auto',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type TableProps = ComponentPropsWithRef<'table'> & {
  /** 보조기기가 표보다 먼저 읽는 설명. 필수다. 열 구성을 다 적는다. 화면에는 보이지 않는다. */
  caption: ReactNode;
  /** 열 너비. `undefined` 인 열은 남은 폭을 나눠 갖는다(`['30%', undefined]`). 안 주면 모두 같은 폭이다. */
  columnWidths?: Array<string | number | undefined>;
  /** 감싸개(`krds-table-wrap`)에 붙일 클래스. 표 바깥 여백은 여기로 준다. */
  wrapClassName?: string;
  /** 감싸개로 흘려보낼 나머지 속성. */
  wrapProps?: Omit<TableWrapProps, 'className' | 'children' | 'mobScroll' | 'scroll'>;
} & Pick<TableWrapProps, 'mobScroll' | 'scroll'>;

/** `<table>` 의 display 를 갈아엎어 행·열 관계를 없애는 클래스들. */
const LAYOUT_KILLERS = new Set(['grid', 'flex', 'inline-grid', 'inline-flex', 'block', 'hidden']);

export function Table({
  caption,
  columnWidths,
  wrapClassName,
  wrapProps,
  mobScroll = true,
  scroll,
  className,
  children,
  ...rest
}: TableProps) {
  if (process.env.NODE_ENV !== 'production' && className) {
    const killers = className.split(/\s+/).filter((c) => LAYOUT_KILLERS.has(c));
    if (killers.length) {
      // 조용히 망가지지 않게 막는다.
      console.warn(
        `[krds-react Table] <table> 에 display 를 바꾸는 클래스가 붙었다: ${killers.join(' ')} — 행·열 관계가 사라진다.`,
      );
    }
  }

  return (
    <TableWrap mobScroll={mobScroll} scroll={scroll} className={wrapClassName} {...wrapProps}>
      {/* 가로로 스크롤되는 표는 열 폭을 내용에 맞춘다 — 킷이 `table{table-layout:fixed}` 를 전역으로 못 박아
          폭을 안 주면 열이 전부 같은 너비가 되고, `whitespace-nowrap` 인 칸(날짜·조작 단추)이 잘리지 않고
          **옆 칸 위로 흘러넘쳐** 글자가 겹친다. `ui/data-table` 과 같은 판단이다.
          폭을 손으로 준 표(`columnWidths`)와 스크롤이 아예 없는 표는 그대로 둔다. */}
      <table
        className={cx('tbl data', className)}
        style={(scroll || mobScroll) && !columnWidths ? { tableLayout: 'auto' } : undefined}
        {...rest}
      >
        <caption>{caption}</caption>
        {columnWidths && (
          <colgroup>
            {columnWidths.map((width, i) => (
              // 열 순서가 곧 신원이다 — 인덱스를 key 로 쓰는 것이 맞다.
              <col key={i} style={width === undefined ? undefined : { width }} />
            ))}
          </colgroup>
        )}
        {children}
      </table>
    </TableWrap>
  );
}

/**
 * 머리 칸 — `<th>`. 열 머리는 `scope="col"`, 행 머리는 `scope="row"` 다.
 *
 * `scope` 는 필수다 — 없으면 스크린리더가 셀과 머리의 짝을 알려 주지 못한다.
 */
export type ThProps = Omit<ComponentPropsWithRef<'th'>, 'scope'> & {
  scope: 'col' | 'row' | 'colgroup' | 'rowgroup';
  /** 양적 데이터 열. 오른쪽 정렬 + 자릿수 고정. 날짜·전화번호에는 주지 마라. */
  numeric?: boolean;
  /** 머리글을 화면에서만 감춘다. 조작 버튼만 든 열처럼 이름이 보일 필요는 없는 열에 쓴다. */
  hiddenLabel?: boolean;
};

export function Th({ scope, numeric, hiddenLabel, className, children, ...rest }: ThProps) {
  return (
    <th
      scope={scope}
      className={cx(numeric && 'text-right tabular-nums', className)}
      {...rest}
    >
      {hiddenLabel ? <span className="sr-only">{children}</span> : children}
    </th>
  );
}

/** 값 칸 — `<td>`. 값이 비면 규격대로 대시(`-`)를 넣는다. */
export type TdProps = ComponentPropsWithRef<'td'> & {
  /** 숫자 열. 오른쪽 정렬 + `tabular-nums`. `Th` 의 같은 이름과 짝을 맞춰 쓴다. */
  numeric?: boolean;
  /** 값이 비었을 때 넣을 것. 기본 `-`. 정말로 비워야 하면 `empty={null}`. */
  empty?: ReactNode;
};

/** `-` 로 바꿔야 하는 빈 값인가. `0` 과 `false` 는 값이다. */
function isBlank(children: ReactNode): boolean {
  if (children === null || children === undefined || children === '') return true;
  return Array.isArray(children) && children.length === 0;
}

export function Td({ numeric, empty = '-', className, children, ...rest }: TdProps) {
  return (
    <td className={cx(numeric && 'text-right tabular-nums', className)} {...rest}>
      {isBlank(children) ? empty : children}
    </td>
  );
}

/** 「자료 없음」 행. 킷에 빈 상태 규칙이 없어 유틸리티로 그린다. `<tbody>` 안에 넣는다. */
export type TableEmptyProps = ComponentPropsWithRef<'td'> & {
  /** 표의 전체 열 개수. 덜 주면 빈 문구가 표 가운데에 서지 않는다. */
  colSpan: number;
};

export function TableEmpty({
  colSpan,
  className,
  children = '등록된 자료가 없습니다.',
  ...rest
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cx('py-14 text-center text-fg-subtle', className)} {...rest}>
        {children}
      </td>
    </tr>
  );
}
