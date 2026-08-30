import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 스크롤 영역 — KRDS 에 없다. 킷 스크롤 막대 모양을 유틸리티로 옮긴 보충 부품이다.
 *
 * 넘치는 내용을 가둬 굴린다. **초점을 받아 키보드로도 굴러간다** — 그것이 이 부품의 존재 이유다.
 * `role="region"` 이라 이름(`label` 또는 `labelledBy`)이 필수이고, 랜드마크가 목록에 쌓이므로
 * 이름을 붙일 만큼 뜻이 있는 칸에만 쓴다. 단순히 넘치는 표는 `ui/table` 의 감싸개다.
 * **높이(폭)를 제한하지 않으면 아무것도 스크롤되지 않는다** — `className="max-h-80"` 처럼 준다.
 *
 * @example
 * <ScrollArea label="약관 전문" className="max-h-80 rounded-lg border border-solid border-line p-4">
 *   {terms}
 * </ScrollArea>
 *
 * 자세히: docs/krds/09-부품-노트.md#스크롤영역
 */

/** 굴릴 방향. 기본은 세로. */
export type ScrollAreaAxis = 'vertical' | 'horizontal' | 'both';

type BaseProps = {
  /** 굴릴 방향. 기본 세로. */
  axis?: ScrollAreaAxis;
  /** 끝에 닿았을 때 바깥까지 따라 굴러가는 것을 막는다. 모달·서랍처럼 겹쳐 뜨는 칸에 켠다. */
  containScroll?: boolean;
  /** 칸에 붙일 클래스. **여기서 높이(폭)를 제한해야 스크롤이 생긴다.** */
  className?: string;
  /** 굴릴 내용. */
  children?: ReactNode;
};

/** 이름은 반드시 하나 있어야 한다 — 둘 다 주지도 둘 다 빼지도 못하게 타입으로 막는다. */
type NameProps =
  | { label: string; labelledBy?: never }
  | { label?: never; labelledBy: string };

export type ScrollAreaProps = Omit<
  ComponentPropsWithRef<'div'>,
  'aria-label' | 'aria-labelledby' | 'children'
> &
  BaseProps &
  NameProps;

const OVERFLOW: Record<ScrollAreaAxis, string> = {
  vertical: 'overflow-y-auto overflow-x-hidden',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto',
};

/** 스크롤 막대 모양. 킷 모달의 막대 mixin 을 유틸리티로 옮긴 것이다(8px). */
const SCROLLBAR = cx(
  // 표준 속성 — 파이어폭스와 크롬 121+ 가 본다.
  '[scrollbar-width:thin]',
  '[scrollbar-color:var(--color-line)_var(--color-surface-subtler)]',
  // 웹킷 의사요소 — 킷과 같은 8px 막대.
  '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2',
  '[&::-webkit-scrollbar-track]:bg-surface-subtler',
  '[&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-line',
);

export function ScrollArea(props: ScrollAreaProps) {
  const {
    axis = 'vertical',
    containScroll,
    label,
    labelledBy,
    className,
    children,
    // 기본 0. 스크롤 칸은 초점을 받아야 ↑↓·PageUp/PageDown·Space 로 굴러간다(브라우저가 처리한다).
    tabIndex = 0,
    ...rest
  } = props as BaseProps &
    Omit<ComponentPropsWithRef<'div'>, 'children'> & { label?: string; labelledBy?: string };

  return (
    <div
      role="region"
      aria-label={label}
      aria-labelledby={labelledBy}
      tabIndex={tabIndex}
      className={cx(
        OVERFLOW[axis],
        // flex/grid 자식일 때 내용만큼 늘어나 스크롤이 안 생기는 것을 막는다.
        'min-h-0 min-w-0',
        containScroll && 'overscroll-contain',
        SCROLLBAR,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
