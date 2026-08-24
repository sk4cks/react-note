import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Col, ListGroup, Row } from "react-bootstrap";
import { API } from "@/api";
import { mailFolders } from "../../temp_data/mailData";

const MailLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeFolder = location.state?.folder ?? "inbox";
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
                  active={
                    location.pathname === "/mail" && activeFolder === folder.id
                  }
                  onClick={() =>
                    navigate("/mail", { state: { folder: folder.id } })
                  }
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
            <ListGroup.Item
              action
              active={location.pathname === "/mail/contacts"}
              onClick={() => navigate("/mail/contacts")}
            >
              주소록
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={9}>
          <Outlet />
        </Col>
      </Row>
    </div>
  );
};

export default MailLayout;
