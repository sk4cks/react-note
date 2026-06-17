import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MailLayout from "../../layout/mail/MailLayout";
import MailInbox from "../../components/mail/MailInbox";
import { getMessagesByFolder } from "../../temp_data/mailData";

const InboxView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [folder, setFolder] = useState(location.state?.folder ?? "inbox");

  const messages = useMemo(() => getMessagesByFolder(folder), [folder]);

  return (
    <MailLayout
      navigate={navigate}
      activeFolder={folder}
      onFolderChange={setFolder}
    >
      <MailInbox
        messages={messages}
        onSelect={(id) => navigate(`/mail/${id}`)}
      />
    </MailLayout>
  );
};

export default InboxView;
