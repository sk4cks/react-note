import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin";
import MailLayout from "../../layout/mail/MailLayout";
import MailDetail from "../../components/mail/MailDetail";
import NotFoundView from "../errors/NotFoundView";

const MailDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const folderFromList = location.state?.folder;
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    API.mailAPI
      .getMessage(id)
      .then((response) => {
        if (!cancelled) {
          setMessage(response.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setMessage(null);
            return;
          }
          const code = err.response?.data?.code;
          setError(code === "MAIL_GOOGLE_NOT_LINKED" ? "google" : "generic");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const activeFolder = folderFromList ?? message?.folder ?? "inbox";

  if (loading) {
    return (
      <MailLayout
        navigate={navigate}
        activeFolder={folderFromList ?? "inbox"}
        onFolderChange={() => navigate("/mail")}
      >
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" /> 메일 불러오는 중...
        </div>
      </MailLayout>
    );
  }

  if (error === "google") {
    return (
      <MailLayout
        navigate={navigate}
        activeFolder={folderFromList ?? "inbox"}
        onFolderChange={() => navigate("/mail")}
      >
        <Alert variant="warning">
          Gmail 연동이 필요합니다.
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => startSnsLogin("google")}
            >
              Google로 로그인
            </button>
          </div>
        </Alert>
      </MailLayout>
    );
  }

  if (error === "generic" || !message) {
    return error === "generic" ? (
      <MailLayout
        navigate={navigate}
        activeFolder={folderFromList ?? "inbox"}
        onFolderChange={() => navigate("/mail")}
      >
        <Alert variant="danger">메일을 불러오지 못했습니다.</Alert>
      </MailLayout>
    ) : (
      <NotFoundView />
    );
  }

  return (
    <MailLayout
      navigate={navigate}
      activeFolder={activeFolder}
      onFolderChange={(folderId) =>
        navigate("/mail", { state: { folder: folderId } })
      }
    >
      <MailDetail
        message={message}
        onBack={() =>
          navigate("/mail", {
            state: {
              folder: activeFolder,
              ...(message.unread ? {} : { readMessageId: id, refreshFolders: true }),
            },
          })
        }
        onReply={() =>
          navigate("/mail/compose", {
            state: {
              to: message.fromEmail,
              subject: message.subject.startsWith("Re:")
                ? message.subject
                : `Re: ${message.subject}`,
            },
          })
        }
      />
    </MailLayout>
  );
};

export default MailDetailView;
