/** 메일 쓰기. 왼쪽 메일 쓰기 / 메일 상세 > 답장. */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@/api";
import MailCompose from "../../components/mail/MailCompose";
import { parseMailAddresses } from "../../utils/mailAttachment";
import { sanitizeMailHtml } from "../../utils/sanitizeMailHtml";

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

const MailComposeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reply = location.state ?? {}; // 답장이면 to·subject

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

  /** 작성 폼 한 칸을 바꾼다. */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** 주소록·그룹·최근 수신자 제안. */
  const suggestRecipients = async (q) => {
    const response = await API.contactAPI.suggestRecipients(q);
    return response.data ?? [];
  };

  /** 메일을 보내고 보낸편지함으로 간다. */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const to = form.to ?? [];
    const cc = form.cc ?? [];
    const bcc = form.bcc ?? [];

    // 받는 사람·본문(또는 첨부)이 있어야 보낸다.
    if (to.length === 0) {
      alert("받는 사람을 입력해 주세요.");
      return;
    }
    if (isEmptyMailHtml(form.body) && attachments.length === 0) {
      alert("메일 내용이나 첨부파일을 넣어 주세요.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      // 위험한 태그를 걷어낸 뒤 보낸다.
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
      });
      navigate("/mail", { state: { folder: "sent" } });

    } catch (err) {
      // google: Gmail 재로그인 안내. generic: 아래 Alert 기본 문구.
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
    />
  );
};

export default MailComposeView;
