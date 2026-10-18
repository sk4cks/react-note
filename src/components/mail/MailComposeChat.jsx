import { Button, Form, Spinner } from "react-bootstrap";

/** 작성 카드 옆 채팅. */
const MailComposeChat = ({
  messages = [], // user | assistant
  input = "", // 입력 중인 말
  onInput, // 입력 수정
  onSend, // 전송
  sending = false, // 답변 대기
  onApplySubject, // 말풍선을 제목으로
  onApplyBody, // 말풍선을 본문 뒤에
}) => {
  /** Enter면 전송. Shift+Enter는 줄바꿈. */
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <aside className="mail-compose-chat">

      {/* 제목 */}
      <div className="mail-compose-chat-title">작성 도우미</div>

      {/* 대화 */}
      <div className="mail-compose-chat-log">
        {messages.length === 0 && (
          <p className="mail-compose-chat-empty">
            문장을 부탁하거나, 지금 메일을 어떻게 고칠지 적어 주세요.
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key = {`${message.role}-${index}`}
            className = {`mail-compose-chat-bubble is-${message.role}`}
          >
            <p className="mb-0">{message.content}</p>
            {message.role === "assistant" && (
              <div className="mail-compose-chat-apply">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick = {() => onApplySubject(message.content)}
                >
                  제목에 넣기
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick = {() => onApplyBody(message.content)}
                >
                  본문에 넣기
                </Button>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="small text-muted">
            <Spinner animation="border" size="sm" /> 생각 중...
          </div>
        )}
      </div>

      {/* 입력 */}
      <Form
        onSubmit = {(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <Form.Control
          as="textarea"
          rows = {3}
          value = {input}
          placeholder="무엇을 쓸까요?"
          onChange = {(event) => onInput(event.target.value)}
          onKeyDown = {handleKeyDown}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="mt-2"
          disabled = {sending || !input.trim()}
        >
          보내기
        </Button>
      </Form>
    </aside>
  );
};

export default MailComposeChat;
