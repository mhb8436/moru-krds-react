import type { ComponentPropsWithRef, MouseEventHandler, ReactNode } from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 태그 — KRDS `krds-tag-wrap` + `krds-btn-tag`.
 *
 * 필터 조건을 보이고 지우는 표시다. 누르지 않는 상태 표시는 `Badge` 를 쓴다.
 * **반드시 `TagWrap` 으로 감싼다** — 킷 규칙이 전부 감싸개의 자손 선택자라 없으면 맨 글자가 된다.
 * 크기도 `TagWrap` 이 정한다. 한 묶음에는 `Tag`(비대화형)나 `TagButton`(대화형) 한 종류만 넣는다.
 * 색 prop 은 없다 — 규격이 색으로 뜻을 전하지 말라고 한다.
 *
 * @example
 * <TagWrap size="medium">
 *   <Tag onDelete={() => remove('서울')}>서울</Tag>
 *   <Tag onDelete={() => remove('2024')}>2024</Tag>
 * </TagWrap>
 * <TagWrap>
 *   <TagButton selected={on} onClick={toggle}>진행 중</TagButton>
 * </TagWrap>
 *
 * 자세히: docs/krds/09-부품-노트.md#태그
 */

/** 태그 크기. 킷에 있는 셋뿐이다 — 높이 24 / 32 / 40px. */
export type TagSize = Extract<KrdsSize, 'small' | 'medium' | 'large'>;

export type TagWrapProps = ComponentPropsWithRef<'div'> & {
  /** 기본 medium(32px). 킷 기본값과 같다. 이 묶음 안 태그 전부에 적용된다. */
  size?: TagSize;
};

/**
 * 태그 묶음 — 킷 `krds-tag-wrap`. 태그 하나만 놓을 때도 반드시 이걸로 감싼다.
 *
 * 간격은 킷이 크기별로 잡는다 — `ml-*` 를 손으로 붙이지 않는다.
 * 「전체 해제」 같은 일괄 버튼은 이 묶음 **밖**의 형제로, 오른쪽에 둔다.
 */
export function TagWrap({ size = 'medium', className, children, ...rest }: TagWrapProps) {
  return (
    <div className={cx('krds-tag-wrap', size, className)} {...rest}>
      {children}
    </div>
  );
}

/** 삭제 단추의 스크린리더 이름(`[태그 레이블] 옵션 삭제`). children 이 문자열일 때만 만들 수 있다. */
function deleteName(children: ReactNode): string {
  return typeof children === 'string' && children.trim() ? `${children.trim()} 옵션 삭제` : '삭제';
}

export type TagProps = ComponentPropsWithRef<'span'> & {
  /** 주면 삭제 단추가 붙는다 — 설정된 필터·정렬 옵션을 해제하는 자리다. */
  onDelete?: MouseEventHandler<HTMLButtonElement>;
  /** 삭제 단추의 스크린리더 이름. 생략하면 `[children] 옵션 삭제`(children 이 문자열일 때). */
  deleteLabel?: string;
};

/**
 * 태그 — 킷 `krds-btn-tag`. 누르지 않는 레이블이 기본이고 `onDelete` 를 주면 삭제 단추가 붙는다.
 *
 * 삭제 아이콘은 킷이 그린다 — `<i class="svg-icon">` 를 따로 넣지 마라.
 */
export function Tag({ onDelete, deleteLabel, className, children, ...rest }: TagProps) {
  return (
    <span className={cx('krds-btn-tag', className)} {...rest}>
      {children}
      {onDelete && (
        <button type="button" className="btn-delete" onClick={onDelete}>
          <span className="sr-only">{deleteLabel ?? deleteName(children)}</span>
        </button>
      )}
    </span>
  );
}

export type TagLinkProps = ComponentPropsWithRef<'a'>;

/**
 * 링크형 태그 — 킷 `krds-btn-tag link`. **이동에만 쓴다**(동작은 `TagButton`).
 *
 * `.link` 가 하는 일은 hover/active 에서 밑줄을 켜는 것뿐이다. 색 변형이 아니다.
 */
export function TagLink({ className, children, target, title, ...rest }: TagLinkProps) {
  return (
    <a
      className={cx('krds-btn-tag', 'link', className)}
      target={target}
      // 새 창으로 열리면 미리 알린다 — KRDS 접근성 요구.
      title={title ?? (target === '_blank' ? '새 창 열림' : undefined)}
      {...rest}
    >
      {children}
    </a>
  );
}

export type TagButtonProps = ComponentPropsWithRef<'button'> & {
  /**
   * 선택 상태. 주면 `aria-pressed` 와 체크 아이콘이 붙는다.
   * 생략하면 실행 단추가 되므로 `aria-label="[레이블] 필터 옵션 추가"` 를 직접 준다.
   */
  selected?: boolean;
};

/**
 * 대화형 태그 — `<button class="krds-btn-tag">`. 필터 조건을 켜고 끄는 자리다.
 *
 * **상태를 스스로 갖지 않는다(controlled).** 필터 조건은 목록·질의와 함께 움직여야 하므로
 * 화면 쪽이 들고 `selected` 로 내려 준다. 선택 여부는 색이 아니라 체크 아이콘으로 알린다.
 *
 * @example
 * <TagButton selected={picked.has('진행')} onClick={() => toggle('진행')}>진행 중</TagButton>
 */
export function TagButton({
  selected,
  className,
  children,
  type = 'button',
  ...rest
}: TagButtonProps) {
  return (
    <button type={type} className={cx('krds-btn-tag', className)} aria-pressed={selected} {...rest}>
      {selected && <i className="svg-icon ico-checkbox size-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}
