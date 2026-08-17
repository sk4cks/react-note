import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin";
import MailDetail from "../../components/mail/MailDetail";
import NotFoundView from "../errors/NotFoundView";

const MailDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  /** IMAP UID는 폴더별로 달라 목록에서 넘어온 폴더로 조회해야 한다. */
  const activeFolder = location.state?.folder ?? "inbox";
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    API.mailAPI
      .getMessage(id, activeFolder)
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
  }, [id, activeFolder]);

  const handleDownloadAttachment = async (attachment) => {
    const response = await API.mailAPI.downloadAttachment(
      id,
      attachment.id,
      activeFolder
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

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
    );
  }

  if (error === "generic") {
    return <Alert variant="danger">메일을 불러오지 못했습니다.</Alert>;
  }

  if (!message) {
    return <NotFoundView />;
  }

  return (
    <MailDetail
      message={message}
      onDownloadAttachment={handleDownloadAttachment}
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
  );
};

export default MailDetailView;
