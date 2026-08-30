'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { cx } from '../lib/krds';

/**
 * 탭 — KRDS `krds-tab-area`.
 *
 * 같은 자리에서 내용을 갈아 끼운다. 접었다 펴는 목록은 `ui/accordion` 이다.
 * `Tab.Trigger` 와 `Tab.Panel` 을 같은 `value` 로 짝지운다.
 * **탭에 사용 불가 상태를 쓰지 않는다**(규격) — 내용이 없으면 탭을 지우거나 패널에서 설명한다.
 * 탭이 6개를 넘으면 킷이 가로 스크롤만 시키므로 넘기지 않는 편이 맞다. 세로 탭은 킷에 없다.
 * 비제어로 쓸 때 `defaultValue` 를 생략하면 서버 렌더 결과에 열린 패널이 없다 — 되도록 명시한다.
 *
 * @example
 * <Tab.Root defaultValue="online">
 *   <Tab.List label="청구 방법" variant="line">
 *     <Tab.Trigger value="online">온라인</Tab.Trigger>
 *     <Tab.Trigger value="post">우편·팩스</Tab.Trigger>
 *   </Tab.List>
 *   <Tab.Panels>
 *     <Tab.Panel value="online">…</Tab.Panel>
 *     <Tab.Panel value="post">…</Tab.Panel>
 *   </Tab.Panels>
 * </Tab.Root>
 *
 * 자세히: docs/krds/09-부품-노트.md#탭
 */

/** 탭 막대 모양. `line` 밑줄형(기본) · `fill` 버튼형. */
export type TabVariant = 'line' | 'fill';

/**
 * 화살표로 초점을 옮길 때 곧바로 선택할 것인가.
 * `manual`(기본)이 KRDS 가이드의 동작이고, `auto` 는 패널이 가벼울 때만 쓴다.
 */
export type TabActivation = 'manual' | 'auto';

type TabContextValue = {
  selected: string | undefined;
  select: (value: string) => void;
  /** 첫 `Tab.Trigger` 가 마운트하면서 기본 선택값을 채운다. */
  claimDefault: (value: string) => void;
  triggerId: (value: string) => string;
  panelId: (value: string) => string;
  activation: TabActivation;
};

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext(name: string): TabContextValue {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error(`<${name}> 은 <Tab.Root> 안에서만 쓸 수 있다.`);
  return ctx;
}

/** id 로 쓸 수 있게 다듬는다. 값에 공백·한글·`/` 가 들어와도 찾을 수 있어야 한다. */
function idSafe(value: string): string {
  return encodeURIComponent(value).replace(/%/g, '_');
}

export type TabRootProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & {
  /** 제어 모드. 주면 상태를 바깥이 갖는다. */
  value?: string;
  /** 비제어 모드의 첫 선택값. **생략하면 서버 렌더 결과에 열린 패널이 없다** — 되도록 명시한다. */
  defaultValue?: string;
  /** 선택이 바뀔 때. */
  onValueChange?: (value: string) => void;
  /** 화살표 이동이 곧바로 선택할지. 기본 `manual`. */
  activation?: TabActivation;
};

/** 탭 바깥틀 — 킷 `krds-tab-area`. 안에 `Tab.List` 와 `Tab.Panels` 를 둔다. */
export function TabRoot({
  value,
  defaultValue,
  onValueChange,
  activation = 'manual',
  className,
  children,
  ...rest
}: TabRootProps) {
  const reactId = useId();
  const [inner, setInner] = useState<string | undefined>(defaultValue);

  const controlled = value !== undefined;
  const selected = controlled ? value : inner;

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  // Trigger 의 마운트 효과가 다시 돌지 않도록 신원을 고정한다.
  const claimDefault = useCallback(
    (next: string) => {
      if (controlled) return;
      // 마운트 순서대로 도니 실제로 값을 채우는 건 **첫 번째** Trigger 뿐이다.
      setInner((prev) => prev ?? next);
    },
    [controlled],
  );

  const ctx = useMemo<TabContextValue>(
    () => ({
      selected,
      select,
      claimDefault,
      triggerId: (v) => `${reactId}tab-${idSafe(v)}`,
      panelId: (v) => `${reactId}panel-${idSafe(v)}`,
      activation,
    }),
    [selected, select, claimDefault, reactId, activation],
  );

  return (
    <TabContext.Provider value={ctx}>
      <div className={cx('krds-tab-area', className)} {...rest}>
        {children}
      </div>
    </TabContext.Provider>
  );
}

export type TabListProps = ComponentPropsWithRef<'div'> & {
  /** 탭 막대 모양. 기본 `line` — 생략할 수 없다(둘 다 없으면 활성 표시가 사라진다). */
  variant?: TabVariant;
  /** 탭이 가로를 꽉 채운다. 기본 true — false 면 `line` 이 밑줄 대신 테두리 상자로 그려진다. */
  full?: boolean;
  /** 탭 막대의 이름(`aria-label`). */
  label?: string;
  /** `<ul role="tablist">` 에 얹을 클래스. */
  listClassName?: string;
};

/**
 * 탭 막대 — 킷 `.tab.line.full > ul[role=tablist]`.
 *
 * ←→ 로 초점을 옮기고 Home/End 로 양 끝으로 간다(순환하지 않는다).
 * **모든 탭이 Tab 순서에 남는다** — KRDS 가 「Tab/Shift+Tab 으로 접근」을 못박아 로빙 tabindex 를
 * 쓰지 않는다.
 */
export function TabList({
  variant = 'line',
  full = true,
  label,
  listClassName,
  className,
  children,
  onKeyDown,
  ...rest
}: TabListProps) {
  const { select, activation } = useTabContext('Tab.List');

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const list = event.currentTarget.querySelector('ul[role="tablist"]');
    if (!list) return;
    // 사용 불가 탭은 건너뛴다(규격상 없어야 하지만 들어오면 초점이 갇힌다).
    const buttons = Array.from(
      list.querySelectorAll<HTMLButtonElement>('button.btn-tab[role="tab"]:not([disabled])'),
    );
    const current = (event.target as HTMLElement).closest<HTMLButtonElement>('button.btn-tab');
    const from = current ? buttons.indexOf(current) : -1;
    if (from < 0) return;

    let to: number;
    switch (event.key) {
      case 'ArrowRight':
        to = from + 1;
        break;
      case 'ArrowLeft':
        to = from - 1;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = buttons.length - 1;
        break;
      default:
        return;
    }
    // 킷과 같이 양 끝에서 멈춘다(순환하지 않는다).
    if (to < 0 || to >= buttons.length) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const next = buttons[to];
    next.focus();
    const nextValue = next.dataset.tabValue;
    if (activation === 'auto' && nextValue !== undefined) select(nextValue);
  }

  return (
    <div className={cx('tab', variant, full && 'full', className)} onKeyDown={handleKeyDown} {...rest}>
      <ul role="tablist" aria-label={label} className={listClassName}>
        {children}
      </ul>
    </div>
  );
}

export type TabTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'value'> & {
  /** 이 탭이 여는 패널의 값. 같은 값을 `Tab.Panel` 에 준다. */
  value: string;
  /** `<li>` 에 얹을 클래스. `.active` 가 붙는 요소도 버튼이 아니라 이 `<li>` 다. */
  itemClassName?: string;
};

/**
 * 탭 하나 — 킷 마크업은 `<li>` + `button.btn-tab` 이고, **`role="tab"` 은 버튼에 붙인다.**
 *
 * 킷 원문은 `role="tab"` 과 ARIA 속성을 `<li>` 에 얹고 그 안에 버튼을 넣는데, 그러면
 * 「누를 수 있는 것 안에 누를 수 있는 것」이 되어 axe `nested-interactive`(serious)로 걸린다
 * — 실제로 표준사전 화면에서 3건 잡혔다. ARIA 규격(APG Tabs)도 초점을 받는 요소가 곧 `role="tab"` 이다.
 * 그래서 역할·상태는 버튼으로 옮기고, `<li>` 는 `role="none"` 으로 둔다.
 * 모양은 그대로다 — 킷 CSS 가 보는 `.active` 는 여전히 `<li>` 에 붙는다.
 *
 * 초점은 굴러다닌다(roving tabindex) — 선택된 탭만 Tab 키로 들어오고, 좌우 화살표로 옮긴다(APG).
 * 선택된 탭에는 「선택됨」 문구가 소리로 함께 나간다(직접 짤 때 가장 자주 빠뜨리는 곳이다).
 */
export function TabTrigger({
  value,
  itemClassName,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: TabTriggerProps) {
  const { selected, select, claimDefault, triggerId, panelId } = useTabContext('Tab.Trigger');
  const active = selected === value;

  // 비제어 + defaultValue 없음이면 첫 탭이 기본값이 된다.
  useEffect(() => {
    claimDefault(value);
  }, [claimDefault, value]);

  return (
    <li role="none" className={cx(active && 'active', itemClassName)}>
      <button
        id={triggerId(value)}
        role="tab"
        aria-selected={active}
        aria-controls={panelId(value)}
        tabIndex={active ? 0 : -1}
        type={type}
        className={cx('btn-tab', className)}
        data-tab-value={value}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) select(value);
        }}
        {...rest}
      >
        {children}
        {/* 킷 원문 그대로 — 앞 공백까지 같다. */}
        {active && <i className="sr-only">{' 선택됨'}</i>}
      </button>
    </li>
  );
}

/** 패널 묶음 — 킷 `tab-conts-wrap`. **빼면 패널 폭이 줄어든다.** */
export function TabPanels({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('tab-conts-wrap', className)} {...rest}>
      {children}
    </div>
  );
}

export type TabPanelProps = ComponentPropsWithRef<'section'> & {
  /** 짝이 되는 `Tab.Trigger` 의 값. */
  value: string;
  /** 제목 이동(H 키)에만 잡히는 숨은 패널 제목. 탭 글자와 다른 설명이 필요할 때만 준다. */
  srHeading?: string;
  /** `srHeading` 의 제목 단계. 기본 3. */
  srHeadingLevel?: 2 | 3 | 4 | 5 | 6;
  /**
   * 안 보이는 패널도 DOM 에 남길 것인가. 기본 true 가 킷 동작이다(폼 입력값이 살아 있다).
   * false 는 무거운 목록이나 열 때마다 초기화해야 하는 폼에 쓴다.
   */
  keepMounted?: boolean;
};

/**
 * 탭 패널 — 킷 `section.tab-conts`. 자식을 여럿 넣으면 24px 간격이 자동으로 붙는다.
 */
export function TabPanel({
  value,
  srHeading,
  srHeadingLevel = 3,
  keepMounted = true,
  className,
  children,
  ...rest
}: TabPanelProps) {
  const { selected, triggerId, panelId } = useTabContext('Tab.Panel');
  const active = selected === value;

  if (!active && !keepMounted) return null;

  const Heading = `h${srHeadingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <section
      id={panelId(value)}
      role="tabpanel"
      aria-labelledby={triggerId(value)}
      className={cx('tab-conts', active && 'active', className)}
      // 쪽 안 내비게이션이 감춰진 패널을 목차로 긁어가지 않게 하는 표식.
      data-quick-nav="false"
      {...rest}
    >
      {srHeading && <Heading className="sr-only">{srHeading}</Heading>}
      {children}
    </section>
  );
}

/** 합성용 묶음. `Root` · `List` · `Trigger` · `Panels` · `Panel`. */
export const Tab = {
  Root: TabRoot,
  List: TabList,
  Trigger: TabTrigger,
  Panels: TabPanels,
  Panel: TabPanel,
};
