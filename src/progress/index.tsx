import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsSize, type KrdsTone } from '../lib/krds';

/**
 * 진행 막대 — 킷에 없다. KRDS 토큰으로 그리는 보충 부품이다.
 *
 * **끝이 있는 일의 진행**에 쓴다. 한도 사용량·준수율처럼 오르내리는 값은 {@link Meter} 다
 * (ARIA 가 둘을 다른 역할로 나눠 두었다). 1초 미만이면 아예 쓰지 않는다.
 * `value` 를 생략하면 불확정(맥동)이 되고 `aria-valuenow` 가 빠진다.
 * 진행 자체는 조용히 두고, 알릴 말은 `status`(= `role="status"`)로 보낸다.
 * 모양을 모르거나 좁은 자리는 `ui/spinner`, 목록·카드 자리는 `ui/skeleton` 이다.
 *
 * @example
 * <Progress label="파일 올리는 중" value={42} status={`3/12 — 「${name}」 처리 중`} />
 * <Progress label="집계 중" size="small" />
 * <Meter label="오늘 한도 사용량" value={used} max={quota} valueText={`${used}건 / ${quota}건`} />
 *
 * 자세히: docs/krds/09-부품-노트.md#진행상태
 */

/** 굵기 — 8 / 12 / 16px. KRDS 모서리 표의 프로그레스 바 컨테이너 크기다. */
export type ProgressSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

/** 색. `gray`(solid 토큰 없음)와 `warning`(트랙 대비 1.48:1 로 규격 미달)은 뺐다. */
export type ProgressTone = Exclude<KrdsTone, 'gray' | 'warning'>;

/** 굵기 → 높이 유틸리티. */
const SIZE_CLASS: Record<ProgressSize, string> = {
  small: 'h-2',
  medium: 'h-3',
  large: 'h-4',
};

/** 색 → 채움 유틸리티. 완성된 문자열로 적는다 — 조립하면 Tailwind 가 클래스를 만들지 않는다. */
const TONE_CLASS: Record<ProgressTone, string> = {
  primary: 'bg-primary-solid',
  secondary: 'bg-secondary-solid',
  point: 'bg-point-solid',
  danger: 'bg-danger-solid',
  success: 'bg-success-solid',
  information: 'bg-information-solid',
};

/** 트랙. 채움과의 대비를 3:1 위로 올려 두는 값이다. */
const TRACK_CLASS = 'w-full overflow-hidden rounded-xs bg-surface-subtle';

export type ProgressProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 무엇의 진행인지. 필수다 — 막대의 `aria-label` 이 되므로 `string` 이어야 한다. */
  label: string;
  /** 레이블을 눈에 보이지 않게 한다. 이미 머리글이 있는 자리에서만. */
  labelHidden?: boolean;
  /** 현재 값. **생략하면 불확정**(`aria-valuenow` 를 빼고 맥동한다). */
  value?: number;
  /** 값의 아래끝. 기본 0. */
  min?: number;
  /** 값의 위끝. 기본 100. */
  max?: number;
  /** 스크린리더가 읽을 값 문구. 「12개 중 5개 끝남」처럼. 주면 보이는 수치도 이 문구가 된다. */
  valueText?: string;
  /** 눈에 보이는 수치를 그린다. 기본 true(불확정이면 그리지 않는다). */
  showValue?: boolean;
  /** 굵기. 기본 medium(12px). */
  size?: ProgressSize;
  /** 채움 색. 기본 primary. */
  tone?: ProgressTone;
  /** 막대 아래 한 줄 설명. `role="status"` 라 바뀌면 스크린리더가 읽어 준다. */
  status?: ReactNode;
};

export function Progress({
  label,
  labelHidden,
  value,
  min = 0,
  max = 100,
  valueText,
  showValue = true,
  size = 'medium',
  tone = 'primary',
  status,
  className,
  ...rest
}: ProgressProps) {
  const span = max - min;
  const indeterminate = value === undefined || !Number.isFinite(value);

  if (process.env.NODE_ENV !== 'production') {
    if (span <= 0) {
      console.warn(`[Progress] max(${max})가 min(${min})보다 커야 한다. 0% 로 그린다.`);
    } else if (!indeterminate && (value! < min || value! > max)) {
      console.warn(
        `[Progress] value(${value})가 ${min}~${max} 밖이다. 잘라서 그리지만 보이는 값과 계산이 어긋난다.`,
      );
    }
  }

  // 폭은 자르지 않은 소수 그대로, 글자는 반올림. 「보이는 폭 ≠ 읽히는 값」을 만들지 않는다.
  const ratio = indeterminate || span <= 0 ? 0 : Math.min(1, Math.max(0, (value! - min) / span));
  const percent = ratio * 100;
  const readout = valueText ?? `${Math.round(percent)}%`;
  const showReadout = showValue && !indeterminate;

  return (
    <div className={cx('w-full', className)} {...rest}>
      {(!labelHidden || showReadout) && (
        // 이름과 값은 ARIA 로 이미 준다 — 여기 글자는 눈으로 볼 몫이라 가린다.
        <div className="mb-2 flex items-baseline justify-between gap-2" aria-hidden="true">
          {labelHidden ? <span /> : <span className="text-sm text-fg-subtle">{label}</span>}
          {showReadout && <span className="text-sm font-bold text-fg tabular-nums">{readout}</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        // 불확정은 valuenow 를 「빼는 것」이 신호다. 0 을 넣으면 멈춘 0% 가 된다.
        aria-valuenow={indeterminate ? undefined : Math.min(max, Math.max(min, value!))}
        aria-valuetext={indeterminate ? undefined : valueText}
        aria-busy={indeterminate || undefined}
        className={cx(TRACK_CLASS, SIZE_CLASS[size])}
      >
        {indeterminate ? (
          // 가운데 3분의 1. 움직임을 끈 사용자에게 「가득 찬 채 멈춘 막대」를 남기지 않는다.
          <div className={cx('mx-auto h-full w-1/3 animate-pulse rounded-xs', TONE_CLASS[tone])} />
        ) : (
          <div
            className={cx('h-full rounded-xs transition-[width]', TONE_CLASS[tone])}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>

      {status !== undefined && status !== null && (
        <p className="mt-2 text-sm text-fg-subtle" role="status">
          {status}
        </p>
      )}
    </div>
  );
}

/**
 * 비율 막대 — `role="meter"`. **진행이 아니라 「지금 얼마」다.**
 *
 * 한도 사용량·준수율처럼 오르내릴 수 있고 끝나지 않는 값에 쓴다. 불확정은 없다(`value` 필수).
 * `role="meter"` 는 스크린리더 지원이 고르지 않으니 `label` 을 값 없이도 뜻이 서는 말로 짓고
 * 정확한 수치는 `valueText` 로 준다.
 */
export type MeterProps = Omit<ProgressProps, 'value' | 'showValue' | 'status'> & {
  value: number;
  showValue?: boolean;
};

export function Meter({
  label,
  labelHidden,
  value,
  min = 0,
  max = 100,
  valueText,
  showValue = true,
  size = 'medium',
  tone = 'primary',
  className,
  ...rest
}: MeterProps) {
  const span = max - min;
  const ratio = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span));
  const percent = ratio * 100;
  const readout = valueText ?? `${Math.round(percent)}%`;

  return (
    <div className={cx('w-full', className)} {...rest}>
      {(!labelHidden || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-2" aria-hidden="true">
          {labelHidden ? <span /> : <span className="text-sm text-fg-subtle">{label}</span>}
          {showValue && <span className="text-sm font-bold text-fg tabular-nums">{readout}</span>}
        </div>
      )}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.min(max, Math.max(min, value))}
        aria-valuetext={valueText}
        className={cx(TRACK_CLASS, SIZE_CLASS[size])}
      >
        <div
          className={cx('h-full rounded-xs transition-[width]', TONE_CLASS[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
