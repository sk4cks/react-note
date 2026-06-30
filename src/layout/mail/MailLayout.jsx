import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Col, ListGroup, Row } from "react-bootstrap";
import { API } from "@/api";
import { mailFolders } from "../../temp_data/mailData";

const MailLayout = ({
  navigate,
  activeFolder,
  onFolderChange,
  children,
}) => {
  const location = useLocation();
  const [folderCounts, setFolderCounts] = useState({});

  useEffect(() => {
    let cancelled = false;

    API.mailAPI
      .getFolders()
      .then((response) => {
        if (cancelled) {
          return;
        }
        const counts = Object.fromEntries(
          response.data.map((folder) => [folder.id, folder.count])
        );
        setFolderCounts(counts);
      })
      .catch(() => {
        if (!cancelled) {
          setFolderCounts({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, activeFolder, location.state?.readMessageId, location.key]);

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
            {mailFolders.map((folder) => {
              const count = folderCounts[folder.id] ?? 0;
              const showBadge = folder.id !== "sent" && count > 0;

              return (
                <ListGroup.Item
                  key={folder.id}
                  action
                  active={activeFolder === folder.id}
                  onClick={() => onFolderChange(folder.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{folder.label}</span>
                  {showBadge && (
                    <span
                      className={`badge rounded-pill ${
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
          </ListGroup>
          <p className="text-muted small mt-3 mb-0">Gmail API 연동</p>
        </Col>
        <Col md={9}>{children}</Col>
      </Row>
    </div>
  );
};

export default MailLayout;
