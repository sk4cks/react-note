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
  const [error, setError] = useState(null); // google | generic | delete | null
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  /** append면 다음 페이지인 폴더 메일 조회. */
  const loadMessages = useCallback(
    async (pageToken = null, append = false) => {
      if (append) {
        if (loadingMoreRef.current) {
          return;
        }

        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        // 폴더를 바꾸면 처음부터 다시 읽는 목록.
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
    setSelectedIds([]);
  }, [folder]);

  /** 휴지통이 아니면 휴지통으로 옮기고, 휴지통이면 완전히 지우는 삭제. */
  const deleteMessages = async (ids) => {
    if (ids.length === 0 || deleting) {
      return;
    }

    if (
      folder === "trash" &&
      !window.confirm(
        ids.length === 1
          ? "휴지통에서 완전히 삭제할까요? 되돌릴 수 없습니다."
          : `선택한 ${ids.length}통을 휴지통에서 완전히 삭제할까요? 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await API.mailAPI.deleteMessages(folder, ids);
      setMessages((prev) => prev.filter((message) => !ids.includes(message.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      navigate("/mail", {
        replace: true,
        state: { folder, refreshFolders: Date.now() },
      });

    } catch {
      setError("delete");

    } finally {
      setDeleting(false);
    }
  };

  /** 휴지통 메일을 원래 편지함으로 되돌리는 복원. */
  const restoreMessages = async (ids) => {
    if (ids.length === 0 || deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await API.mailAPI.restoreMessages(ids);
      setMessages((prev) => prev.filter((message) => !ids.includes(message.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      navigate("/mail", {
        replace: true,
        state: { folder, refreshFolders: Date.now() },
      });

    } catch {
      setError("restore");

    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const readMessageId = location.state?.readMessageId;

    if (!readMessageId) {
      return;
    }

    // 상세에서 읽음 처리된 메일을 목록에도 바로 반영.
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
      loading = {loading} // 첫 페이지 조회 중
      error = {error} // google | generic | delete | restore
      onGoogleLogin = {() => startSnsLogin("google")} // Gmail 미연동 때 다시 로그인
      folder = {folder} // 지금 보는 편지함
      messages = {messages} // 화면에 그릴 메일
      selectedIds = {selectedIds} // 체크된 메일 id
      onToggle = {(id) =>
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
      } // 한 통 체크
      onToggleAll = {() =>
        setSelectedIds((prev) =>
          prev.length === messages.length ? [] : messages.map((message) => message.id)
        )
      } // 보이는 메일 전체 체크
      onDeleteOne = {(id) => deleteMessages([id])} // 한 통 삭제
      onDeleteSelected = {() => deleteMessages(selectedIds)} // 체크한 메일 삭제
      onRestoreOne = {(id) => restoreMessages([id])} // 한 통 복원
      onRestoreSelected = {() => restoreMessages(selectedIds)} // 체크한 메일 복원
      deleting = {deleting} // 삭제·복원 요청 중
      onSelect = {(id) =>
        folder === "draft"
          ? navigate(`/mail/compose?draftId=${encodeURIComponent(id)}`)
          : navigate(`/mail/${id}`, { state: { folder } })
      } // 한 통을 열어 상세·초안 이동
      loadMoreRef = {loadMoreRef} // 목록 맨 아래. 보이면 다음 페이지
      hasMore = {Boolean(nextPageToken)} // 다음 페이지 있음
      loadingMore = {loadingMore} // 다음 페이지 조회 중
    />
  );
};

export default MailInboxView;
