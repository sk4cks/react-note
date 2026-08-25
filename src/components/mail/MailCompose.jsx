import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, ButtonGroup, Card, Form } from "react-bootstrap";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  MAIL_MAX_ATTACHMENTS,
  MAIL_MAX_BYTES,
  dataUrlToBase64,
  estimateBase64Bytes,
  formatBytes,
  mailPayloadBytes,
  readFileAsDataUrl,
} from "../../utils/mailAttachment";
import MailRecipientField from "./MailRecipientField";

const TOOLBAR_CONTAINER = [
  [{ header: [1, 2, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["link", "image"],
  ["clean"],
];

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

/** 본문 편집 모드 아이콘. */
const RichTextIcon = () => {
  return (
    <svg {...iconProps}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h6" />
    </svg>
  );
};

/** HTML 소스 편집 모드 아이콘. */
const SourceIcon = () => {
  return (
    <svg {...iconProps}>
      <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9.5 3l-3 10" />
    </svg>
  );
};

const DATA_URL = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g; // 본문 인라인 이미지

/**
 * 본문 이미지의 data URL은 수십만 자라 그대로 두면 소스를 읽을 수 없다.
 * 짧은 자리표시자로 접고 원본은 따로 들고 있다가 되돌린다.
 */
const collapseDataUrls = (html) => {
  const images = [];
  const collapsed = html.replace(DATA_URL, (dataUrl, mimeType, base64) => {
    const size = formatBytes(estimateBase64Bytes(base64));
    const placeholder = `data:${mimeType};base64,#img${images.length + 1}#(${size})`;
    images.push({ placeholder, dataUrl });
    return placeholder;
  });

  return { collapsed, images };
};

/** 자리표시자를 원본 data URL로 되돌린다. 사용자가 고쳐 쓴 자리표시자는 복원되지 않는다. */
const expandDataUrls = (html, images) => {
  return images.reduce(
    (acc, { placeholder, dataUrl }) => acc.split(placeholder).join(dataUrl),
    html
  );
};

/** 메일 쓰기 폼(수신자·본문·첨부). */
const MailCompose = ({
  form,
  attachments = [],
  onChange,
  onAttachmentsChange,
  onSubmit,
  onCancel,
  sending = false,
  onSuggest,
  error = null,
}) => {
  const quillRef = useRef(null); // ReactQuill
  const fileInputRef = useRef(null); // 숨긴 첨부 파일 input
  const formRef = useRef(form); // 최신 form. 이미지 넣을 때 읽음
  const attachmentsRef = useRef(attachments); // 최신 첨부. 콜백에서 읽음
  formRef.current = form;
  attachmentsRef.current = attachments;

  const [sourceMode, setSourceMode] = useState(false); // true면 HTML 소스 편집
  const [htmlDraft, setHtmlDraft] = useState(""); // 소스 창. data URL은 자리표시자
  const [showCc, setShowCc] = useState(() => (form.cc?.length ?? 0) > 0);
  const [showBcc, setShowBcc] = useState(() => (form.bcc?.length ?? 0) > 0);
  const inlineImagesRef = useRef([]); // 자리표시자 → 원본 data URL

  /** 본문 data URL을 짧게 접고 소스 편집으로 바꾼다. */
  const openSourceView = () => {
    const { collapsed, images } = collapseDataUrls(form.body ?? "");
    inlineImagesRef.current = images;
    setHtmlDraft(collapsed);
    setSourceMode(true);
  };

  /** 소스 편집 내용을 본문에 반영한다. 자리표시자는 원본 URL로 되돌린다. */
  const handleHtmlDraftChange = (value) => {
    setHtmlDraft(value);
    onChange("body", expandDataUrls(value, inlineImagesRef.current));
  };

  /** 본문+첨부가 10MB를 넘으면 막는다. */
  const ensureWithinLimit = useCallback((nextHtml, nextAttachments) => {
    if (mailPayloadBytes(nextHtml, nextAttachments) > MAIL_MAX_BYTES) {
      alert("이미지와 첨부파일을 합쳐 10MB를 넘을 수 없습니다.");
      return false;
    }
    return true;
  }, []);

  /** 이미지를 본문에 data URL로 넣는다. */
  const insertImageFile = useCallback(
    async (file) => {
      if (!file?.type?.startsWith("image/")) {
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      const extraHtml = `<img src="${dataUrl}">`;
      if (!ensureWithinLimit(`${formRef.current.body || ""}${extraHtml}`, attachmentsRef.current)) {
        return;
      }

      // 용량을 통과하면 커서 위치에 넣는다.
      const quill = quillRef.current?.getEditor?.();
      if (!quill) {
        return;
      }

      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.insertEmbed(index, "image", dataUrl, "user");
      quill.setSelection(index + 1, 0, "user");
    },
    [ensureWithinLimit]
  );

  /** 툴바 이미지 버튼 — 파일을 고르면 본문에 넣는다. */
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        await insertImageFile(file);
      }
    };
    input.click();
  }, [insertImageFile]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR_CONTAINER,
        handlers: { image: imageHandler },
      },
      // Quill 기본 uploader가 붙여넣기·드롭 이미지를 자체 삽입해 아래 paste/drop
      // 핸들러와 이중으로 들어간다. 용량 검사를 하는 우리 쪽만 남긴다.
      // (mimetypes를 비우는 방식은 Quill이 옵션을 deep merge 해서 통하지 않는다)
      uploader: { handler: () => {} },
    }),
    [imageHandler]
  );

  useEffect(() => {
    let cancelled = false;
    let root; // quill.root. cleanup에서 리스너를 뗌
    let onPaste;
    let onDrop;
    let onDragOver;
    let frames = 0; // 에디터 대기 프레임. 60이면 포기
    /** Quill이 준비되면 붙여넣기·드롭으로 이미지를 넣는다. */
    const tryAttach = () => {
      const quill = quillRef.current?.getEditor?.();
      if (!quill) {
        // 에디터가 아직 없으면 다음 프레임에 다시 본다.
        if (!cancelled && frames++ < 60) {
          requestAnimationFrame(tryAttach);
        }
        return;
      }
      root = quill.root;
      onPaste = (event) => {
        const file = [...(event.clipboardData?.files ?? [])].find((item) =>
          item.type.startsWith("image/")
        );
        if (!file) {
          return;
        }
        event.preventDefault();
        insertImageFile(file);
      };
      onDrop = (event) => {
        const file = [...(event.dataTransfer?.files ?? [])].find((item) =>
          item.type.startsWith("image/")
        );
        if (!file) {
          return;
        }
        event.preventDefault();
        insertImageFile(file);
      };
      onDragOver = (event) => {
        if ([...(event.dataTransfer?.items ?? [])].some((item) => item.type.startsWith("image/"))) {
          event.preventDefault();
        }
      };
      root.addEventListener("paste", onPaste);
      root.addEventListener("drop", onDrop);
      root.addEventListener("dragover", onDragOver);
    };
    tryAttach();

    return () => {
      cancelled = true;
      if (root && onPaste) {
        root.removeEventListener("paste", onPaste);
        root.removeEventListener("drop", onDrop);
        root.removeEventListener("dragover", onDragOver);
      }
    };
  }, [insertImageFile]);

  /** 파일 선택창에서 고른 첨부를 넣는다. */
  const handleFilesSelected = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    if (attachmentsRef.current.length + files.length > MAIL_MAX_ATTACHMENTS) {
      alert(`첨부파일은 최대 ${MAIL_MAX_ATTACHMENTS}개까지 가능합니다.`);
      return;
    }

    // 파일마다 용량을 더해가며 붙인다. 넘치면 그 파일부터 버린다.
    const next = [...attachmentsRef.current];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      const item = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        contentBase64: dataUrlToBase64(dataUrl),
        size: file.size,
      };
      const candidate = [...next, item];
      if (!ensureWithinLimit(formRef.current.body, candidate)) {
        return;
      }
      next.push(item);
    }

    onAttachmentsChange(next);
  };

  /** 첨부 칩을 뺀다. */
  const removeAttachment = (id) => {
    onAttachmentsChange(attachments.filter((item) => item.id !== id));
  };

  return (
    <>
      {error === "google" && (
        <Alert variant="warning" className="mb-3">
          Gmail 발송 권한이 없습니다. Google 계정으로 다시 로그인해 주세요.
        </Alert>
      )}
      {error && error !== "google" && (
        <Alert variant="danger" className="mb-3">
          {error === "generic" ? "메일을 보내지 못했습니다." : error}
        </Alert>
      )}
      <Card>
        <Card.Header>새 메일</Card.Header>
        <Card.Body>
        <Form onSubmit={onSubmit}>
          <MailRecipientField
            id="mailTo"
            label="받는 사람"
            values={form.to}
            onChange={(value) => onChange("to", value)}
            onSuggest={onSuggest}
            placeholder="받는 사람"
            required
            trailing={
              !showCc || !showBcc ? (
                <>
                  {!showCc && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowCc(true)}
                    >
                      참조
                    </Button>
                  )}
                  {!showBcc && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowBcc(true)}
                    >
                      숨은참조
                    </Button>
                  )}
                </>
              ) : null
            }
          />
          {showCc && (
            <MailRecipientField
              id="mailCc"
              label="참조"
              values={form.cc}
              onChange={(value) => onChange("cc", value)}
              onSuggest={onSuggest}
              placeholder="참조"
            />
          )}
          {showBcc && (
            <MailRecipientField
              id="mailBcc"
              label="숨은참조"
              values={form.bcc}
              onChange={(value) => onChange("bcc", value)}
              onSuggest={onSuggest}
              placeholder="숨은참조"
            />
          )}
          <Form.Group className="mb-3" controlId="mailSubject">
            <Form.Label>제목</Form.Label>
            <Form.Control
              type="text"
              placeholder="제목"
              value={form.subject}
              onChange={(e) => onChange("subject", e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="mailBody">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="mb-0">내용</Form.Label>
              <ButtonGroup
                size="sm"
                className="mail-compose-modes"
                aria-label="본문 편집 모드"
              >
                <Button
                  type="button"
                  variant="outline-secondary"
                  active={!sourceMode}
                  aria-pressed={!sourceMode}
                  title="편집기"
                  onClick={() => setSourceMode(false)}
                >
                  <RichTextIcon />
                  <span className="visually-hidden">편집기</span>
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  active={sourceMode}
                  aria-pressed={sourceMode}
                  title="HTML 소스"
                  onClick={openSourceView}
                >
                  <SourceIcon />
                  <span className="visually-hidden">HTML 소스</span>
                </Button>
              </ButtonGroup>
            </div>
            {/* 탭을 오갈 때 Quill이 다시 마운트되지 않도록 감추기만 한다 */}
            <div className={sourceMode ? "d-none" : undefined}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                className="mail-compose-editor"
                value={form.body}
                onChange={(html) => onChange("body", html)}
                modules={modules}
                placeholder="메일 내용"
              />
            </div>
            {sourceMode && (
              <>
                <Form.Control
                  as="textarea"
                  className="mail-compose-source"
                  value={htmlDraft}
                  onChange={(e) => handleHtmlDraftChange(e.target.value)}
                  spellCheck={false}
                  placeholder="<p>메일 내용</p>"
                />
                {inlineImagesRef.current.length > 0 && (
                  <Form.Text muted>
                    본문 이미지는 <code>#img1#</code> 같은 자리표시자로 줄여
                    보여줍니다. 이 부분을 고치면 해당 이미지는 사라집니다.
                  </Form.Text>
                )}
              </>
            )}
          </Form.Group>
          <div className="mail-compose-attachments mb-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 첨부
            </Button>
            {attachments.length > 0 && (
              <ul className="mail-attachment-list mt-2 mb-0">
                {attachments.map((item) => (
                  <li key={item.id} className="mail-attachment-item">
                    <span className="mail-attachment-name">{item.filename}</span>
                    <span className="mail-attachment-size text-muted">
                      {formatBytes(item.size)}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => removeAttachment(item.id)}
                    >
                      삭제
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled={sending}>
              {sending ? "보내는 중..." : "보내기"}
            </Button>
            <Button type="button" variant="outline-secondary" onClick={onCancel}>
              취소
            </Button>
          </div>
        </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default MailCompose;
