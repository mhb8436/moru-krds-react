import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsIcon, type KrdsTone } from '../lib/krds';

/**
 * 인라인 안내 상자 — KRDS 에 없다. shadcn `Alert` 형태에 KRDS 토큰을 입힌 보충 부품이다.
 *
 * 본문 흐름 안에서 「이 화면을 쓰기 전에 알아야 할 것」을 한 덩이로 알린다.
 * 떴다 사라지는 알림은 `Toast`, 폼 필드 하나에 붙는 문구는 `Field` 의 `hint`·`message`,
 * 재난·장애 배너는 `CriticalAlert` 다 — 그쪽에 이 상자를 갖다 쓰지 마라(규격이 금지한다).
 * `AlertTitle` · `AlertDescription` 말고 다른 것을 바로 넣지 않는다.
 *
 * @example
 * <Alert tone="information">
 *   <AlertTitle>열람 신청 전에 확인하세요.</AlertTitle>
 *   <AlertDescription>비공개 기록물은 소속 기관 승인 뒤에 열립니다.</AlertDescription>
 * </Alert>
 * <Alert tone="danger" announce="assertive">
 *   <AlertTitle>저장하지 못했습니다.</AlertTitle>
 * </Alert>
 *
 * 자세히: docs/krds/09-부품-노트.md#안내상자
 */

/** 색조. `KrdsTone` 에서 이 상자가 쓰는 다섯만 좁힌 것이다. */
export type AlertTone = Extract<KrdsTone, 'information' | 'warning' | 'danger' | 'success' | 'gray'>;

/**
 * 낭독 방식. 생략하면 role 이 없다(늘 떠 있는 안내의 기본값).
 * `polite` = `role="status"`(새로 나타나는 안내) · `assertive` = `role="alert"`(긴급한 것에만).
 */
export type AlertAnnounce = 'polite' | 'assertive';

const ROLE: Record<AlertAnnounce, 'status' | 'alert'> = {
  polite: 'status',
  assertive: 'alert',
};

/**
 * 색조별 유틸리티. 선 `border-*-line` · 면 `bg-*-surface` · 글자 `text-*` · mask 아이콘 색 `tint`.
 * 완성된 문자열로 적는다(Tailwind 는 글자 그대로 적힌 클래스만 만든다).
 */
const TONE: Record<AlertTone, { box: string; tint: string; icon: KrdsIcon | null }> = {
  information: {
    box: 'border-information-line bg-information-surface text-information',
    tint: 'bg-information',
    icon: 'information-fill',
  },
  // 경고 아이콘은 킷에 없다 — 위 「경고에 아이콘이 없는 것은 일부러다」 참고.
  warning: { box: 'border-warning-line bg-warning-surface text-warning', tint: 'bg-warning', icon: null },
  danger: { box: 'border-danger-line bg-danger-surface text-danger', tint: 'bg-danger', icon: 'error-fill' },
  success: { box: 'border-success-line bg-success-surface text-success', tint: 'bg-success', icon: 'success-fill' },
  gray: { box: 'border-line bg-surface-subtler text-fg', tint: 'bg-fg', icon: null },
};

export type AlertProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** 기본 `information`. 선·면·글자색과 기본 아이콘이 여기서 정해진다. */
  tone?: AlertTone;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 색조 기본값을 덮는다. `null` 이면 그리지 않는다. */
  icon?: KrdsIcon | null;
  /** 낭독 방식. 기본은 role 없음. `assertive`(=`role="alert"`)는 긴급한 것에만. */
  announce?: AlertAnnounce;
  /** `AlertTitle` · `AlertDescription` 을 넣는다. */
  children?: ReactNode;
};

export function Alert({ tone = 'information', icon, announce, className, children, ...rest }: AlertProps) {
  const t = TONE[tone];
  // `undefined` 는 「색조 기본값을 쓴다」, `null` 은 「그리지 않는다」. 둘을 구분해야 한다.
  const iconName = icon === undefined ? t.icon : icon;

  const iconNode = iconName ? (
    <i
      className={cx(
        'svg-icon',
        `ico-${iconName}`,
        // shadcn 이 자식 svg 에 거는 16px + 아래로 2px 자리. 킷 `.svg-icon` 기본이 large 라 줄여야 한다.
        'col-start-1 row-start-1 size-4 translate-y-0.5',
        // `-fill` 은 background-image 라 색을 못 바꾼다(함정 1).
        !iconName.endsWith('-fill') && t.tint,
      )}
      aria-hidden="true"
    />
  ) : null;

  return (
    <div
      role={announce ? ROLE[announce] : undefined}
      className={cx(
        'relative grid w-full items-start gap-y-0.5 rounded-lg border border-solid px-4 py-3 text-sm',
        // 아이콘이 있을 때만 첫 칸이 열린다 — shadcn 의 `has-[>svg]:` 분기를 코드로 옮긴 것.
        iconNode ? 'grid-cols-[calc(var(--spacing)*4)_1fr] gap-x-3' : 'grid-cols-[0_1fr]',
        t.box,
        className,
      )}
      {...rest}
    >
      {iconNode}
      {children}
    </div>
  );
}

/** 안내 제목 한 줄. 둘째 칸에 놓인다. 색은 상자에서 물려받는다. */
export function AlertTitle({ className, ...rest }: ComponentPropsWithRef<'div'>) {
  return <div className={cx('col-start-2 min-h-4 font-bold', className)} {...rest} />;
}

/** 안내 본문. 여러 줄·목록을 넣어도 `gap-1` 로 벌어진다. 색은 상자에서 물려받는다. */
export function AlertDescription({ className, ...rest }: ComponentPropsWithRef<'div'>) {
  return <div className={cx('col-start-2 grid justify-items-start gap-1 text-sm', className)} {...rest} />;
}
