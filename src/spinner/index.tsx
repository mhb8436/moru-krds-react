import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 스피너 — KRDS `krds-spinner`.
 *
 * **모양을 모르거나 좁은 자리**(버튼 안·입력칸 안·화면 한복판)의 로딩 표시다.
 * 올 것의 모양을 아는 목록·카드는 `ui/skeleton`, 진행을 셀 수 있으면 `ui/progress` 다 —
 * 한 화면에 섞어 쓰지 않는다. 1초 미만이면 아예 쓰지 않는다.
 * 크기 변형이 없다(지름 20px 고정) — 넓은 영역에서는 `className` 으로 여백을 벌린다.
 * 시작과 완료를 둘 다 알리려면 {@link LoadingStatus} 로 감싼다.
 * 입력칸 안에 겹치려면 {@link FormSpinner} 안에 넣는다.
 *
 * @example
 * <LoadingStatus loading={busy} label="목록을 불러오는 중" done="목록을 불러왔습니다">
 *   불러오는 중…
 * </LoadingStatus>
 * <FormSpinner>
 *   <TextInput id="q" readOnly />
 *   <Spinner label="조회 중" />
 * </FormSpinner>
 *
 * 자세히: docs/krds/09-부품-노트.md#스피너
 */
export type SpinnerProps = ComponentPropsWithRef<'div'> & {
  /** 스크린리더가 읽을 상태 문구. 회전 원뿐이라 이것이 없으면 소리로 아무것도 남지 않는다. */
  label?: string;
  /** 눈에 보이는 문구. 없어도 된다. */
  children?: ReactNode;
};

export function Spinner({ label = '로딩 중', className, children, ...rest }: SpinnerProps) {
  return (
    // role 은 rest 보다 앞에 둔다 — 바깥에 라이브 영역이 이미 있으면 `role={undefined}` 로 지운다.
    <div role="status" className={cx('krds-spinner', className)} {...rest}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * 입력칸 안 스피너 감싸개 — 킷 `form-spinner`. 이 안에 넣어야 스피너가 입력칸 오른쪽 안쪽에 겹친다.
 * 스피너가 글자 위를 덮으므로 조회 중에는 입력칸을 `readOnly` 로 두는 편이 낫다.
 *
 * @example
 * <FormSpinner>
 *   <TextInput id="q" readOnly />
 *   <Spinner label="조회 중" />
 * </FormSpinner>
 */
export function FormSpinner({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('form-spinner', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * 로딩 상태 알림 — 킷에 없다. 시작과 완료 **두 시점**을 소리로 알리려고 덧붙인 조합이다.
 *
 * 이 라이브 영역은 **항상 DOM 에 두고 안의 내용만 바꾼다** — 통째로 넣었다 뺐다 하면
 * 완료를 알릴 자리가 사라진다. 스켈레톤 쪽 짝은 `ui/skeleton` 의 `SkeletonGroup` 이다.
 */
export type LoadingStatusProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 참이면 스피너를, 거짓이면 완료 문구를 라이브 영역에 담는다. */
  loading: boolean;
  /** 로딩 중 스크린리더 문구. */
  label?: string;
  /** 완료 시 스크린리더 문구. 빈 문자열이면 완료를 알리지 않는다. */
  done?: string;
  /** 로딩 중 눈에 보이는 문구. */
  children?: ReactNode;
};

export function LoadingStatus({
  loading,
  label = '로딩 중',
  done = '로딩이 완료되었습니다',
  className,
  children,
  ...rest
}: LoadingStatusProps) {
  return (
    <div role="status" className={className} {...rest}>
      {loading ? (
        // 바깥이 이미 라이브 영역이라 안쪽 role 은 지운다.
        <Spinner role={undefined} label={label}>
          {children}
        </Spinner>
      ) : (
        // 완료 문구는 눈에 보일 필요가 없다. 킷 `.sr-only` 로 숨긴다.
        <span className="sr-only">{done}</span>
      )}
    </div>
  );
}
