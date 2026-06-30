import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin";
import MailLayout from "../../layout/mail/MailLayout";
import MailInbox from "../../components/mail/MailInbox";

const InboxView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [folder, setFolder] = useState(location.state?.folder ?? "inbox");
  const [messages, setMessages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = useCallback(
    async (pageToken = null, append = false) => {
      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await API.mailAPI.listMessages(folder, pageToken);
        const data = response.data;
        const fetchedMessages = Array.isArray(data)
          ? data
          : (data.messages ?? []);
        const token = Array.isArray(data) ? null : (data.nextPageToken ?? null);

        setMessages((prev) =>
          append ? [...prev, ...fetchedMessages] : fetchedMessages
        );
        setNextPageToken(token);
      } catch (err) {
        if (!append) {
          const code = err.response?.data?.code;
          setError(code === "MAIL_GOOGLE_NOT_LINKED" ? "google" : "generic");
        }
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [folder]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const readMessageId = location.state?.readMessageId;
    if (!readMessageId) {
      return;
    }
    setMessages((prev) =>
      prev.map((message) =>
        message.id === readMessageId ? { ...message, unread: false } : message
      )
    );
  }, [location.state?.readMessageId]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !nextPageToken || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMessages(nextPageToken, true);
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [nextPageToken, loadingMore, loadMessages]);

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
          loadMoreRef={loadMoreRef}
          hasMore={Boolean(nextPageToken)}
          loadingMore={loadingMore}
        />
      )}
    </MailLayout>
  );
};

export default InboxView;
