import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { API } from "@/api";
import MailCompose from "../../components/mail/MailCompose";
import { parseMailAddresses } from "../../utils/mailAttachment";
import { sanitizeMailHtml } from "../../utils/sanitizeMailHtml";

function isEmptyMailHtml(html) {
  if (/<img\b/i.test(html ?? "")) {
    return false;
  }
  const text = (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "")
    .trim();

  return text.length === 0;
}

const MailComposeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reply = location.state ?? {};

  const [form, setForm] = useState({
    to: parseMailAddresses(reply.to ?? ""),
    cc: [],
    bcc: [],
    subject: reply.subject ?? "",
    body: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    setSending(true);
    setError(null);
    try {
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
    <>
      {error === "google" && (
        <Alert variant="warning" className="mb-3">
          Gmail 발송 권한이 없습니다. Google 계정으로 다시 로그인해 주세요.
        </Alert>
      )}
      {error && error !== "google" && (
        <Alert variant="danger" className="mb-3">
          {error === "generic" ? "메일을 보내지 못했습니다." : error}
        </Alert>
      )}
      <MailCompose
        form={form}
        attachments={attachments}
        onChange={handleChange}
        onAttachmentsChange={setAttachments}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/mail")}
        sending={sending}
      />
    </>
  );
};

export default MailComposeView;
