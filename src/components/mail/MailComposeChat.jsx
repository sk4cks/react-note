import { useEffect, useRef } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { isImeComposing } from "@/utils/mailField";

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
  const ignoreImeUntilRef = useRef(0); // 전송 직후 IME가 되돌리는 글자 무시 시각
  const logRef = useRef(null); // 대화 스크롤 영역

  /** 새 말이 오면 맨 아래로 스크롤. */
  useEffect(() => {
    const log = logRef.current;

    if (!log) {
      return;
    }

    log.scrollTop = log.scrollHeight;
  }, [messages, sending]);

  /** Enter면 전송. 조합 중 Enter는 글자 확정만. */
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || isImeComposing(event)) {
      return;
    }

    event.preventDefault();
    ignoreImeUntilRef.current = Date.now() + 100;
    onSend();
  };

  /** 전송 직후 IME가 되돌린 마지막 글자 무시. */
  const handleChange = (event) => {
    if (Date.now() < ignoreImeUntilRef.current) {
      onInput("");
      return;
    }

    onInput(event.target.value);
  };

  return (
    <aside className="mail-compose-chat">
      <div className="mail-compose-chat-inner">

      {/* 제목 */}
      <div className="mail-compose-chat-title">작성 도우미</div>

      {/* 대화 */}
      <div className="mail-compose-chat-log" ref = {logRef}>
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
            {message.role === "assistant" && (message.subject || message.body) && (
              <div className="mail-compose-chat-apply">
                {message.subject && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick = {() => onApplySubject(message.subject)}
                  >
                    제목에 넣기
                  </Button>
                )}
                {message.body && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick = {() => onApplyBody(message.body, Boolean(message.subject))}
                  >
                    본문에 넣기
                  </Button>
                )}
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
        className="mail-compose-chat-form"
        onSubmit = {(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <Form.Control
          as="textarea"
          rows = {3}
          className="mail-compose-chat-input"
          value = {input}
          placeholder="무엇을 쓸까요?"
          onChange = {handleChange}
          onKeyDown = {handleKeyDown}
        />
        <button
          type="submit"
          className="mail-compose-chat-send"
          aria-label="보내기"
          disabled = {sending || !input.trim()}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V6M6.5 11.5 12 6l5.5 5.5"
            />
          </svg>
        </button>
      </Form>
      </div>
    </aside>
  );
};

export default MailComposeChat;
