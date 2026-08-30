import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx, type KrdsIcon } from '../lib/krds';

/**
 * 푸터 — KRDS `#krds-footer`.
 *
 * 조각을 규격 순서대로 조립해 쓴다 — 로고 → 연락처 → 유틸리티 링크 → 정책 링크 → 저작권 →
 * 운영기관 식별자. **순서를 바꾸지 마라**(규격의 금지 사항).
 * 아이디 선택자라 한 화면에 하나만 두고, 모든 조각을 `Footer` 안에 둔다.
 * 좁은 화면에서 세로로 바뀌어도 DOM 순서는 같다 — 폭마다 다른 순서를 렌더하지 않는다.
 *
 * @example
 * <Footer>
 *   <FooterInner>
 *     <FooterLogo label="○○기관"><img src="/site/logo.svg" alt="" /></FooterLogo>
 *     <FooterContent>
 *       <FooterInfo>
 *         <FooterAddress>(00000) 모루시 …</FooterAddress>
 *         <FooterContacts><FooterContact note="(평일 09~18시)">대표전화 1577-0000</FooterContact></FooterContacts>
 *       </FooterInfo>
 *       <FooterLinks>
 *         <FooterGoLinks><FooterGoLink href="/map">찾아오시는 길</FooterGoLink></FooterGoLinks>
 *       </FooterLinks>
 *     </FooterContent>
 *     <FooterBottom>
 *       <FooterBottomText>
 *         <FooterMenu>
 *           <FooterMenuLink href="/policy/privacy" point>개인정보처리방침</FooterMenuLink>
 *           <FooterMenuLink href="/policy/copyright">저작권 정책</FooterMenuLink>
 *         </FooterMenu>
 *         <FooterCopyright>© 2026 …</FooterCopyright>
 *       </FooterBottomText>
 *       <FooterIdentifier orgName="○○기관" />
 *     </FooterBottom>
 *   </FooterInner>
 * </Footer>
 *
 * 자세히: docs/krds/09-부품-노트.md#푸터
 */

/** 푸터 바깥틀 — `<footer id="krds-footer">`. 한 화면에 하나만 둔다. */
export type FooterProps = Omit<ComponentPropsWithRef<'footer'>, 'id'>;

export function Footer({ className, children, ...rest }: FooterProps) {
  return (
    // 모양이 `#krds-footer` 아이디에 걸려 있어 뿌리에는 킷 클래스가 없다. 빈 class 를 남기지 않는다.
    <footer id="krds-footer" className={cx(className) || undefined} {...rest}>
      {children}
    </footer>
  );
}

/** 관련 사이트 띠 — 킷 `.foot-quick`. 선택 사항이고, 있으면 푸터의 맨 위다. */
export function FooterQuick({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('foot-quick', className)} {...rest}>
      <div className="inner">{children}</div>
    </div>
  );
}

/**
 * 관련 사이트 한 칸 — 킷 `.link`. `href` 를 주면 `<a>`, 없으면 레이어를 여는 `<button>` 이다.
 * 아이콘은 킷이 `::after` 로 붙인다 — 따로 넣지 마라.
 */
export type FooterQuickLinkProps =
  | (Omit<ComponentPropsWithRef<'button'>, 'href'> & { href?: undefined })
  | (ComponentPropsWithRef<'a'> & { href: string });

export function FooterQuickLink(props: FooterQuickLinkProps) {
  const cls = cx('link', props.className);

  if (props.href !== undefined) {
    const { className: _a, ...rest } = props as ComponentPropsWithRef<'a'>;
    return <a className={cls} {...rest} />;
  }
  const { className: _b, ...rest } = props as ComponentPropsWithRef<'button'>;
  return <button type="button" className={cls} {...rest} />;
}

/** 푸터 본문 폭 — 킷 `#krds-footer > .inner`. **`Footer` 의 직계 자식이어야 한다.** */
export function FooterInner({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('inner', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * 서비스 로고 — 킷 `.f-logo`. 킷이 KRDS 로고를 배경 이미지로 그린다.
 * `children` 에 `<img>` 를 넣으려면 그 배경을 지워야 로고가 겹치지 않는다.
 */
export type FooterLogoProps = ComponentPropsWithRef<'div'> & {
  /** 스크린리더가 읽을 기관·서비스 이름. 로고가 이미지든 배경이든 반드시 준다. */
  label: string;
};

export function FooterLogo({ label, className, children, ...rest }: FooterLogoProps) {
  return (
    <div className={cx('f-logo', className)} {...rest}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** 로고 아래 3단(연락처 · 고객센터 · 유틸리티 링크) — 킷 `.f-cnt`. 폭 배분은 킷이 한다. */
export function FooterContent({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-cnt', className)} {...rest}>
      {children}
    </div>
  );
}

/** 연락처 묶음 — 킷 `.f-info`. `FooterAddress` 와 `FooterContacts` 가 들어간다. */
export function FooterInfo({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-info', className)} {...rest}>
      {children}
    </div>
  );
}

/** 주소 한 줄 — 킷 `.info-addr`. */
export function FooterAddress({ className, children, ...rest }: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('info-addr', className)} {...rest}>
      {children}
    </p>
  );
}

/** 연락 수단 목록 — 킷 `.info-cs`. 안에는 `FooterContact` 만 넣는다. */
export function FooterContacts({ className, children, ...rest }: ComponentPropsWithRef<'ul'>) {
  return (
    <ul className={cx('info-cs', className)} {...rest}>
      {children}
    </ul>
  );
}

/** 연락 수단 한 줄 — 킷 `.info-cs > li > .key-info` (+ 선택 `.more-info`). */
export type FooterContactProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
  /** 굵게 나오는 본문. 예: `대표전화 1577-1000` */
  children: ReactNode;
  /** 괄호 보조 설명. 예: `(유료, 평일 09시~18시)` — 굵기가 본문으로 돌아간다. */
  note?: ReactNode;
  /** 구분선 뒤에 붙는 덧붙임. 예: 팩스·야간 안내. */
  more?: ReactNode;
};

export function FooterContact({ children, note, more, className, ...rest }: FooterContactProps) {
  return (
    <li className={cx(className) || undefined} {...rest}>
      <span className="key-info">
        <strong>{children}</strong>
        {note != null && <span>{note}</span>}
      </span>
      {more != null && <span className="more-info">{more}</span>}
    </li>
  );
}

/** 고객센터 안내 단 — 킷 `.f-cs`. 안에는 `FooterCsItem` 을 넣는다. */
export function FooterCs({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-cs', className)} {...rest}>
      {children}
    </div>
  );
}

/** 고객센터 항목 한 벌 — 킷 `.f-cs dl` + `.info-tit`. */
export type FooterCsItemProps = Omit<ComponentPropsWithRef<'dl'>, 'title' | 'children'> & {
  /** 항목 이름. 예: `고객센터` */
  title: ReactNode;
  /** 값. 예: `1577-1000` */
  children: ReactNode;
};

export function FooterCsItem({ title, children, className, ...rest }: FooterCsItemProps) {
  return (
    <dl className={cx(className) || undefined} {...rest}>
      <dt className="info-tit">{title}</dt>
      <dd>{children}</dd>
    </dl>
  );
}

/** 유틸리티 링크 묶음 — 킷 `.f-link`. `FooterGoLinks` 와 `FooterSnsLinks` 가 들어간다. */
export function FooterLinks({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-link', className)} {...rest}>
      {children}
    </div>
  );
}

/** 바로가기 링크 묶음 — 킷 `.link-go`. */
export function FooterGoLinks({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('link-go', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * 바로가기 링크 한 줄 — 킷 `.link-go > a.krds-btn.medium.text`.
 * 여기에 공용 `LinkButton` 을 쓰지 마라 — 킷이 이 자리의 크기를 따로 잡아 어긋난다.
 */
export type FooterGoLinkProps = ComponentPropsWithRef<'a'> & {
  /** 뒤에 붙는 킷 아이콘 이름(`ico-` 뺀 것). 기본은 샘플의 `angle` + 오른쪽 회전. */
  icon?: KrdsIcon | null;
  /** 아이콘 회전. 방향은 이름의 일부가 아니라 별도 클래스다 — `icon="angle right"` 로 쓰지 마라. */
  iconDirection?: 'up' | 'down' | 'left' | 'right';
};

export function FooterGoLink({
  icon = 'angle',
  iconDirection = 'right',
  className,
  children,
  target,
  title,
  ...rest
}: FooterGoLinkProps) {
  return (
    <a
      className={cx('krds-btn', 'medium', 'text', className)}
      target={target}
      // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구. 푸터 샘플의 문구가 「새 창 열기」다.
      title={title ?? (target === '_blank' ? '새 창 열기' : undefined)}
      {...rest}
    >
      {children}
      {icon && <i className={cx(`svg-icon ico-${icon}`, iconDirection)} aria-hidden="true" />}
    </a>
  );
}

/** 소셜 채널 묶음 — 킷 `.link-sns`. */
export function FooterSnsLinks({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('link-sns', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * 소셜 채널 아이콘 링크 — 킷 `a.krds-btn.xlarge.icon.border`. 채널 이름(`label`)이 필수다.
 * 킷에 있는 아이콘은 `instagram` · `youtube` · `sns-x` · `facebook` · `blog` 다.
 */
export type FooterSnsLinkProps = Omit<ComponentPropsWithRef<'a'>, 'children'> & {
  /** 스크린리더가 읽을 채널 이름. 예: `인스타그램` */
  label: string;
  /** 킷 아이콘 이름(`ico-` 뺀 것). 예: `instagram` */
  icon: KrdsIcon;
};

export function FooterSnsLink({
  label,
  icon,
  className,
  target = '_blank',
  title = '새 창 열기',
  ...rest
}: FooterSnsLinkProps) {
  return (
    <a
      className={cx('krds-btn', 'xlarge', 'icon', 'border', className)}
      target={target}
      title={title}
      {...rest}
    >
      <span className="sr-only">{label}</span>
      <i className={`svg-icon ico-${icon}`} aria-hidden="true" />
    </a>
  );
}

/** 맨 아래 줄 — 킷 `.f-btm`. 안에 `FooterBottomText` 와 `FooterIdentifier` 를 넣는다. */
export function FooterBottom({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-btm', className)} {...rest}>
      {children}
    </div>
  );
}

/** 정책 링크 + 저작권 한 줄 — 킷 `.f-btm-text`. PC 에서 좌우 양끝으로 벌어진다. */
export function FooterBottomText({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-btm-text', className)} {...rest}>
      {children}
    </div>
  );
}

/** 정책 링크 묶음 — 킷 `.f-menu`. */
export function FooterMenu({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={cx('f-menu', className)} {...rest}>
      {children}
    </div>
  );
}

/** 정책 링크 하나. **개인정보처리방침에는 `point` 를 준다** — 규격이 다른 고지사항과 구분하라고 한다. */
export type FooterMenuLinkProps = ComponentPropsWithRef<'a'> & {
  /** 개인정보처리방침처럼 다른 고지사항과 구분해야 하는 링크. 굵게 그린다. */
  point?: boolean;
};

export function FooterMenuLink({ point, className, children, ...rest }: FooterMenuLinkProps) {
  return (
    <a className={cx(point && 'point font-bold', className) || undefined} {...rest}>
      {children}
    </a>
  );
}

/** 저작권 — 킷 `.f-copy`. 규격상 푸터의 마지막 정보다(식별자는 그 뒤의 별도 구획). */
export function FooterCopyright({ className, children, ...rest }: ComponentPropsWithRef<'p'>) {
  return (
    <p className={cx('f-copy', className)} {...rest}>
      {children}
    </p>
  );
}

/**
 * 운영기관 식별자 — KRDS `.krds-identifier`. `FooterBottom` 의 **마지막 자식**으로 넣는다.
 *
 * 로고는 서비스 로고가 아니라 **운영 주체 기관**의 로고다(서비스 로고는 `FooterLogo`).
 * 문구 형식과 요소 배치는 규격이 변형을 금지한다 — `children` 은 번역을 넣는 자리다.
 * 푸터 밖에 독립해 두려면 `ui/identifier` 의 `Identifier` 를 쓴다.
 */

/** KRDS 가 규정한 식별자 문구. 기관명만 갈아 끼운다. */
export function identifierText(orgName: string): string {
  return `이 누리집은 ${orgName} 누리집입니다.`;
}

export type FooterIdentifierProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** 운영 기관 이름. 로고의 대체 텍스트로도 쓴다. */
  orgName: string;
  /** 로고 자리에 넣을 것(보통 `<img>`). 생략하면 킷 배경 로고만 나온다. */
  logo?: ReactNode;
  /** 안내 문구. 생략하면 `identifierText(orgName)`. 번역본 말고 다른 문구를 넣지 마라. */
  children?: ReactNode;
  /** 주면 `<section aria-label>` 로 랜드마크가 된다. 본문과 같은 문구를 넣지 마라(두 번 읽힌다). */
  label?: string;
};

export function FooterIdentifier({
  orgName,
  logo,
  label,
  className,
  children,
  ...rest
}: FooterIdentifierProps) {
  const inner = (
    <>
      <span className="logo">
        {logo}
        <span className="sr-only">{orgName}</span>
      </span>
      <span className="ban-txt">{children ?? identifierText(orgName)}</span>
    </>
  );

  if (label) {
    return (
      <section
        className={cx('krds-identifier', className)}
        aria-label={label}
        {...(rest as ComponentPropsWithRef<'section'>)}
      >
        {inner}
      </section>
    );
  }
  return (
    <div className={cx('krds-identifier', className)} {...rest}>
      {inner}
    </div>
  );
}
