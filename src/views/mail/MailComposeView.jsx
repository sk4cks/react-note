/** 메일 쓰기. 왼쪽 메일 쓰기 / 메일 상세 > 답장 / 임시보관함 > 초안. */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@/api";
import MailCompose from "../../components/mail/MailCompose";
import {
  parseMailAddressList,
  parseMailAddresses,
  readBlobAsAttachment,
} from "../../utils/mailAttachment";
import { sanitizeMailHtml } from "../../utils/sanitizeMailHtml";

const AUTOSAVE_MS = 2000;

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

const MailComposeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reply = location.state ?? {};
  const draftIdFromRoute = reply.draftId ?? null;

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
  const saveDraftRef = useRef(async () => null);

  formRef.current = form;
  attachmentsRef.current = attachments;
  draftIdRef.current = draftId;
  sendingRef.current = sending;
  loadingDraftRef.current = loadingDraft;

  /** 작성 폼 한 칸을 바꾼다. */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

    if (isEmptyDraft(formRef.current, attachmentsRef.current)) {
      return null;
    }

    if (inFlightRef.current) {
      queuedRef.current = true;

      return null;
    }

    inFlightRef.current = true;
    setSaveStatus("saving");

    try {
      const payload = buildDraftPayload();
      const data = keepalive
        ? await API.mailAPI.saveDraftKeepalive(payload)
        : (await API.mailAPI.saveDraft(payload)).data;
      const id = data?.id;

      if (id) {
        setDraftId(id);
        draftIdRef.current = id;
      }

      setSaveStatus("saved");

      return id;

    } catch {
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
      return;
    }

    let cancelled = false;
    setLoadingDraft(true);

    const loadDraft = async () => {
      try {
        const response = await API.mailAPI.getMessage(draftIdFromRoute, "draft");
        const message = response.data;
        const files = await Promise.all(
          (message.attachments ?? []).map(async (attachment) => {
            const file = await API.mailAPI.downloadAttachment(
              draftIdFromRoute,
              attachment.id,
              "draft"
            );

            return readBlobAsAttachment(
              file.data,
              attachment.filename,
              attachment.contentType
            );
          })
        );

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

      } catch {
        if (!cancelled) {
          setError("generic");
        }

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
    if (loadingDraft || sending) {
      return;
    }

    const timer = setTimeout(() => {
      void saveDraftRef.current();
    }, AUTOSAVE_MS);

    return () => clearTimeout(timer);
  }, [form, attachments, loadingDraft, sending]);

  useEffect(() => {
    const flush = () => {
      void saveDraftRef.current({ keepalive: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void saveDraftRef.current();
      }
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);

      if (!skipSaveRef.current) {
        void saveDraftRef.current({ keepalive: true });
      }
    };
  }, []);

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

    if (isEmptyMailHtml(form.body) && attachments.length === 0) {
      alert("메일 내용이나 첨부파일을 넣어 주세요.");
      return;
    }

    skipSaveRef.current = true;
    setSending(true);
    setError(null);

    try {
      while (inFlightRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await API.mailAPI.sendMail({
        to,
        cc,
        bcc,
        subject: form.subject,
        body: sanitizeMailHtml(form.body),
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
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;

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
      onAttachmentsChange={setAttachments}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/mail")}
      sending={sending}
      onSuggest={suggestRecipients}
      error={error}
      saveStatus={saveStatus}
      loading={loadingDraft}
    />
  );
};

export default MailComposeView;
