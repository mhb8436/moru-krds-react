'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx, type KrdsIcon, type KrdsSize } from '../lib/krds';

/**
 * 툴팁 — KRDS `krds-tooltip` · 맥락적 도움말 — KRDS `krds-contextual-help`.
 *
 * 갈림길은 하나다 — **팝오버 안에 링크·버튼이 필요하면 툴팁이 아니라 맥락적 도움말이다.**
 * 툴팁은 hover/focus 로 뜨고 맥락적 도움말은 click 으로 연다.
 * **한 화면에 둘을 섞어 쓰지 마라**(가이드 원문) — 버튼이 똑같이 생겼는데 상호작용이 달라진다.
 * 본문은 150자 내외로 쓰고, 그보다 길면 도움 패널이나 별도 도움말 페이지로 보낸다.
 * `title` 속성과 겹쳐 쓰지 않는다 — 같은 말이 두 번 읽힌다.
 *
 * @example
 * <Tooltip iconOnly icon="help" label="처리 기간 도움말" content="접수일로부터 10일 이내" />
 * <Tooltip variant="text" icon="angle" iconDirection="right" content="예상 처리 기간입니다.">
 *   처리 기간
 * </Tooltip>
 * <ContextualHelp label="신청 자격 도움말" heading="신청 자격" text="신청 자격">
 *   <p>만 18세 이상이면 신청할 수 있습니다.</p>
 *   <div className="btn-wrap">
 *     <LinkButton size="xsmall" href="/help/eligibility">자세히 보기</LinkButton>
 *   </div>
 * </ContextualHelp>
 *
 * 자세히: docs/krds/09-부품-노트.md#툴팁
 */

/** 킷 JS 의 `tooltipGap`. CSS 토큰이 아니라 코드 상수다. */
const TOOLTIP_GAP = 12;

/** 킷 CSS 의 좁은 화면 경계. */
const MOBILE_MAX = 767;

/** 킷 CSS 가 팝오버를 화면 폭에 맞춰 버리는 경계. 이때는 좌표를 계산하지 않는다. */
const NARROW_MAX = 420;

/** 팝오버를 열 때 초점을 줄 첫 대화형 요소. 킷 JS 의 선택자 그대로다. */
const CONTEXTUAL_FOCUSABLE = 'a, button, [tabindex="0"], input, textarea, select';

/** SSR 경고를 피하려고 갈아 끼운다. 위치 계산은 그리기 전에 끝나야 좌상단에 번쩍이지 않는다. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** 버튼 위계. `ui/button` 의 `ButtonVariant` 와 같은 값이다(부품 간 의존을 만들지 않으려고 따로 적었다). */
export type TooltipVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'link';

/** 계산된 팝오버 위치. `cls` 는 킷이 말풍선 꼬리를 붙일 때 쓰는 방향 클래스다. */
type TooltipPosition = { top: number; left: number; centered: boolean; cls: string };

/** 팝오버 좌표. 킷 JS 의 `calculateTooltipPosition()` 이식. 좌표가 뷰포트 기준이라 스크롤에 닫는다. */
function computeTooltipPosition(
  trigger: HTMLElement,
  popover: HTMLElement,
  vertical: boolean,
): TooltipPosition {
  const { clientHeight: popH, clientWidth: popW } = popover;
  const rect = trigger.getBoundingClientRect();
  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  // 좁은 화면에서는 방향 지정과 무관하게 세로형으로 떨어뜨린다(킷 JS 의 isMobile 분기).
  const isVertical = vertical || window.innerWidth <= MOBILE_MAX;
  const cls: string[] = [];
  let top: number;
  let left: number;

  if (isVertical) {
    if (rect.top + rect.height > halfH) {
      top = rect.top - popH - TOOLTIP_GAP; // 화면 아래쪽 요소 → 위로 띄운다
      cls.push('top');
    } else {
      top = rect.top + rect.height + TOOLTIP_GAP;
      cls.push('bottom');
    }
    if (rect.left + rect.width > halfW) {
      left = rect.right - popW; // 오른쪽 정렬
      // 오른쪽에 여유가 있으면 가운데로 되돌린다
      if (window.innerWidth - (rect.left + rect.width) > popW / 2) {
        left = rect.left + (rect.width - popW) / 2;
      } else {
        cls.push('right');
      }
    } else {
      left = rect.left + (rect.width - popW) / 2;
      if (left < 0) {
        left = rect.left; // 왼쪽 공간 부족 보정
        cls.push('left');
      }
    }
  } else {
    // 가로형: 트리거 옆에 세로 가운데를 맞춰 붙인다
    top = rect.top + (rect.height - popH) / 2;
    if (rect.left + rect.width > halfW) {
      left = rect.left - popW - TOOLTIP_GAP; // 왼쪽에 붙인다
      cls.push('right'); // 꼬리는 팝오버의 오른쪽에 난다
    } else {
      left = rect.right + TOOLTIP_GAP;
    }
  }

  return { top, left, centered: window.innerWidth <= NARROW_MAX, cls: cls.join(' ') };
}

type TooltipBaseProps = {
  /** 팝오버 본문. **150자 내외**로 쓴다 — 더 길면 맥락적 도움말·도움 패널·별도 페이지다. */
  content: ReactNode;
  /** 기본 medium(48px). 같은 줄의 입력칸·버튼과 같은 값을 준다. */
  size?: KrdsSize;
  /** 트리거 버튼의 위계. */
  variant?: TooltipVariant;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 예: `help` · `information` */
  icon?: KrdsIcon;
  /** 아이콘 회전. 방향은 이름의 일부가 아니라 별도 클래스다 — `icon="angle right"` 로 쓰지 마라. */
  iconDirection?: 'up' | 'down' | 'left' | 'right';
  /** 아이콘 위치. 기본 `end`. */
  iconPosition?: 'start' | 'end';
  /** 테두리 있는 아이콘 버튼. `iconOnly` 일 때만 뜻이 있다. */
  bordered?: boolean;
  /** 박스형 — 흰 바탕에 테두리, 줄바꿈 허용. 세로 방향으로 뜬다. */
  box?: boolean;
  /** 인라인형을 세로(위/아래) 방향으로 띄운다. */
  vertical?: boolean;
  /** 팝오버 맨 앞에 숨겨 넣을 트리거 이름. 생략하면 트리거의 글자에서 읽어 온다. */
  name?: string;
  /** 트리거 버튼에 붙일 클래스. */
  className?: string;
  /** 트리거 글자. `iconOnly` 가 아닐 때. */
  children?: ReactNode;
};

export type TooltipProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'content'> &
  TooltipBaseProps & {
    iconOnly?: false;
  };

export type IconTooltipProps = Omit<ComponentPropsWithRef<'button'>, 'children' | 'content'> &
  TooltipBaseProps & {
    iconOnly: true;
    /** 스크린리더가 읽을 버튼 이름. **툴팁 글월은 이름의 대체물이 아니다**(가이드 원문). */
    label: string;
    icon: KrdsIcon;
  };

/**
 * 툴팁 — KRDS `krds-tooltip`. hover/focus 로 뜨는 부가 설명이다.
 *
 * **팝오버 안에 링크·버튼을 넣지 마라** — hover 로만 뜨는 영역은 마우스를 옮기는 동안 사라진다
 * (대화형 요소가 필요하면 {@link ContextualHelp}).
 * **필수 정보를 툴팁에만 담지 마라** — 터치 기기에는 hover 가 없다.
 * `disabled` 트리거에는 붙지 않는다(마우스·초점 이벤트가 오지 않는다).
 */
export function Tooltip(props: TooltipProps | IconTooltipProps) {
  const {
    content,
    size = 'medium',
    variant,
    icon,
    iconDirection,
    iconPosition = 'end',
    bordered,
    box,
    vertical,
    name,
    className,
    children,
    type = 'button',
    disabled,
    ref,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  } = props as TooltipProps & Partial<IconTooltipProps>;

  const iconOnly = 'iconOnly' in props && props.iconOnly === true;
  const label = 'label' in props ? props.label : undefined;

  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TooltipPosition | null>(null);
  // 트리거 글자 사본. `name` 을 주면 안 읽는다.
  const [autoName, setAutoName] = useState(label ?? '');

  // 밖에서 온 ref 와 부품 ref 를 한 요소에 함께 건다.
  const setTriggerRef = useCallback(
    (el: HTMLButtonElement | null) => {
      triggerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLButtonElement | null }).current = el;
    },
    [ref],
  );

  // 트리거 글자 읽기(팝오버가 이름을 갈아 끼우므로 사본이 필요하다). 값이 같으면 아무것도 하지 않는다.
  useEffect(() => {
    if (name !== undefined) return;
    const text = (triggerRef.current?.innerText ?? '').trim();
    if (text && text !== autoName) setAutoName(text);
  });

  // 열린 뒤 그리기 전에 좌표를 잡는다. 팝오버는 `.active` 라야 크기를 잴 수 있다.
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    setPos(computeTooltipPosition(trigger, popover, Boolean(box || vertical)));
  }, [open, box, vertical]);

  // 닫는 사건들 — Esc · 스크롤 · 크기 변경.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') close();
    };
    document.addEventListener('keydown', onKeyDown);
    // 안쪽 스크롤 상자에서도 좌표가 낡으므로 캡처로 넓혀 잡았다.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const show = () => !disabled && setOpen(true);
  const hide = () => setOpen(false);

  const iconNode = icon ? (
    <i className={cx(`svg-icon ico-${icon}`, iconDirection)} aria-hidden="true" />
  ) : null;

  return (
    <>
      <button
        type={type}
        ref={setTriggerRef}
        disabled={disabled}
        className={cx(
          'krds-btn',
          size,
          variant,
          iconOnly && 'icon',
          iconOnly && bordered && 'border',
          'krds-tooltip',
          box && 'tooltip-box',
          vertical && 'tooltip-vertical',
          className,
        )}
        // 이름이 팝오버로 갈린다. 팝오버가 없는 disabled 일 때는 걸지 않는다.
        aria-labelledby={disabled ? undefined : popoverId}
        onMouseEnter={(event: ReactMouseEvent<HTMLButtonElement>) => {
          show();
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event: ReactMouseEvent<HTMLButtonElement>) => {
          hide();
          onMouseLeave?.(event);
        }}
        onFocus={(event: ReactFocusEvent<HTMLButtonElement>) => {
          show();
          onFocus?.(event);
        }}
        onBlur={(event: ReactFocusEvent<HTMLButtonElement>) => {
          hide();
          onBlur?.(event);
        }}
        {...rest}
      >
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
      {!disabled && (
        <div
          id={popoverId}
          ref={popoverRef}
          className={cx(
            'krds-tooltip-popover',
            open && 'active',
            box && 'tooltip-box',
            vertical && 'tooltip-vertical',
            open && pos?.cls,
          )}
          // 킷이 만드는 팝오버는 늘 aria-hidden 이다 — 소리로는 위 aria-labelledby 로 한 번만 전해진다.
          aria-hidden="true"
          style={
            open && pos
              ? { top: `${pos.top}px`, left: pos.centered ? '50%' : `${pos.left}px` }
              : undefined
          }
        >
          <span className="sr-only">{name ?? autoName}</span> {content}
        </div>
      )}
    </>
  );
}

/** 팝오버가 붙는 세로 방향. */
export type ContextualHelpSide = 'top' | 'bottom';

/** 팝오버가 붙는 가로 정렬. */
export type ContextualHelpAlign = 'left' | 'center' | 'right';

export type ContextualHelpProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** 아이콘 버튼의 이름. **고유하고 구체적으로** — 「도움말」 여러 개보다 「신청 자격 도움말」이 맞다. */
  label: string;
  /** 팝오버 제목. 한 줄로 잘린다. */
  heading?: ReactNode;
  /** 아이콘 버튼 옆에 놓이는 글자. 대개 그 도움말이 설명하는 항목의 이름이다. */
  text?: ReactNode;
  /** 킷 아이콘 이름. 기본 `tooltip` — 정보 제공이면 `information`, 과업 도움이면 `help`. */
  icon?: KrdsIcon;
  /** 팝오버가 붙는 세로 방향. 기본 `top`. */
  side?: ContextualHelpSide;
  /** 팝오버가 붙는 가로 정렬. 기본 `left`. */
  align?: ContextualHelpAlign;
  /** 아이콘 버튼 크기. 기본 medium(48px). */
  buttonSize?: KrdsSize;
  /** 닫기 버튼 이름. */
  closeLabel?: string;
  /** 제목 태그 단계. 기본 4 — 문서 구조에 맞춰 고른다. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** 팝오버 본문. 링크는 `<div className="btn-wrap">` 안에 넣는다. */
  children?: ReactNode;
};

/**
 * 좁은 화면에서 팝오버를 본문 폭에 맞춘다. 킷 JS 이식이되 넓은 화면에서는 인라인 폭을 지우기만 한다
 * (킷 CSS 의 rem 폭이 글자 크기 조정을 따라오기 때문이다).
 */
function adjustContextualPopover(popover: HTMLElement, action: HTMLElement) {
  // 킷 JS 는 768 로 재서 CSS 의 767 과 1px 어긋난다 — 여기서는 CSS 에 맞춰 767 로 잰다.
  if (window.innerWidth > MOBILE_MAX) {
    popover.style.left = '';
    popover.style.width = '';
    return;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    '--krds-contents-padding-x',
  );
  const pad = Number.parseFloat(raw) || 0;
  const offsetLeft = action.getBoundingClientRect().left - pad;
  popover.style.left = `${-offsetLeft}px`;
  popover.style.width = `${document.body.clientWidth - pad * 2}px`;
}

/**
 * 맥락적 도움말 — KRDS `krds-contextual-help`. click 으로 열리고 **팝오버 안에 링크를 둘 수 있다.**
 *
 * **스스로 열리면 안 된다**(규격 금지) — 그래서 `open`·`defaultOpen` 이 일부러 없다.
 * 닫는 방법은 셋(닫기 버튼 · Esc · 바깥 누르기)이고, 열면 초점이 팝오버 안으로 들어간다.
 * 제목은 한 줄로 잘린다. 한 화면에서 {@link Tooltip} 과 섞어 쓰지 마라.
 */
export function ContextualHelp({
  label,
  heading,
  text,
  icon = 'tooltip',
  side = 'top',
  align = 'left',
  buttonSize = 'medium',
  closeLabel = '닫기',
  headingLevel = 4,
  className,
  children,
  ...rest
}: ContextualHelpProps) {
  const actionRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  /** 규격이 초점을 아이콘 버튼으로 되돌리라고 못 박은 경우에만 `refocus` 를 켠다. */
  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  // 좁은 화면 좌표·폭. 그리기 전에 넣어야 어긋난 자리에 번쩍이지 않는다.
  useIsoLayoutEffect(() => {
    const popover = popoverRef.current;
    const action = actionRef.current;
    if (!popover || !action) return;
    if (!open) {
      popover.style.left = '';
      popover.style.width = '';
      return;
    }
    adjustContextualPopover(popover, action);
  }, [open]);

  // 열리면 초점을 팝오버 안 첫 대화형 요소로(닫기 버튼도 그 대상에 든다).
  useEffect(() => {
    if (!open) return;
    popoverRef.current?.querySelector<HTMLElement>(CONTEXTUAL_FOCUSABLE)?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const action = actionRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      // 초점이 어디 있든 Esc 로 닫고 아이콘 버튼으로 돌아간다(규격).
      if (event.key === 'Escape' || event.key === 'Esc') close(true);
    };
    const onDocumentClick = (event: MouseEvent) => {
      if (!action?.contains(event.target as Node)) setOpen(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && action?.contains(next)) return;
      setOpen(false); // 초점은 사용자가 간 곳에 둔다 — 킷은 버튼으로 끌어와 키보드 함정이 된다
    };
    const onResize = () => {
      if (popoverRef.current && action) adjustContextualPopover(popoverRef.current, action);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocumentClick);
    action?.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocumentClick);
      action?.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const Heading = `h${headingLevel}` as 'h4';

  return (
    <div className={cx('krds-contextual-help', side, align, className)} {...rest}>
      {text != null && <p className="tooltip-txt">{text}</p>}
      <div className="tooltip-action" ref={actionRef}>
        <button
          type="button"
          ref={buttonRef}
          className={cx('krds-btn', buttonSize, 'icon', 'tooltip-btn')}
          aria-expanded={open}
          onClick={() => (open ? close(true) : setOpen(true))}
        >
          <span className="sr-only">{label}</span>
          <i className={`svg-icon ico-${icon}`} aria-hidden="true" />
        </button>
        {/* 킷은 팝오버를 인라인 display 로 여닫는다. */}
        <div
          className="tooltip-popover"
          role="tooltip"
          ref={popoverRef}
          style={{ display: open ? 'block' : undefined }}
        >
          {heading != null && <Heading className="tooltip-title">{heading}</Heading>}
          <div className="tooltip-contents">{children}</div>
          <button
            type="button"
            className="krds-btn xsmall icon tooltip-close"
            onClick={() => close(true)}
          >
            <span className="sr-only">{closeLabel}</span>
            <i className="svg-icon ico-modal-close" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
