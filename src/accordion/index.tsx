'use client';

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '../lib/krds';

/**
 * 아코디언 — KRDS `krds-accordion`.
 *
 * 헤더를 눌러 한 덩이씩 펼쳐 보는 목록. FAQ 는 `line`(킷 `type-line`)이 규격이다 — 표로 그리지 않는다.
 * 기본은 한 번에 하나만 열리고, `multiple` 을 주면 여러 개가 함께 열린다.
 * 부가 안내 한 덩이만 접었다 펴려면 `Disclosure` 를, 내용을 갈아 끼우려면 `Tab` 을 쓴다.
 *
 * @example
 * <Accordion.Root line multiple toggleAll headingLevel={3}>
 *   <Accordion.Item title="신청 자격이 어떻게 되나요?">…</Accordion.Item>
 *   <Accordion.Item title="처리 기간은 얼마나 걸리나요?" defaultOpen>…</Accordion.Item>
 * </Accordion.Root>
 *
 * 자세히: docs/krds/09-부품-노트.md#아코디언
 */

/** 헤더 제목의 헤딩 단계. 페이지의 앞선 헤딩보다 한 단계 아래로 준다. */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * 열림 상태.
 *
 * 항목 목록을 부모가 모르고도(등록 절차 없이) 「전체 열기」를 지원하려고 이렇게 잡았다.
 * - `all: null` — 전체 열기/닫기를 아직 누르지 않았다 → 손대지 않은 항목은 제 `defaultOpen` 을 따른다
 * - `all: true|false` — 전체 열기/닫기를 눌렀다 → 손대지 않은 항목은 전부 그 값을 따른다
 * - `touched` — 헤더를 눌러 개별로 손댄 항목만. 언제나 `all` 보다 우선한다
 */
type AccordionOpenState = {
  all: boolean | null;
  touched: Record<string, boolean>;
};

type AccordionContextValue = {
  /** 이 항목이 열려 있나. 손댄 적 없으면 항목 제 `defaultOpen` 이 산다. */
  isOpen: (key: string, defaultOpen: boolean) => boolean;
  toggle: (key: string, defaultOpen: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
  /** 「전체 열기」를 누른 뒤 하나도 닫지 않은 상태. 전체 단추의 글자를 여기서 고른다. */
  allOpen: boolean;
  /** 다중 열림인가(킷 JS 의 `data-type="multiOpen"`). */
  multiple: boolean;
  headingLevel: AccordionHeadingLevel;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(who: string): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error(`${who} 은(는) <Accordion.Root> 안에서만 쓴다.`);
  return ctx;
}

export type AccordionRootProps = Omit<ComponentPropsWithRef<'div'>, 'onToggle'> & {
  /** 여러 항목을 동시에 연다. 기본은 킷과 같은 단일 열림 — 하나를 열면 나머지가 닫힌다. */
  multiple?: boolean;
  /** 라인형(`type-line`). 상자 배경 없이 구분선만 남는다. FAQ 목록에 이 모양을 쓴다. */
  line?: boolean;
  /** 처음부터 전부 펼친다. `multiple` 일 때만 뜻이 있다. */
  defaultAllOpen?: boolean;
  /** 헤더 제목의 헤딩 단계. 기본 `h3`. 페이지의 앞선 헤딩보다 한 단계 아래로 준다. */
  headingLevel?: AccordionHeadingLevel;
  /** 목록 위 오른쪽에 「전체 열기 / 전체 닫기」 단추를 그린다. `multiple` 일 때만 그려진다. */
  toggleAll?: boolean;
  /** 항목을 열고 닫을 때. 뜻 있는 `id` 를 받으려면 항목마다 `id` 를 직접 준다. */
  onToggle?: (id: string, open: boolean) => void;
};

export function AccordionRoot({
  multiple = false,
  line,
  defaultAllOpen,
  headingLevel = 3,
  toggleAll,
  onToggle,
  className,
  children,
  ...rest
}: AccordionRootProps) {
  const [state, setState] = useState<AccordionOpenState>(() => ({
    // 단일 열림에서 「처음부터 전부 펼침」은 성립하지 않는다.
    all: defaultAllOpen && multiple ? true : null,
    touched: {},
  }));

  const value = useMemo<AccordionContextValue>(() => {
    const isOpen = (key: string, defaultOpen: boolean) =>
      key in state.touched ? state.touched[key] : (state.all ?? defaultOpen);

    return {
      isOpen,
      toggle: (key, defaultOpen) => {
        const next = !isOpen(key, defaultOpen);
        setState((prev) =>
          multiple
            ? // 다중 열림 — 누른 항목만 뒤집는다. 나머지는 그대로 둔다.
              { all: prev.all, touched: { ...prev.touched, [key]: next } }
            : // 단일 열림 — 누른 항목만 남긴다. `all: false` 라서 나머지는 전부 닫힌다.
              { all: false, touched: { [key]: next } },
        );
        onToggle?.(key, next);
      },
      expandAll: () => setState({ all: true, touched: {} }),
      collapseAll: () => setState({ all: false, touched: {} }),
      allOpen: state.all === true && Object.values(state.touched).every(Boolean),
      multiple,
      headingLevel,
    };
  }, [state, multiple, headingLevel, onToggle]);

  return (
    <AccordionContext.Provider value={value}>
      {toggleAll && multiple && (
        // 킷에 전체 열기 단추 자리가 없다 — 목록 위 오른쪽에 Tailwind 로 둔다(mb-2 = 8px).
        <div className="mb-2 flex justify-end">
          <AccordionToggleAll />
        </div>
      )}
      <div
        className={cx('krds-accordion', line && 'type-line', className)}
        // 킷 JS 가 읽던 값. 우리 렌더에는 필요 없지만 DOM 만 봐도 모드를 알 수 있게 남긴다.
        data-type={multiple ? 'multiOpen' : 'singleOpen'}
        {...rest}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** 헤더 제목. 헤더 전체가 단추가 된다. */
  title: ReactNode;
  /** 처음부터 이 항목을 펼친다. 단일 열림에서는 하나에만 준다. */
  defaultOpen?: boolean;
  /** 이 항목만 헤딩 단계를 달리한다. 보통은 `Accordion.Root` 쪽에서 정한다. */
  headingLevel?: AccordionHeadingLevel;
  /** 헤더 단추(`btn-accordion`)에 붙일 클래스. */
  buttonClassName?: string;
  /** 내용 영역(`accordion-body`)에 붙일 클래스. */
  bodyClassName?: string;
};

export function AccordionItem({
  title,
  defaultOpen = false,
  headingLevel,
  buttonClassName,
  bodyClassName,
  id,
  className,
  children,
  ...rest
}: AccordionItemProps) {
  const uid = useId();
  const ctx = useAccordionContext('<Accordion.Item>');

  // 킷 JS 는 `accordionHeader-id-*` / `accordionCollapse-id-*` 를 난수로 만든다.
  // React 는 `useId()` 가 서버·클라이언트에서 같은 값을 주므로 그것을 쓴다.
  const key = id ?? uid;
  const headerId = `${key}-header`;
  const panelId = `${key}-panel`;

  const open = ctx.isOpen(key, defaultOpen);
  const Heading = `h${headingLevel ?? ctx.headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <div id={id} className={cx('accordion-item', open && 'active', className)} {...rest}>
      <Heading className="accordion-header">
        <button
          type="button"
          id={headerId}
          className={cx('btn-accordion', open && 'active', buttonClassName)}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => ctx.toggle(key, defaultOpen)}
        >
          {title}
        </button>
      </Heading>
      {/* `collapse` 는 킷 CSS 에 규칙이 없다. 킷 마크업과 맞추려고 그대로 둔다.
          닫힘/열림은 `.accordion-item.active` 가 이 요소의 max-height·visibility 를 바꿔 만든다. */}
      <div id={panelId} className="accordion-collapse collapse" role="region" aria-labelledby={headerId}>
        <div className={cx('accordion-body', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}

export type AccordionToggleAllProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  expandLabel?: string;
  collapseLabel?: string;
};

/**
 * 전체 열기 / 전체 닫기 — 킷에 없어 `krds-btn xsmall text` 로 보충한 단추.
 *
 * `Accordion.Root` 에 `toggleAll` 을 주면 제자리에 알아서 그려진다. 직접 쓸 때는
 * `Accordion.Root` 안에 둔다(문맥을 읽는다). 단일 열림에서는 아무것도 그리지 않는다.
 */
export function AccordionToggleAll({
  expandLabel = '전체 열기',
  collapseLabel = '전체 닫기',
  className,
  onClick,
  ...rest
}: AccordionToggleAllProps) {
  const ctx = useAccordionContext('<Accordion.ToggleAll>');

  // 단일 열림에서는 「전체 열기」가 성립하지 않는다.
  if (!ctx.multiple) return null;

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (ctx.allOpen) ctx.collapseAll();
    else ctx.expandAll();
  };

  return (
    <button
      type="button"
      className={cx('krds-btn xsmall text', className)}
      onClick={handleClick}
      {...rest}
    >
      {ctx.allOpen ? collapseLabel : expandLabel}
      <i className={cx('svg-icon ico-angle', ctx.allOpen && 'rotate-180')} aria-hidden="true" />
    </button>
  );
}

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  ToggleAll: AccordionToggleAll,
};
