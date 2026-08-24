import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  ListGroup,
  Nav,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { API } from "@/api";
import MailGroupMemberField, {
  contactKey,
} from "../../components/mail/MailGroupMemberField";

const emptyContact = { displayName: "", email: "" };

function splitMemberKeys(members) {
  const contactIds = [];
  const accountUserSeqs = [];
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
}

function membersSignature(members) {
  return (members ?? [])
    .map((member) => contactKey(member))
    .sort()
    .join("|");
}

function permissionLabel(permission) {
  return permission === "WRITE" ? "수정" : "읽기";
}

const MailContactsView = () => {
  const [tab, setTab] = useState("contacts");
  const [groupPanelTab, setGroupPanelTab] = useState("members");
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [shareUserId, setShareUserId] = useState("");
  const [sharePermission, setSharePermission] = useState("READ");
  const [shares, setShares] = useState([]);
  const [draftMembers, setDraftMembers] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [myUserId, setMyUserId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const canWrite =
    !!selectedGroup && (selectedGroup.owned || selectedGroup.permission === "WRITE");
  const membersDirty =
    canWrite &&
    membersSignature(draftMembers) !== membersSignature(selectedGroup?.members ?? []);

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
    API.contactAPI
      .listShares(selectedGroupId)
      .then((response) => setShares(response.data ?? []))
      .catch(() => setShares([]));
  }, [selectedGroupId]);

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

  const handleDeleteContact = async (id) => {
    try {
      await API.contactAPI.deleteContact(id);
      await load();
    } catch {
      setError("연락처를 삭제하지 못했습니다.");
    }
  };

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

  const handleSaveMembers = async () => {
    if (!selectedGroupId || !membersDirty) {
      return;
    }
    setSavingMembers(true);
    try {
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
      let book = contacts;
      if (pending.length > 0) {
        const listed = await API.contactAPI.listContacts();
        book = listed.data ?? [];
        setContacts(book);
      }
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

  const applyShare = async (sharedWithUserId, permission) => {
    const response = await API.contactAPI.shareGroup(selectedGroup.id, {
      sharedWithUserId,
      permission,
    });
    const saved = response.data;
    setShares((prev) => {
      const index = prev.findIndex((share) => share.id === saved.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedGroup) {
      return;
    }
    const targetId = shareUserId.trim();
    if (!targetId) {
      return;
    }
    if (targetId === selectedGroup.ownerUserId || targetId === myUserId) {
      window.alert("등록자나 본인에게는 공유할 수 없습니다.");
      return;
    }
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

  const handleRevoke = async (shareId) => {
    if (!selectedGroup) {
      return;
    }
    const revoked = shares.find((share) => share.id === shareId);
    const leaving =
      !selectedGroup.owned &&
      !!myUserId &&
      revoked?.sharedWithUserId === myUserId;
    try {
      await API.contactAPI.revokeShare(selectedGroup.id, shareId);
      if (leaving) {
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

  const groupCaption = (group) => {
    if (group.owned) {
      return "내 그룹";
    }
    const from = group.sharedByUserId || group.ownerUserId;
    const prefix = from ? `${from}가 공유` : "공유받음";
    if (group.permission === "WRITE") {
      return `${prefix} · 수정 가능`;
    }
    return `${prefix} · 읽기`;
  };

  const groupList = (
    <ListGroup>
      {groups.map((group) => (
        <ListGroup.Item
          key={group.id}
          action
          active={group.id === selectedGroupId}
          onClick={() => setSelectedGroupId(group.id)}
        >
          <div className="fw-semibold">{group.name}</div>
          <div className="small">{groupCaption(group)}</div>
        </ListGroup.Item>
      ))}
      {groups.length === 0 && (
        <ListGroup.Item className="text-muted">그룹이 없습니다.</ListGroup.Item>
      )}
    </ListGroup>
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" /> 주소록 불러오는 중...
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-3">주소록</h5>
      {error && (
        <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      <Tabs activeKey={tab} onSelect={(key) => setTab(key || "contacts")} className="mb-3">
        <Tab eventKey="contacts" title="연락처">
          <Form onSubmit={handleCreateContact} className="row g-2 mb-3">
            <div className="col-md-4">
              <Form.Control
                placeholder="이름"
                value={contactForm.displayName}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </div>
            <div className="col-md-5">
              <Form.Control
                type="email"
                placeholder="다른 도메인 이메일"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="col-md-3">
              <Button type="submit" className="w-100">
                추가
              </Button>
            </div>
          </Form>
          <p className="small text-muted mb-2">
            가입된 계정은 자동으로 표시됩니다. 다른 도메인 메일은 위에서 추가하세요.
          </p>
          <ListGroup>
            {contacts.map((contact) => (
              <ListGroup.Item
                key={contactKey(contact)}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="fw-semibold">
                    {contact.displayName || contact.email}
                    {contact.fromAccount ? (
                      <span className="badge text-bg-secondary ms-2">계정</span>
                    ) : null}
                  </div>
                  {contact.displayName ? (
                    <div className="small text-muted">{contact.email}</div>
                  ) : null}
                </div>
                {!contact.fromAccount && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    삭제
                  </Button>
                )}
              </ListGroup.Item>
            ))}
            {contacts.length === 0 && (
              <ListGroup.Item className="text-muted">연락처가 없습니다.</ListGroup.Item>
            )}
          </ListGroup>
        </Tab>
        <Tab eventKey="groups" title="그룹·공유">
          <Form onSubmit={handleCreateGroup} className="d-flex gap-2 mb-3">
            <Form.Control
              placeholder="새 그룹 이름"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <Button type="submit">그룹 만들기</Button>
          </Form>
          <div className="row g-3">
            <div className="col-md-4">{groupList}</div>
            <div className="col-md-8">
              {!selectedGroup ? (
                <p className="text-muted">그룹을 선택하세요.</p>
              ) : (
                <>
                  <div className="mb-3 border-bottom">
                    <Nav
                      variant="tabs"
                      activeKey={groupPanelTab}
                      onSelect={(key) => setGroupPanelTab(key || "members")}
                      className="border-bottom-0 mb-0"
                    >
                      <Nav.Item>
                        <Nav.Link eventKey="members">멤버</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="share">공유</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="info">정보</Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </div>
                  {groupPanelTab === "members" && (
                    <>
                      <MailGroupMemberField
                        members={canWrite ? draftMembers : selectedGroup.members ?? []}
                        candidates={contacts}
                        readOnly={!canWrite}
                        onChange={setDraftMembers}
                      />
                      {canWrite && (
                        <Button
                          disabled={!membersDirty || savingMembers}
                          onClick={handleSaveMembers}
                        >
                          {savingMembers ? "저장 중..." : "멤버 저장"}
                        </Button>
                      )}
                    </>
                  )}
                  {groupPanelTab === "share" && (
                    <>
                      {canWrite && (
                        <Form onSubmit={handleShare} className="row g-2 mb-3">
                          <div className="col-md-5">
                            <Form.Control
                              placeholder="상대 USER_ID"
                              value={shareUserId}
                              onChange={(e) => setShareUserId(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <Form.Select
                              value={sharePermission}
                              onChange={(e) => setSharePermission(e.target.value)}
                            >
                              <option value="READ">읽기</option>
                              <option value="WRITE">수정</option>
                            </Form.Select>
                          </div>
                          <div className="col-md-4">
                            <Button type="submit" className="w-100">
                              공유
                            </Button>
                          </div>
                        </Form>
                      )}
                      <ListGroup>
                        {selectedGroup.ownerUserId && (
                          <ListGroup.Item>
                            {selectedGroup.ownerUserId} · 등록자
                          </ListGroup.Item>
                        )}
                        {shares.map((share) => (
                          <ListGroup.Item
                            key={share.id}
                            className="d-flex justify-content-between align-items-center gap-2"
                          >
                            <div className="d-flex align-items-center gap-2 min-w-0">
                              <span>{share.sharedWithUserId}</span>
                              {canWrite && share.sharedWithUserId !== myUserId ? (
                                <Form.Select
                                  size="sm"
                                  style={{ width: "5.5rem" }}
                                  value={share.permission}
                                  onChange={(e) =>
                                    handleChangeSharePermission(share, e.target.value)
                                  }
                                >
                                  <option value="READ">읽기</option>
                                  <option value="WRITE">수정</option>
                                </Form.Select>
                              ) : (
                                <span className="text-muted">
                                  · {permissionLabel(share.permission)}
                                </span>
                              )}
                            </div>
                            {(canWrite || share.sharedWithUserId === myUserId) && (
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => handleRevoke(share.id)}
                              >
                                회수
                              </Button>
                            )}
                          </ListGroup.Item>
                        ))}
                        {!selectedGroup.ownerUserId && shares.length === 0 && (
                          <ListGroup.Item className="text-muted">
                            공유 대상이 없습니다.
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </>
                  )}
                  {groupPanelTab === "info" && (
                    <>
                      {selectedGroup.owned ? (
                        <Form onSubmit={handleRenameGroup} className="mb-4">
                          <Form.Label>그룹 이름</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              required
                              maxLength={120}
                              disabled={savingName}
                            />
                            <Button
                              type="submit"
                              className="flex-shrink-0"
                              disabled={
                                savingName ||
                                !renameDraft.trim() ||
                                renameDraft.trim() === selectedGroup.name
                              }
                            >
                              {savingName ? "저장 중..." : "저장"}
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <div className="mb-4">
                          <div className="text-muted small">그룹 이름</div>
                          <div className="fw-semibold">{selectedGroup.name}</div>
                        </div>
                      )}
                      {selectedGroup.ownerUserId && (
                        <div className="mb-4">
                          <div className="text-muted small">등록자</div>
                          <div>{selectedGroup.ownerUserId}</div>
                        </div>
                      )}
                      <div className="mb-4">
                        <div className="text-muted small">권한</div>
                        <div>{groupCaption(selectedGroup)}</div>
                      </div>
                      {selectedGroup.owned && (
                        <>
                          <hr />
                          <Button variant="outline-danger" onClick={handleDeleteGroup}>
                            그룹 삭제
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default MailContactsView;
