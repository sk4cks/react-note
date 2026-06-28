import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin";
import MailLayout from "../../layout/mail/MailLayout";
import MailInbox from "../../components/mail/MailInbox";

const InboxView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [folder, setFolder] = useState(location.state?.folder ?? "inbox");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    API.mailAPI
      .listMessages(folder)
      .then((response) => {
        if (!cancelled) {
          setMessages(response.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
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
  }, [folder]);

  return (
    <MailLayout
      navigate={navigate}
      activeFolder={folder}
      onFolderChange={setFolder}
    >
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" /> 메일 불러오는 중...
        </div>
      )}
      {!loading && error === "google" && (
        <Alert variant="warning">
          Gmail 연동이 필요합니다. Google 계정으로 다시 로그인해 주세요.
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
      )}
      {!loading && error === "generic" && (
        <Alert variant="danger">메일을 불러오지 못했습니다.</Alert>
      )}
      {!loading && !error && (
        <MailInbox
          messages={messages}
          onSelect={(id) => navigate(`/mail/${id}`, { state: { folder } })}
        />
      )}
    </MailLayout>
  );
};

export default InboxView;
