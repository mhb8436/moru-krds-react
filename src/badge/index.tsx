import type { ComponentPropsWithRef } from 'react';
import { cx, type KrdsTone } from '../lib/krds';

/**
 * 배지 — KRDS `krds-badge`.
 *
 * 상태·분류를 한 낱말로 표시한다. 누르는 것이 아니다 —
 * 필터 조건처럼 누르거나 지우는 표시는 `ui/tag` 의 `Tag` · `TagButton` 이다.
 * 여럿을 늘어놓을 때는 `BadgeWrap` 으로 감싼다(간격은 킷이 잡는다).
 *
 * @example
 * <Badge tone="success">승인</Badge>
 * <Badge tone="primary" fill="solid" number>5</Badge>
 * <BadgeWrap>
 *   <Badge tone="danger">반려</Badge>
 *   <Badge tone="gray">보관</Badge>
 * </BadgeWrap>
 *
 * 자세히: docs/krds/09-부품-노트.md#배지
 */

/** 채움 방식. 킷 클래스는 각각 `bg-*` · `bg-light-*` · `outline-*`. */
export type BadgeFill = 'solid' | 'light' | 'outline';

/** 배지 크기. 킷에 규칙이 있는 것은 `large` 하나뿐이라 그것만 연다. */
export type BadgeSize = 'large';

export type BadgeProps = ComponentPropsWithRef<'span'> & {
  /** 색조. 기본 `gray`. */
  tone?: KrdsTone | 'disabled';
  /** 채움 방식. 기본 `light`. */
  fill?: BadgeFill;
  /** 크기. 생략하면 킷 기본 크기. */
  size?: BadgeSize;
  /** 숫자 배지(`number`). 알림 개수처럼 수를 담을 때. */
  number?: boolean;
  /** 점 배지(`dot`). 글자 없이 점만 찍는다 — 곁에 `sr-only` 설명이나 부모 `aria-label` 이 필요하다. */
  dot?: boolean;
};

const FILL_PREFIX: Record<BadgeFill, string> = {
  solid: 'bg-',
  light: 'bg-light-',
  outline: 'outline-',
};

export function Badge({
  tone = 'gray',
  fill = 'light',
  size,
  number,
  dot,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        'krds-badge',
        size,
        `${FILL_PREFIX[fill]}${tone}`,
        number && 'number',
        dot && 'dot',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/**
 * 배지 묶음 — 킷 `krds-badge-wrap`.
 *
 * 배지를 여럿 늘어놓을 때 간격을 킷이 잡아 준다. `ml-*` 를 손으로 붙이지 않는다.
 *
 * @example
 * <BadgeWrap>
 *   <Badge tone="primary">공지</Badge>
 *   <Badge tone="gray">보관</Badge>
 * </BadgeWrap>
 */
export function BadgeWrap({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('krds-badge-wrap', className)} {...rest}>
      {children}
    </div>
  );
}
