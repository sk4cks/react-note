import { Button, Col, ListGroup, Row } from "react-bootstrap";
import { mailFolders } from "../../temp_data/mailData";

const MailLayout = ({
  navigate,
  activeFolder,
  onFolderChange,
  children,
}) => {
  return (
    <div className="container mail-container text-start py-3">
      <Row className="g-3">
        <Col md={3}>
          <Button
            variant="primary"
            className="w-100 mb-3"
            onClick={() => navigate("/mail/compose")}
          >
            메일 쓰기
          </Button>
          <ListGroup>
            {mailFolders.map((folder) => (
              <ListGroup.Item
                key={folder.id}
                action
                active={activeFolder === folder.id}
                onClick={() => onFolderChange(folder.id)}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{folder.label}</span>
                {folder.count > 0 && (
                  <span className="badge bg-secondary rounded-pill">
                    {folder.count}
                  </span>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
          <p className="text-muted small mt-3 mb-0">Gmail API 연동</p>
        </Col>
        <Col md={9}>{children}</Col>
      </Row>
    </div>
  );
};

export default MailLayout;
