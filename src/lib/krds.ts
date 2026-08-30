/**
 * KRDS 공통 타입과 도우미.
 *
 * 여기 있는 값은 전부 킷(`public/krds/krds.min.css`)에서 실측한 것이다. 지어낸 값이 없다.
 */

/**
 * 크기.
 *
 * ★ 버튼과 입력칸이 **같은 이름에 같은 높이**다. 실측(1rem = 10px):
 *
 * | 이름    | 높이 | 버튼 | 입력·셀렉트 |
 * |---------|-----|------|------------|
 * | xsmall  | 32  | ○    | —          |
 * | small   | 40  | ○    | ○          |
 * | medium  | 48  | ○    | ○          |
 * | large   | 56  | ○    | ○          |
 * | xlarge  | 64  | ○    | 80(예외)   |
 *
 * 그래서 한 줄에 놓을 버튼과 입력칸에는 **같은 size 를 준다.**
 * 예전에 입력칸에 크기를 안 줘서 킷 기본값 large(56)로 렌더되고 옆 버튼은 small(40)이라
 * 16px 이 어긋났다 — 부품에서 기본값을 명시해 이 실수를 구조적으로 막는다.
 */
export type KrdsSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/** 폼 요소가 실제로 지원하는 크기(킷에 xsmall 규칙이 없다). */
export type KrdsFieldSize = Exclude<KrdsSize, 'xsmall'>;

/**
 * 의미 색상. 킷의 배지·태그·알림이 공통으로 쓰는 이름이다.
 */
export type KrdsTone =
  | 'primary'
  | 'secondary'
  | 'gray'
  | 'point'
  | 'danger'
  | 'warning'
  | 'success'
  | 'information';

/** 폼 필드 상태. 킷 클래스는 `.is-error` · `.is-success` · `.is-information`. */
export type KrdsFieldState = 'error' | 'success' | 'information';

/**
 * 킷이 제공하는 아이콘 이름(`ico-` 접두사를 뺀 것).
 * `<i className="svg-icon ico-sch" />` 처럼 쓴다.
 *
 * 킷의 아이콘 파일은 `public/krds/img/component/icon/ico_*.svg` 에 있고 CSS 가 mask 로 물린다.
 * **여기 없는 이름을 쓰면 검은 네모가 나온다** — 그래서 타입으로 좁혀 둔다.
 * 아래 목록은 킷 CSS 에서 `\\.ico-([a-z0-9-]+)` 로 뽑은 68종 전부다. 킷을 올릴 때 다시 뽑는다.
 */
export type KrdsIcon =
  | 'all' | 'angle' | 'blog' | 'bread-home' | 'cal-move' | 'calendar'
  | 'call' | 'checkbox' | 'complete-fill' | 'del' | 'delete-fill' | 'down'
  | 'ellipsis' | 'email' | 'error-fill' | 'facebook' | 'faq' | 'file'
  | 'filter' | 'flag' | 'fold' | 'func' | 'global' | 'go'
  | 'go-top' | 'help' | 'information-fill' | 'instagram' | 'invalid' | 'join'
  | 'like' | 'link' | 'log' | 'login-go' | 'login-type01' | 'login-type02'
  | 'login-type03' | 'login-type04' | 'login-type05' | 'login-type06' | 'logout' | 'modal-close'
  | 'more' | 'my' | 'page-next' | 'plus' | 'popup-close' | 'print'
  | 'pw-visible' | 'pw-visible-on' | 'refresh' | 'reset' | 'sch' | 'sch-plus'
  | 'scrap' | 'search' | 'setting' | 'share' | 'sns-x' | 'success-fill'
  | 'swiper-play' | 'swiper-stop' | 'toggle' | 'tooltip' | 'upload' | 'urgent-danger'
  | 'view-mode' | 'youtube';

/** 클래스 이름을 합친다. falsy 는 버린다. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 상태 → 킷 클래스. */
export function stateClass(state?: KrdsFieldState): string | undefined {
  return state && `is-${state}`;
}
