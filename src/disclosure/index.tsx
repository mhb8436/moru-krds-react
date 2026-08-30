'use client';

import { useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../lib/krds';

/**
 * 디스클로저(더 보기/접기) — KRDS `krds-disclosure`.
 *
 * 한 덩이의 **부가** 안내를 접었다 편다. 기본은 접힌 상태이고 한 섹션에 하나만 둔다.
 * 여러 덩이를 목록으로 접었다 펴려면 `Accordion`, 내용을 갈아 끼우려면 `Tab` 이다.
 * 오류 문구·중요한 정보·입력칸은 넣지 마라 — 접힌 안쪽은 보이지 않은 채 제출된다.
 * 꺾쇠 아이콘은 킷이 그리므로 `<i class="svg-icon">` 를 따로 넣지 않는다.
 *
 * @example
 * <Disclosure label="신청 서비스안내">
 *   <TextList marker="dash">
 *     <TextListItem>하나의 아이디로 여러 전자정부 서비스를 이용할 수 있습니다.</TextListItem>
 *   </TextList>
 * </Disclosure>
 *
 * 자세히: docs/krds/09-부품-노트.md#상세보기
 */

export type DisclosureProps = ComponentPropsWithRef<'div'> & {
  /** 버튼에 보이는 글. 펼칠 내용을 유추할 수 있는 제목이어야 한다. */
  label: ReactNode;
  /** 처음부터 펼쳐 둘까. 기본 false 가 규격이다 — 되도록 바꾸지 마라. */
  defaultOpen?: boolean;
  /** 바깥에서 여닫기를 쥘 때. 주면 통제 모드가 되고 내부 상태는 쓰지 않는다. */
  open?: boolean;
  /** 사용자가 버튼을 눌러 상태가 바뀔 때. 통제 모드에서는 이걸 받아 직접 `open` 을 옮긴다. */
  onOpenChange?: (open: boolean) => void;
  /** 버튼(`btn-conts-expand`)에 덧붙일 클래스. */
  buttonClassName?: string;
  /** 안쪽 내용 상자(`expand-in`)에 덧붙일 클래스. */
  contentClassName?: string;
  children?: ReactNode;
};

export function Disclosure({
  label,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  buttonClassName,
  contentClassName,
  className,
  children,
  ...rest
}: DisclosureProps) {
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  // 통제/비통제 겸용. `open` 을 준 쪽이 이긴다.
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : selfOpen;

  // 킷 JS 는 `disclosure-<난수>` 를 만들어 붙인다. React 는 useId 로 서버·클라이언트가 같은 값을 낸다.
  const reactId = useId();
  const contentId = `disclosure-${reactId}`;

  function toggle() {
    const next = !open;
    if (!controlled) setSelfOpen(next);
    onOpenChange?.(next);
  }

  return (
    // `conts-expand-area` 는 킷 CSS 에 규칙이 없지만 마크업 샘플과 맞추려고 남긴다.
    <div
      className={cx('krds-disclosure', 'conts-expand-area', open && 'active', className)}
      {...rest}
    >
      <button
        type="button"
        className={cx('btn-conts-expand', buttonClassName)}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={toggle}
      >
        {label}
      </button>
      {/* 접힌 동안 `inert` — 킷 JS 와 같다. 초점·클릭·보조기술을 한 번에 막는다. */}
      <div className="expand-wrap" id={contentId} inert={!open}>
        <div className={cx('expand-in', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
