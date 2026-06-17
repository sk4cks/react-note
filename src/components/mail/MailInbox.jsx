import { ListGroup } from "react-bootstrap";
import { formatMailDate } from "../../temp_data/mailData";

const MailInbox = ({ messages, onSelect }) => {
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
          className={`mail-list-item ${msg.unread ? "mail-unread" : ""}`}
        >
          <div className="d-flex justify-content-between gap-2">
            <strong className="mail-from text-truncate">{msg.from}</strong>
            <small className="text-muted flex-shrink-0">
              {formatMailDate(msg.date)}
            </small>
          </div>
          <div className="mail-subject text-truncate">{msg.subject}</div>
          <div className="mail-preview text-muted text-truncate small">
            {msg.preview}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default MailInbox;
