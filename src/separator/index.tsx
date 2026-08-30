import type { ComponentPropsWithRef } from 'react';
import { cx, type KrdsTone } from '../lib/krds';

/**
 * 구분선 — KRDS 에 없다. KRDS 토큰으로 그리는 보충 부품이다.
 *
 * **`<hr>` 을 쓰지 마라** — 킷이 sr-only 규칙에 끼워 `!important` 로 숨겨 화면에서 사라진다.
 * 이 부품은 `<div role="separator">` 로 그린다.
 * 목록 사이를 촘촘히 나누는 뜻 없는 선은 `decorative` 로 두어 소리에서 뺀다.
 * 세로선은 자기 높이가 없다 — 부모를 flex 로 두거나 `className` 으로 높이를 준다.
 *
 * @example
 * <Separator />
 * <Separator tone="line" spacing="large" />
 * <div className="flex items-center gap-2">
 *   <span>등록일</span>
 *   <Separator orientation="vertical" spacing="none" decorative className="h-4" />
 *   <span>조회 12</span>
 * </div>
 *
 * 자세히: docs/krds/09-부품-노트.md#구분선
 */

/**
 * 선 색. 앞 넷은 중립 선이고(`divider` 가 KRDS 의 「나누는 선」 전용 토큰), 나머지는 `KrdsTone` 이다.
 * `gray` 만 전용 선 토큰이 없어 `strong` 과 같은 값을 쓴다.
 */
export type SeparatorTone = KrdsTone | 'divider' | 'line' | 'strong' | 'darker';

/** 앞뒤 여백 — 8 / 16 / 24px. KRDS gap 눈금이다. */
export type SeparatorSpacing = 'none' | 'small' | 'medium' | 'large';

const TONE_CLASS: Record<SeparatorTone, string> = {
  divider: 'border-divider',
  line: 'border-line',
  strong: 'border-line-strong',
  darker: 'border-line-darker',
  primary: 'border-primary-line',
  secondary: 'border-secondary-line',
  gray: 'border-line-strong', // gray 전용 선 토큰이 없다 — 위 주석 참고
  point: 'border-point-line',
  danger: 'border-danger-line',
  warning: 'border-warning-line',
  success: 'border-success-line',
  information: 'border-information-line',
};

/** 굵기 → 어느 변에 그릴지까지 한 표에 담는다. 1px·2px 는 KRDS 테두리 눈금과 같다. */
const EDGE_CLASS = {
  horizontal: { thin: 'border-t', thick: 'border-t-2' },
  // krds-check: 세로 구분선은 한쪽 선이 본질이다
  vertical: { thin: 'border-l', thick: 'border-l-2' },
} as const;

const SPACING_CLASS = {
  horizontal: { none: '', small: 'my-2', medium: 'my-4', large: 'my-6' },
  vertical: { none: '', small: 'mx-2', medium: 'mx-4', large: 'mx-6' },
} as const;

export type SeparatorProps = ComponentPropsWithRef<'div'> & {
  /** 방향. 기본 가로선. **세로선은 자기 높이가 없다** — 부모를 flex 로 두거나 높이를 준다. */
  orientation?: 'horizontal' | 'vertical';
  /** 선 색. 기본 `divider`. */
  tone?: SeparatorTone;
  /** 1px(`thin`, 기본) · 2px(`thick`). */
  thickness?: 'thin' | 'thick';
  /** 점선. */
  dashed?: boolean;
  /** 앞뒤 여백. 기본 `medium`(16px). */
  spacing?: SeparatorSpacing;
  /** 뜻 없이 모양만인 선. `role="none"` + `aria-hidden` 이 되어 소리에서 빠진다. */
  decorative?: boolean;
};

/**
 * 구분선 하나. 가로선은 그냥 놓으면 되고, **세로선은 부모가 flex 이거나 높이를 줘야 보인다.**
 */
export function Separator({
  orientation = 'horizontal',
  tone = 'divider',
  thickness = 'thin',
  dashed,
  spacing = 'medium',
  decorative,
  className,
  ...rest
}: SeparatorProps) {
  return (
    <div
      // 장식용이면 role="none" — 보조기술이 통째로 건너뛴다.
      role={decorative ? 'none' : 'separator'}
      aria-hidden={decorative ? true : undefined}
      // role="separator" 의 기본값이 horizontal 이라 세로일 때만 적는다.
      aria-orientation={!decorative && orientation === 'vertical' ? 'vertical' : undefined}
      className={cx(
        'self-stretch',
        orientation === 'vertical' && 'shrink-0', // 좁은 flex 줄에서 눌려 사라지지 않게
        EDGE_CLASS[orientation][thickness],
        dashed ? 'border-dashed' : 'border-solid', // 빼면 폭만 있고 선이 안 그려진다
        TONE_CLASS[tone],
        SPACING_CLASS[orientation][spacing],
        className,
      )}
      {...rest}
    />
  );
}
