'use client';

import {
  useId,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cx, stateClass, type KrdsFieldState } from '../lib/krds';

/**
 * 텍스트 영역 — KRDS `textarea-wrap` + `krds-input`.
 *
 * **`maxLength` 를 주면 글자 수 표시가 저절로 켜진다**(규격 요구) — 끄려면 `showCount={false}`.
 * 크기 prop 이 없다. 킷 크기 클래스를 붙이면 높이가 한 줄 입력칸(48px)으로 찌부러지기 때문이다 —
 * 높이는 `className="h-60"` 처럼 유틸리티로 준다(킷 기본은 144px). `rows` 는 아무 영향이 없다.
 * `error` 의 붉은 글씨·아이콘은 `.form-group` 안에서만 나오므로 `ui/field` 의 `Field` 안에 둔다.
 *
 * @example
 * <Field id="content" label="내용">
 *   {(a) => <Textarea {...a} maxLength={500} placeholder="500자 이내로 입력하세요" />}
 * </Field>
 *
 * 자세히: docs/krds/09-부품-노트.md#텍스트영역
 */
export type TextareaProps = ComponentPropsWithRef<'textarea'> & {
  /** 필드 상태. */
  state?: KrdsFieldState;
  /** 오류 문구. 주면 글자 수와 한 줄에 나란히 놓고 `aria-invalid`·`aria-describedby` 를 건다. */
  error?: ReactNode;
  /** 글자 수 표시. 기본값은 `maxLength` 가 있으면 켬(규격 요구). */
  showCount?: boolean;
  /** 감싸개에 붙일 클래스(바깥 여백 등). `className` 은 `<textarea>` 로 간다. */
  wrapClassName?: string;
};

/** `value`·`defaultValue` 가 받아들이는 세 형태를 글자열로 맞춘다. */
function toText(value: TextareaProps['value'] | TextareaProps['defaultValue']): string {
  if (value == null) return '';
  return Array.isArray(value) ? value.join('') : String(value);
}

export function Textarea({
  state,
  error,
  showCount,
  wrapClassName,
  className,
  maxLength,
  value,
  defaultValue,
  onChange,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextareaProps) {
  const uid = useId();
  const countId = `${uid}-count`;
  const errorId = `${uid}-error`;

  // 규격: 글자 수 제한이 있으면 글자 수를 보여 준다. 세는 값은 브라우저와 같은 UTF-16 길이다.
  const counting = showCount ?? maxLength !== undefined;
  const controlled = value !== undefined;

  const [typed, setTyped] = useState(() => toText(defaultValue));
  const length = (controlled ? toText(value) : typed).length;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    // 세지 않거나 바깥에서 값을 쥐고 있으면 여기서 다시 그릴 이유가 없다.
    if (counting && !controlled) setTyped(event.target.value);
    onChange?.(event);
  }

  const fieldState = state ?? (error ? 'error' : undefined);

  // 도움말·글자 수를 스크린리더에 연결한다. 바깥에서 준 aria-describedby 는 버리지 않고 앞에 둔다.
  const describedBy =
    cx(ariaDescribedBy, error ? errorId : undefined, counting ? countId : undefined) || undefined;

  const count = counting ? (
    <p className="textarea-count" id={countId}>
      {/* 킷 샘플에는 없는 보충 — 숫자만으로는 무엇인지 읽히지 않는다. */}
      <span className="sr-only">입력 글자 수</span>
      <span className="count-now">{length}</span>
      {maxLength !== undefined && <span className="count-total">/{maxLength}</span>}
    </p>
  ) : null;

  return (
    <div className={cx('textarea-wrap', stateClass(fieldState), wrapClassName)}>
      <textarea
        className={cx('krds-input', className)}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-describedby={describedBy}
        aria-invalid={fieldState === 'error' || undefined}
        {...rest}
      />
      {error ? (
        <div className="textarea-bottom">
          <p className="form-hint-invalid" id={errorId}>
            {error}
          </p>
          {count}
        </div>
      ) : (
        count
      )}
    </div>
  );
}
