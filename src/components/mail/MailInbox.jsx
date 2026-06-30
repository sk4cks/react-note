import { ListGroup, Spinner } from "react-bootstrap";
import { formatMailDate } from "../../temp_data/mailData";

const MailInbox = ({ messages = [], onSelect, loadMoreRef, hasMore, loadingMore }) => {
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
