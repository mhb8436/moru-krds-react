import { Children, cloneElement, isValidElement } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 텍스트 목록 — KRDS `krds-info-list`.
 *
 * 안내 문구 묶음·절차·요건처럼 **줄 단위로 끊어 읽는 글**에 쓴다.
 * 순서가 없으면 `TextList`, 순서·순위가 있으면 `OrderedTextList` 다(번호는 부품이 채운다).
 * 들여쓰기·간격·글자 크기는 킷이 **DOM 깊이**로 정한다 — 중첩 목록은 `TextListItem` 의
 * **직계 자식**으로 넣어야 하고, 사이에 `<div>` 를 하나만 끼워도 깊이 1 로 돌아간다.
 * 수준은 3 이내다. 여러 차원의 자료는 표, 긴 서술은 문단으로 간다.
 *
 * @example
 * <TextList marker="dot">
 *   <TextListItem>
 *     신청 자격
 *     <TextList marker="dash">
 *       <TextListItem>만 18세 이상</TextListItem>
 *     </TextList>
 *   </TextListItem>
 * </TextList>
 * <OrderedTextList numbering="decimal">
 *   <TextListItem>신청서를 내려받습니다.</TextListItem>
 *   <TextListItem>작성해 방문 접수합니다.</TextListItem>
 * </OrderedTextList>
 *
 * 자세히: docs/krds/09-부품-노트.md#텍스트목록
 */

/**
 * 글머리 기호. `dot` ● (1수준) · `dash` - (2수준) · `circle` ○ (3수준)이 킷 샘플의 관례다.
 * **1수준에 `circle` 을 주면 들여쓰기가 얕아진다** — 킷이 ○ 를 막내 수준으로 전제한다.
 */
export type TextListMarker = 'dot' | 'dash' | 'circle';

/** 뜻 → 킷 클래스. 킷의 `decimal` 은 숫자가 아니라 **채운 점(●)** 이라 이름을 한 겹 감쌌다. */
const MARKER_CLASS: Record<TextListMarker, string> = {
  dot: 'decimal',
  dash: 'dash',
  circle: 'hollow',
};

export type TextListProps = ComponentPropsWithRef<'ul'> & {
  /** 글머리 기호. 기본 `dot`(●). */
  marker?: TextListMarker;
};

/** 순서 없는 텍스트 목록. 순서·순위가 있으면 {@link OrderedTextList} 로 간다. */
export function TextList({
  marker = 'dot',
  className,
  children,
  role = 'list',
  ...rest
}: TextListProps) {
  return (
    <ul role={role} className={cx('krds-info-list', MARKER_CLASS[marker], className)} {...rest}>
      {children}
    </ul>
  );
}

/** 번호 표기 방식. 킷 샘플의 수준별 관례는 1수준 `1. ` · 2수준 `a. ` · 3수준 `①` 이다. */
export type TextListNumbering = 'decimal' | 'alpha' | 'circled' | 'hangul';

/** 가·나·다… 14자. 넘으면 숫자로 되돌린다. */
const HANGUL_ORDINALS = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

/** a, b, … z, aa, ab … (26 넘어가면 두 글자). */
function alphaOrdinal(n: number): string {
  let out = '';
  let v = n;
  while (v > 0) {
    const r = (v - 1) % 26;
    out = String.fromCharCode(97 + r) + out;
    v = Math.floor((v - 1) / 26);
  }
  return out;
}

/** 번호 글자를 만든다. `decimal`·`alpha`·`hangul` 은 뒤에 공백이 붙고 `circled` 는 붙지 않는다. */
function formatOrdinal(kind: TextListNumbering, n: number): string {
  switch (kind) {
    // ①~⑳ 는 U+2460 부터 20자뿐이다. 넘어가면 숫자로 되돌린다.
    case 'circled':
      return n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `${n}. `;
    case 'alpha':
      return `${alphaOrdinal(n)}. `;
    case 'hangul':
      return n >= 1 && n <= HANGUL_ORDINALS.length ? `${HANGUL_ORDINALS[n - 1]}. ` : `${n}. `;
    default:
      return `${n}. `;
  }
}

export type OrderedTextListProps = ComponentPropsWithRef<'ol'> & {
  /**
   * 자식 항목에 번호 글자를 자동으로 채운다. 기본 `decimal`. 항목이 `num` 을 주면 그쪽이 이긴다.
   * `false` 면 채우지 않는다 — 이때 `num` 을 안 주면 화면에 기호가 하나도 안 나온다.
   */
  numbering?: TextListNumbering | false;
};

/**
 * 순서 있는 텍스트 목록. **킷은 번호를 CSS 로 그리지 않아** 이 부품이 자식을 세어 채운다.
 *
 * 번호 자리는 들여쓰기 폭만큼이라 **넘치면 본문 글자와 겹친다** —
 * 깊이 3 에서 두 자리 숫자를 쓰면 겹치므로 그 수준은 `circled` 가 안전하다.
 */
export function OrderedTextList({
  numbering = 'decimal',
  className,
  children,
  role = 'list',
  ...rest
}: OrderedTextListProps) {
  let seq = 0;
  const numbered =
    numbering === false
      ? children
      : Children.map(children, (child) => {
          // TextListItem 이 아닌 것(문자열·조건부 false·다른 요소)은 세지도 건드리지도 않는다.
          if (!isValidElement<TextListItemProps>(child) || child.type !== TextListItem) return child;
          seq += 1;
          // 직접 적은 번호가 우선이다. 순서는 이미 셌으니 다음 항목이 이어받는다.
          if (child.props.num !== undefined && child.props.num !== null) return child;
          return cloneElement(child, { num: formatOrdinal(numbering, seq) });
        });

  return (
    <ol role={role} className={cx('krds-info-list', 'ordered', className)} {...rest}>
      {numbered}
    </ol>
  );
}

export type TextListItemProps = ComponentPropsWithRef<'li'> & {
  /**
   * 번호 글자. 보통 `OrderedTextList` 가 채워 주므로 직접 줄 일이 드물다
   * (조문 번호처럼 연속이 아닌 번호를 쓸 때만). 순서 없는 목록에는 주지 않는다.
   */
  num?: ReactNode;
};

/**
 * 목록 항목 — `<li>`. 모양은 전부 부모 목록의 **DOM 깊이**에서 온다.
 * 중첩 목록은 이 안에 **바로** 넣는다 — 사이에 요소를 끼우면 깊이가 깨진다.
 */
export function TextListItem({
  num,
  className,
  children,
  role = 'listitem',
  ...rest
}: TextListItemProps) {
  return (
    <li role={role} className={className} {...rest}>
      {num !== undefined && num !== null && <span className="num">{num}</span>}
      {children}
    </li>
  );
}

/**
 * 항목에 딸린 보조 설명 — 킷 `info-txt`. **`TextListItem` 의 직계 자식일 때만** 여백이 붙는다.
 * 항목 본문을 한 줄 더 잇는 용도지 독립한 문단이 아니다.
 */
export function TextListNote({ className, children, ...rest }: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('info-txt', className)} {...rest}>
      {children}
    </p>
  );
}

// 킷에 모양이 없어 지원하지 않는 것: `fraction`(클래스 이름만 있고 규칙이 0건이다).
