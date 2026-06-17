import { useNavigate, useParams } from "react-router-dom";
import MailLayout from "../../layout/mail/MailLayout";
import MailDetail from "../../components/mail/MailDetail";
import { getMessageById } from "../../temp_data/mailData";
import NotFoundView from "../errors/NotFoundView";

const MailDetailView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const message = getMessageById(id);

  if (!message) {
    return <NotFoundView />;
  }

  return (
    <MailLayout
      navigate={navigate}
      activeFolder={message.folder}
      onFolderChange={(folderId) => navigate("/mail", { state: { folder: folderId } })}
    >
      <MailDetail
        message={message}
        onBack={() => navigate("/mail")}
        onReply={() =>
          navigate("/mail/compose", {
            state: {
              to: message.fromEmail,
              subject: message.subject.startsWith("Re:")
                ? message.subject
                : `Re: ${message.subject}`,
            },
          })
        }
      />
    </MailLayout>
  );
};

export default MailDetailView;
