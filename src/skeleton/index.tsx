import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 스켈레톤(로딩 자리표시) — 킷에 클래스가 없다. KRDS 토큰으로 그리는 보충 부품이다.
 *
 * **올 것의 모양을 이미 아는 자리**(목록 행·카드·본문 문단)에 쓴다. 모양을 모르거나 좁은 자리는
 * `ui/spinner`, 오래 걸리는 작업은 `ui/progress` 의 진행 막대다 — 한 화면에 섞어 쓰지 않는다.
 * **크기는 `className` 으로 준다**(`<Skeleton className="h-4 w-40" />`).
 * 자리표시는 전부 `aria-hidden` 이라 **`SkeletonGroup` 으로 감싸야** 로딩이 소리로 전해진다.
 * 그 라이브 영역은 항상 DOM 에 두고 안의 내용만 바꾼다. 1초 미만이면 아예 쓰지 않는다.
 *
 * @example
 * <SkeletonGroup loading={pending} label="목록을 불러오는 중" done="목록을 불러왔습니다">
 *   <SkeletonText lines={5} />
 * </SkeletonGroup>
 * {!pending && <List items={items} />}
 *
 * 자세히: docs/krds/09-부품-노트.md#스켈레톤
 */

/** 자리표시의 모양. 둥글기가 갈린다. */
export type SkeletonShape = 'block' | 'text' | 'circle';

/** 모양 → 둥글기 유틸리티. 완성된 문자열로 적는다 — 조립하면 Tailwind 가 클래스를 만들지 않는다. */
const SHAPE_RADIUS: Record<SkeletonShape, string> = {
  block: 'rounded-md', // 6 — 버튼·입력칸과 같은 둥글기(--krds-radius-medium1)
  text: 'rounded-sm', // 4 — 글줄 막대(--krds-radius-small1)
  circle: 'rounded-full', // 아바타·아이콘 자리
};

export type SkeletonProps = ComponentPropsWithRef<'div'> & {
  /** 모양. 기본 `block`(버튼·입력칸과 같은 둥글기). */
  shape?: SkeletonShape;
  /** 맥동을 끈다. 자리표시를 아주 많이 깔 때는 꺼서 시선을 덜 흔든다. */
  animated?: boolean;
};

/**
 * 자리표시 막대 하나. **크기는 반드시 `className` 으로 준다** — 부품에 기본 크기가 없다.
 *
 * @example
 * <Skeleton className="h-4 w-40" />
 * <Skeleton shape="circle" className="size-12" />
 */
export function Skeleton({ shape = 'block', animated = true, className, ...rest }: SkeletonProps) {
  return (
    <div
      // aria-hidden 은 rest 보다 앞에 둔다 — 바깥에서 지울 길은 열어 두되 기본은 숨김이다.
      aria-hidden="true"
      className={cx(
        'bg-surface-subtle',
        SHAPE_RADIUS[shape],
        // 기본 정지. 모션을 막지 않은 사용자에게만 맥동한다.
        animated && 'motion-safe:animate-pulse',
        className,
      )}
      {...rest}
    />
  );
}

/** 글줄 크기. KRDS 본문 글자 축과 같다 — 13 / 15 / 17 / 19px. */
export type SkeletonTextSize = Exclude<KrdsSize, 'xlarge'>;

/**
 * 글줄 크기 → 막대 높이 + 줄 간격. 자리표시를 진짜 글로 바꿔도 높이가 변하지 않도록
 * KRDS 줄 상자(글자 × 1.5)에 맞춰 골랐다.
 */
const TEXT_METRIC: Record<SkeletonTextSize, { bar: string; gap: string }> = {
  xsmall: { bar: 'h-3', gap: 'gap-2' },
  small: { bar: 'h-3', gap: 'gap-2.5' },
  medium: { bar: 'h-4', gap: 'gap-2.5' },
  large: { bar: 'h-4', gap: 'gap-3' },
};

/** 마지막 줄 폭. 문단 끝줄이 짧은 것을 흉내 낸다. */
export type SkeletonLastLineWidth = 'full' | '4/5' | '3/5' | '1/2' | '2/5';

/** 완성된 문자열로 적는다(Tailwind 스캐너). */
const LAST_WIDTH: Record<SkeletonLastLineWidth, string> = {
  full: 'w-full',
  '4/5': 'w-4/5',
  '3/5': 'w-3/5',
  '1/2': 'w-1/2',
  '2/5': 'w-2/5',
};

export type SkeletonTextProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 줄 수. **실제로 올 줄 수와 맞춘다** — 어긋나면 내용이 도착할 때 화면이 접힌다. */
  lines?: number;
  /** 글줄 크기. 기본 medium(17px 줄). */
  size?: SkeletonTextSize;
  /** 마지막 줄 폭. 기본 3/5. */
  lastLineWidth?: SkeletonLastLineWidth;
  /** 맥동을 끈다. */
  animated?: boolean;
};

/**
 * 여러 줄짜리 글 자리표시. 한 줄일 때는 끝줄을 줄이지 않는다.
 *
 * @example
 * <SkeletonText lines={3} />
 * <SkeletonText lines={1} size="large" className="w-1/3" />
 */
export function SkeletonText({
  lines = 3,
  size = 'medium',
  lastLineWidth = '3/5',
  animated = true,
  className,
  ...rest
}: SkeletonTextProps) {
  const { bar, gap } = TEXT_METRIC[size];
  // 0줄·음수·소수를 막는다. 부모가 목록 길이를 그대로 넘기는 일이 흔하다.
  const count = Math.max(1, Math.trunc(lines) || 1);

  return (
    <div aria-hidden="true" className={cx('flex flex-col', gap, className)} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          shape="text"
          animated={animated}
          className={cx(bar, i === count - 1 && count > 1 ? LAST_WIDTH[lastLineWidth] : 'w-full')}
        />
      ))}
    </div>
  );
}

export type SkeletonGroupProps = ComponentPropsWithRef<'div'> & {
  /** 참이면 자리표시를, 거짓이면 완료 문구만 라이브 영역에 담는다. */
  loading: boolean;
  /** 로딩 중 스크린리더 문구. */
  label?: string;
  /** 완료 시 스크린리더 문구. 빈 문자열이면 완료를 알리지 않는다. */
  done?: string;
  /** 자리표시들. */
  children?: ReactNode;
};

/**
 * 자리표시 묶음 + 로딩 알림 — 스켈레톤을 쓸 때 **이것으로 감싸는 것이 기본**이다.
 *
 * 이 라이브 영역은 **항상 DOM 에 두고 안의 내용만 바꾼다** — 통째로 넣었다 뺐다 하면
 * 완료를 알릴 자리가 사라진다. `aria-live` · `aria-busy` 를 손으로 덮어쓰지 마라.
 * 스피너 쪽 짝은 `ui/spinner` 의 `LoadingStatus` 다.
 */
export function SkeletonGroup({
  loading,
  label = '불러오는 중',
  done = '불러왔습니다',
  className,
  children,
  ...rest
}: SkeletonGroupProps) {
  return (
    <div role="status" className={className} {...rest}>
      {loading ? (
        <>
          {/* 킷 `.sr-only` — 화면에서 숨고 스크린리더만 읽는다. */}
          <span className="sr-only">{label}</span>
          {children}
        </>
      ) : (
        <span className="sr-only">{done}</span>
      )}
    </div>
  );
}
