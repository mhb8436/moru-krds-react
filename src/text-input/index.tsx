import type { ComponentPropsWithRef } from 'react';
import { Field, type FieldProps } from '../field';
import { cx, type KrdsFieldSize } from '../lib/krds';

/**
 * 텍스트 입력 — KRDS `krds-input`.
 *
 * `TextInput` 은 `<input>` 하나만 그린다. 레이블·도움말까지 한꺼번에 필요하면 {@link TextField},
 * 골격을 조각으로 짤 때는 `ui/field` 의 `Field` 를 쓴다.
 * 크기 기본이 medium(48px)이라 같은 줄의 버튼과 어긋나지 않는다(킷 기본은 large 56px).
 * **`size` 를 `<textarea>` 에 붙이면 높이가 48px 로 찌부러진다** — 그래서 `ui/textarea` 에는 없다.
 * 돋보기가 겹친 검색칸은 {@link SearchInput}, 제안 목록까지 필요하면 `ui/combobox` 다.
 *
 * @example
 * <TextField id="consult_name" label="성명" hint="주민등록상 성명" required placeholder="예) 김모루" />
 * <InputGroup>
 *   <InputGroupItem><TextInput id="q" /></InputGroupItem>
 *   <Button variant="primary" type="submit">검색</Button>
 * </InputGroup>
 *
 * 자세히: docs/krds/09-부품-노트.md#텍스트입력
 */

/* ────────────────────────────── 입력칸 ────────────────────────────── */

/**
 * 입력칸 하나 — `<input class="krds-input">`. 골격은 `ui/field` 가 맡는다.
 * HTML `size` 속성(글자 수)은 지원하지 않는다 — 너비는 `className` 으로 잡는다.
 */
export type TextInputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  /** 기본 medium(48px). 같은 줄의 버튼과 같은 값을 준다. */
  size?: KrdsFieldSize;
};

export function TextInput({ size = 'medium', type = 'text', className, ...rest }: TextInputProps) {
  return <input type={type} className={cx('krds-input', size, className)} {...rest} />;
}

/* ────────────────────────────── 레이블·도움말까지 붙은 완성형 ────────────────────────────── */

/**
 * 레이블 · 도움말까지 붙은 텍스트 한 줄 — `Field` + `TextInput` 을 조립한 편의 부품이다.
 *
 * 골격 prop(`hint` · `state` · `message` · `error` · `required` · `action` · `deletable` …)은
 * `Field` 의 것을 그대로 받고 나머지는 `<input>` 으로 간다.
 * 컨트롤이 입력칸이 아니거나 한 칸에 요소가 여럿이면 `Field` 를 직접 쓴다.
 */
export type TextFieldProps = Omit<TextInputProps, 'className'> &
  Pick<
    FieldProps,
    | 'label'
    | 'hideLabel'
    | 'hint'
    | 'state'
    | 'message'
    | 'error'
    | 'action'
    | 'deletable'
    | 'describedBy'
    | 'contentProps'
    | 'standalone'
  > & {
    /** `<label for>` 로 이어야 하므로 필수다(서버 컴포넌트라 `useId` 를 쓸 수 없다). */
    id: string;
    /** `.form-group` 에 붙는다. 바깥 여백은 여기서 조절한다. */
    className?: string;
    /** `<input>` 에 붙는다(너비 고정 등). */
    inputClassName?: string;
  };

export function TextField({
  id,
  label,
  hideLabel,
  hint,
  state,
  message,
  error,
  required,
  action,
  deletable,
  describedBy,
  contentProps,
  standalone,
  className,
  inputClassName,
  size = 'medium',
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      state={state}
      message={message}
      error={error}
      required={required}
      // 바깥에서 준 aria-describedby 는 버리지 않는다 — `Field` 가 도움말·메시지 id 를 뒤에 잇는다.
      describedBy={cx(describedBy, ariaDescribedBy) || undefined}
      action={action}
      deletable={deletable}
      contentProps={contentProps}
      standalone={standalone}
      className={className}
    >
      {(a) => <TextInput {...a} size={size} className={inputClassName} {...rest} />}
    </Field>
  );
}

/* ────────────────────────────── 검색 입력 ────────────────────────────── */

/**
 * 돋보기가 겹쳐진 검색 입력 — 킷 `sch-input`.
 *
 * 기본이 `type="submit"` 이라 `<form action>` 안에 두면 JS 없이도 검색이 된다.
 * 실시간 제안 목록·검색어 삭제까지 필요하면 `ui/combobox` 의 `SearchCombobox` 다.
 *
 * @example
 * <form action="/search">
 *   <SearchInput name="q" placeholder="검색어를 입력하세요" />
 * </form>
 */
export type SearchInputProps = Omit<TextInputProps, 'type'> & {
  /** 돋보기 버튼의 접근 가능한 이름. 아이콘만 있는 버튼이라 반드시 있어야 한다. */
  buttonLabel?: string;
  /** 버튼에 그대로 흘릴 속성(onClick 등). */
  buttonProps?: Omit<ComponentPropsWithRef<'button'>, 'type' | 'className' | 'children'>;
  /** 버튼 종류. 기본 `submit`. */
  buttonType?: 'submit' | 'button';
  /** `.sch-input` 감싸개에 붙는다. 너비·여백은 여기서 조절한다. */
  wrapperClassName?: string;
};

export function SearchInput({
  size = 'medium',
  buttonLabel = '검색',
  buttonProps,
  buttonType = 'submit',
  wrapperClassName,
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cx('sch-input', wrapperClassName)}>
      <TextInput type="text" size={size} className={className} {...rest} />
      <button type={buttonType} className="krds-btn medium icon ico-search" {...buttonProps}>
        <span className="sr-only">{buttonLabel}</span>
        <i className="svg-icon ico-sch" aria-hidden="true" />
      </button>
    </div>
  );
}
