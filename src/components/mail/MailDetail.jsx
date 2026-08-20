import { Button, Card } from "react-bootstrap";
import { formatBytes } from "@/utils/mailAttachment";
import MailHtmlBody from "./MailHtmlBody";
import MailPlainBody from "./MailPlainBody";

const MailDetail = ({ message, onBack, onReply, onDownloadAttachment }) => {
  const attachments = message.attachments ?? [];

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <Button variant="outline-secondary" size="sm" onClick={onBack}>
          ← 목록
        </Button>
        <Button variant="outline-primary" size="sm" onClick={onReply}>
          답장
        </Button>
      </Card.Header>
      <Card.Body>
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
        {message.bodyContentType === "text/html" ? (
          <MailHtmlBody html={message.body} className="mail-body-html" />
        ) : (
          <MailPlainBody text={message.body} className="mail-body" />
        )}
        {attachments.length > 0 && (
          <>
            <hr />
            <div className="mail-attachment-section">
              <div className="fw-semibold small mb-2">
                첨부파일 {attachments.length}개
              </div>
              <ul className="mail-attachment-list mb-0">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="mail-attachment-item">
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
                      onClick={() => onDownloadAttachment(attachment)}
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
  );
};

export default MailDetail;
