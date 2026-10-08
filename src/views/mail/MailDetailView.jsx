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
  /** 폴더마다 다른 IMAP UID라, 목록에서 넘어온 폴더로 하는 조회. */
  const activeFolder = location.state?.folder ?? "inbox";
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // google | generic | delete | null
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (activeFolder === "draft") {
      return;
    }

    let cancelled = false; // 메일을 바꾸면 버리는 이전 응답.
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

          // Gmail 미연동은 재로그인 안내, 그 외는 일반 오류로 보는 분기.
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

  /** 첨부 파일 다운로드. */
  const handleDownloadAttachment = async (attachment) => {
    const response = await API.mailAPI.downloadAttachment(
      id,
      attachment.id,
      activeFolder
    );

    // blob URL로 받는 다운로드.
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** 휴지통이 아니면 휴지통으로 옮기고, 휴지통이면 완전히 지우는 삭제. */
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

  /** 휴지통 메일을 원래 편지함으로 되돌리는 복원. */
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
    return <Navigate to = {`/mail/compose?draftId=${encodeURIComponent(id)}`} replace />;
  }

  if (!loading && !error && !message) {
    return <NotFoundView />;
  }

  return (
    <MailDetail
      loading = {loading} // 본문 조회 중
      error = {error} // google | generic | delete | restore
      onGoogleLogin = {() => startSnsLogin("google")} // Gmail 미연동 때 다시 로그인
      message = {message} // 제목·본문·첨부
      onDownloadAttachment = {handleDownloadAttachment} // 첨부 다운로드
      onBack = {() =>
        navigate("/mail", {
          state: {
            folder: activeFolder,
            // 읽음 처리된 메일의 목록·뱃지 반영.
            ...(message?.unread ? {} : { readMessageId: id, refreshFolders: true }),
          },
        })
      } // 목록으로
      onReply = {() =>
        navigate("/mail/compose", {
          state: {
            to: message.fromEmail,
            subject: message.subject.startsWith("Re:")
              ? message.subject
              : `Re: ${message.subject}`,
          },
        })
      } // 답장 작성
      onDelete = {handleDelete} // 삭제
      onRestore = {handleRestore} // 휴지통에서 복원
      deleting = {deleting} // 삭제·복원 요청 중
      folder = {activeFolder} // 이 메일이 있던 편지함
    />
  );
};

export default MailDetailView;
