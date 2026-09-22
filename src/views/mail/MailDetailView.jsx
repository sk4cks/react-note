/** 메일 상세. 메일 목록 > 메일 클릭. */
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
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
  const [error, setError] = useState(null); // google | generic | delete | null
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (activeFolder === "draft") {
      return;
    }
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

    // blob URL을 만들어 <a download>로 저장한다.
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** 휴지통이 아니면 휴지통으로, 휴지통이면 완전히 지운다. */
  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    if (
      activeFolder === "trash" &&
      !window.confirm("휴지통에서 완전히 삭제할까요? 되돌릴 수 없습니다.")
    ) {
      return;
    }

    setDeleting(true);

    try {
      await API.mailAPI.deleteMessages(activeFolder, [id]);
      navigate("/mail", {
        state: { folder: activeFolder, refreshFolders: Date.now() },
      });

    } catch {
      setError("delete");
      setDeleting(false);
    }
  };

  /** 휴지통 메일을 원래 편지함으로 되돌린다. */
  const handleRestore = async () => {
    if (deleting) {
      return;
    }

    setDeleting(true);

    try {
      await API.mailAPI.restoreMessages([id]);
      navigate("/mail", {
        state: { folder: "trash", refreshFolders: Date.now() },
      });

    } catch {
      setError("restore");
      setDeleting(false);
    }
  };

  if (activeFolder === "draft") {
    return <Navigate to={`/mail/compose?draftId=${encodeURIComponent(id)}`} replace />;
  }

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
            // 읽음 처리된 메일은 목록·뱃지도 바로 맞춘다.
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
      onDelete={handleDelete}
      onRestore={handleRestore}
      deleting={deleting}
      folder={activeFolder}
    />
  );
};

export default MailDetailView;
