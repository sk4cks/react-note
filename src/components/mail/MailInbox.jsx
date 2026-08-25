/** 메일 목록. 아래로 내리면 더 불러온다. */
import { Alert, ListGroup, Spinner } from "react-bootstrap";
import { formatMailDate } from "../../temp_data/mailData";

const MailInbox = ({
  loading,
  error,
  onGoogleLogin,
  messages = [],
  onSelect,
  loadMoreRef,
  hasMore,
  loadingMore,
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
        Gmail 연동이 필요합니다. Google 계정으로 다시 로그인해 주세요.
        <div className="mt-2">
          <button type="button" className="btn btn-sm btn-primary" onClick={onGoogleLogin}>
            Google로 로그인
          </button>
        </div>
      </Alert>
    );
  }

  if (error === "generic") {
    return <Alert variant="danger">메일을 불러오지 못했습니다.</Alert>;
  }

  if (messages.length === 0) {
    return <p className="text-muted text-center py-5">메일이 없습니다.</p>;
  }

  return (
    <ListGroup>
      {messages.map((msg) => (
        <ListGroup.Item
          key={msg.id}
          action
          onClick={() => onSelect(msg.id)}
          className={`mail-list-item ${msg.unread ? "mail-unread" : "mail-read"}`}
        >
          <div className="d-flex justify-content-between gap-2">
            <span className="mail-from text-truncate">{msg.from}</span>
            <small className="mail-date text-muted flex-shrink-0">
              {formatMailDate(msg.date)}
            </small>
          </div>
          <div className="mail-subject text-truncate">{msg.subject}</div>
          <div className="mail-preview text-muted text-truncate small">
            {msg.preview}
          </div>
        </ListGroup.Item>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="mail-load-more text-center py-3">
          {loadingMore && <Spinner animation="border" size="sm" />}
        </div>
      )}
    </ListGroup>
  );
};

export default MailInbox;
