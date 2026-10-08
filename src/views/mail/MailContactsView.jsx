/** 주소록(연락처·그룹·공유). 왼쪽 주소록. */
import { useCallback, useEffect, useState } from "react";
import { API } from "@/api";
import MailContacts from "../../components/mail/MailContacts";
import { contactKey } from "../../components/mail/MailGroupMemberField";

const emptyContact = { displayName: "", email: "" }; // 연락처 추가 폼 초기값

/** 그룹 저장 API용 개인 연락처 id와 계정 seq 분리. */
const splitMemberKeys = (members) => {
  const contactIds = []; // MAIL_CONTACT
  const accountUserSeqs = []; // SYS_USER
  for (const contact of members) {
    if (contact.pending) {
      continue;
    }

    const key = contactKey(contact);
    if (key.startsWith("a:")) {
      accountUserSeqs.push(Number(key.slice(2)));
    } else if (key.startsWith("c:")) {
      contactIds.push(Number(key.slice(2)));
    }
  }

  return { contactIds, accountUserSeqs };
};

/** 멤버 구성이 바뀌었는지 비교하는 키. */
const membersSignature = (members) => {
  return (members ?? [])
    .map((member) => contactKey(member))
    .sort()
    .join("|");
};

/** WRITE/READ를 화면에 쓸 말로. */
const permissionLabel = (permission) => {
  return permission === "WRITE" ? "수정" : "읽기";
};

const MailContactsView = () => {
  const [tab, setTab] = useState("contacts"); // 연락처 | 그룹·공유
  const [groupPanelTab, setGroupPanelTab] = useState("members"); // 멤버 | 공유 | 정보
  const [contacts, setContacts] = useState([]); // 개인 연락처
  const [groups, setGroups] = useState([]); // 내 그룹 + 공유받은 그룹
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [groupName, setGroupName] = useState(""); // 새 그룹 이름 입력
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [shareUserId, setShareUserId] = useState(""); // 공유할 USER_ID
  const [sharePermission, setSharePermission] = useState("READ");
  const [shares, setShares] = useState([]); // 고른 그룹의 공유 목록
  const [draftMembers, setDraftMembers] = useState([]); // 저장 전 멤버 칩
  const [savingMembers, setSavingMembers] = useState(false);
  const [myUserId, setMyUserId] = useState("");
  const [renameDraft, setRenameDraft] = useState(""); // 정보 탭 이름 수정
  const [savingName, setSavingName] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const canWrite =
    !!selectedGroup && (selectedGroup.owned || selectedGroup.permission === "WRITE"); // 멤버·공유 수정
  const membersDirty =
    canWrite &&
    membersSignature(draftMembers) !== membersSignature(selectedGroup?.members ?? []); // 멤버 저장 버튼

  /** 연락처·그룹 목록 다시 조회. */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [contactRes, groupRes] = await Promise.all([
        API.contactAPI.listContacts(),
        API.contactAPI.listGroups(),
      ]);
      setContacts(contactRes.data ?? []);
      setGroups(groupRes.data ?? []);

    } catch {
      setError("주소록을 불러오지 못했습니다.");

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    API.userAPI
      .getMe()
      .then((response) => {
        setMyUserId(response.data.preferredUsername ?? response.data.userId ?? "");
      })
      .catch(() => setMyUserId(""));
  }, [load]);

  useEffect(() => {
    const group = groups.find((item) => item.id === selectedGroupId);
    setDraftMembers(group?.members ?? []);
    setGroupPanelTab("members");
    setRenameDraft(group?.name ?? "");
    if (!selectedGroupId) {
      setShares([]);
      return;
    }

    // 고른 그룹만 따로 불러오는 공유 목록.
    API.contactAPI
      .listShares(selectedGroupId)
      .then((response) => setShares(response.data ?? []))
      .catch(() => setShares([]));
  }, [selectedGroupId]);

  /** 개인 연락처 추가. */
  const handleCreateContact = async (e) => {
    e.preventDefault();

    try {
      await API.contactAPI.createContact(contactForm);
      setContactForm(emptyContact);
      await load();

    } catch {
      setError("연락처를 저장하지 못했습니다.");
    }
  };

  /** 개인 연락처 삭제. */
  const handleDeleteContact = async (id) => {
    try {
      await API.contactAPI.deleteContact(id);
      await load();

    } catch {
      setError("연락처를 삭제하지 못했습니다.");
    }
  };

  /** 새 그룹 생성. */
  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      const response = await API.contactAPI.createGroup({ name: groupName });
      setGroupName("");
      await load();
      setSelectedGroupId(response.data?.id ?? null);

    } catch {
      setError("그룹을 만들지 못했습니다.");
    }
  };

  /** pending 이메일을 연락처로 만든 뒤 저장하는 그룹 멤버. */
  const handleSaveMembers = async () => {
    if (!selectedGroupId || !membersDirty) {
      return;
    }

    setSavingMembers(true);

    try {
      // 저장 전까지 칩만 있던 이메일의 개인 연락처 생성.
      const pending = draftMembers.filter((member) => member.pending);
      await Promise.all(
        pending.map((member) =>
          API.contactAPI
            .createContact({
              displayName: member.displayName || "",
              email: member.email,
            })
            .catch(() => null)
        )
      );

      let book = contacts; // 방금 만든 연락처가 포함된 주소록
      if (pending.length > 0) {
        // 방금 만든 연락처 id를 받으려고 다시 읽는 목록.
        const listed = await API.contactAPI.listContacts();
        book = listed.data ?? [];
        setContacts(book);
      }

      // pending 칩을 방금 만든 연락처로 바꾸는 교체.
      const resolved = draftMembers.map((member) => {
        if (!member.pending) {
          return member;
        }

        return (
          book.find(
            (contact) => contact.email.toLowerCase() === member.email.toLowerCase()
          ) ?? member
        );
      });
      if (resolved.some((member) => member.pending)) {
        throw new Error("create");
      }

      // pending이 다 연락처가 된 뒤의 그룹 멤버 전체 저장.
      const response = await API.contactAPI.replaceMembers(
        selectedGroupId,
        splitMemberKeys(resolved)
      );
      const saved = response.data?.members ?? resolved;
      setDraftMembers(saved);
      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroupId ? { ...group, members: saved } : group
        )
      );

    } catch {
      setError("그룹 멤버를 저장하지 못했습니다.");

    } finally {
      setSavingMembers(false);
    }
  };

  /** 공유를 넣거나 권한을 바꾸는 수정. */
  const applyShare = async (sharedWithUserId, permission) => {
    const response = await API.contactAPI.shareGroup(selectedGroup.id, {
      sharedWithUserId,
      permission,
    });
    const saved = response.data;
    setShares((prev) => {
      const index = prev.findIndex((share) => share.id === saved.id);
      if (index >= 0) {
        // 같은 사용자면 권한만 바꾸는 교체.
        const next = [...prev];
        next[index] = saved;
        return next;
      }

      return [...prev, saved];
    });
  };

  /** 이미 있으면 권한 변경을 묻는 공유 폼 제출. */
  const handleShare = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      return;
    }

    const targetId = shareUserId.trim(); // 공유할 USER_ID
    if (!targetId) {
      return;
    }

    if (targetId === selectedGroup.ownerUserId || targetId === myUserId) {
      window.alert("등록자나 본인에게는 공유할 수 없습니다.");
      return;
    }

    // 이미 공유된 사용자에게 권한만 바꿀지 묻는 확인.
    const existing = shares.find(
      (share) => share.sharedWithUserId.toLowerCase() === targetId.toLowerCase()
    );
    if (existing) {
      if (existing.permission === sharePermission) {
        window.alert("이미 공유된 사용자입니다.");
        return;
      }

      if (
        !window.confirm(
          `이미 공유된 사용자입니다. 권한을 ${permissionLabel(sharePermission)}(으)로 변경할까요?`
        )
      ) {
        return;
      }
    }

    try {
      await applyShare(targetId, sharePermission);
      setShareUserId("");

    } catch {
      setError("그룹을 공유하지 못했습니다. USER_ID를 확인해 주세요.");
    }
  };

  /** 목록에서 바로 바꾸는 공유 권한. */
  const handleChangeSharePermission = async (share, permission) => {
    if (!selectedGroup || share.permission === permission) {
      return;
    }

    if (share.sharedWithUserId === myUserId) {
      return;
    }

    try {
      await applyShare(share.sharedWithUserId, permission);

    } catch {
      window.alert("공유 권한을 변경하지 못했습니다.");
    }
  };

  /** 공유 회수, 또는 공유받은 그룹에서 나가는 탈퇴. */
  const handleRevoke = async (shareId) => {
    if (!selectedGroup) {
      return;
    }

    const revoked = shares.find((share) => share.id === shareId);
    const leaving =
      !selectedGroup.owned &&
      !!myUserId &&
      revoked?.sharedWithUserId === myUserId; // 공유받은 그룹에서 나가는지

    try {
      await API.contactAPI.revokeShare(selectedGroup.id, shareId);
      if (leaving) {
        // 공유받은 쪽에서 나가면 목록에서 빼는 그룹.
        const groupId = selectedGroup.id;
        setGroups((prev) => prev.filter((group) => group.id !== groupId));
        setSelectedGroupId(null);
        setShares([]);
        return;
      }

      setShares((prev) => prev.filter((share) => share.id !== shareId));

    } catch {
      setError("공유를 회수하지 못했습니다.");
    }
  };

  /** 등록자의 그룹 이름 수정. */
  const handleRenameGroup = async (e) => {
    e.preventDefault();

    if (!selectedGroup?.owned) {
      return;
    }

    const name = renameDraft.trim();
    if (!name || name === selectedGroup.name) {
      return;
    }

    setSavingName(true);

    try {
      const response = await API.contactAPI.updateGroup(selectedGroup.id, { name });
      const savedName = response.data?.name ?? name;
      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup.id ? { ...group, name: savedName } : group
        )
      );
      setRenameDraft(savedName);

    } catch {
      setError("그룹 이름을 바꾸지 못했습니다.");

    } finally {
      setSavingName(false);
    }
  };

  /** 등록자의 그룹 삭제. */
  const handleDeleteGroup = async () => {
    if (!selectedGroup?.owned) {
      return;
    }

    if (
      !window.confirm(
        `'${selectedGroup.name}' 그룹을 삭제할까요? 멤버와 공유도 함께 삭제됩니다.`
      )
    ) {
      return;
    }

    try {
      await API.contactAPI.deleteGroup(selectedGroup.id);
      setSelectedGroupId(null);
      await load();

    } catch {
      setError("그룹을 삭제하지 못했습니다.");
    }
  };

  /** 연락처 추가 폼 한 칸. */
  const handleContactFormChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MailContacts
      loading = {loading} // 연락처·그룹 조회 중
      error = {error} // 실패 메시지
      onCloseError = {() => setError(null)} // 오류 알림 닫기
      tab = {tab} // contacts | groups
      onTab = {setTab} // 연락처·그룹 탭 이동
      contactForm = {contactForm} // 연락처 추가 입력
      onContactFormChange = {handleContactFormChange} // 연락처 폼 한 칸 수정
      onCreateContact = {handleCreateContact} // 개인 연락처 추가
      contacts = {contacts} // 개인 연락처와 계정
      onDeleteContact = {handleDeleteContact} // 개인 연락처 삭제
      groupName = {groupName} // 새 그룹 이름
      onGroupNameChange = {setGroupName} // 새 그룹 이름 수정
      onCreateGroup = {handleCreateGroup} // 그룹 생성
      groups = {groups} // 내 그룹과 공유받은 그룹
      selectedGroupId = {selectedGroupId} // 고른 그룹 id
      onSelectGroup = {setSelectedGroupId} // 그룹 선택
      selectedGroup = {selectedGroup} // 고른 그룹 상세
      groupPanelTab = {groupPanelTab} // members | share | info
      onGroupPanelTab = {setGroupPanelTab} // 멤버·공유·정보 탭 이동
      canWrite = {canWrite} // 멤버·공유 수정 가능
      draftMembers = {draftMembers} // 저장 전 멤버 칩
      onDraftMembersChange = {setDraftMembers} // 멤버 칩 수정
      membersDirty = {membersDirty} // 저장 안 한 멤버 변경
      savingMembers = {savingMembers} // 멤버 저장 중
      onSaveMembers = {handleSaveMembers} // 멤버 저장
      shareUserId = {shareUserId} // 공유할 USER_ID
      onShareUserIdChange = {setShareUserId} // 공유 대상 수정
      sharePermission = {sharePermission} // READ | WRITE
      onSharePermissionChange = {setSharePermission} // 공유 권한 수정
      onShare = {handleShare} // 공유 추가
      shares = {shares} // 이 그룹의 공유 목록
      myUserId = {myUserId} // 내 USER_ID. 나가기 구분
      permissionLabel = {permissionLabel} // 권한 표시 문구
      onChangeSharePermission = {handleChangeSharePermission} // 목록에서 권한 수정
      onRevoke = {handleRevoke} // 공유 회수 또는 나가기
      renameDraft = {renameDraft} // 그룹 이름 수정 입력
      onRenameDraftChange = {setRenameDraft} // 그룹 이름 수정
      savingName = {savingName} // 이름 저장 중
      onRenameGroup = {handleRenameGroup} // 그룹 이름 저장
      onDeleteGroup = {handleDeleteGroup} // 그룹 삭제
    />
  );
};

export default MailContactsView;
