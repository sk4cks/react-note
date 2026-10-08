import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { formatBytes } from "@/utils/mailAttachment";
import MailHtmlBody from "./MailHtmlBody";
import MailPlainBody from "./MailPlainBody";

/** 메일 한 통(제목·본문·첨부). */
const MailDetail = ({
  loading, // 본문 조회 중
  error, // google | generic | delete | restore
  onGoogleLogin, // Gmail 미연동 때 다시 로그인
  message, // 제목·본문·첨부
  onBack, // 목록으로
  onReply, // 답장 작성
  onDelete, // 삭제
  onRestore, // 휴지통에서 복원
  deleting = false, // 삭제·복원 요청 중
  folder = "inbox", // 이 메일이 있던 편지함
  onDownloadAttachment, // 첨부 다운로드
}) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" /> 메일 불러오는 중...
      </div>
    );
  }

  if (error === "google") {
    return (
      <Alert variant="warning">
        Gmail 연동이 필요합니다.
        <div className="mt-2">
          <button type="button" className="btn btn-sm btn-primary" onClick = {onGoogleLogin}>
            Google로 로그인
          </button>
        </div>
      </Alert>
    );
  }

  if (error === "generic") {
    return <Alert variant="danger">메일을 불러오지 못했습니다.</Alert>;
  }

  if (!message) {
    return null;
  }

  const attachments = message.attachments ?? [];

  return (
    <>

      {/* 삭제·복원 실패 */}
      {error === "delete" && (
        <Alert variant="danger" className="mb-2">
          메일을 삭제하지 못했습니다.
        </Alert>
      )}
      {error === "restore" && (
        <Alert variant="danger" className="mb-2">
          메일을 되돌리지 못했습니다.
        </Alert>
      )}

      <Card>

        {/* 목록·복원·삭제·답장 */}
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Button variant="outline-secondary" size="sm" onClick = {onBack}>
            ← 목록
          </Button>
          <div className="d-flex gap-2">
            {folder === "trash" && (
              <Button
                variant="outline-secondary"
                size="sm"
                disabled = {deleting}
                onClick = {onRestore}
              >
                복원
              </Button>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              disabled = {deleting}
              onClick = {onDelete}
            >
              {folder === "trash" ? "완전히 삭제" : "삭제"}
            </Button>
            <Button variant="outline-primary" size="sm" onClick = {onReply}>
              답장
            </Button>
          </div>
        </Card.Header>

        <Card.Body>

          {/* 제목과 수신 정보 */}
          <h5 className="mb-3">{message.subject}</h5>
          <div className="mail-meta text-muted small mb-3">
            <div>
              <strong>보낸 사람:</strong> {message.from} &lt;{message.fromEmail}&gt;
            </div>
            <div>
              <strong>받는 사람:</strong> {message.to}
            </div>
            {message.cc ? (
              <div>
                <strong>참조:</strong> {message.cc}
              </div>
            ) : null}
            {message.folder === "sent" && message.bcc ? (
              <div>
                <strong>숨은 참조:</strong> {message.bcc}
              </div>
            ) : null}
            <div>
              <strong>날짜:</strong>{" "}
              {new Date(message.date).toLocaleString("ko-KR")}
            </div>
          </div>
          <hr />

          {/* 본문 */}
          {message.bodyContentType === "text/html" ? (
            <MailHtmlBody
              html = {message.body} // 원본 HTML
              className="mail-body-html" // 본문 클래스
            />
          ) : (
            <MailPlainBody
              text = {message.body} // 원문
              className="mail-body" // 본문 클래스
            />
          )}

          {/* 첨부 */}
          {attachments.length > 0 && (
            <>
              <hr />
              <div className="mail-attachment-section">
                <div className="fw-semibold small mb-2">
                  첨부파일 {attachments.length}개
                </div>
                <ul className="mail-attachment-list mb-0">
                  {attachments.map((attachment) => (
                    <li key = {attachment.id} className="mail-attachment-item">
                      <span className="mail-attachment-name">
                        {attachment.filename}
                      </span>
                      <span className="mail-attachment-size text-muted">
                        {formatBytes(attachment.size)}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick = {() => onDownloadAttachment(attachment)}
                      >
                        다운로드
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default MailDetail;
