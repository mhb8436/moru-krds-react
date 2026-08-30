import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, stateClass, type KrdsFieldState } from '../lib/krds';

/**
 * 폼 필드 골격 — KRDS `fieldset` · `form-group` · `form-tit` · `form-conts` · `form-hint`.
 *
 * 레이블 · 컨트롤 · 도움말 · 상태 메시지를 한 골격으로 묶고 접근성 속성을 이어 준다.
 * 컨트롤은 `TextInput` · `Select` · `Textarea` 가 스스로 그린다 — 여기서 겹쳐 그리지 않는다.
 * **`hint` 는 상태와 무관한 입력 규칙 안내**(회색)이고, 파란 「정보」 메시지는
 * `state="information"` + `message` 다. 둘을 바꿔 쓰면 평범한 안내가 상태 메시지로 보인다.
 * 레이블 달린 텍스트 한 줄이면 `ui/text-input` 의 `TextField` 가 이 조립을 대신한다.
 * 서버 컴포넌트라 `id` 가 필수다.
 *
 * @example
 * <Fieldset>
 *   <Field id="user_id" label="아이디" hint="4~30자" required>
 *     {(a) => <TextInput {...a} placeholder="아이디" />}
 *   </Field>
 *   <Field id="user_pw" label="비밀번호" state="error" message="8자 이상이어야 합니다."
 *          action={<Button iconOnly label="비밀번호 보기" icon="pw-visible" />}>
 *     {(a) => <TextInput {...a} type="password" />}
 *   </Field>
 * </Fieldset>
 *
 * 자세히: docs/krds/09-부품-노트.md#폼필드
 */

/* ────────────────────────────── 골격 조각 ────────────────────────────── */

/**
 * `<div class="fieldset">` — 폼그룹 여럿을 세로로 묶는다.
 * 필드 사이 세로 간격이 여기서 나온다 — `mt-*` 를 손으로 붙이지 마라.
 */
export function Fieldset({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('fieldset', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * `<div class="form-col-group">` — 폼그룹 여럿을 가로로 늘어놓는다(성/이름, 시작일/종료일).
 * 좁은 화면(767px 이하)에서는 킷이 알아서 세로로 접는다.
 *
 * 컨트롤 하나에 딸린 버튼·기호를 묶는 것은 `ui/input-group` 의 `InputGroup` 이다.
 */
export function FieldRow({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('form-col-group', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * `<div class="form-group">` — 필드 하나.
 * 도움말 선택자와 상태 토큰이 전부 여기 매여 있다 — 이 감싸개 없이 조각만 쓰면 모양이 나오지 않는다.
 */
export function FormGroup({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('form-group', className)} {...rest}>
      {children}
    </div>
  );
}

export type FieldLabelProps = Omit<ComponentPropsWithRef<'label'>, 'htmlFor'> & {
  /** 이을 컨트롤의 id. `<label for>` 라 필수다. */
  htmlFor: string;
  /** 필수 입력 표시(`*`). 킷에 클래스가 없어 보충한 부분이다. */
  required?: boolean;
  /** 눈에서만 감춘다(`sr-only`). 이름 자체는 남는다 — 검색창처럼 레이블을 못 두는 자리에. */
  srOnly?: boolean;
  /** `.form-tit` 감싸개에 붙는다. `className` 은 `<label>` 로 간다. */
  boxClassName?: string;
};

/**
 * 레이블 — `<div class="form-tit"><label for>…</label></div>`.
 * 라디오·체크박스 묶음의 **소제목**은 이것이 아니라 `.form-conts` 안의 `.form-label` 자리다.
 */
export function FieldLabel({
  htmlFor,
  required,
  srOnly,
  boxClassName,
  className,
  children,
  ...rest
}: FieldLabelProps) {
  const label = (
    <label htmlFor={htmlFor} className={cx(srOnly && 'sr-only', className)} {...rest}>
      {children}
      {required && (
        // 킷에 필수 표시 클래스가 없어 보충한 부분. 소리로는 컨트롤의 required/aria-required 가 알린다.
        <em className="not-italic text-danger ml-1" aria-hidden="true">
          *
        </em>
      )}
    </label>
  );

  // 감춘 레이블은 `.form-tit` 로 감싸지 않는다 — 감싸개만 남아 gap 이 한 칸 더 벌어진다.
  return srOnly ? label : <div className={cx('form-tit', boxClassName)}>{label}</div>;
}

/** `data-*` 속성. React 타입에 자리가 없어 객체 리터럴로 넘기면 `TS2353` 이 나므로 열어 둔다. */
export type KrdsDataAttrs = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export type FieldControlProps = ComponentPropsWithRef<'div'> &
  KrdsDataAttrs & {
    /** 필드 상태. 킷의 `is-*` 클래스가 이 감싸개에 붙는다. */
    state?: KrdsFieldState;
    /**
     * 컨트롤 오른쪽에 겹쳐 놓을 아이콘 버튼(비밀번호 보기, 내용 지우기 등).
     * 킷 클래스 `btn-ico-wrap` 은 부품이 붙인다. 둘 이상이면 `<div class="btn-group">` 으로 묶어 넘긴다.
     */
    action?: ReactNode;
    /**
     * 「내용 지우기」 버튼을 킷 CSS 로 여닫는다. **`placeholder` 가 없으면 영영 보이지 않는다.**
     * 버튼 자체는 `action` 으로 넘겨 입력칸의 형제가 되게 한다.
     */
    deletable?: boolean;
  };

/**
 * `<div class="form-conts">` — 컨트롤 감싸개. **상태 클래스가 붙는 자리다.**
 *
 * 킷이 여기 얹어 쓰는 클래스가 더 있다 — 날짜 입력 `calendar-conts`,
 * 검색 키워드 입력 `keyword-sch`. 필요하면 `className` 으로 더한다.
 */
export function FieldControl({
  state,
  action,
  deletable,
  className,
  children,
  ...rest
}: FieldControlProps) {
  return (
    <div
      className={cx('form-conts', stateClass(state), action ? 'btn-ico-wrap' : undefined, className)}
      // 킷 선택자가 `.form-conts[data-delete=true]` 라 문자열 "true" 여야 한다.
      data-delete={deletable ? 'true' : undefined}
      {...rest}
    >
      {children}
      {action}
    </div>
  );
}

/** 메시지 클래스 4종. `state` 를 생략하면 중립(`form-hint`, 회색)이다. */
export const FIELD_HINT_CLASS: Record<KrdsFieldState | 'neutral', string> = {
  neutral: 'form-hint',
  error: 'form-hint-invalid',
  success: 'form-hint-success',
  information: 'form-hint-information',
};

/** 상태 → 메시지 클래스. `undefined` 는 중립이다. */
export function fieldHintClass(state?: KrdsFieldState): string {
  return FIELD_HINT_CLASS[state ?? 'neutral'];
}

export type FieldHintProps = ComponentPropsWithRef<'p'> & {
  /** 생략하면 중립 도움말(`form-hint`). 상태를 주면 그 상태의 메시지가 된다. */
  state?: KrdsFieldState;
};

/**
 * `<p class="form-hint…">` — 도움말·상태 메시지. `.form-group` 안에 두어야 모양을 받는다.
 * 아이콘은 킷이 `::before` 로 붙인다 — 따로 넣지 마라.
 */
export function FieldHint({ state, className, children, ...rest }: FieldHintProps) {
  return (
    <p className={cx(fieldHintClass(state), className)} {...rest}>
      {children}
    </p>
  );
}

/* ────────────────────────────── 완성형 ────────────────────────────── */

/** 컨트롤에 그대로 펼쳐 넣는 속성. `<input {...control} />` 처럼 쓴다. */
export type FieldControlAttrs = {
  id: string;
  /** 도움말·상태 메시지의 id 를 잇는다(둘 다 있으면 공백으로 이어 붙인다). */
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
  required?: boolean;
};

export type FieldProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 컨트롤의 id. `<label for>` 와 `aria-describedby` 가 여기서 갈라져 나온다. 서버 컴포넌트라 필수다. */
  id: string;
  /** 레이블 글자. */
  label: ReactNode;
  /** 레이블을 눈에서만 감춘다. 이름은 남는다. */
  hideLabel?: boolean;
  /** 중립 도움말(회색). 상태와 무관한 입력 규칙 안내는 여기에 쓴다. */
  hint?: ReactNode;
  /** 필드 상태. `is-*` 는 `.form-conts` 에, 색은 `message` 에 걸린다. */
  state?: KrdsFieldState;
  /** 상태 메시지. `state` 와 짝으로 쓴다. */
  message?: ReactNode;
  /** 오류 문구 지름길. `state="error"` + `message` 와 같다(직접 준 쪽이 이긴다). */
  error?: ReactNode;
  /** 필수 입력. 레이블에 `*`, 컨트롤에 `required`·`aria-required` 를 함께 붙인다. */
  required?: boolean;
  /** 이미 있는 설명 요소를 더 잇고 싶을 때(공백으로 이어진 id 목록). */
  describedBy?: string;
  /** 컨트롤 오른쪽에 겹쳐 놓을 아이콘 버튼. {@link FieldControlProps.action} 참고. */
  action?: ReactNode;
  /** 「내용 지우기」 버튼을 연다. {@link FieldControlProps.deletable} 참고. */
  deletable?: boolean;
  /** `.form-conts` 에 그대로 흘릴 속성(`className="calendar-conts"` · `data-*` 등). */
  contentProps?: Omit<ComponentPropsWithRef<'div'>, 'children'> & KrdsDataAttrs;
  /** 이 필드 하나만 놓일 때 `<div class="fieldset">` 로 감싼다. 여럿이면 바깥에서 한 번만 감싼다. */
  standalone?: boolean;
  /**
   * 컨트롤. 함수로 주면 접근성 속성을 받는다 — **반드시 펼쳐 넣어야** 레이블·도움말이 이어진다.
   * 킷 클래스는 여기서 넘기지 않는다(컨트롤 부품이 스스로 붙인다).
   */
  children: ReactNode | ((control: FieldControlAttrs) => ReactNode);
};

/**
 * 레이블 · 컨트롤 · 도움말 · 상태 메시지를 KRDS 골격 하나로 묶는다.
 *
 * 레이블 달린 텍스트 한 줄이면 `ui/text-input` 의 `TextField` 가 이 조립을 대신한다.
 *
 * @example
 * <Field id="user_id" label="아이디" hint="4~30자" required>
 *   {(a) => <TextInput {...a} placeholder="아이디" />}
 * </Field>
 */
export function Field({
  id,
  label,
  hideLabel,
  hint,
  state,
  message,
  error,
  required,
  describedBy,
  action,
  deletable,
  contentProps,
  standalone,
  className,
  children,
  ...rest
}: FieldProps) {
  // `error` 지름길. 직접 준 state·message 가 이긴다.
  // 빈 값(undefined·null·'' ·false)은 「메시지 없음」으로 본다 — 빈 <p> 가 남으면 gap 만 벌어진다.
  const finalState: KrdsFieldState | undefined = state ?? (error ? 'error' : undefined);
  const finalMessage = message || error;

  const hintId = hint ? `${id}-hint` : undefined;
  const messageId = finalMessage ? `${id}-message` : undefined;

  const control: FieldControlAttrs = { id };
  // KRDS 는 규정하지 않지만 WAI-ARIA 상 옳다 — 초과 준수로 붙인다.
  const described = cx(describedBy, hintId, messageId);
  if (described) control['aria-describedby'] = described;
  if (finalState === 'error') control['aria-invalid'] = true;
  if (required) {
    control.required = true;
    control['aria-required'] = true;
  }

  const { className: contentClassName, ...contentRest } = contentProps ?? {};

  const group = (
    <FormGroup className={className} {...rest}>
      <FieldLabel htmlFor={id} required={required} srOnly={hideLabel}>
        {label}
      </FieldLabel>

      <FieldControl
        state={finalState}
        action={action}
        deletable={deletable}
        className={contentClassName}
        {...contentRest}
      >
        {typeof children === 'function' ? children(control) : children}
      </FieldControl>

      {/* 중립 도움말. 상태 메시지와 **다른 줄**이다 — 규칙 안내는 오류가 떠도 그대로 남는다. */}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      {finalMessage && (
        <FieldHint id={messageId} state={finalState}>
          {finalMessage}
        </FieldHint>
      )}
    </FormGroup>
  );

  return standalone ? <Fieldset>{group}</Fieldset> : group;
}
