import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("목업: Gmail API 연동 후 실제 발송됩니다.");
    navigate("/mail");
  };

  return (
    <MailLayout
      navigate={navigate}
      activeFolder="inbox"
      onFolderChange={() => navigate("/mail")}
    >
      <MailCompose
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/mail")}
      />
    </MailLayout>
  );
};

export default ComposeView;
