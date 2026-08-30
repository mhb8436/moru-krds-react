import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 공식 배너(마스트헤드) — KRDS `#krds-masthead`.
 *
 * 「이 누리집은 대한민국 공식 전자정부 누리집입니다」 띠. 모든 화면 최상단,
 * `SkipLink` 뒤·`Header` 앞에 같은 자리로 둔다(순서는 셸이 지켜야 한다).
 * 문구와 구조는 규격이 변형을 금지한다 — `children` 은 번역을 넣는 자리다.
 * 기관 식별은 푸터의 `Identifier` 가 맡는다.
 *
 * @example
 * <Masthead />
 * <Masthead label="공식 누리집 안내">{t('masthead')}</Masthead>
 *
 * 자세히: docs/krds/09-부품-노트.md#마스트헤드
 */

/** KRDS 가 규정한 배너 문구. 변형 금지 — 번역 외에 손대지 않는다. */
export const MASTHEAD_TEXT = '이 누리집은 대한민국 공식 전자정부 누리집입니다.';

export type MastheadProps = Omit<ComponentPropsWithRef<'div'>, 'id' | 'children'> & {
  /** 배너 문구. 생략하면 KRDS 원문. 번역본 말고 다른 문구를 넣지 마라. */
  children?: ReactNode;
  /** 주면 `role="region" aria-label` 로 랜드마크가 된다. 본문과 같은 문구를 넣지 마라(두 번 읽힌다). */
  label?: string;
};

export function Masthead({ children, label, className, ...rest }: MastheadProps) {
  return (
    <div
      id="krds-masthead"
      role={label ? 'region' : undefined}
      aria-label={label}
      // 뿌리에는 킷 클래스가 없다(모양이 `#krds-masthead` 아이디에 걸려 있다).
      // 합칠 게 className 뿐이라 비면 속성을 아예 빼서 `class=""` 를 남기지 않는다.
      className={cx(className) || undefined}
      {...rest}
    >
      {/* `.toggle-wrap` 은 킷 CSS 에 규칙이 없지만 규격이 구조 변형을 금지해 샘플 그대로 둔다. */}
      <div className="toggle-wrap">
        <div className="toggle-head">
          <div className="inner">
            <span className="nuri-txt">{children ?? MASTHEAD_TEXT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
