/** 메일 상세. 메일 목록 > 메일 클릭. */
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  const [error, setError] = useState(null); // google | generic | null

  useEffect(() => {
    let cancelled = false; // 메일을 바꾸면 이전 응답은 버린다.
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
          // Gmail 미연동은 재로그인 안내, 그 외는 일반 오류.
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

  /** 첨부 파일을 내려받는다. */
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

  if (!loading && !error && !message) {
    return <NotFoundView />;
  }

  return (
    <MailDetail
      loading={loading}
      error={error}
      onGoogleLogin={() => startSnsLogin("google")}
      message={message}
      onDownloadAttachment={handleDownloadAttachment}
      onBack={() =>
        navigate("/mail", {
          state: {
            folder: activeFolder,
            ...(message?.unread ? {} : { readMessageId: id, refreshFolders: true }),
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
