/**
 * 링크 구현 — **이 묶음이 프레임워크에 닿는 유일한 자리다.**
 *
 * 부품 안에서 화면 이동이 필요할 때는 프레임워크의 링크를 직접 부르지 않고 여기 `UiLink` 를 쓴다.
 * 그래서 Next·React Router·순수 React 어디에 올리든 **고칠 파일이 이 하나**다.
 *
 * 기본값은 맨 `<a>` 다 — 아무 프레임워크에도 묶이지 않는다.
 * 클라이언트 라우팅을 쓰고 있다면 아래처럼 이 파일만 바꾼다.
 *
 * ```tsx
 * // Next.js (App Router · Pages Router 공통)
 * import NextLink from 'next/link';
 * export function UiLink({ href, ...rest }: UiLinkProps) {
 *   return <NextLink href={href} {...rest} />;
 * }
 *
 * // React Router
 * import { Link } from 'react-router';
 * export function UiLink({ href, ...rest }: UiLinkProps) {
 *   return <Link to={href} {...rest} />;
 * }
 * ```
 *
 * 왜 context 나 전역 등록이 아닌가 — 부품 중 절반이 서버 컴포넌트로도 쓰인다.
 * React context 는 서버 컴포넌트에서 못 쓰고, 모듈 전역 등록은 서버와 클라이언트의
 * 모듈 그래프가 갈라져 있어 한쪽만 설정되는 함정이 있다. 그냥 import 를 한 곳에 모으는 것이
 * 가장 단순하고 양쪽에서 똑같이 동작한다.
 */
import type { ComponentPropsWithRef } from 'react';

export type UiLinkProps = ComponentPropsWithRef<'a'> & { href: string };

export function UiLink({ href, ...rest }: UiLinkProps) {
  return <a href={href} {...rest} />;
}
