import type { ChangeEvent, ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 라디오 버튼 — KRDS `krds-form-check` · `krds-form-chip`.
 *
 * `name` 을 공유하는 것끼리 한 묶음이 되고 방향키 이동은 브라우저가 한다.
 * **`<label>` 안에 `<input>` 을 넣으면 동그라미가 아예 안 그려진다** — 이 부품이 그 골격을 강제한다.
 * 보통은 {@link RadioGroup} 에 `options` 를 넘겨 한 번에 그린다(그래야 `<fieldset>`/`<legend>` 가 붙는다).
 * 여러 값을 고르는 자리는 `ui/checkbox` 다.
 *
 * @example
 * <RadioGroup label="공개 범위" name="scope" options={[
 *   { value: 'all', label: '전체 공개' },
 *   { value: 'org', label: '기관 내부', description: '소속 기관 승인 뒤 열립니다.' },
 * ]} />
 * <RadioGroup label="동의" name="agree" chip equalWidth options={[
 *   { value: 'y', label: '예' }, { value: 'n', label: '아니오' },
 * ]} />
 *
 * 자세히: docs/krds/09-부품-노트.md#라디오
 */

/** 항목 크기. 킷에 있는 둘뿐이다 — 동그라미 20px / 24px, 글자 17px / 19px. */
export type RadioSize = Extract<KrdsSize, 'medium' | 'large'>;

/** 칩 크기. 높이 40 / 48 / 56px — 버튼·입력칸과 같은 눈금이라 한 줄에 섞어도 어긋나지 않는다. */
export type RadioChipSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

/** id 를 `name`+`value` 로 만든다. `useId()` 를 쓰면 부품이 클라이언트로 내려가는데 그럴 이유가 없다. */
function radioId(name: string, value: string): string {
  return `${name}-${value}`.replace(/\s+/g, '-');
}

/* ────────────────────────────────────────────────────────────────────────── */

export type RadioProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'className'
> & {
  /** 그룹 이름. 같은 값을 가진 라디오끼리 한 묶음이 되고 방향키가 그 안에서 돈다. */
  name: string;
  /** 값. 같은 `name` 안에서 유일해야 한다 — `id` 를 이 값으로 만든다. */
  value: string;
  /** `<label>` 에 들어갈 글. */
  label: ReactNode;
  /** 부가 설명. 세로 배치와 함께 쓴다. `aria-describedby` 로 이어진다. */
  description?: ReactNode;
  /** 크기. 기본 medium. */
  size?: RadioSize;
  /** 감싸개 `div.krds-form-check` 에 붙는다(여백 조절은 여기서). */
  className?: string;
  /** `<input>` 에 붙는다. */
  inputClassName?: string;
};

/** 라디오 한 개. `id` 를 주지 않으면 `name`-`value` 로 만든다. 묶음은 {@link RadioGroup} 이다. */
export function Radio({
  name,
  value,
  label,
  description,
  size = 'medium',
  className,
  inputClassName,
  id,
  'aria-describedby': describedBy,
  ...rest
}: RadioProps) {
  const inputId = id ?? radioId(name, value);
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <div className={cx('krds-form-check', size, className)}>
      <input
        type="radio"
        id={inputId}
        name={name}
        value={value}
        className={inputClassName}
        aria-describedby={cx(describedBy, descId) || undefined}
        {...rest}
      />
      <label htmlFor={inputId}>{label}</label>
      {description ? (
        // 킷 규칙이 `label + .krds-form-check-cnt` 라 label 바로 다음 형제여야 왼쪽 들여쓰기가 맞는다.
        <div className="krds-form-check-cnt">
          <p className="krds-form-check-p" id={descId}>
            {description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * 칩 포커스 테두리. 킷은 JS 가 붙이는 `.focus` 클래스를 전제하는데 그 JS 가 없어
 * CSS 형제 선택(`peer` / `peer-focus`)으로 같은 그림을 만든다. 값은 킷 토큰 그대로다.
 */
const CHIP_FOCUS_RING = 'peer-focus:[box-shadow:var(--krds-box-shadow-outline-inset)]';

export type RadioChipProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'className'
> & {
  /** 그룹 이름. */
  name: string;
  /** 값. 같은 `name` 안에서 유일해야 한다. */
  value: string;
  /** 칩에 보이는 글. */
  label: ReactNode;
  /** 크기. 기본 medium(48px). */
  size?: RadioChipSize;
  /** 감싸개 `div.krds-form-chip` 에 붙는다. */
  className?: string;
  /** `<input>` 에 붙는다. */
  inputClassName?: string;
};

/**
 * 칩 라디오 — 테두리 알약을 눌러 고른다. 예/아니오처럼 선택지가 짧을 때 쓴다.
 * 체크 아이콘은 킷이 알아서 켜고 끈다.
 */
export function RadioChip({
  name,
  value,
  label,
  size = 'medium',
  className,
  inputClassName,
  id,
  ...rest
}: RadioChipProps) {
  const inputId = id ?? radioId(name, value);

  return (
    <div className={cx('krds-form-chip', size, className)}>
      <input
        type="radio"
        // `radio` 는 킷 샘플이 붙이는 클래스다(chip-wrap 안에서 선택자로 쓰인다).
        className={cx('radio peer', inputClassName)}
        id={inputId}
        name={name}
        value={value}
        {...rest}
      />
      <label className={cx('krds-form-chip-outline', CHIP_FOCUS_RING)} htmlFor={inputId}>
        {label}
      </label>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/** `RadioGroup` 이 직접 그릴 항목. */
export type RadioOption<T extends string = string> = {
  /** 값. */
  value: T;
  /** 화면에 보이는 글. */
  label: ReactNode;
  /** 부가 설명. 하나라도 있으면 세로 배치가 맞는다. */
  description?: ReactNode;
  /** 비활성. */
  disabled?: boolean;
  /** 기본값은 `name`-`value`. 한 페이지에 같은 `name` 을 두 번 쓸 때만 손으로 준다. */
  id?: string;
};

export type RadioGroupProps<T extends string = string> = Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'children'
> & {
  /** 묶음 이름. `<legend>` 로 들어간다 — 킷이 화면에서 감추지만 스크린리더는 읽는다. */
  label: ReactNode;
  /** 소제목을 화면에도 보이게 한다. 사본이라 낭독에서는 빠진다. */
  labelVisible?: boolean;
  /** 그룹 이름. 방향키 이동이 이 값을 공유하는 라디오 안에서 돈다. */
  name: string;
  /** 항목. 주면 `RadioGroup` 이 직접 그린다. 생략하고 `children` 으로 손수 넣어도 된다. */
  options?: readonly RadioOption<T>[];
  /** 통제 컴포넌트로 쓸 때의 현재 값. */
  value?: T;
  /** 비통제로 쓸 때의 처음 값. 정확한 값이 중요하면 **기본 선택값을 주지 않는다**(규격). */
  defaultValue?: T;
  /** 값이 바뀔 때. */
  onValueChange?: (value: T) => void;
  /** 항목 크기. 기본 medium. */
  size?: RadioSize;
  /** 칩 크기. 기본 medium. */
  chipSize?: RadioChipSize;
  /** 칩 형태로 그린다. */
  chip?: boolean;
  /** 배치. 기본은 세로다(규격). 칩은 성질상 가로가 기본. */
  orientation?: 'vertical' | 'horizontal';
  /** 칩을 같은 너비로 늘린다(킷 `chip-wrap`). */
  equalWidth?: boolean;
  /** `div.krds-check-area` 에 붙는다. `className` 은 바깥 `<fieldset>` 에 붙는다. */
  areaClassName?: string;
  children?: ReactNode;
};

/**
 * 라디오 묶음 — `fieldset > legend + div.krds-check-area`. 규격이 요구하는 골격이다.
 *
 * `disabled` 를 주면 안에 든 라디오가 전부 잠긴다(브라우저 기본 동작).
 */
export function RadioGroup<T extends string = string>({
  label,
  labelVisible,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  size = 'medium',
  chipSize = 'medium',
  chip,
  orientation,
  equalWidth,
  className,
  areaClassName,
  children,
  ...rest
}: RadioGroupProps<T>) {
  const vertical = (orientation ?? (chip ? 'horizontal' : 'vertical')) === 'vertical';
  const controlled = value !== undefined;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.currentTarget.value as T);
  };

  return (
    <fieldset
      // 브라우저 기본 테두리를 지우고, flex/grid 안에서 줄어들지 못하는 기본값을 푼다.
      className={cx('border-0 min-w-0', className)}
      {...rest}
    >
      <legend>{label}</legend>
      {labelVisible ? (
        // `<legend>` 가 이미 읽히므로 사본은 낭독에서 뺀다.
        <p className="form-label mb-3" aria-hidden="true">
          {label}
        </p>
      ) : null}

      <div
        className={cx(
          'krds-check-area',
          vertical && 'chk-column',
          equalWidth && 'chip-wrap',
          areaClassName,
        )}
      >
        {options?.map((o) => {
          const common = {
            name,
            value: o.value,
            label: o.label,
            id: o.id,
            disabled: o.disabled,
            onChange: handleChange,
            ...(controlled
              ? { checked: o.value === value }
              : defaultValue !== undefined
                ? { defaultChecked: o.value === defaultValue }
                : null),
          };
          // key 는 spread 밖에 둔다 — props 객체에 섞으면 React 가 경고한다.
          return chip ? (
            <RadioChip key={o.value} {...common} size={chipSize} />
          ) : (
            <Radio key={o.value} {...common} size={size} description={o.description} />
          );
        })}
        {children}
      </div>
    </fieldset>
  );
}
