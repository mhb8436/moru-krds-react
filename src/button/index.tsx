import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsIcon, type KrdsSize } from '../lib/krds';

/**
 * 버튼 — KRDS `krds-btn`.
 *
 * 이동은 `LinkButton`, 동작은 `Button` 을 쓴다(규격상 다른 것이다).
 * 같은 줄의 입력칸과 같은 `size` 를 준다(기본 medium · 48px).
 * 글자 없이 아이콘만 두려면 `iconOnly` 와 `label` 을 함께 준다.
 * 버튼 여럿은 `ButtonGroup` 으로 묶는다 — 제출은 가장 오른쪽이다.
 *
 * @example
 * <Button variant="primary">저장</Button>
 * <Button size="small" variant="secondary" icon="down">내려받기</Button>
 * <Button iconOnly icon="sch" label="검색" />
 * <LinkButton href="/notice" icon="angle" iconDirection="right">공지 전체보기</LinkButton>
 *
 * 자세히: docs/krds/09-부품-노트.md#버튼
 */

/** 위계. 한 화면에 최상위 강조(`primary`)는 하나만 둔다. */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'link';

type BaseProps = {
  /** 기본 medium(48px). 같은 줄의 입력칸과 같은 값을 준다. */
  size?: KrdsSize;
  /** 위계. 생략하면 킷 기본 버튼. */
  variant?: ButtonVariant;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 예: `sch` · `down` · `go` */
  icon?: KrdsIcon;
  /** 아이콘 회전. 방향은 이름의 일부가 아니라 별도 클래스다 — `icon="angle right"` 로 쓰지 마라. */
  iconDirection?: 'up' | 'down' | 'left' | 'right';
  /** 아이콘 위치. 기본 `end` — 킷 샘플은 xlarge 만 앞에 둔다. */
  iconPosition?: 'start' | 'end';
  /** 테두리 있는 아이콘 버튼(`krds-btn icon border`). iconOnly 일 때만 뜻이 있다. */
  bordered?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> &
  BaseProps & {
    /** 글자 없이 아이콘만 두려면 `true` 와 함께 `label`·`icon` 을 준다({@link IconButtonProps}). */
    iconOnly?: false;
  };

export type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> &
  BaseProps & {
    iconOnly: true;
    /** 스크린리더가 읽을 이름. 아이콘 버튼에는 반드시 있어야 한다. */
    label: string;
    icon: KrdsIcon;
  };

export function Button(props: ButtonProps | IconButtonProps) {
  const {
    size = 'medium',
    variant,
    icon,
    iconDirection,
    iconPosition = 'end',
    bordered,
    className,
    children,
    type = 'button',
    ...rest
  } = props as ButtonProps & Partial<IconButtonProps>;

  const iconOnly = 'iconOnly' in props && props.iconOnly === true;
  const label = 'label' in props ? props.label : undefined;

  const cls = cx(
    'krds-btn',
    size,
    variant,
    iconOnly && 'icon',
    iconOnly && bordered && 'border',
    className,
  );

  const iconNode = icon ? (
    <i className={cx(`svg-icon ico-${icon}`, iconDirection)} aria-hidden="true" />
  ) : null;

  return (
    <button type={type} className={cls} {...rest}>
      {iconOnly ? (
        <>
          <span className="sr-only">{label}</span>
          {iconNode}
        </>
      ) : (
        <>
          {iconPosition === 'start' && iconNode}
          {children}
          {iconPosition === 'end' && iconNode}
        </>
      )}
    </button>
  );
}

/**
 * 링크 — KRDS `krds-btn link`. **이동에만 쓴다**(동작은 `Button`).
 *
 * 밑줄은 킷이 안쪽 `<span class="underline">` 에 건다 — `hiddenUnderline` · `noUnderline` 로 끈다.
 * `target="_blank"` 면 「새 창 열림」 안내가 `title` 로 붙는다.
 */
export type LinkButtonProps = Omit<ComponentPropsWithRef<'a'>, 'children'> &
  // `variant`·`bordered` 는 버튼 전용이라 뺀다 — 안 빼면 `<a variant="primary">` 로 새어 나간다.
  Omit<BaseProps, 'variant' | 'bordered'> & {
    /** `basic` = 본문 글자색 링크 · `pure` = 가상클래스에서도 색 유지 */
    linkStyle?: 'basic' | 'pure';
    /** 비활성. 킷 클래스 `.disabled` + `aria-disabled` 로 알린다. 이동까지 막으려면 `href` 를 빼라. */
    disabled?: boolean;
    /** 밑줄을 평소엔 감추고 hover/focus 에서만 보인다(`hidden-underline`). */
    hiddenUnderline?: boolean;
    /** 밑줄 자체를 쓰지 않는다. 킷 샘플의 「밑줄 없음」 형태. */
    noUnderline?: boolean;
  };

export function LinkButton({
  size = 'medium',
  icon,
  iconDirection,
  iconPosition = 'end',
  linkStyle,
  hiddenUnderline,
  noUnderline,
  disabled,
  className,
  children,
  target,
  title,
  ...rest
}: LinkButtonProps) {
  const cls = cx('krds-btn', size, 'link', linkStyle, disabled && 'disabled', className);
  const iconNode = icon ? (
    <i className={cx(`svg-icon ico-${icon}`, iconDirection)} aria-hidden="true" />
  ) : null;

  return (
    <a
      className={cls}
      aria-disabled={disabled || undefined}
      target={target}
      // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구.
      title={title ?? (target === '_blank' ? '새 창 열림' : undefined)}
      {...rest}
    >
      {iconPosition === 'start' && iconNode}
      {noUnderline ? (
        <span>{children}</span>
      ) : (
        <span className={cx('underline', hiddenUnderline && 'hidden-underline')}>{children}</span>
      )}
      {iconPosition === 'end' && iconNode}
    </a>
  );
}

/**
 * 버튼 묶음 — 킷 `btn-group`. 기본 오른쪽 정렬이고 **제출 버튼이 가장 오른쪽**이다.
 *
 * @example
 * <ButtonGroup>
 *   <Button variant="tertiary">취소</Button>
 *   <Button variant="primary" type="submit">제출</Button>
 * </ButtonGroup>
 */
export function ButtonGroup({
  align = 'end',
  className,
  children,
  ...rest
}: ComponentPropsWithRef<'div'> & { align?: 'start' | 'center' | 'end' | 'between' }) {
  const justify =
    align === 'start'
      ? 'justify-start'
      : align === 'center'
        ? 'justify-center'
        : align === 'between'
          ? 'justify-between'
          : 'justify-end';
  return (
    <div className={cx('btn-group flex flex-wrap items-center gap-2', justify, className)} {...rest}>
      {children}
    </div>
  );
}
