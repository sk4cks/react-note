/** 메일 왼쪽 편지함·주소록. RequireAuth 아래. */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "@/api";
import { mailFolders } from "../../temp_data/mailData";
import MailLayout from "../../components/mail/MailLayout";

const MailLayoutView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeFolder = location.state?.folder ?? "inbox";
  const [folderCounts, setFolderCounts] = useState({}); // 편지함 안 읽은 수

  useEffect(() => {
    let cancelled = false; // 폴더를 바꾸면 이전 건수 응답은 버린다.

    API.mailAPI
      .getFolders()
      .then((response) => {
        if (cancelled) {
          return;
        }
        const counts = Object.fromEntries(
          response.data.map((folder) => [folder.id, folder.count])
        );
        setFolderCounts(counts);
      })
      .catch(() => {
        if (!cancelled) {
          setFolderCounts({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, activeFolder, location.state?.readMessageId, location.key]);

  return (
    <MailLayout
      folders={mailFolders}
      folderCounts={folderCounts}
      activeFolder={activeFolder}
      pathname={location.pathname}
      onCompose={() => navigate("/mail/compose")}
      onSelectFolder={(folder) => navigate("/mail", { state: { folder } })}
      onContacts={() => navigate("/mail/contacts")}
    />
  );
};

export default MailLayoutView;
