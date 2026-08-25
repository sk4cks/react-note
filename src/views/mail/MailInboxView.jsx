/** 메일 목록(받은·보낸·임시보관함). 상단 Mail / 로그인 후 / 왼쪽 편지함. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin";
import MailInbox from "../../components/mail/MailInbox";

const MailInboxView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loadMoreRef = useRef(null); // 목록 맨 아래. 보이면 다음 페이지
  const loadingMoreRef = useRef(false); // 스크롤 중복 요청 막기
  const folder = location.state?.folder ?? "inbox";
  const [messages, setMessages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null); // google | generic | null

  /** 폴더 메일을 불러온다. append면 다음 페이지. */
  const loadMessages = useCallback(
    async (pageToken = null, append = false) => {
      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        // 폴더를 바꾸면 목록을 처음부터 다시 읽는다.
        setLoading(true);
        setError(null);
      }

      try {
        const response = await API.mailAPI.listMessages(folder, pageToken);
        const data = response.data;
        // 예전 API는 배열만, 지금은 { messages, nextPageToken }.
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
    <MailInbox
      loading={loading}
      error={error}
      onGoogleLogin={() => startSnsLogin("google")}
      messages={messages}
      onSelect={(id) => navigate(`/mail/${id}`, { state: { folder } })}
      loadMoreRef={loadMoreRef}
      hasMore={Boolean(nextPageToken)}
      loadingMore={loadingMore}
    />
  );
};

export default MailInboxView;
