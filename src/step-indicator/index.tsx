import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 단계 표시기 — KRDS `krds-step-wrap`.
 *
 * 다단계 신청 화면 위에 놓는다. **단계는 3~7개**이고 어기면 개발 모드에서 경고한다.
 * `current` 는 0부터 센다 — `steps.length` 를 주면 전부 완료, 음수면 전부 예정이다.
 * 연결선·완료 체크 아이콘·여백은 킷이 그리므로 마크업이나 `mb-*` 를 더하지 마라.
 * 레이블은 짧게 쓴다 — 킷이 줄바꿈을 막아 길면 넘쳐 잘린다.
 * 좁은 화면에서 킷이 글자를 전부 숨기므로 「N단계 중 M단계」 요약을 부품이 대신 그린다.
 *
 * @example
 * <StepIndicator current={2} steps={['유의 사항 확인', '신청인 정보', '이사 전 살던 곳', '이사 온 곳']} />
 *
 * 자세히: docs/krds/09-부품-노트.md#단계표시
 */

/** 단계 하나의 상태. 완료 `done` · 현재 `active` · 예정 `todo`. */
export type StepStatus = 'done' | 'active' | 'todo';

export type StepItem = {
  /** 단계 레이블. 짧은 단어·문구로 — 길면 줄바꿈 없이 잘린다. */
  label: ReactNode;
  /** 단계 번호 글자. 생략하면 「N단계」. 다국어는 여기로 넘긴다. */
  number?: ReactNode;
  /** 상태를 손으로 정한다. 생략하면 `current` 로 계산한다 — 순서대로 떨어지지 않을 때만 쓴다. */
  status?: StepStatus;
};

export type StepIndicatorProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 단계 목록. 문자열만 주면 레이블로 본다. 규격 상한·하한은 3~7 이다. */
  steps: Array<string | StepItem>;
  /** 현재 단계의 **0부터 센 번호**. `steps.length` 면 전부 완료, 음수면 전부 예정이다. */
  current: number;
  /** 현재 단계임을 알리는 숨은 글자. 기본 「현재단계」. */
  currentLabel?: string;
  /** 좁은 화면 요약을 직접 정한다. 생략하면 「N단계 중 M단계 + 레이블」. */
  summary?: ReactNode;
  /** 좁은 화면 요약을 끄고 킷 그대로(원만 남는 모습) 둔다. */
  hideSummary?: boolean;
  /** 감싸개에 붙일 클래스. */
  className?: string;
};

/** 규격이 정한 단계 수의 하한·상한. */
const MIN_STEPS = 3;
const MAX_STEPS = 7;

export function StepIndicator({
  steps,
  current,
  currentLabel = '현재단계',
  summary,
  hideSummary,
  className,
  ...rest
}: StepIndicatorProps) {
  if (!steps.length) return null;

  if (
    process.env.NODE_ENV !== 'production' &&
    (steps.length < MIN_STEPS || steps.length > MAX_STEPS)
  ) {
    console.warn(
      `[StepIndicator] 단계는 ${MIN_STEPS}개 이상 ${MAX_STEPS}개 이하여야 한다(받은 개수 ${steps.length}). 그대로 그리되 절차를 다시 나눠라.`,
    );
  }

  const items: StepItem[] = steps.map((step) =>
    typeof step === 'string' ? { label: step } : step,
  );

  // 현재 단계가 목록 안에 있을 때만 요약을 그린다(전부 완료·전부 예정이면 셀 「M단계」가 없다).
  const activeIndex = current >= 0 && current < items.length ? current : -1;

  return (
    // 킷에 감싸개 클래스가 없다. 빈 class 를 남기지 않는다.
    <div className={cx(className) || undefined} {...rest}>
      {!hideSummary && activeIndex >= 0 && (
        // 좁은 화면 요약. 킷이 글자를 전부 숨기는 767px 이하에서만 보인다.
        // 숨긴 글자는 DOM 에 남아 스크린리더가 읽으므로 이 요약은 aria-hidden 이다.
        <p className="mb-2 text-sm md:hidden" aria-hidden="true">
          {summary ?? (
            <>
              <span className="text-fg-subtle">{`${items.length}단계 중 ${activeIndex + 1}단계`}</span>
              <span className="ml-2 font-bold text-fg">{items[activeIndex]!.label}</span>
            </>
          )}
        </p>
      )}

      <ol
        className="krds-step-wrap"
        // 킷 전역 `ol,ul{list-style:none}` 이 목록 의미를 떨어뜨리는 브라우저가 있어 되돌린다.
        role="list"
      >
        {items.map((item, i) => {
          const status: StepStatus =
            item.status ?? (i < current ? 'done' : i === current ? 'active' : 'todo');
          const isActive = status === 'active';

          return (
            <li
              key={i}
              className={status === 'todo' ? undefined : status}
              // ARIA 에 더 정확한 값 `step` 이 있지만 KRDS 가 적은 값은 `true` 다 — 규격을 따른다.
              aria-current={isActive ? 'true' : undefined}
            >
              <span>
                {/* 킷이 `.sr-only` 를 !important 로 숨긴다 — 화면에는 안 보이고 낭독만 된다. */}
                {isActive && <em className="sr-only">{currentLabel}</em>}
                <i className="step">{item.number ?? `${i + 1}단계`}</i>
                <span className="step-tit">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
