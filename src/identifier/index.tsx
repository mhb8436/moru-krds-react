import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 운영기관 식별자 — KRDS `krds-identifier`.
 *
 * 「이 누리집은 [기관]에서 운영하는 누리집입니다.」 안내. 푸터 안 **가장 마지막 구획**에 둔다.
 * 여기 들어가는 로고는 서비스 로고가 아니라 **운영 주체 기관**의 로고다(서비스 로고는 `f-logo`).
 * 문구 형식과 요소 배치는 규격이 변형을 금지한다 — `children` 은 번역을 넣는 자리다.
 * 푸터 골격을 조립할 때는 `ui/footer` 의 `FooterIdentifier` 를 쓴다.
 *
 * @example
 * <Identifier org="○○기관" logoSrc="/site/logo-mark.svg" />
 * <Identifier org="○○기관" variant="text" dark />
 *
 * 자세히: docs/krds/09-부품-노트.md#운영기관식별자
 */

/**
 * 표현 방식. `card` 는 흰 면 + 둥근 상자(기본), `text` 는 한 줄짜리 킷 전용 변형이다.
 */
export type IdentifierVariant = 'card' | 'text';

export type IdentifierProps = Omit<ComponentPropsWithRef<'section'>, 'children'> & {
  /** 운영기관명. 안내 문구와 로고 대체 텍스트에 함께 쓰인다. */
  org: string;
  /** 운영기관 로고 이미지 경로. 없으면 `.logo` 를 아예 그리지 않는다(킷 마크가 찍히는 것을 막는다). */
  logoSrc?: string;
  /** 표현 방식. 기본 `card`. */
  variant?: IdentifierVariant;
  /** 어두운 바탕용. 킷에 클래스가 없어 KRDS 반전 토큰으로 그린다. */
  dark?: boolean;
  /** 안내 문구. 다국어 번역을 넣을 때만 쓰고 형식은 바꾸지 않는다. */
  children?: ReactNode;
  /** 구획 이름(`aria-label`). `<section>` 은 이름이 있어야 region 으로 노출된다. */
  label?: string;
  /** 가이드가 허용하는 두 요소. 기본은 `section`. */
  as?: 'section' | 'article';
  className?: string;
};

export function Identifier({
  org,
  logoSrc,
  variant = 'card',
  dark,
  label = '운영기관 식별자',
  as: Tag = 'section',
  className,
  children,
  ...rest
}: IdentifierProps) {
  // 가이드 형식: `(운영기관 로고) 이 누리집은 [운영기관명]에서 운영하는 누리집입니다.`
  const text = children ?? `이 누리집은 ${org}에서 운영하는 누리집입니다.`;

  const logo = logoSrc ? (
    <span
      className={cx(
        'logo',
        // 킷의 KRDS 마크 배경과 고정 폭을 지운다. 높이는 킷 값을 그대로 쓴다.
        'inline-flex items-center bg-none w-auto',
        // text 변형에는 킷 `.logo` 규칙이 닿지 않아 높이가 없다 — 본문 소자 줄에 맞춘다.
        variant === 'text' && 'h-5',
      )}
    >
      {/* 이름은 옆의 sr-only 가 준다. alt 까지 채우면 두 번 읽힌다. */}
      <img src={logoSrc} alt="" className="h-full w-auto" />
      <span className="sr-only">{org}</span>
    </span>
  ) : null;

  const cls =
    variant === 'text'
      ? cx(
          'krds-identifier-txt',
          // 킷 규칙이 `#krds-footer .f-btm` 안에서만 걸린다 — 밖에서도 같은 줄로 서게 보충한다.
          // 킷의 `white-space:nowrap` 은 옮기지 않는다(긴 기관명이 좁은 화면에서 넘친다).
          'flex items-center gap-2 text-sm',
          dark && 'text-fg-inverse',
          className,
        )
      : cx(
          'krds-identifier',
          // 킷의 흰 면(`--krds-light-color-surface-white`)을 반전 토큰으로 덮는다.
          dark && 'bg-surface-inverse text-fg-inverse',
          className,
        );

  return (
    // rest 를 뒤에 두어 화면 쪽에서 aria-label 을 덮어쓸 수 있게 한다.
    <Tag aria-label={label} className={cls} {...rest}>
      {logo}
      {variant === 'text' ? <span>{text}</span> : <span className="ban-txt">{text}</span>}
    </Tag>
  );
}
