import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 체크박스 — KRDS `krds-form-check` · `krds-check-area` · `krds-form-chip`.
 *
 * `id` 가 필수다 — 킷이 `input ~ label` 형제 선택자로 네모를 그려서 `<label for>` 로만 이을 수 있다.
 * **`<label>` 안에 `<input>` 을 넣으면 네모가 아예 안 그려진다.**
 * 여러 개는 `CheckArea`(배치만) 나 `CheckboxGroup`(fieldset + legend + 도움말)으로 묶는다.
 * 한 값만 고르는 자리는 `ui/radio`, 검색 필터처럼 알약 꼴이 필요하면 `CheckboxChip` 이다.
 *
 * @example
 * <CheckboxGroup legend="수신 동의" hint="언제든 해지할 수 있습니다.">
 *   <Checkbox id="agree-sms" name="agree" value="sms" label="문자" />
 *   <Checkbox id="agree-mail" name="agree" value="mail" label="이메일" description="주 1회 발송" />
 * </CheckboxGroup>
 * <Checkbox id="agree-all" label="전체 선택" indeterminate={some} />
 *
 * 자세히: docs/krds/09-부품-노트.md#체크박스
 */

/** 체크박스 크기. 킷에 있는 둘뿐이다 — 네모 20px / 24px, 글자 17px / 19px. */
export type CheckboxSize = Extract<KrdsSize, 'medium' | 'large'>;

/** 칩 크기. 킷에 있는 셋. 높이가 버튼·입력칸과 같은 눈금이다. */
export type CheckboxChipSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

/**
 * 중간 상태 표시 — 킷에 `:indeterminate` 규칙이 없어 보충했다. 네모만 primary 로 채운다.
 * 「일부 선택됨」은 화면 쪽에서 글로도 알려야 규격을 채운다.
 */
const INDETERMINATE_MARK =
  '[&>input:indeterminate~label]:before:bg-primary-solid ' +
  '[&>input:indeterminate~label]:before:border-primary-line';

/**
 * `indeterminate` 는 속성이 아니라 DOM 프로퍼티라 ref 콜백에서 넣는다.
 * `true` 일 때만 만들고(서버 컴포넌트가 함수를 실어 보내지 않게), 떼어낼 때 프로퍼티를 되돌린다.
 */
function indeterminateRef(ref: Ref<HTMLInputElement> | undefined): Ref<HTMLInputElement> {
  return (node: HTMLInputElement | null) => {
    if (node) node.indeterminate = true;
    const inner = typeof ref === 'function' ? ref(node) : undefined;
    if (ref && typeof ref !== 'function') ref.current = node;

    return () => {
      if (node) node.indeterminate = false;
      if (typeof inner === 'function') inner();
      else if (typeof ref === 'function') ref(null);
      else if (ref) ref.current = null;
    };
  };
}

type CheckboxBaseProps = {
  /** `<label for>` 로 이을 id. 필수다. 목록에서는 값에서 만든다(`agree-${item.code}`). */
  id: string;
  /** 레이블. `for`/`id` 로 이어져 레이블 클릭으로도 토글된다. */
  label: ReactNode;
  /** `.krds-form-check` 감싸개에 붙는다. `...rest` 는 `<input>` 으로 흘린다. */
  className?: string;
};

export type CheckboxProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'children' | 'className' | 'id'
> &
  CheckboxBaseProps & {
    size?: CheckboxSize;
    /** 부가 설명. 레이블 바로 다음에 놓여 들여쓰기가 걸린다. */
    description?: ReactNode;
    /** 중간 상태. 「전체 선택」에서 하위 일부만 선택되었을 때 켠다. */
    indeterminate?: boolean;
  };

export function Checkbox({
  id,
  label,
  description,
  size = 'medium',
  indeterminate,
  className,
  ref,
  ...rest
}: CheckboxProps) {
  // 참일 때만 표시도 ref 도 만든다 — `indeterminate={false}` 는 그냥 보통 체크박스다.
  const mixed = indeterminate === true;

  return (
    <div className={cx('krds-form-check', size, mixed && INDETERMINATE_MARK, className)}>
      <input
        type="checkbox"
        id={id}
        ref={mixed ? indeterminateRef(ref) : ref}
        {...rest}
      />
      <label htmlFor={id}>{label}</label>
      {description != null && (
        // 킷 규칙이 `label + .krds-form-check-cnt` 라 레이블 바로 뒤에 붙어야 한다.
        <div className="krds-form-check-cnt">
          <p className="krds-form-check-p">{description}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 칩 꼴 체크박스 — 킷 `krds-form-chip`. 네모 대신 테두리 알약을 눌러 고른다.
 *
 * 검색 필터처럼 여러 값을 한 줄에 늘어놓을 때 쓴다. 높이가 버튼·입력칸과 같은 눈금이다.
 *
 * @example
 * <CheckArea layout="inline">
 *   <CheckboxChip id="f-open" label="공개" />
 *   <CheckboxChip id="f-closed" label="비공개" />
 * </CheckArea>
 */
export type CheckboxChipProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'children' | 'className' | 'id'
> &
  CheckboxBaseProps & {
    size?: CheckboxChipSize;
  };

export function CheckboxChip({
  id,
  label,
  size = 'medium',
  className,
  ...rest
}: CheckboxChipProps) {
  return (
    <div className={cx('krds-form-chip', size, className)}>
      <input type="checkbox" className="checkbox" id={id} {...rest} />
      <label className="krds-form-chip-outline" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

/**
 * 배치. `column` 세로(20px) · `row` 가로(20px) · `inline` 가로 좁은 간격(12px).
 * `inline` 은 칩처럼 폭이 넓은 항목을 한 줄에 여럿 놓을 때만 쓴다.
 */
export type CheckAreaLayout = 'column' | 'row' | 'inline';

export type CheckAreaProps = ComponentPropsWithRef<'div'> & {
  /** 배치. 기본 `column` — 규격이 수직 배치를 요구한다. */
  layout?: CheckAreaLayout;
};

/**
 * 체크박스 묶음 영역 — 킷 `krds-check-area`. 배치만 맡는다.
 *
 * 기본이 세로다(규격). 가로가 필요하면 `layout="row"` 를 명시한다.
 * 그룹 이름·도움말·오류까지 필요하면 `CheckboxGroup` 을 쓴다.
 */
export function CheckArea({ layout = 'column', className, children, ...rest }: CheckAreaProps) {
  return (
    <div
      className={cx(
        'krds-check-area',
        layout === 'column' && 'chk-column',
        layout === 'inline' && 'krds-form-checks-inline',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CheckboxGroupProps = Omit<ComponentPropsWithRef<'fieldset'>, 'children' | 'title'> & {
  /** 묶음의 접근 가능한 이름(`<legend>`). 킷이 화면에서 감추고 스크린리더에만 남긴다. */
  legend: string;
  /** 보이는 제목. 생략하면 `legend` 를 쓰고, `null` 을 주면 그리지 않는다. */
  title?: ReactNode | null;
  /** 도움말. 킷이 회색 정보 아이콘을 앞에 붙인다. */
  hint?: ReactNode;
  /** 오류 메시지. 붉은 글자 + 오류 아이콘. 색만으로 알리지 말고 반드시 문구를 넣는다. */
  error?: ReactNode;
  /** 배치. 기본 `column`. */
  layout?: CheckAreaLayout;
  children?: ReactNode;
};

/**
 * 체크박스 묶음 — `<fieldset class="form-group">` + `krds-check-area`.
 *
 * 그룹 이름(`legend`) · 보이는 소제목 · 도움말 · 오류 메시지를 한 골격으로 묶는다.
 * `id` 를 주면 도움말·오류가 `aria-describedby` 로 이어진다.
 *
 * @example
 * <CheckboxGroup id="agree" legend="수신 동의" hint="언제든 해지할 수 있습니다.">
 *   <Checkbox id="agree-sms" label="문자" />
 * </CheckboxGroup>
 */
export function CheckboxGroup({
  legend,
  title,
  hint,
  error,
  layout = 'column',
  id,
  className,
  children,
  ...rest
}: CheckboxGroupProps) {
  const hintId = id && hint != null ? `${id}-hint` : undefined;
  const errorId = id && error != null ? `${id}-error` : undefined;
  const describedBy = cx(hintId, errorId) || undefined;
  const visibleTitle = title === undefined ? legend : title;

  return (
    <fieldset
      id={id}
      className={cx('form-group', className)}
      aria-describedby={describedBy}
      {...rest}
    >
      {/* legend 는 fieldset 의 첫 자식이어야 한다. 킷이 화면에서 감추지만 이름은 그대로 읽힌다. */}
      <legend>{legend}</legend>
      <div className="form-conts">
        {visibleTitle != null && (
          <p className="form-label" aria-hidden="true">
            {visibleTitle}
          </p>
        )}
        <CheckArea layout={layout}>{children}</CheckArea>
      </div>
      {hint != null && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}
      {error != null && (
        <p id={errorId} className="form-hint-invalid">
          {error}
        </p>
      )}
    </fieldset>
  );
}
