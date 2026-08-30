import type { ComponentPropsWithRef } from 'react';
import { cx, stateClass, type KrdsFieldSize, type KrdsFieldState } from '../lib/krds';

/**
 * 셀렉트 — KRDS `krds-form-select`.
 *
 * 이 부품이 그리는 것은 `<select>` 하나다. 레이블·도움말·상태 골격은 `ui/field` 의 `Field` 가 맡는다.
 * 크기 기본이 medium(48px)이라 같은 줄의 버튼과 어긋나지 않는다(킷 기본은 large 56px).
 * **항목이 7개 미만이면 라디오**, 20개를 넘으면 콤보박스나 셀렉트 분할을 쓴다.
 * 여러 개를 고르는 자리에 `multiple` 을 쓰지 않는다(→ 체크박스).
 * 목록 위 정렬·개수 도구는 테두리 없는 {@link SortSelect} 다.
 *
 * @example
 * <Field id="board" label="게시판">
 *   {(a) => <Select {...a} placeholder="선택하세요" options={boards} />}
 * </Field>
 * <SortSelect aria-label="정렬기준" options={sorts} value={sort} onChange={onSort} />
 *
 * 자세히: docs/krds/09-부품-노트.md#셀렉트
 */

/** 셀렉트 크기 — 40 / 48 / 56px. 입력칸에는 있는 xlarge 가 셀렉트에는 없다. */
export type SelectSize = Exclude<KrdsFieldSize, 'xlarge'>;

/** `options` 로 넘길 항목 하나. */
export type SelectOption = {
  /** 값. */
  value: string | number;
  /** 화면에 보이는 글자. 요소가 아니라 글자여야 한다(브라우저가 마크업을 그리지 않는다). */
  label: string;
  /** 비활성. */
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'size'> & {
  /** 기본 medium(48px). 같은 줄의 입력칸·버튼과 같은 값을 준다. HTML `size` 속성은 지원하지 않는다. */
  size?: SelectSize;
  /** 폼 상태. 킷이 셀렉트에 실제로 그려 주는 것은 `is-error` 하나뿐이다. */
  state?: KrdsFieldState;
  /**
   * 선택 완료. **켜지 않으면 값을 고른 뒤 초점을 잃었을 때 글자가 다시 흐려진다.**
   * 생략하면 `value`(또는 `defaultValue`)가 빈 값이 아닌지로 정한다 —
   * 값 없이 시작하는 비제어 셀렉트는 화면 쪽에서 직접 넘긴다.
   */
  completed?: boolean;
  /** 항목 목록. `children` 으로 `<option>` 을 직접 써도 된다. */
  options?: readonly SelectOption[];
  /** 맨 앞에 붙는 `value=""` 항목. 「선택하세요」 자리다. */
  placeholder?: string;
};

/** 값이 골라진 것인지. 빈 문자열·undefined·빈 배열은 미선택으로 본다. */
function hasValue(value: SelectProps['value'] | SelectProps['defaultValue']): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value) !== '';
}

/** 들어온 className 에서 `krds-input` 만 걷어낸다 — 입력칸 클래스가 함께 붙으면 높이가 두 규칙으로 갈린다. */
function withoutInputClass(className?: string): string | undefined {
  if (!className) return undefined;
  const kept = className.split(/\s+/).filter((one) => one && one !== 'krds-input');
  return kept.length ? kept.join(' ') : undefined;
}

/**
 * `<select class="krds-form-select">` 하나. 골격은 `ui/field` 가 맡는다.
 *
 * **이름을 반드시 준다** — `<label for>` 가 원칙이고, 안 되면 `aria-label` 이다(부품이 지어내지 않는다).
 * 값을 바꿨다고 폼이 제출되게 하지 마라. 폭은 100% 라 줄이려면 `w-*` 를 더한다.
 */
export function Select({
  size = 'medium',
  state,
  completed,
  options,
  placeholder,
  className,
  children,
  ...rest
}: SelectProps) {
  const isCompleted = completed ?? hasValue(rest.value ?? rest.defaultValue);

  return (
    <select
      // 오류를 색으로만 알리면 스크린리더가 읽지 못한다. 킷 샘플에는 없지만 붙인다.
      // (뒤의 {...rest} 가 이기므로 화면 쪽에서 덮어쓸 수 있다 — FormField 가 이미 넣어 주는 경우 등)
      aria-invalid={state === 'error' ? true : undefined}
      className={cx(
        'krds-form-select',
        size,
        isCompleted && 'completed',
        stateClass(state),
        withoutInputClass(className),
      )}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map((one) => (
        <option key={String(one.value)} value={one.value} disabled={one.disabled}>
          {one.label}
        </option>
      ))}
      {children}
    </select>
  );
}

/**
 * 정렬용 셀렉트 — KRDS `krds-form-select-sort`. **`Select` 와 다른 부품이다.**
 *
 * 테두리 없이 버튼처럼 생긴 목록 도구다 — 목록 위 「정렬기준」·「목록 표시 개수」 자리에 쓴다.
 * 상태도 선택 완료도 없다(글자색이 늘 진하다). 폼 안의 입력에는 `Select` 를 쓴다.
 */
export type SortSelectProps = Omit<ComponentPropsWithRef<'select'>, 'size'> & {
  /** 기본 medium. `large` 는 글자가 커진다 — 목록 위 제목처럼 쓰는 자리 전용이다. */
  size?: SelectSize;
  /** 항목 목록. `children` 으로 `<option>` 을 직접 써도 된다. */
  options?: readonly SelectOption[];
};

export function SortSelect({ size = 'medium', options, className, children, ...rest }: SortSelectProps) {
  return (
    <select
      className={cx('krds-form-select-sort', size, withoutInputClass(className))}
      {...rest}
    >
      {options?.map((one) => (
        <option key={String(one.value)} value={one.value} disabled={one.disabled}>
          {one.label}
        </option>
      ))}
      {children}
    </select>
  );
}
