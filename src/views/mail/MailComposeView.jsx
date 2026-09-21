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
const DRAFT_ID_SESSION_KEY = "mailComposeDraftId";
const DRAFT_SNAPSHOT_KEY = "mailComposeSnapshot";
const HIDE_SAVE_MS = 200;

/** 보낼 본문이 비었는지. 이미지만 있으면 비어 있지 않다. */
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

/** 받는 사람·제목·본문·첨부가 모두 비면 초안을 만들지 않는다. */
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

/** 주소의 id가 저장 직후 바뀌었으면 세션에 남은 새 id로 다시 연다. */
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

/** 새로고침 직후 IMAP id가 바뀌었을 때 마지막 작성 내용을 되돌린다. */
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
  // 초안 로드·Quill 첫 onChange는 수정으로 치지 않는다.
  const ignoreChangesRef = useRef(Boolean(draftIdFromRoute));
  const loadedIdRef = useRef(null);
  const saveDraftRef = useRef(async () => null);
  const abortRef = useRef(null);

  formRef.current = form;
  attachmentsRef.current = attachments;
  draftIdRef.current = draftId;
  sendingRef.current = sending;
  loadingDraftRef.current = loadingDraft;

  /** 작성 폼 한 칸을 바꾼다. */
  const handleChange = (field, value) => {
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
  };

  /** 첨부 목록을 바꾼다. */
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
            // 첨부만 실패해도 본문은 연다.
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
      // 용량이 모자라면 서버 id만으로 연다.
    }
  }, [form, draftId, loadingDraft, error]);

  /** 탭만 가리면 저장하고, 새로고침(pagehide)이면 저장을 취소한다. */
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

  /** 목록으로 돌아간다. 수정분이 있으면 저장이 끝난 뒤 이동한다. */
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

  /** 메일을 보내고 보낸편지함으로 간다. */
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
      form={form}
      attachments={attachments}
      onChange={handleChange}
      onAttachmentsChange={handleAttachmentsChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      sending={sending}
      onSuggest={suggestRecipients}
      error={error}
      saveStatus={saveStatus}
      loading={loadingDraft}
    />
  );
};

export default MailComposeView;
