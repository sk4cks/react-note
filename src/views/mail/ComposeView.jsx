import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "react-bootstrap";
import { API } from "@/api";
import MailLayout from "../../layout/mail/MailLayout";
import MailCompose from "../../components/mail/MailCompose";

const ComposeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reply = location.state ?? {};

  const [form, setForm] = useState({
    to: reply.to ?? "",
    subject: reply.subject ?? "",
    body: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await API.mailAPI.sendMail(form);
      navigate("/mail", { state: { folder: "sent" } });
    } catch (err) {
      const code = err.response?.data?.code;
      setError(code === "MAIL_GOOGLE_NOT_LINKED" ? "google" : "generic");
    } finally {
      setSending(false);
    }
  };

  return (
    <MailLayout
      navigate={navigate}
      activeFolder="inbox"
      onFolderChange={() => navigate("/mail")}
    >
      {error === "google" && (
        <Alert variant="warning" className="mb-3">
          Gmail 발송 권한이 없습니다. Google 계정으로 다시 로그인해 주세요.
        </Alert>
      )}
      {error === "generic" && (
        <Alert variant="danger" className="mb-3">
          메일을 보내지 못했습니다.
        </Alert>
      )}
      <MailCompose
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/mail")}
        sending={sending}
      />
    </MailLayout>
  );
};

export default ComposeView;
