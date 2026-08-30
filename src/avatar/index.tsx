import type { ComponentPropsWithRef } from 'react';
import { cx, type KrdsSize, type KrdsTone } from '../lib/krds';

/**
 * 아바타(사용자 표식) — KRDS 킷에 없다. KRDS 토큰을 입힌 보충 부품이다.
 *
 * 사람 이름 옆에 놓아 목록에서 행을 구분한다. 스스로 누를 수 없는 `<span>` 이다 —
 * 누르는 일은 감싸는 `<Link>`·`<button>` 이 한다.
 * 이름이 곁에 이미 적혀 있으면 `decorative` 를 켠다(안 켜면 이름이 두 번 읽힌다).
 * 여러 사람을 겹쳐 늘어놓을 때는 `AvatarGroup` 을 쓴다.
 *
 * @example
 * <Avatar name="홍길동" />
 * <Avatar name="홍길동" src="/files/1.jpg" size="small" />
 * <span className="flex items-center gap-2">
 *   <Avatar name={p.author} size="xsmall" decorative /> {p.author}
 * </span>
 * <AvatarGroup label="참여자" items={members} max={4} />
 *
 * 자세히: docs/krds/09-부품-노트.md#아바타
 */

/** 채움 방식. 킷 배지의 `bg-light-*` · `bg-*` 짝을 유틸리티로 옮긴 것이다. */
export type AvatarFill = 'light' | 'solid';

/**
 * 크기 → 상자·글자·아이콘·겹침. 상자 높이는 버튼·입력칸과 같은 눈금이고 글자는 레이블 축이다.
 * 아이콘은 상자의 절반, 겹침 폭은 원의 1/4쯤이다.
 */
const SIZE: Record<KrdsSize, { box: string; text: string; icon: string; overlap: string }> = {
  xsmall: { box: 'size-8', text: 'text-label-xs', icon: 'size-4', overlap: '-ml-2' }, // 32 / 13 / 16
  small: { box: 'size-10', text: 'text-label-sm', icon: 'size-5', overlap: '-ml-2' }, // 40 / 15 / 20
  medium: { box: 'size-12', text: 'text-label-md', icon: 'size-6', overlap: '-ml-3' }, // 48 / 17 / 24
  large: { box: 'size-14', text: 'text-label-lg', icon: 'size-7', overlap: '-ml-4' }, // 56 / 19 / 28
  xlarge: { box: 'size-16', text: 'text-label-lg', icon: 'size-8', overlap: '-ml-4' }, // 64 / 19 / 32
};

/**
 * 옅은 채움. 킷 배지 `bg-light-*` 와 같은 색 짝이다(대비를 킷이 이미 검증했다).
 * 완성된 문자열로 적는다 — Tailwind 는 글자 그대로 적힌 클래스만 만든다.
 */
const TONE_LIGHT: Record<KrdsTone, string> = {
  primary: 'bg-primary-surface text-primary',
  secondary: 'bg-secondary-surface text-secondary',
  gray: 'bg-surface-subtle text-fg-subtle',
  point: 'bg-point-surface text-point',
  danger: 'bg-danger-surface text-danger',
  warning: 'bg-warning-surface text-warning',
  success: 'bg-success-surface text-success',
  information: 'bg-information-surface text-information',
};

/**
 * 꽉 찬 채움. 킷 배지 `bg-*`(element 바탕 + 흰 글자)와 같은 짝이다.
 * gray 만 solid 토큰이 없어 `bg-fg-subtle` 로 잇는다.
 */
const TONE_SOLID: Record<KrdsTone, string> = {
  primary: 'bg-primary-solid text-fg-inverse',
  secondary: 'bg-secondary-solid text-fg-inverse',
  gray: 'bg-fg-subtle text-fg-inverse',
  point: 'bg-point-solid text-fg-inverse',
  danger: 'bg-danger-solid text-fg-inverse',
  warning: 'bg-warning-solid text-fg-inverse',
  success: 'bg-success-solid text-fg-inverse',
  information: 'bg-information-solid text-fg-inverse',
};

/** 한글 — 완성형 가나다(AC00~D7A3)와 호환 자모(3131~318E). */
const HANGUL = /[ㄱ-ㆎ가-힣]/;

/**
 * 이름에서 이니셜을 뽑는다. 한글은 성 한 글자, 서양식 이름은 첫 두 낱말의 머리글자다.
 *
 * @example
 * avatarInitials('홍길동')       // '홍'
 * avatarInitials('남궁 민수')    // '남'
 * avatarInitials('Hong Gildong') // 'HG'
 * avatarInitials('gildong')      // 'G'
 */
export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = Array.from(words[0] ?? '')[0] ?? '';
  if (!first) return '';
  if (HANGUL.test(first)) return first;
  const second = words.length > 1 ? (Array.from(words[1] ?? '')[0] ?? '') : '';
  return (first + second).toUpperCase();
}

type AvatarBase = {
  /** 기본 medium(48px). 같은 줄의 버튼·입력칸과 **같은 값**을 준다. */
  size?: KrdsSize;
  /** 기본 gray. 뜻이 있을 때만 다른 색을 준다 — 이름 해시로 색을 흩뿌리지 않는다. */
  tone?: KrdsTone;
  fill?: AvatarFill;
  /** 프로필 사진 주소. 불러오기에 실패하면 밑의 이니셜이 드러난다. */
  src?: string;
  /** 이니셜을 직접 준다. 생략하면 `name` 에서 뽑는다. */
  initials?: string;
  /** 겹쳐 놓을 때 서로 떨어져 보이도록 바탕색 테두리를 두른다. `AvatarGroup` 이 켜 준다. */
  bordered?: boolean;
  className?: string;
};

/** 아바타 하나가 사람을 대신하는 자리. 보조기술이 이름을 읽는다. */
export type AvatarProps = Omit<ComponentPropsWithRef<'span'>, 'children'> &
  AvatarBase & {
    decorative?: false;
    /** 사람 이름. 이니셜과 보조기술 이름이 여기서 나온다. */
    name: string;
    /** 읽을 문구를 이름과 다르게 하고 싶을 때(예: `홍길동 (관리자)`). */
    label?: string;
  };

/** 곁에 이름이 이미 적혀 있는 자리. 보조기술에서 감춘다(이름이 두 번 읽히지 않게). */
export type DecorativeAvatarProps = Omit<ComponentPropsWithRef<'span'>, 'children'> &
  AvatarBase & {
    decorative: true;
    /** 이니셜을 뽑는 데만 쓴다. 읽히지는 않는다. */
    name?: string;
  };

/** 두 갈래를 한 번에 꺼내기 위한 내부 형. 밖으로 내보내지 않는다. */
type AvatarAnyProps = Omit<ComponentPropsWithRef<'span'>, 'children'> &
  AvatarBase & { decorative?: boolean; name?: string; label?: string };

/**
 * 사용자 표식 하나. 이니셜을 깔고 `src` 가 있으면 그 위에 사진을 덮는다.
 * 이름도 이미지도 없으면 킷 아이콘 `ico-my` 를 그린다(비회원 글 등).
 *
 * @example
 * <Avatar name="홍길동" size="small" src={user.photo} />
 */
export function Avatar(props: AvatarProps | DecorativeAvatarProps) {
  const {
    size = 'medium',
    tone = 'gray',
    fill = 'light',
    src,
    initials,
    bordered,
    decorative = false,
    name,
    label,
    className,
    ...rest
  } = props as AvatarAnyProps;

  const metric = SIZE[size];
  const text = initials ?? (name ? avatarInitials(name) : '');

  return (
    <span
      // 장식용이면 통째로 감춘다. 아니면 그림 하나로 읽히고 이름은 aria-label 이 준다.
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? name)}
      aria-hidden={decorative ? true : undefined}
      className={cx(
        // relative/overflow-hidden — 사진을 원 안에 가둔다. shrink-0 — 좁은 flex 줄에서 눌려 찌그러지지 않게.
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full align-middle font-bold leading-none',
        metric.box,
        metric.text,
        fill === 'solid' ? TONE_SOLID[tone] : TONE_LIGHT[tone],
        // ★ 함정 4 — outline-solid 를 빼면 폭만 있고 선이 없을 수 있다
        bordered && 'outline-2 outline-solid outline-bg',
        className,
      )}
      {...rest}
    >
      {text ? (
        // role="img" 는 자손을 읽지 않지만, 그 규칙을 안 지키는 보조기술이 있어 명시해 둔다.
        <span aria-hidden="true">{text}</span>
      ) : (
        <i className={cx('svg-icon ico-my bg-current', metric.icon)} aria-hidden="true" />
      )}
      {src && (
        /* 이니셜 위에 덮는다. 실패하면 아무것도 안 그려져 밑의 이니셜이 드러난다(함정 2).
           프레임워크의 이미지 부품이 아니라 맨 `<img>` 다 — 프로필 사진은 기관이 올린 파일이라 호스트가
           미리 정해져 있지 않다. 저장소 eslint 설정이 `no-img-element` 를 경고로 낮춰 둔 이유가 이것이다. */
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}

/** 묶음에 넣을 한 사람. */
export type AvatarGroupItem = {
  name: string;
  src?: string;
  tone?: KrdsTone;
  /** 읽을 문구를 이름과 다르게 할 때. */
  label?: string;
};

export type AvatarGroupProps = Omit<ComponentPropsWithRef<'ul'>, 'children'> & {
  items: AvatarGroupItem[];
  /** 몇 칸까지 보일지. 나머지는 `+N` 한 칸으로 접는다. 기본 4. */
  max?: number;
  /** 기본 small(40px) — 목록 안에 들어가는 일이 많아 하나짜리보다 작다. */
  size?: KrdsSize;
  fill?: AvatarFill;
  /** 모든 칸의 기본 색. 항목이 `tone` 을 주면 그것이 이긴다. */
  tone?: KrdsTone;
  /** 겹치지 않고 나란히 놓는다. */
  spaced?: boolean;
  /** 묶음 전체의 이름(`<ul>` 의 aria-label). 예: 「참여자」 */
  label?: string;
};

/**
 * 아바타 묶음 — 담당자·참여자를 겹쳐 늘어놓는다.
 *
 * `children` 이 아니라 `items` 를 받는다. 겹침 간격·테두리·`+N` 칸을 묶음이 정해야 하기 때문이다.
 * `<ul>/<li>` 라 스크린리더가 개수를 세어 준다 — 각 칸의 이름도 그대로 읽힌다.
 *
 * @example
 * <AvatarGroup label="참여자" items={members} max={4} />
 */
export function AvatarGroup({
  items,
  max = 4,
  size = 'small',
  fill = 'light',
  tone = 'gray',
  spaced,
  label,
  className,
  ...rest
}: AvatarGroupProps) {
  // 0·음수·소수를 막는다. 부모가 화면 폭에서 계산한 값을 그대로 넘기는 일이 흔하다.
  const limit = Math.max(1, Math.trunc(max) || 1);
  const shown = items.slice(0, limit);
  const rest_ = items.length - shown.length;
  const step = spaced ? 'ml-2' : SIZE[size].overlap;

  return (
    <ul aria-label={label} className={cx('flex items-center', className)} {...rest}>
      {shown.map((it, i) => (
        <li key={`${it.name}-${i}`} className={cx('shrink-0 first:ml-0', step)}>
          <Avatar
            name={it.name}
            label={it.label}
            src={it.src}
            size={size}
            fill={fill}
            tone={it.tone ?? tone}
            bordered
          />
        </li>
      ))}
      {rest_ > 0 && (
        <li className={cx('shrink-0 first:ml-0', step)}>
          {/* 화면에는 `+3`, 보조기술에는 「외 3명」. 숫자는 tabular-nums 로 폭을 고정한다. */}
          <Avatar
            name={`외 ${rest_}명`}
            initials={`+${rest_}`}
            size={size}
            fill={fill}
            tone="gray"
            bordered
            className="tabular-nums"
          />
        </li>
      )}
    </ul>
  );
}
