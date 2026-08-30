'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEventHandler,
  type ComponentPropsWithRef,
  type DragEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx, type KrdsSize } from '../lib/krds';

/**
 * 파일 업로드 — KRDS `krds-file-upload`.
 *
 * 바깥틀(`FileUpload`) · 드롭 영역(`FileDropzone`) · 목록(`FileList` + `FileItem`)으로 나뉜다.
 * 드래그 앤 드롭은 **반드시 파일 선택 버튼과 함께** 제공한다(`FileDropzone` 이 둘을 늘 같이 그린다).
 * 유형·크기·개수 검사는 `onFiles` 에서 직접 한다 — 드롭으로 들어온 파일은 `accept` 로 걸러지지 않는다.
 * 파일 이름 표기는 {@link formatFileLabel} 이 정한 `이름 [유형, 크기]` 한 가지다.
 * 글 보기 화면의 정적 첨부 목록에는 `FileItem` 만 써도 된다.
 *
 * @example
 * <FileUpload bordered title="첨부파일" description="hwp·pdf, 10MB 이하, 5개까지" descriptionId="up-desc">
 *   <FileDropzone multiple accept=".hwp,.pdf" describedBy="up-desc" onFiles={add} clearAfterSelect />
 *   <FileList count={files.length} max={5} onDeleteAll={clear}>
 *     {files.map((f) => (
 *       <FileItem key={f.id} name={f.name} size={f.size} onDelete={() => remove(f.id)} />
 *     ))}
 *   </FileList>
 * </FileUpload>
 *
 * 자세히: docs/krds/09-부품-노트.md#파일첨부
 */

/* ────────────────────────────── 표기 도우미 ────────────────────────────── */

/** 넘겨받은 ref 에 노드를 꽂는다. 컴포넌트 본문에서 prop 을 직접 대입하면 컴파일러 규칙에 걸려 밖에 둔다. */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** `useId()` 는 `«r0»` 처럼 특수문자를 담는다 — id 조각으로 쓸 수 있게 깎는다. */
function idBase(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'file';
}

/** 이름 끝의 확장자를 뽑는다. 없으면 `undefined`. `.gitignore` 처럼 앞에 이름이 없으면 확장자로 보지 않는다. */
function extensionOf(name: string): string | undefined {
  const m = /.\.([A-Za-z0-9]{1,10})$/.exec(name);
  return m ? m[1].toLowerCase() : undefined;
}

/**
 * 파일 크기 표기 — `17KB` · `1.2MB` 꼴(공백 없음). 1KB 미만도 `1KB` 로 올린다.
 *
 * @example
 * formatFileSize(17408) // '17KB'
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

/**
 * KRDS 파일 표기 — `이름 [유형, 크기]`. `type` 을 생략하면 이름 끝의 확장자에서 뽑아 이름에서 뗀다.
 *
 * @example
 * formatFileLabel({ name: '위임장.hwp', size: 17408 }) // '위임장 [hwp, 17KB]'
 */
export function formatFileLabel(file: { name: string; type?: string; size?: number }): string {
  const { name, type, size } = file;
  const auto = type ? undefined : extensionOf(name);
  const shown = auto ? name.slice(0, name.length - auto.length - 1) : name;
  const meta = [type ?? auto, typeof size === 'number' ? formatFileSize(size) : ''].filter(Boolean);
  return meta.length > 0 ? `${shown} [${meta.join(', ')}]` : shown;
}

/* ────────────────────────────── 바깥 틀 ────────────────────────────── */

export type FileUploadProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** 테두리형. 다른 폼과 구분해 한 덩어리로 보일 때. */
  bordered?: boolean;
  /** 제목. */
  title?: ReactNode;
  /** 제목 태그. 기본 `h3` — 화면의 제목 위계에 맞춘다. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** 제목 아래 설명. **파일 유형·크기·개수 제한을 여기에 적는다**(가이드 요구). */
  description?: ReactNode;
  /** 설명 영역의 `id`. {@link FileDropzone} 의 `describedBy` 와 짝을 맞춘다. */
  descriptionId?: string;
};

export function FileUpload({
  bordered,
  title,
  titleAs: Tit = 'h3',
  description,
  descriptionId,
  className,
  children,
  ...rest
}: FileUploadProps) {
  return (
    <div className={cx('krds-file-upload', bordered && 'line', className)} {...rest}>
      {(title || description) && (
        <div className="file-head">
          {title && <Tit className="tit">{title}</Tit>}
          {description && (
            <div id={descriptionId}>
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ────────────────────────── 드롭 영역 + 파일 선택 ────────────────────────── */

export type FileDropzoneProps = Omit<
  ComponentPropsWithRef<'div'>,
  'onChange' | 'onDrop' | 'onDragEnter' | 'onDragLeave' | 'onDragOver'
> & {
  /** `<input type="file">` 의 id. 생략하면 `useId` 로 만든다. */
  id?: string;
  /** 폼 전송에 쓸 이름. */
  name?: string;
  /** 파일 선택창의 필터. **드롭으로 들어온 파일은 이걸로 걸러지지 않는다.** */
  accept?: string;
  /** 여러 개를 고를 수 있다. */
  multiple?: boolean;
  /** 비활성. 드롭도 받지 않는다. */
  disabled?: boolean;
  /** 필수 입력. */
  required?: boolean;
  /** 파일칸을 직접 다뤄야 할 때(값 비우기 등). */
  inputRef?: Ref<HTMLInputElement>;
  /** 파일칸에 걸 `aria-describedby`. {@link FileUpload} 의 `descriptionId` 와 짝이다. */
  describedBy?: string;
  /** 드롭 영역 안내 문구. 기본값은 킷 샘플 문구 그대로. */
  text?: ReactNode;
  /** 파일 선택 버튼 글자. */
  buttonLabel?: ReactNode;
  /** 기본 medium(48px). 같은 줄의 폼 요소와 같은 값을 준다. */
  buttonSize?: KrdsSize;
  /** 파일 선택 버튼의 위계. `primary` 는 제출 버튼과 강조가 충돌해 두지 않았다. */
  buttonVariant?: 'secondary' | 'tertiary' | 'text';
  /** 선택·드롭 공통 진입점. `multiple` 이 아니면 첫 파일 하나만 넘긴다. */
  onFiles?: (files: File[]) => void;
  /** 원래의 `change` 도 필요하면 받는다. `onFiles` 보다 먼저 불린다. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** 넘긴 뒤 파일칸을 비워 같은 파일 재선택을 살린다. **폼 제출로 파일을 보낸다면 켜지 마라.** */
  clearAfterSelect?: boolean;
};

export function FileDropzone({
  id,
  name,
  accept,
  multiple,
  disabled,
  required,
  inputRef,
  describedBy,
  text = '첨부할 파일을 여기에 끌어다 놓거나, 파일 선택 버튼을 눌러 파일을 직접 선택해주세요.',
  buttonLabel = '파일선택',
  buttonSize = 'medium',
  buttonVariant,
  onFiles,
  onChange,
  clearAfterSelect,
  className,
  children,
  ...rest
}: FileDropzoneProps) {
  const uid = idBase(useId());
  const inputId = id ?? `file-upload-${uid}`;
  const textId = `file-upload-txt-${uid}`;
  const input = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave 는 자식 요소를 지날 때마다 다시 뜬다. 깊이를 세어야 테두리가 깜빡이지 않는다.
  const depth = useRef(0);

  const setInput = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      assignRef(inputRef, node);
    },
    [inputRef],
  );

  const emit = (list: FileList | null | undefined) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    onFiles?.(multiple ? files : files.slice(0, 1));
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange?.(e);
    emit(e.currentTarget.files);
    if (clearAfterSelect) e.currentTarget.value = '';
  };

  const enter = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const over = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    // 이 preventDefault 를 빼면 브라우저가 기본 동작(파일 열기)을 해 버려 drop 이 아예 오지 않는다.
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };
  const leave = () => {
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const drop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    emit(e.dataTransfer?.files);
  };

  return (
    <div
      className={cx('file-upload', dragging && 'active', className)}
      {...rest}
      onDragEnter={enter}
      onDragOver={over}
      onDragLeave={leave}
      onDrop={drop}
    >
      <p className="txt" id={textId}>
        {text}
      </p>
      <div className="file-upload-btn-wrap">
        {/* hidden 을 붙이지 않는다 — 킷 CSS 가 이미 감추고, hidden 은 초점까지 막아 제출이 조용히 멈춘다. */}
        <input
          type="file"
          id={inputId}
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-describedby={cx(textId, describedBy)}
          ref={setInput}
          onChange={handleChange}
        />
        <label htmlFor={inputId}>
          <button
            type="button"
            className={cx('krds-btn', buttonSize, buttonVariant)}
            disabled={disabled}
            // `<label>` 안의 `<button>` 은 라벨 활성화를 일으키지 못해 직접 부른다.
            onClick={() => input.current?.click()}
          >
            <i className="svg-icon ico-upload" aria-hidden="true" />
            {buttonLabel}
          </button>
        </label>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────── 파일 목록 ────────────────────────────── */

type FileListBaseProps = ComponentPropsWithRef<'ul'> & {
  /** 올릴 수 있는 최대 파일 수. */
  max?: number;
  /** 세는 단위. 기본 `개`. */
  unit?: string;
  /** 전체 삭제 버튼 글자. */
  deleteAllLabel?: ReactNode;
  /** `.file-list` 에 붙일 클래스. `className` 은 `<ul class="upload-list">` 로 간다. */
  wrapClassName?: string;
};

/** 카운터를 그리는 두 방법. `count`(부품이 `3개 / 10개` 를 그린다) 또는 `counter`(직접 그린다). */
type FileListCounterProps =
  | { count: number; counter?: ReactNode }
  // `counter={null}` 로 빠져나가지 못하게 null·undefined 를 뺀다 — 그러면 `.total` 이 안 그려진다.
  | { count?: number; counter: NonNullable<ReactNode> };

/**
 * **전체 삭제 버튼은 카운터 없이 둘 수 없다** — 킷이 그 버튼을 절대 배치해서 카운터가 없으면
 * 목록 첫 항목 위에 겹친다. 타입으로 막아 둔다.
 */
export type FileListProps = FileListBaseProps &
  (
    | ({
        /** 전체 삭제. 카운터(`count` 또는 `counter`)가 함께 필요하다. 조건부로 `undefined` 도 받는다. */
        onDeleteAll: (() => void) | undefined;
      } & FileListCounterProps)
    | {
        onDeleteAll?: never;
        /** 올라간 파일 수. `max` 와 함께 주면 `3개 / 10개` 카운터를 그린다. */
        count?: number;
        /** 카운터를 직접 그릴 때. 주면 `count`·`max` 는 무시한다. */
        counter?: ReactNode;
      }
  );

/** 유니온은 판별자가 없어 그대로 구조 분해가 안 된다 — 넓은 쪽으로 한 번 받아 쓴다. */
type FileListAllProps = FileListBaseProps & {
  count?: number;
  counter?: ReactNode;
  onDeleteAll?: () => void;
};

export function FileList(props: FileListProps) {
  const {
    count,
    max,
    unit = '개',
    counter,
    onDeleteAll,
    deleteAllLabel = '전체 파일 삭제',
    wrapClassName,
    className,
    children,
    ...rest
  }: FileListAllProps = props;
  const total =
    counter ??
    (typeof count === 'number' ? (
      <>
        <span className="current">
          {count}
          {unit}
        </span>
        {typeof max === 'number' && ` / ${max}${unit}`}
      </>
    ) : null);

  return (
    <div className={cx('file-list', wrapClassName)}>
      {total && <div className="total">{total}</div>}
      <ul className={cx('upload-list', className)} {...rest}>
        {children}
      </ul>
      {onDeleteAll && (
        <div className="upload-delete-btn">
          <button type="button" className="krds-btn xsmall tertiary" onClick={onDeleteAll}>
            {deleteAllLabel}
            <i className="svg-icon ico-angle right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── 파일 항목 ────────────────────────────── */

/** 업로드 상태 아이콘. `uploading` 스피너 · `complete` 완료 표시. */
export type FileItemStatus = 'uploading' | 'complete';

type FileItemBaseProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
  /** 파일 이름. `type` 을 안 주면 여기서 확장자를 뽑아 이름에서 뗀다({@link formatFileLabel}). */
  name: string;
  /** 파일 유형. 예: `hwp`. */
  type?: string;
  /** 바이트 수. `328KB` 꼴로 바꿔 이름 옆 대괄호에 넣는다. */
  size?: number;
  /** 삭제 단추를 그린다. */
  onDelete?: () => void;
  /** 삭제 단추 글자. */
  deleteLabel?: ReactNode;
  /** 내려받기 주소. 「다운로드」와 「바로보기」는 규격상 따로 둔다. */
  downloadHref?: string;
  /** 내려받기 단추 글자. */
  downloadLabel?: ReactNode;
  /** 바로보기(미리보기) 주소. */
  viewHref?: string;
  /** 바로보기 단추 글자. */
  viewLabel?: ReactNode;
  /** 항목 버튼 크기. 킷 샘플은 medium. */
  actionSize?: KrdsSize;
  /** 좁은 화면에서 이름과 버튼을 위아래로 놓는다. 버튼이 둘 이상일 때 쓴다. */
  stackOnMobile?: boolean;
  /** 버튼 영역을 통째로 대신 그린다. */
  children?: ReactNode;
};

/** 업로드 상태와 오류는 배타다 — 등록되지 않은 파일에 스피너·완료 아이콘이 같이 뜨면 안 된다. */
export type FileItemProps = FileItemBaseProps &
  (
    | {
        /** 업로드 진행 표시. 완료 아이콘은 잠시 뒤 삭제 버튼으로 바꾼다. */
        status?: FileItemStatus;
        error?: never;
      }
    | {
        status?: never;
        /** 오류 문구. 「형식이 올바르지 않습니다」처럼 **무엇이 틀렸는지** 밝힌다(가이드 요구). */
        error: ReactNode;
      }
  );

/** 유니온은 그대로 구조 분해가 안 된다 — 넓은 쪽으로 한 번 받아 쓴다. */
type FileItemAllProps = FileItemBaseProps & {
  status?: FileItemStatus;
  error?: ReactNode;
};

export function FileItem(props: FileItemProps) {
  const {
    name,
    type,
    size,
    status,
    error,
    onDelete,
    deleteLabel = '삭제',
    downloadHref,
    downloadLabel = '다운로드',
    viewHref,
    viewLabel = '바로보기',
    actionSize = 'medium',
    stackOnMobile,
    className,
    children,
    ...rest
  }: FileItemAllProps = props;
  const uid = idBase(useId());
  const nameId = `file-name-${uid}`;
  const btn = cx('krds-btn', actionSize, 'text');
  const hasDefaultAction = Boolean(status || downloadHref || viewHref || onDelete);

  // 이름과 버튼을 `aria-describedby` 로 잇는다(가이드 요구) — 어느 파일의 버튼인지 읽어 준다.
  const actions = children ?? (hasDefaultAction ? (
    <>
      {status === 'uploading' && (
        <span className="krds-spinner" role="status">
          <span className="sr-only">업로드 중</span>
        </span>
      )}
      {status === 'complete' && (
        <span className="ico-invalid complete">
          <em className="sr-only">업로드 완료</em>
        </span>
      )}
      {downloadHref && (
        <a className={btn} href={downloadHref} download aria-describedby={nameId}>
          {downloadLabel}
          <i className="svg-icon ico-down" aria-hidden="true" />
        </a>
      )}
      {viewHref && (
        <a className={btn} href={viewHref} aria-describedby={nameId}>
          {viewLabel}
          <i className="svg-icon ico-angle right" aria-hidden="true" />
        </a>
      )}
      {onDelete && (
        <button type="button" className={btn} onClick={onDelete} aria-describedby={nameId}>
          {deleteLabel}
          <i className="svg-icon ico-delete-fill" aria-hidden="true" />
        </button>
      )}
    </>
  ) : null);

  return (
    <li className={cx(error ? 'is-error' : undefined, className)} {...rest}>
      <div className={cx('file-info', stackOnMobile && 'm-column')}>
        <div className="file-name" id={nameId}>
          {formatFileLabel({ name, type, size })}
        </div>
        {actions ? <div className="btn-wrap">{actions}</div> : null}
      </div>
      {error ? <p className="file-hint-invalid">{error}</p> : null}
    </li>
  );
}
