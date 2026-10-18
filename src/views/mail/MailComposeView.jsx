/** HTML을 채팅·본문에 넣을 때 태그를 문자로 바꾸는 이스케이프. */
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** 메일 쓰기. 왼쪽 메일 쓰기 / 메일 상세 > 답장 / 임시보관함 > 초안. */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/api";
import MailCompose from "../../components/mail/MailCompose";
import {
  parseMailAddressList,
  parseMailAddresses,
  readBlobAsAttachment,
} from "../../utils/mailAttachment";
import { sanitizeMailHtml } from "../../utils/sanitizeMailHtml";

const AUTOSAVE_MS = 2000;
const SUGGEST_MS = 450;
const DRAFT_ID_SESSION_KEY="mailComposeDraftId";
const DRAFT_SNAPSHOT_KEY="mailComposeSnapshot";
const HIDE_SAVE_MS = 200;

/** 이미지만 있어도 비어 있지 않은 본문인지 확인. */
const isEmptyMailHtml = (html) => {
  if (/<img\b/i.test(html ?? "")) {
    return false;
  }

  const text = (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "")
    .trim();

  return text.length === 0;
};

/** 받는 사람·제목·본문·첨부가 모두 비면 건너뛰는 초안 확인. */
const isEmptyDraft = (form, attachments) => {
  const noRecipients =
    (form.to?.length ?? 0) === 0 &&
    (form.cc?.length ?? 0) === 0 &&
    (form.bcc?.length ?? 0) === 0;

  return (
    noRecipients &&
    !(form.subject ?? "").trim() &&
    isEmptyMailHtml(form.body) &&
    (attachments?.length ?? 0) === 0
  );
};

/** 저장 직후 id가 바뀌면 세션의 새 id로 다시 여는 초안 조회. */
const fetchDraft = async (requestedId) => {
  try {
    const response = await API.mailAPI.getMessage(requestedId, "draft");

    return response.data;

  } catch (err) {
    const fallbackId = sessionStorage.getItem(DRAFT_ID_SESSION_KEY);

    if (err.response?.status === 404 && fallbackId && fallbackId !== requestedId) {
      const response = await API.mailAPI.getMessage(fallbackId, "draft");

      return response.data;
    }

    throw err;
  }
};

/** 새로고침 직후 IMAP id가 바뀌었을 때 되돌리는 마지막 작성 내용. */
const readDraftSnapshot = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_SNAPSHOT_KEY);

    return raw ? JSON.parse(raw) : null;

  } catch {
    return null;
  }
};

const MailComposeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const reply = location.state ?? {};
  const draftIdFromRoute = searchParams.get("draftId") || reply.draftId || null;

  const [form, setForm] = useState({
    to: parseMailAddresses(reply.to ?? ""),
    cc: [],
    bcc: [],
    subject: reply.subject ?? "",
    body: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null); // google | generic | 서버 메시지
  const [draftId, setDraftId] = useState(draftIdFromRoute);
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftIdFromRoute));
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [suggestion, setSuggestion] = useState(null); // { field, text }
  const [chatMessages, setChatMessages] = useState([]); // 옆 채팅
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const formRef = useRef(form);
  const attachmentsRef = useRef(attachments);
  const draftIdRef = useRef(draftId);
  const sendingRef = useRef(sending);
  const loadingDraftRef = useRef(loadingDraft);
  const skipSaveRef = useRef(false);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const dirtyRef = useRef(false);
  const editGenRef = useRef(0);
  // 초안 로드와 Quill 첫 onChange는 수정으로 치지 않는 표시.
  const ignoreChangesRef = useRef(Boolean(draftIdFromRoute));
  const loadedIdRef = useRef(null);
  const saveDraftRef = useRef(async () => null);
  const abortRef = useRef(null);
  const suggestTimerRef = useRef(null);
  const suggestAbortRef = useRef(null);

  formRef.current = form;
  attachmentsRef.current = attachments;
  draftIdRef.current = draftId;
  sendingRef.current = sending;
  loadingDraftRef.current = loadingDraft;

  /** 작성 폼 한 칸 수정. prefix는 커서 앞 글. false면 추천 숨김. */
  const handleChange = (field, value, prefix) => {
    setForm((prev) => {
      if (prev[field] === value) {
        return prev;
      }

      if (!ignoreChangesRef.current) {
        dirtyRef.current = true;
        editGenRef.current += 1;
      }

      return { ...prev, [field]: value };
    });

    if (field === "subject" || field === "body") {
      scheduleSuggest(field, value, prefix);
    }
  };

  /** 입력이 잠시 멈추면 커서 뒤 이어쓰기 조회. prefix가 false면 숨김. */
  const scheduleSuggest = (field, value, prefix) => {
    window.clearTimeout(suggestTimerRef.current);

    if (prefix === false) {
      suggestAbortRef.current?.abort();
      setSuggestion(null);

      return;
    }

    if (prefix === null) {
      return;
    }

    const raw = prefix != null ? String(prefix) : (value ?? "");
    const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (plain.length < 2 || ignoreChangesRef.current) {
      setSuggestion(null);

      return;
    }

    suggestTimerRef.current = window.setTimeout(async () => {
      suggestAbortRef.current?.abort();
      const controller = new AbortController();
      suggestAbortRef.current = controller;
      const current = formRef.current;

      try {
        const response = await API.mailAPI.completeMail(
          {
            field,
            text: plain,
            subject: field === "subject" ? value : current.subject,
            body: field === "body" ? value : current.body,
          },
          { signal: controller.signal }
        );
        const text = (response.data?.suggestion ?? "").replace(/\s+$/u, "");

        setSuggestion(text.trim() ? { field, text } : null);

      } catch (err) {
        if (err?.code !== "ERR_CANCELED") {
          setSuggestion(null);
        }
      }
    }, SUGGEST_MS);
  };

  /** Tab·클릭으로 회색 추천을 비우는 닫기. 붙이기는 작성 폼. */
  const acceptSuggestion = () => {
    setSuggestion(null);
  };

  /** 회색 추천 닫기. */
  const dismissSuggestion = () => {
    setSuggestion(null);
  };

  /** 채팅 전송. 실패 메시지도 말풍선으로 표시. */
  const sendChat = async () => {
    const content = chatInput.trim();

    if (!content || chatSending) {
      return;
    }

    const nextMessages = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);

    try {
      const response = await API.mailAPI.chatMail({
        messages: nextMessages,
        subject: formRef.current.subject,
        body: formRef.current.body,
      });
      const message = (response.data?.message ?? "").trim() || "답이 비어 있습니다.";

      setChatMessages((prev) => [...prev, { role: "assistant", content: message }]);

    } catch (err) {
      const message = err.response?.data?.message || "AI 응답을 받지 못했습니다.";

      setChatMessages((prev) => [...prev, { role: "assistant", content: message }]);

    } finally {
      setChatSending(false);
    }
  };

  /** 말풍선을 제목으로 넣는 반영. */
  const applyChatSubject = (text) => {
    handleChange("subject", String(text ?? "").replace(/\s+/g, " ").trim());
  };

  /** 말풍선을 본문 뒤에 붙이는 반영. */
  const applyChatBody = (text) => {
    const current = formRef.current.body ?? "";
    const addition = `<p>${escapeHtml(text)}</p>`;
    const next = !current || current === "<p><br></p>" ? addition : `${current}${addition}`;

    handleChange("body", next);
  };

  /** 첨부 목록 수정. */
  const handleAttachmentsChange = (next) => {
    if (!ignoreChangesRef.current) {
      dirtyRef.current = true;
      editGenRef.current += 1;
    }

    setAttachments(next);
  };

  /** 주소록·그룹·최근 수신자 제안. */
  const suggestRecipients = async (q) => {
    const response = await API.contactAPI.suggestRecipients(q);

    return response.data ?? [];
  };

  const buildDraftPayload = () => {
    const current = formRef.current;
    const payload = {
      to: current.to ?? [],
      cc: current.cc ?? [],
      bcc: current.bcc ?? [],
      subject: current.subject ?? "",
      body: sanitizeMailHtml(current.body),
      attachments: attachmentsRef.current.map(({ filename, contentType, contentBase64 }) => ({
        filename,
        contentType,
        contentBase64,
      })),
    };

    if (draftIdRef.current) {
      payload.id = draftIdRef.current;
    }

    return payload;
  };

  saveDraftRef.current = async ({ keepalive = false } = {}) => {
    if (skipSaveRef.current || sendingRef.current || loadingDraftRef.current) {
      return null;
    }

    if (!dirtyRef.current) {
      return null;
    }

    if (isEmptyDraft(formRef.current, attachmentsRef.current)) {
      return null;
    }

    if (inFlightRef.current) {
      queuedRef.current = true;

      return null;
    }

    inFlightRef.current = true;
    setSaveStatus("saving");
    const editGen = editGenRef.current;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const payload = buildDraftPayload();
      const data = keepalive
        ? await API.mailAPI.saveDraftKeepalive(payload)
        : (await API.mailAPI.saveDraft(payload, { signal: abortRef.current.signal })).data;
      const id = data?.id;

      if (id) {
        setDraftId(id);
        draftIdRef.current = id;
        loadedIdRef.current = id;
        sessionStorage.setItem(DRAFT_ID_SESSION_KEY, String(id));

        if (searchParams.get("draftId") !== String(id)) {
          setSearchParams({ draftId: String(id) }, { replace: true });
        }
      }

      if (editGenRef.current === editGen) {
        dirtyRef.current = false;
      }

      setSaveStatus("saved");

      return id;

    } catch (err) {
      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
        return null;
      }

      setSaveStatus("error");

      return null;

    } finally {
      inFlightRef.current = false;

      if (queuedRef.current && !skipSaveRef.current) {
        queuedRef.current = false;
        void saveDraftRef.current();
      }
    }
  };

  useEffect(() => {
    if (!draftIdFromRoute) {
      sessionStorage.removeItem(DRAFT_ID_SESSION_KEY);
      sessionStorage.removeItem(DRAFT_SNAPSHOT_KEY);

      return;
    }

    if (loadedIdRef.current === draftIdFromRoute) {
      return;
    }

    let cancelled = false;
    setLoadingDraft(true);
    setError(null);

    const loadDraft = async () => {
      try {
        const message = await fetchDraft(draftIdFromRoute);

        if (cancelled) {
          return;
        }

        const files = [];

        for (const attachment of message.attachments ?? []) {
          try {
            const file = await API.mailAPI.downloadAttachment(
              message.id ?? draftIdFromRoute,
              attachment.id,
              "draft"
            );
            files.push(
              await readBlobAsAttachment(
                file.data,
                attachment.filename,
                attachment.contentType
              )
            );

          } catch {
            // 첨부만 실패해도 여는 본문.
          }
        }

        if (cancelled) {
          return;
        }

        setForm({
          to: parseMailAddressList(message.to),
          cc: parseMailAddressList(message.cc),
          bcc: parseMailAddressList(message.bcc),
          subject:
            message.subject === "(no subject)" ? "" : (message.subject ?? ""),
          body: message.body ?? "",
        });
        setAttachments(files);
        setDraftId(message.id ?? draftIdFromRoute);
        loadedIdRef.current = message.id ?? draftIdFromRoute;

        if (message.id && searchParams.get("draftId") !== String(message.id)) {
          setSearchParams({ draftId: String(message.id) }, { replace: true });
        }

      } catch {
        const snapshot = readDraftSnapshot();
        const latestId = sessionStorage.getItem(DRAFT_ID_SESSION_KEY);
        const canRestore =
          snapshot?.form &&
          (String(snapshot.id ?? "") === String(draftIdFromRoute) ||
            (latestId && String(snapshot.id ?? "") === String(latestId)));

        if (cancelled) {
          return;
        }

        if (canRestore) {
          setForm(snapshot.form);
          setDraftId(snapshot.id ?? draftIdFromRoute);
          loadedIdRef.current = snapshot.id ?? draftIdFromRoute;

          if (snapshot.id && searchParams.get("draftId") !== String(snapshot.id)) {
            setSearchParams({ draftId: String(snapshot.id) }, { replace: true });
          }

          return;
        }

        setError("load");

      } finally {
        if (!cancelled) {
          setLoadingDraft(false);
        }
      }
    };

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [draftIdFromRoute]);

  useEffect(() => {
    if (loadingDraft) {
      ignoreChangesRef.current = true;

      return;
    }

    const ready = window.setTimeout(() => {
      ignoreChangesRef.current = false;
    }, 100);

    return () => window.clearTimeout(ready);
  }, [loadingDraft]);

  useEffect(() => {
    if (loadingDraft || sending || !dirtyRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      void saveDraftRef.current();
    }, AUTOSAVE_MS);

    return () => clearTimeout(timer);
  }, [form, attachments, loadingDraft, sending]);

  useEffect(() => {
    if (loadingDraft || error === "load") {
      return;
    }

    try {
      sessionStorage.setItem(
        DRAFT_SNAPSHOT_KEY,
        JSON.stringify({ id: draftId, form })
      );

    } catch {
      // 용량이 모자라면 서버 id만으로 여는 초안.
    }
  }, [form, draftId, loadingDraft, error]);

  /** 탭만 가리면 저장하고, 새로고침이면 취소하는 임시저장. */
  useEffect(() => {
    let hideTimer = 0;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hideTimer = window.setTimeout(() => {
          void saveDraftRef.current();
        }, HIDE_SAVE_MS);

        return;
      }

      window.clearTimeout(hideTimer);
    };

    const onPageHide = () => {
      window.clearTimeout(hideTimer);
      queuedRef.current = false;
      abortRef.current?.abort();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearTimeout(hideTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  /** 수정분이 있으면 저장이 끝난 뒤 이동하는 목록 복귀. */
  const handleCancel = async () => {
    while (inFlightRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (dirtyRef.current) {
      await saveDraftRef.current();
    }

    skipSaveRef.current = true;
    navigate("/mail", { state: { folder: draftIdFromRoute ? "draft" : "inbox" } });
  };

  /** 메일을 보내고 보낸편지함으로 가는 발송. */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const to = form.to ?? [];
    const cc = form.cc ?? [];
    const bcc = form.bcc ?? [];

    if (to.length === 0) {
      alert("받는 사람을 입력해 주세요.");
      return;
    }

    if (!(form.subject ?? "").trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (isEmptyMailHtml(form.body) && attachments.length === 0) {
      alert("본문이나 첨부파일을 넣어 주세요.");
      return;
    }

    skipSaveRef.current = true;
    setSending(true);
    setError(null);

    try {
      while (inFlightRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const body = isEmptyMailHtml(form.body)
        ? "<p></p>"
        : sanitizeMailHtml(form.body);

      await API.mailAPI.sendMail({
        to,
        cc,
        bcc,
        subject: form.subject,
        body,
        attachments: attachments.map(({ filename, contentType, contentBase64 }) => ({
          filename,
          contentType,
          contentBase64,
        })),
        draftId: draftIdRef.current || undefined,
      });
      navigate("/mail", { state: { folder: "sent" } });

    } catch (err) {
      skipSaveRef.current = false;
      const data = err.response?.data;
      const code = data?.code;
      const fieldErrors = data?.errors;
      const fieldMessage =
        fieldErrors && typeof fieldErrors === "object"
          ? Object.values(fieldErrors).filter(Boolean).join(" ")
          : "";
      const message = fieldMessage || data?.message;

      if (code === "MAIL_GOOGLE_NOT_LINKED") {
        setError("google");
      } else if (message) {
        setError(message);
      } else {
        setError("generic");
      }

    } finally {
      setSending(false);
    }
  };

  return (
    <MailCompose
      form = {form} // 받는 사람·제목·본문
      attachments = {attachments} // 첨부 목록
      onChange = {handleChange} // 폼 한 칸 수정
      onAttachmentsChange = {handleAttachmentsChange} // 첨부 목록 수정
      onSubmit = {handleSubmit} // 발송
      onCancel = {handleCancel} // 목록으로
      sending = {sending} // 발송 요청 중
      onSuggest = {suggestRecipients} // 수신자 자동완성 조회
      error = {error} // google | generic | load | 서버 메시지
      saveStatus = {saveStatus} // idle | saving | saved | error
      loading = {loadingDraft} // 초안 조회 중
      suggestion = {suggestion} // 커서 뒤 회색 이어쓰기
      onAcceptSuggestion = {acceptSuggestion} // Tab·클릭으로 추천 반영
      onDismissSuggestion = {dismissSuggestion} // Esc로 추천 닫기
      chatMessages = {chatMessages} // 옆 채팅
      chatInput = {chatInput} // 채팅 입력
      onChatInput = {setChatInput} // 채팅 입력 수정
      onChatSend = {sendChat} // 채팅 전송
      chatSending = {chatSending} // 채팅 답변 대기
      onApplySubject = {applyChatSubject} // 말풍선을 제목으로
      onApplyBody = {applyChatBody} // 말풍선을 본문 뒤에
    />
  );
};

export default MailComposeView;
