/** 메일 왼쪽 편지함·주소록 + 오른쪽 내용. */
import { Outlet } from "react-router-dom";
import { Button, Col, ListGroup, Row } from "react-bootstrap";

const MailLayout = ({
  folders, // 받은·보낸·임시·휴지통
  folderCounts, // 폴더 id별 뱃지 건수
  activeFolder, // 지금 선택된 편지함
  pathname, // 주소록 화면인지 구분
  onCompose, // 메일 쓰기
  onSelectFolder, // 편지함 이동
  onContacts, // 주소록 이동
}) => {
  return (
    <div className="container mail-container text-start py-3">
      <Row className="g-3">

        {/* 왼쪽 편지함 */}
        <Col md = {3}>
          <Button variant="primary" className="w-100 mb-3" onClick = {onCompose}>
            메일 쓰기
          </Button>
          <ListGroup>
            {folders.map((folder) => {
              const count = folderCounts[folder.id] ?? 0;
              const showBadge = folder.id !== "sent" && count > 0;

              return (
                <ListGroup.Item
                  key = {folder.id}
                  action
                  active = {pathname === "/mail" && activeFolder === folder.id}
                  onClick = {() => onSelectFolder(folder.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{folder.label}</span>
                  {showBadge && (
                    <span
                      className = {`badge rounded-pill ${
                        activeFolder === folder.id
                          ? "bg-light text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </ListGroup.Item>
              );
            })}
            <ListGroup.Item
              action
              active = {pathname === "/mail/contacts"}
              onClick = {onContacts}
            >
              주소록
            </ListGroup.Item>
          </ListGroup>
        </Col>

        {/* 오른쪽 내용 */}
        <Col md = {9}>
          <Outlet />
        </Col>
      </Row>
    </div>
  );
};

export default MailLayout;
