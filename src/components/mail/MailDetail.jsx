import { Button, Card } from "react-bootstrap";
import MailHtmlBody from "./MailHtmlBody";
import MailPlainBody from "./MailPlainBody";

const MailDetail = ({ message, onBack, onReply }) => {
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
      </Card.Body>
    </Card>
  );
};

export default MailDetail;
