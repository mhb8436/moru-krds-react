"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cx, type KrdsFieldSize, type KrdsIcon } from "../lib/krds";

/**
 * 콤보박스 — 입력하면 목록이 좁혀지는 자동완성. KRDS 킷에 없는 보충 부품이다.
 *
 * 껍데기는 킷 드롭다운(`krds-drop-wrap`), 동작은 WAI-ARIA 1.2 콤보박스 패턴이다.
 * ↓↑ 는 양 끝에서 순환하고 Esc 는 닫기만 하며 값은 건드리지 않는다.
 * 검색칸(돋보기 · 검색어 삭제 · 실행 버튼)이 필요하면 {@link SearchCombobox} 를 쓴다.
 * 최근·인기·제안처럼 종류가 갈리면 `options` 대신 `groups` 로 계층화한다(규격 요구).
 *
 * @example
 * <Combobox label="기관명" options={hits} onSelect={(o) => setOrg(o.value)} />
 * <SearchCombobox
 *   groups={[
 *     { label: '최근 검색어', options: recent },
 *     { label: '인기 검색어', options: popular },
 *   ]}
 *   emptyMessage="일치하는 검색어가 없습니다."
 *   onSearch={run}
 * />
 *
 * 자세히: docs/krds/09-부품-노트.md#콤보박스
 */

/* ────────────────────────────── 자료 모양 ────────────────────────────── */

/** 제안 항목 하나. */
export type ComboboxOption = {
  /** 고르면 입력칸에 들어갈 글자. */
  value: string;
  /** 화면에 보일 것. 없으면 `value` 를 그대로 쓴다(일치 글자 강조를 넣을 자리). */
  label?: ReactNode;
  /** 오른쪽 끝 보조 설명(분류·결과 수 등). */
  description?: ReactNode;
  /** 앞 아이콘 이름(`ico-` 뺀 것). 최근 검색어에 `log`, 인기 검색어에 `like` 같은 식. */
  icon?: KrdsIcon;
  /** 보이되 고를 수 없다. ↑↓ 순회에서도 건너뛴다. */
  disabled?: boolean;
};

/** 제안 묶음. 규격이 요구하는 계층화의 단위다 — 최근 / 인기 / 제안이 각각 한 묶음이다. */
export type ComboboxGroup = {
  /** 묶음 제목. `<h3>` 으로 그리고 `role="group"` 의 이름으로도 쓴다. */
  label: string;
  options: readonly ComboboxOption[];
};

/** 내부용 — 평평하게 편 항목. `id` 가 `aria-activedescendant` 로 가리킬 자리다. */
type FlatOption = ComboboxOption & { id: string };

/* ────────────────────────────── Props ────────────────────────────── */

type ComboboxOwnProps = {
  /** 입력칸의 접근 가능한 이름. 보이는 `<label>` 이 있으면 `labelledBy` 를 대신 준다. */
  label?: string;
  /** 보이는 `<label>` 의 id. `label` 과 함께 줄 수 없다. */
  labelledBy?: string;
  /** `<input>` 의 id. 생략하면 `useId()` 로 만든다. */
  id?: string;
  /** 기본 medium(48px). 같은 줄의 버튼과 같은 값을 준다. */
  size?: KrdsFieldSize;

  /** 한 덩어리 목록. `groups` 를 함께 주면 `groups` 만 그린다. */
  options?: readonly ComboboxOption[];
  /** 제목이 붙은 묶음 목록(계층화). */
  groups?: readonly ComboboxGroup[];

  /** 제어 입력값. 주면 제어 부품이 된다. */
  value?: string;
  /** 비제어 초기값. */
  defaultValue?: string;
  /** 입력값이 바뀔 때(사람이 치거나 항목을 골랐을 때 모두). */
  onValueChange?: (value: string) => void;
  /** 항목을 골랐을 때. 입력값을 `option.value` 로 바꾼 **뒤** 부른다. */
  onSelect?: (option: ComboboxOption) => void;

  /** 초점이 들어오면 값이 비어 있어도 목록을 연다. 기본 true(규격의 Focusin 동작). */
  openOnFocus?: boolean;
  /** 처음부터 펼친 채로 그린다. 비제어 초깃값이라 사람이 닫으면 다시 열리지 않는다(문서·시각 시험용). */
  defaultOpen?: boolean;
  /** 열 때 첫 항목을 미리 활성으로 둔다. 기본 false — 치던 글자가 Enter 로 바뀌는 사고를 막는다. */
  autoHighlight?: boolean;

  /** 결과가 없을 때 보일 글. **글자를 한 자 이상 친 뒤에만** 뜬다. 주지 않으면 목록이 열리지 않는다. */
  emptyMessage?: ReactNode;
  /** 목록 위 고정 영역(킷 `.drop-top`). 「검색 도움말」 같은 것. */
  header?: ReactNode;
  /** 목록 아래 고정 영역(킷 `.drop-bottom`). 「검색 기록 전체 삭제」 같은 것. */
  footer?: ReactNode;

  /** 목록의 접근 가능한 이름. 기본 「제안 목록」. */
  listLabel?: string;
  /** 입력칸 오른쪽에 놓일 것(검색 버튼 등). 목록보다 뒤에 그려진다(규격의 읽기 순서). */
  action?: ReactNode;
  /** 입력칸 줄을 킷 `.sch-input`(돋보기 겹침 규칙)으로 감싼다. {@link SearchCombobox} 가 켠다. */
  searchLayout?: boolean;

  /** `.krds-drop-wrap` 감싸개에 붙는다. 바깥 여백·너비는 여기서 조절한다. */
  className?: string;
  /** `<input>` 에 붙는다. */
  inputClassName?: string;
  /** `.drop-menu` 에 붙는다. */
  menuClassName?: string;
};

/** `<input>` 에서 부품이 직접 다루는 것은 뺀다. `onSelect` 는 DOM 이벤트와 이름이 겹쳐 막았다. */
type ComboboxInputProps = Omit<
  ComponentPropsWithRef<"input">,
  | "size"
  | "value"
  | "defaultValue"
  | "onSelect"
  | "role"
  | "children"
  | "list"
  | "type"
>;

type ComboboxBaseProps = ComboboxInputProps & ComboboxOwnProps;

/** 이름 없는 콤보박스를 만들 수 없게 타입으로 막는다 — `label` 이나 `labelledBy` 중 하나는 필수다. */
export type ComboboxProps = ComboboxBaseProps &
  (
    | { label: string; labelledBy?: never }
    | { label?: never; labelledBy: string }
  );

/* ────────────────────────────── 부품 ────────────────────────────── */

export function Combobox(props: ComboboxProps) {
  // 이름 유니온은 판별자가 없어 그대로 구조 분해가 안 된다. 넓은 쪽으로 한 번 받아 쓴다.
  const {
    label,
    labelledBy,
    id: idProp,
    size = "medium",
    options,
    groups,
    value,
    defaultValue,
    onValueChange,
    onSelect,
    openOnFocus = true,
    defaultOpen = false,
    autoHighlight = false,
    emptyMessage,
    header,
    footer,
    listLabel = "제안 목록",
    action,
    searchLayout,
    className,
    inputClassName,
    menuClassName,
    onChange,
    onFocus,
    onKeyDown,
    onBlur,
    autoComplete = "off",
    ref: forwardedRef,
    ...rest
  }: ComboboxBaseProps = props;

  const reactId = useId();
  const id = idProp ?? `${reactId}-input`;
  const listId = `${reactId}-list`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // `defaultOpen` 은 초깃값일 뿐이다 — 닫은 뒤에는 보통 부품과 똑같이 움직인다.
  const [open, setOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(defaultOpen && autoHighlight ? 0 : -1);
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");

  const isControlled = value !== undefined;
  const text = isControlled ? value : innerValue;

  const setText = useCallback(
    (next: string) => {
      if (!isControlled) setInnerValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  /** 묶음이 있으면 묶음, 없으면 제목 없는 묶음 하나. 아래 계산을 한 갈래로 만들려는 정규화다. */
  const sections = useMemo<
    ReadonlyArray<{ label?: string; options: readonly ComboboxOption[] }>
  >(
    () => (groups?.length ? groups : [{ options: options ?? [] }]),
    [groups, options],
  );

  /** 평평하게 편 항목. 이 순서가 곧 ↑↓ 순서다. `id` 는 `aria-activedescendant` 가 가리킨다. */
  const flat = useMemo<FlatOption[]>(
    () =>
      sections.flatMap((section, si) =>
        section.options.map((option, oi) => ({
          ...option,
          id: `${reactId}-o-${si}-${oi}`,
        })),
      ),
    [sections, reactId],
  );

  /**
   * 묶음 si 의 첫 항목이 `flat` 에서 몇 번째인지. 묶음별로 그릴 때 전역 번호를 되찾는 데 쓴다
   * (전역 번호가 곧 ↑↓ 순서라 묶음 안 번호로는 안 된다). 묶음은 서넛뿐이라 앞부분을 다시 세도 된다.
   */
  const offsets = useMemo(
    () =>
      sections.map((_, si) =>
        sections.slice(0, si).reduce((n, s) => n + s.options.length, 0),
      ),
    [sections],
  );

  /**
   * 빈 안내는 **친 글자가 있을 때만** 연다. 초점만으로 여는 자리(규격의 Focusin)는
   * 「인기 검색어·이전 검색 기록」을 보여 주는 자리라, 항목이 하나도 없으면 보여 줄 것이 없다 —
   * 예전에는 `emptyMessage` 만 주면 `options={[]}` 인 화면에서 초점을 줄 때마다 빈 상자가 떴다.
   */
  const expanded =
    open && (flat.length > 0 || (emptyMessage != null && text.length > 0));
  const activeOption =
    expanded && activeIndex >= 0 ? flat[activeIndex] : undefined;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  /**
   * ↑↓ 이동. **양 끝에서 순환한다** — 규격 표가 못 박은 동작이다.
   * `disabled` 는 건너뛰고, 전부 disabled 면 한 바퀴만 돌고 제자리에 둔다.
   */
  const move = useCallback(
    (delta: number) => {
      if (!flat.length) return;
      setActiveIndex((prev) => {
        // 아직 아무 데도 없으면 ↓ 는 첫 항목, ↑ 는 마지막 항목에서 시작하게 자리를 잡아 둔다.
        let next = prev < 0 ? (delta > 0 ? -1 : 0) : prev;
        for (let step = 0; step < flat.length; step += 1) {
          next = (next + delta + flat.length) % flat.length;
          if (!flat[next].disabled) return next;
        }
        return prev;
      });
    },
    [flat],
  );

  /** 항목을 고른다. 입력값을 바꾸고 닫는다(규격: Click/Enter 는 그 항목으로 검색 실행). */
  const select = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return;
      setText(option.value);
      closeMenu();
      onSelect?.(option);
      inputRef.current?.focus();
    },
    [setText, closeMenu, onSelect],
  );

  // 활성 항목이 스크롤 밖으로 나가지 않게 따라간다. `block:'nearest'` 라 필요할 때만 움직인다.
  useEffect(() => {
    if (!activeOption) return;
    document
      .getElementById(activeOption.id)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeOption]);

  // 바깥을 누르면 닫는다. click 이 아니라 pointerdown 이라 드래그로 나가도 닫힌다.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, closeMenu]);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    // ★ 한글 조합 중에는 어떤 키도 가로채지 않는다(함정 4). 조합을 끝내는 Enter 가 검색을 실행해 버린다.
    if (e.nativeEvent.isComposing) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        // 규격: 「방향키 ↓ → 제안 목록의 가장 첫 번째 요소로」. 닫혀 있으면 열면서 첫 항목으로 간다.
        if (!expanded) {
          setOpen(true);
          setActiveIndex(flat.findIndex((o) => !o.disabled));
        } else {
          move(1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActiveIndex(flat.length - 1);
        } else {
          move(-1);
        }
        break;
      case "Enter":
        // 활성 항목이 있을 때만 가로챈다 — 없으면 폼 제출(=검색 실행)이 그대로 지나가야 한다.
        if (activeOption) {
          e.preventDefault();
          select(activeOption);
        } else {
          closeMenu();
        }
        break;
      case "Escape":
        // 규격: 「창이 닫히면서 초점이 검색어 입력 필드로 이동」. 값은 건드리지 않는다(함정 3).
        // 초점은 이미 입력칸에 있으므로 닫기만 하면 규격을 만족한다.
        if (expanded) {
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
        }
        break;
      case "Tab":
        // 열어 둔 채 다음 요소로 넘어가면 유령 상자가 남는다.
        closeMenu();
        break;
      default:
        break;
    }
  };

  // 부품 밖으로 초점이 나가면 닫는다. relatedTarget 이 없으면(브라우저 UI 로 이동) 그대로 둔다.
  const handleBlur = (e: ReactFocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    const next = e.relatedTarget as Node | null;
    if (next && !wrapRef.current?.contains(next)) closeMenu();
  };

  /**
   * 소리로 알리는 제안 개수(함정 5). 닫혀 있으면 빈 글자라 아무것도 읽지 않는다 —
   * 닫힘 자체는 알리지 않는다(모든 Esc 마다 떠드는 화면이 된다).
   */
  const status = !expanded
    ? ""
    : flat.length
      ? `제안 ${flat.length}건`
      : "제안 없음";

  /** 바깥에서 온 ref 와 부품이 쓰는 ref 를 함께 채운다. React 19 라 forwardRef 가 필요 없다. */
  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef)
      (forwardedRef as { current: HTMLInputElement | null }).current = node;
  };

  const renderItem = (option: FlatOption, index: number) => (
    <Item
      key={option.id}
      option={option}
      index={index}
      active={index === activeIndex}
      onPick={select}
      onHover={setActiveIndex}
    />
  );

  const row = (
    <>
      <input
        ref={setInputRef}
        id={id}
        // `search` 로 두면 웹킷이 제 지우기 버튼을 그려 돋보기와 겹친다 — 킷 샘플도 text 다.
        type="text"
        className={cx("krds-input", size, inputClassName)}
        /* ── WAI-ARIA 1.2 콤보박스 배선 ── */
        role="combobox"
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption?.id}
        // 브라우저 자동완성 상자가 우리 목록 위에 겹치는 것을 막는다.
        autoComplete={autoComplete}
        value={text}
        onChange={(e) => {
          onChange?.(e);
          setText(e.target.value);
          // 규격: 「Keyup — 한 글자 이상 입력되면 … 검색어 제안으로 변경된다」. 칠 때마다 연다.
          setOpen(true);
          setActiveIndex(autoHighlight ? 0 : -1);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          // 규격: 「Focusin — 값이 비어 있으면 인기 검색어와 이전 검색 기록이 제공된다」.
          if (openOnFocus) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        {...rest}
      />

      {/*
        ★ 목록은 입력칸의 「다음 요소」다 — 규격의 읽기 순서 요구(함정 1). action 보다 앞에 둔다.
        여는 방법은 인라인 display:block — 킷에 여는 클래스가 없다(보충 1).
        onMouseDown 을 막아 항목을 눌러도 입력칸이 초점을 잃지 않게 한다(닫혔다 열리는 깜빡임 방지).
      */}
      <div
        className={cx("drop-menu w-full mt-1 before:hidden", menuClassName)}
        style={expanded ? { display: "block" } : undefined}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="drop-in">
          {header && <div className="drop-top">{header}</div>}

          {/*
            역할 구조: listbox → (group → option) 또는 listbox → option.
            묶음이 있을 땐 감싸개를 div(listbox)로 두고 `<ul class="drop-list">` 는 role="none" 으로 비운다 —
            listbox 의 자식은 option 이나 group 만 허용되므로 ul/li 의 목록 역할을 지워야 한다.
            제목 `<h3>` 은 group 안에 두고 aria-labelledby 로 그 group 의 이름이 되게 한다.
            규격의 「제목 구조로 계층화」와 ARIA 구조를 동시에 만족시키는 배치다.
          */}
          {groups?.length ? (
            <div
              id={listId}
              role="listbox"
              aria-label={listLabel}
              className="w-full max-h-80 overflow-y-auto flex flex-col gap-2"
            >
              {sections.map((section, si) => (
                <div
                  key={section.label ?? si}
                  role="group"
                  aria-labelledby={`${reactId}-g-${si}`}
                  className="w-full"
                >
                  {/* 킷에 목록 소제목 규칙이 없다(보충 5) — 유틸리티로 그린다. 좌우 16px 은 .item-link 와 맞춘 값. */}
                  <h3
                    id={`${reactId}-g-${si}`}
                    className="px-4 py-1 text-xs font-bold text-fg-subtle"
                  >
                    {section.label}
                  </h3>
                  <ul className="drop-list" role="none">
                    {section.options.map((_, oi) =>
                      renderItem(flat[offsets[si] + oi], offsets[si] + oi),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul
              id={listId}
              role="listbox"
              aria-label={listLabel}
              className="drop-list max-h-80 overflow-y-auto"
            >
              {flat.map(renderItem)}
            </ul>
          )}

          {/* 빈 결과 안내. listbox 밖이라 option 개수에 섞이지 않는다. */}
          {flat.length === 0 && emptyMessage != null && (
            <p className="w-full px-4 py-3 text-sm text-fg-subtle">
              {emptyMessage}
            </p>
          )}

          {footer && <div className="drop-bottom">{footer}</div>}
        </div>
      </div>

      {action}
    </>
  );

  return (
    <div
      ref={wrapRef}
      // `krds-drop-wrap` 이 있어야 `.drop-menu`·`.item-link` 규칙이 걸린다(전부 후손 선택자).
      // `drop-left` 도 킷 클래스다 — 가운데 정렬을 왼쪽 맞춤으로 되돌린다.
      className={cx("krds-drop-wrap drop-left w-full", className)}
    >
      {searchLayout ? <div className="sch-input w-full">{row}</div> : row}
      {/* 함정 5 — 눈에는 안 보이고 소리로만 개수 변화를 알린다. */}
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}

/** 제안 항목 하나 — 킷 `.item-link`. 초점을 받으면 안 되므로 `<li role="option">` 이다. */
function Item({
  option,
  active,
  index,
  onPick,
  onHover,
}: {
  option: FlatOption;
  active: boolean;
  index: number;
  onPick: (option: ComboboxOption) => void;
  onHover: (index: number) => void;
}) {
  return (
    <li
      id={option.id}
      role="option"
      aria-selected={active}
      aria-disabled={option.disabled || undefined}
      // `.active` 는 킷 클래스다(굵게 + secondary 배경). 활성 표시를 새로 그리지 않는다.
      className={cx(
        "item-link",
        active && "active",
        option.disabled
          ? "text-fg-disabled cursor-not-allowed"
          : "cursor-pointer",
      )}
      onClick={() => onPick(option)}
      // 마우스를 올리면 활성도 따라온다 — 키보드로 고른 자리와 마우스가 가리키는 자리가 갈라지지 않게.
      onMouseMove={() => {
        if (!option.disabled) onHover(index);
      }}
    >
      {option.icon && (
        <i className={`svg-icon ico-${option.icon}`} aria-hidden="true" />
      )}
      {/* 항목 높이가 48px 고정이라 줄바꿈이 나면 넘친다. 규격이 금지한 말줄임은 「입력 필드」쪽 이야기다. */}
      <span className="min-w-0 flex-1 truncate">
        {option.label ?? option.value}
      </span>
      {option.description && (
        <span className="shrink-0 text-sm text-fg-subtle">
          {option.description}
        </span>
      )}
    </li>
  );
}

/* ────────────────────────────── 검색어 자동완성 ────────────────────────────── */

/**
 * 검색어 자동완성 — {@link Combobox} + 킷 `sch-input`(돋보기 겹침) + 검색어 삭제 버튼.
 *
 * KRDS 검색 규격의 구성 요소 5(검색어 삭제)·7(실시간 제안)을 한 부품으로 채운다.
 * 규격이 정한 이름 셋이 기본값이다 — 입력 「검색어」·삭제 「검색어 전체 삭제」·실행 「검색」.
 * `buttonType` 기본이 `submit` 이라 `<form action>` 안에 두면 JS 없이도 검색이 된다.
 *
 * @example
 * <form action="/search">
 *   <SearchCombobox name="q" groups={suggestions} onSearch={run} />
 * </form>
 */
export type SearchComboboxProps = Omit<
  ComboboxBaseProps,
  "action" | "searchLayout" | "label" | "labelledBy"
> & {
  /** 입력칸의 접근 가능한 이름. 규격이 정한 기본값 「검색어」. */
  label?: string;
  /** 실행 버튼의 이름(`sr-only`). 규격이 정한 기본값 「검색」. */
  buttonLabel?: string;
  /** 삭제 버튼의 이름(`sr-only`). 규격이 정한 기본값 「검색어 전체 삭제」. */
  clearLabel?: string;
  /** 검색어 삭제 버튼을 둔다. 기본 true — 규격 구성 요소 5는 선택이 아니다. */
  clearable?: boolean;
  /** 삭제 버튼을 누른 뒤. 입력값은 부품이 이미 비운 뒤 부른다. */
  onClear?: () => void;
  /**
   * 검색 실행. Enter(활성 항목이 없을 때)·돋보기 클릭·제안 선택 세 곳에서 부른다.
   * `preventDefault` 를 하지 않으므로 `<form>` 안이면 폼 제출도 함께 일어난다.
   */
  onSearch?: (query: string) => void;
  /** 기본 submit — `<form action>` 안에 두면 JS 없이도 검색이 된다. */
  buttonType?: "submit" | "button";
  buttonProps?: Omit<
    ComponentPropsWithRef<"button">,
    "type" | "className" | "children"
  >;
};

export function SearchCombobox({
  label = "검색어",
  buttonLabel = "검색",
  clearLabel = "검색어 전체 삭제",
  clearable = true,
  onClear,
  onSearch,
  buttonType = "submit",
  buttonProps,
  value,
  defaultValue,
  onValueChange,
  onSelect,
  onKeyDown,
  inputClassName,
  ref,
  ...rest
}: SearchComboboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const text = value !== undefined ? value : innerValue;

  const handleValueChange = (next: string) => {
    if (value === undefined) setInnerValue(next);
    onValueChange?.(next);
  };

  const setRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node;
  };

  return (
    <Combobox
      {...rest}
      ref={setRef}
      label={label}
      searchLayout
      value={text}
      onValueChange={handleValueChange}
      onSelect={(option) => {
        onSelect?.(option);
        // 규격: 「Click — 선택된 항목으로 검색 실행」 / 「Enter — 초점을 가진 항목으로 검색 실행」.
        onSearch?.(option.value);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (
          e.defaultPrevented ||
          e.key !== "Enter" ||
          e.nativeEvent.isComposing
        )
          return;
        // 활성 항목이 있으면 Combobox 가 「항목 선택」으로 처리한다 — 여기서 두 번 실행하지 않는다.
        if (e.currentTarget.getAttribute("aria-activedescendant")) return;
        onSearch?.(e.currentTarget.value);
      }}
      // 킷 여백(48px)은 돋보기 하나 몫이다. 삭제 버튼까지 둘이라 80px 로 넓힌다(값이 없어도 유지).
      inputClassName={cx(clearable && "pr-20", inputClassName)}
      action={
        // `.sch-input .ico-search{position:absolute;top:50%;right:1.6rem;transform:translateY(-50%)}`
        // 킷의 그 위치 규칙을 감싸개가 받는다. gap-2(8px)는 킷 `--krds-gap-3` 과 같은 값.
        <div className="ico-search flex items-center gap-2">
          {clearable && text.length > 0 && (
            <button
              type="button"
              className="krds-btn medium icon"
              onClick={() => {
                handleValueChange("");
                onClear?.();
                inputRef.current?.focus();
              }}
            >
              <span className="sr-only">{clearLabel}</span>
              <i className="svg-icon ico-del" aria-hidden="true" />
            </button>
          )}
          <button
            type={buttonType}
            className="krds-btn medium icon"
            {...buttonProps}
            onClick={(e) => {
              buttonProps?.onClick?.(e);
              onSearch?.(text);
            }}
          >
            <span className="sr-only">{buttonLabel}</span>
            <i className="svg-icon ico-sch" aria-hidden="true" />
          </button>
        </div>
      }
    />
  );
}
