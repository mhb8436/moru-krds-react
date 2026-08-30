import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 긴급 공지 — KRDS `krds-critical-alerts`.
 *
 * **재난·재해, 예고 없는 장애, 점검 사전 예고에만 쓴다.** 규격이 피드백 메시지·일반 공지·홍보에
 * 쓰는 것을 금지한다 — 본문 안내는 `Alert`, 폼 오류는 `Field` 의 `error` 다.
 * 한 화면에 하나, 링크도 하나, 본문은 한 줄이다(킷이 두 줄에서 잘라낸다).
 * 닫기 단추는 규격이 금지해 prop 자체가 없다. 자리는 주메뉴와 히어로 사이, 본문의 첫 요소다.
 *
 * @example
 * <CriticalAlert level="danger" href="/notice/1024" linkTitle="집중호우 대응 안내">
 *   집중호우로 일부 민원 처리가 지연되고 있습니다.
 * </CriticalAlert>
 *
 * 자세히: docs/krds/09-부품-노트.md#긴급공지
 */

/**
 * 긴급도. `danger` 재난·급작스러운 장애(「긴급」) · `ok` 서비스 중단 사전 예고(「안전」) ·
 * `info` 대부분의 사용자가 알아야 하는 상황(「안내」).
 */
export type CriticalAlertLevel = 'danger' | 'ok' | 'info';

/** 긴급도별 기본 레이블. 킷 샘플에 적힌 글자 그대로다. */
const DEFAULT_LABEL: Record<CriticalAlertLevel, string> = {
  danger: '긴급',
  ok: '안전',
  info: '안내',
};

export type CriticalAlertProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 긴급도. 기본값 `danger` — 이 부품을 쓸 상황 자체가 긴급 상황이다. */
  level?: CriticalAlertLevel;
  /** 배지 글자. 생략하면 긴급도별 기본값(긴급/안전/안내). 감추지 마라 — 아이콘만으로는 안 읽힌다. */
  label?: string;
  /** 공지 내용. 한 줄로 쓴다 — 킷이 두 줄에서 잘라낸다. */
  children: ReactNode;
  /** 상세 화면 링크. 규격상 하나만 둘 수 있다. */
  href?: string;
  /** 링크 글자. 기본 「자세히 보기」. 작은 화면(<768px)에서는 감춰지고 화살표만 남는다. */
  linkLabel?: ReactNode;
  /** 링크의 목적지 설명(`title`). 「자세히 보기」만으로는 목적지를 알 수 없으니 문서 제목을 넣는다. */
  linkTitle?: string;
  /** 링크 target. `_blank` 면 `title` 에 「새 창 열림」을 덧붙인다. */
  linkTarget?: ComponentPropsWithRef<'a'>['target'];
};

export function CriticalAlert({
  level = 'danger',
  label,
  children,
  href,
  linkLabel = '자세히 보기',
  linkTitle,
  linkTarget,
  className,
  // 접근성 가이드: 「긴급 공지 섹션에 role="banner" 를 사용하여 배너 역할을 부여」.
  // 킷 샘플에는 없고 가이드가 요구한 것이다. 페이지에 <header> 가 이미 있으면 banner
  // 랜드마크가 둘이 되므로 이름을 붙여 구분한다(aria-label 은 우리가 덧댄 것).
  role = 'banner',
  'aria-label': ariaLabel = '긴급 공지',
  ...rest
}: CriticalAlertProps) {
  const newWindow = linkTarget === '_blank';
  const title = linkTitle
    ? newWindow
      ? `${linkTitle} (새 창 열림)`
      : linkTitle
    : newWindow
      ? '새 창 열림'
      : undefined;

  return (
    // `.main-urgent-wrap` 은 킷 CSS 에 없다(위 주석 참고) — 전폭만 Tailwind 로 준다.
    <div className={cx('w-full', className)} role={role} aria-label={ariaLabel} {...rest}>
      <ul className="krds-critical-alerts">
        {/* 규격상 항목은 하나뿐이다. 늘리지 마라. */}
        <li>
          <div className="critical-ban">
            {/* 아이콘은 이 배지의 ::before 다. 안에 <i> 나 sr-only 를 넣지 마라. */}
            <span className={cx('critical-badge', level)}>{label ?? DEFAULT_LABEL[level]}</span>
            <p className="critical-txt">{children}</p>
            {href && (
              <a
                href={href}
                className="krds-btn medium link basic"
                target={linkTarget}
                title={title}
              >
                {/* 킷의 `m-hide`(모바일 숨김)가 CSS 에 없어 Tailwind 로 대신한다. */}
                <span className="hidden md:inline">{linkLabel}</span>
                <i className="svg-icon ico-angle right" aria-hidden="true" />
              </a>
            )}
          </div>
        </li>
      </ul>
    </div>
  );
}
