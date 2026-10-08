/** 아래로 내리면 이어 불러오는 메일 목록. */
import { Alert, Button, Form, ListGroup, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { formatMailDate } from "../../temp_data/mailData";

/** 휴지통에서 편지함으로 되돌리는 목록 줄 복원 아이콘. */
const RestoreIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19 3H4.99C3.88 3 3 3.9 3 5v14c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10zm-3-5h-2V7h-4v3H8l4 4 4-4z"
      />
    </svg>
  );
};

/** 목록 줄 삭제 아이콘. Gmail 휴지통과 같은 윤곽. */
const TrashIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
      />
    </svg>
  );
};

const MailInbox = ({
  loading, // 첫 페이지 조회 중
  error, // google | generic | delete | restore
  onGoogleLogin, // Gmail 미연동 때 다시 로그인
  folder = "inbox", // 지금 보는 편지함
  messages = [], // 화면에 그릴 메일
  selectedIds = [], // 체크된 메일 id
  onToggle, // 한 통 체크
  onToggleAll, // 보이는 메일 전체 체크
  onDeleteOne, // 한 통 삭제
  onDeleteSelected, // 체크한 메일 삭제
  onRestoreOne, // 한 통 복원
  onRestoreSelected, // 체크한 메일 복원
  deleting = false, // 삭제·복원 요청 중
  onSelect, // 한 통을 열어 상세·초안 이동
  loadMoreRef, // 목록 맨 아래. 보이면 다음 페이지
  hasMore, // 다음 페이지 있음
  loadingMore, // 다음 페이지 조회 중
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

  if (messages.length === 0) {
    return <p className="text-muted text-center py-5">메일이 없습니다.</p>;
  }

  const allSelected = selectedIds.length > 0 && selectedIds.length === messages.length;

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

      {/* 선택 막대 */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <Form.Check
          className="mail-select-check"
          checked = {allSelected}
          onChange = {onToggleAll}
          aria-label="전체 선택"
          label = {selectedIds.length > 0 ? `${selectedIds.length}개 선택` : "전체 선택"}
        />
        {selectedIds.length > 0 && folder === "trash" && (
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            disabled = {deleting}
            onClick = {onRestoreSelected}
          >
            선택 복원
          </Button>
        )}
        {selectedIds.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline-danger"
            disabled = {deleting}
            onClick = {onDeleteSelected}
          >
            {folder === "trash" ? "선택 완전 삭제" : "선택 삭제"}
          </Button>
        )}
      </div>

      {/* 메일 줄 */}
      <ListGroup>
        {messages.map((msg) => (
          <ListGroup.Item
            key = {msg.id}
            action
            onClick = {() => onSelect(msg.id)}
            className = {`mail-list-item ${msg.unread ? "mail-unread" : "mail-read"}`}
          >
            <div className="d-flex align-items-start gap-2">
              <Form.Check
                className="mail-select-check mt-1"
                checked = {selectedIds.includes(msg.id)}
                aria-label="메일 선택"
                onClick = {(event) => event.stopPropagation()}
                onChange = {() => onToggle(msg.id)}
              />
              <div className="mail-list-main flex-grow-1">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <span className="mail-from text-truncate">
                    {folder === "sent" || folder === "draft"
                      ? (msg.to?.trim() || "받는 사람 없음")
                      : msg.from}
                  </span>
                  <div className="mail-list-aside">
                    <small className="mail-date text-muted">
                      {formatMailDate(msg.date)}
                    </small>
                    {folder === "trash" && (
                      <OverlayTrigger
                        placement="left"
                        container = {document.body}
                        popperConfig = {{ strategy: "fixed" }}
                        delay = {{ show: 200, hide: 0 }}
                        overlay = {<Tooltip>원래 편지함으로 복원</Tooltip>}
                      >
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="mail-row-restore"
                          aria-label="원래 편지함으로 복원"
                          disabled = {deleting}
                          onClick = {(event) => {
                            event.stopPropagation();
                            onRestoreOne(msg.id);
                          }}
                        >
                          <RestoreIcon />
                        </Button>
                      </OverlayTrigger>
                    )}
                    <OverlayTrigger
                      placement="left"
                      container = {document.body}
                      popperConfig = {{ strategy: "fixed" }}
                      delay = {{ show: 200, hide: 0 }}
                      overlay = {<Tooltip>{folder === "trash" ? "완전히 삭제" : "삭제"}</Tooltip>}
                    >
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mail-row-delete"
                        aria-label = {folder === "trash" ? "완전히 삭제" : "삭제"}
                        disabled = {deleting}
                        onClick = {(event) => {
                          event.stopPropagation();
                          onDeleteOne(msg.id);
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </div>
                <div className="mail-subject text-truncate">{msg.subject}</div>
                <div className="mail-preview text-muted text-truncate small">
                  {msg.preview}
                </div>
              </div>
            </div>
          </ListGroup.Item>
        ))}
        {hasMore && (
          <div ref = {loadMoreRef} className="mail-load-more text-center py-3">
            {loadingMore && <Spinner animation="border" size="sm" />}
          </div>
        )}
      </ListGroup>
    </>
  );
};

export default MailInbox;
