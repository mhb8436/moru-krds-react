import { Children, cloneElement, Fragment, isValidElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx, type KrdsFieldSize } from '../lib/krds';

/**
 * 입력 묶음 — 킷 `input-group`.
 *
 * 컨트롤 하나와 그에 딸린 버튼·기호를 한 줄로 묶고 **크기를 한 번만 정해 자식에게 내려보낸다.**
 * 그래서 입력칸과 옆 버튼의 높이가 어긋나지 않는다(기본 medium · 48px).
 * 레이블까지 갖춘 필드 여럿을 가로로 늘어놓는 것은 `ui/field` 의 `FieldRow` 다.
 * 기간(시작~끝)은 {@link InputGroupRange} 를 쓴다.
 * 크기는 `TextInput`·`Select`·`Button` 같은 **부품**에만 내려간다 — 맨 `<input>` 은 그대로 남는다.
 *
 * @example
 * <InputGroup size="medium">
 *   <InputGroupItem>
 *     <TextField id="q" label="검색어" hideLabel placeholder="검색어를 입력하세요" />
 *   </InputGroupItem>
 *   <Button variant="primary" type="submit">검색</Button>
 * </InputGroup>
 * <InputGroup>
 *   <InputGroupItem><TextInput id="amount" inputMode="numeric" /></InputGroupItem>
 *   <InputGroupText>원</InputGroupText>
 * </InputGroup>
 *
 * 자세히: docs/krds/09-부품-노트.md#입력묶음
 */

/* ────────────────────────────── 크기 전파 ────────────────────────────── */

/**
 * 자식 부품에 `size` 를 내려보낸다. DOM 태그와 Fragment 에는 넘기지 않고(HTML `size` 속성과 뜻이 다르다),
 * 자식이 이미 `size` 를 갖고 있으면 그대로 둔다.
 */
function withSize(children: ReactNode, size: KrdsFieldSize): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (typeof child.type === 'string' || child.type === Fragment) return child;
    // React 19 타입에서 `props` 는 unknown 이라 좁혀서 본다.
    const props = child.props as { size?: unknown };
    if (props.size !== undefined) return child;
    return cloneElement(child as ReactElement<{ size?: KrdsFieldSize }>, { size });
  });
}

/* ────────────────────────────── 기본형 ────────────────────────────── */

export type InputGroupProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 묶음 전체의 크기. 기본 medium(48px). **자식이 저마다 적지 않고 여기서 한 번만 정한다.** */
  size?: KrdsFieldSize;
  /** 세로 정렬. 기본 `center` — 자식이 레이블까지 달고 있으면 `end` 로 밑선을 맞춘다. */
  align?: 'center' | 'end';
  /** 간격을 16px 에서 8px 로 좁힌다. 입력칸과 버튼을 한 덩어리처럼 보이게 할 때. */
  tight?: boolean;
  children?: ReactNode;
};

/**
 * `<div class="input-group">` — 컨트롤 하나와 그에 딸린 버튼·기호를 한 줄로 묶는다.
 * `size` 를 하나 바꾸면 입력칸·버튼이 함께 움직인다.
 *
 * **`className="row"` 안에서는 세로로 쌓인다** — 킷에 그런 규칙이 있다.
 */
export function InputGroup({
  size = 'medium',
  align = 'center',
  tight,
  className,
  children,
  ...rest
}: InputGroupProps) {
  return (
    <div
      className={cx('input-group', align === 'end' && 'items-end', tight && 'gap-2', className)}
      {...rest}
    >
      {withSize(children, size)}
    </div>
  );
}

/* ────────────────────────────── 폭을 차지하는 칸 ────────────────────────────── */

export type InputGroupItemProps = ComponentPropsWithRef<'div'> & {
  /** 안쪽 자식에 내려보낸다. 보통 {@link InputGroup} 이 알아서 넣어 준다. */
  size?: KrdsFieldSize;
  /** 남는 폭을 차지한다. 기본 true — 이 상자에 넣는 것이 대개 입력칸이라서다. */
  grow?: boolean;
};

/**
 * 늘어나는 칸. **입력칸은 이 상자로 감싼다** — 감싸지 않으면 기준 폭이 컨테이너 전체가 되어
 * 옆 버튼을 찌그러뜨린다. 늘어나지 않아야 하면 `grow={false}`.
 */
export function InputGroupItem({
  size = 'medium',
  grow = true,
  className,
  children,
  ...rest
}: InputGroupItemProps) {
  return (
    <div className={cx(grow ? 'min-w-0 flex-1' : 'shrink-0', className)} {...rest}>
      {withSize(children, size)}
    </div>
  );
}

/* ────────────────────────────── 접두사·접미사 ────────────────────────────── */

/** 크기별 상자 높이와 글자 크기. 킷 입력칸 토큰과 같은 값이다(40 / 48 / 56 / 80px). */
const ADDON_BOX: Record<KrdsFieldSize, string> = {
  small: 'h-10 text-label-sm',
  medium: 'h-12 text-label-md',
  large: 'h-14 text-label-lg',
  xlarge: 'h-20 text-heading-md',
};

export type InputGroupTextProps = ComponentPropsWithRef<'span'> & {
  /** 보통 {@link InputGroup} 이 넣어 준다. 기본 medium(48px). */
  size?: KrdsFieldSize;
};

/**
 * 입력칸에 붙는 글자 — 접두사(`https://`), 단위(`원`·`건`), 구분 기호(`~`).
 * 킷에 클래스가 없어 보충했다. 입력칸과 같은 높이로 서서 밑선이 맞는다.
 *
 * 「원」처럼 **뜻이 있는 단위는 읽혀야 하고**, `~` 처럼 시각적 기호는 `aria-hidden` 을 직접 붙여
 * 소리에서 뺀다 — 어느 쪽인지는 부품이 판단할 수 없어 기본값을 두지 않았다.
 */
export function InputGroupText({
  size = 'medium',
  className,
  children,
  ...rest
}: InputGroupTextProps) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center whitespace-nowrap text-fg-subtle',
        ADDON_BOX[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ────────────────────────────── 기간 입력 ────────────────────────────── */

/** 기간 입력이 쓰는 크기. 킷에 구분 기호의 xlarge 규칙이 없어 덜어냈다. */
export type InputGroupRangeSize = Exclude<KrdsFieldSize, 'xlarge'>;

export type InputGroupRangeProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  /** 기본 medium(48px). 두 칸과 가운데 기호에 함께 내려간다. */
  size?: InputGroupRangeSize;
  /** 시작 칸. 레이블까지 갖춘 필드를 그대로 넣어도 된다. */
  from: ReactNode;
  /** 끝 칸. */
  to: ReactNode;
  /** 가운데 구분 기호. 기본 `-`. 장식이라 소리에서는 빠진다. */
  separator?: ReactNode;
  /** 킷 달력 스크립트가 잡는 손잡이 클래스(`set`)를 붙인다. 킷 달력을 물릴 때만 켠다. */
  set?: boolean;
};

/**
 * 기간 입력 — 킷 `input-group range`. 두 칸이 폭을 반씩 나눠 갖고 입력칸 밑선이 맞는다.
 *
 * @example
 * <InputGroupRange
 *   from={<TextField id="from" label="시작일" type="date" />}
 *   to={<TextField id="to" label="종료일" type="date" />}
 * />
 */
export function InputGroupRange({
  size = 'medium',
  from,
  to,
  separator = '-',
  set,
  className,
  ...rest
}: InputGroupRangeProps) {
  return (
    <ul className={cx('input-group range', set && 'set', className)} {...rest}>
      <li>{withSize(from, size)}</li>
      {/* 크기 클래스를 반드시 붙인다 — 빼면 킷 기본 56px 이라 medium 입력 사이에서 혼자 커진다. */}
      <li className={cx('mark', size)} aria-hidden="true">
        {separator}
      </li>
      <li>{withSize(to, size)}</li>
    </ul>
  );
}
