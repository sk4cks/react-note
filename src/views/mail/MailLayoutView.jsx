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

        // 폴더 id → 건수. 뱃지용.
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
  }, [location.pathname, activeFolder, location.state?.readMessageId, location.state?.refreshFolders, location.key]);

  return (
    <MailLayout
      folders = {mailFolders} // 받은·보낸·임시·휴지통
      folderCounts = {folderCounts} // 폴더 id별 뱃지 건수
      activeFolder = {activeFolder} // 지금 선택된 편지함
      pathname = {location.pathname} // 주소록 화면인지 구분
      onCompose = {() => navigate("/mail/compose")} // 메일 쓰기
      onSelectFolder = {(folder) => navigate("/mail", { state: { folder } })} // 편지함 이동
      onContacts = {() => navigate("/mail/contacts")} // 주소록 이동
    />
  );
};

export default MailLayoutView;
