import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  ListGroup,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { API } from "@/api";

const emptyContact = { displayName: "", email: "" };

const MailContactsView = () => {
  const [tab, setTab] = useState("contacts");
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [shareUserId, setShareUserId] = useState("");
  const [sharePermission, setSharePermission] = useState("READ");
  const [shares, setShares] = useState([]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;

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
  }, [load]);

  useEffect(() => {
    if (!selectedGroup) {
      setMemberIds([]);
      setShares([]);
      return;
    }
    setMemberIds((selectedGroup.members ?? []).map((member) => member.id));
    if (selectedGroup.owned) {
      API.contactAPI
        .listShares(selectedGroup.id)
        .then((response) => setShares(response.data ?? []))
        .catch(() => setShares([]));
    } else {
      setShares([]);
    }
  }, [selectedGroup]);

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
    if (!selectedGroup) {
      return;
    }
    try {
      await API.contactAPI.replaceMembers(selectedGroup.id, memberIds);
      await load();
    } catch {
      setError("그룹 멤버를 저장하지 못했습니다.");
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedGroup) {
      return;
    }
    try {
      await API.contactAPI.shareGroup(selectedGroup.id, {
        sharedWithUserId: shareUserId,
        permission: sharePermission,
      });
      setShareUserId("");
      const response = await API.contactAPI.listShares(selectedGroup.id);
      setShares(response.data ?? []);
    } catch {
      setError("그룹을 공유하지 못했습니다. USER_ID를 확인해 주세요.");
    }
  };

  const handleRevoke = async (shareId) => {
    if (!selectedGroup) {
      return;
    }
    try {
      await API.contactAPI.revokeShare(selectedGroup.id, shareId);
      setShares((prev) => prev.filter((share) => share.id !== shareId));
    } catch {
      setError("공유를 회수하지 못했습니다.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup?.owned) {
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
                placeholder="email@example.com"
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
          <ListGroup>
            {contacts.map((contact) => (
              <ListGroup.Item
                key={contact.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="fw-semibold">
                    {contact.displayName || contact.email}
                  </div>
                  {contact.displayName ? (
                    <div className="small text-muted">{contact.email}</div>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  삭제
                </Button>
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
            <div className="col-md-4">
              <ListGroup>
                {groups.map((group) => (
                  <ListGroup.Item
                    key={group.id}
                    action
                    active={group.id === selectedGroupId}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <div className="fw-semibold">{group.name}</div>
                    <div className="small">
                      {group.owned ? "내 그룹" : "공유받음"} · {group.permission}
                    </div>
                  </ListGroup.Item>
                ))}
                {groups.length === 0 && (
                  <ListGroup.Item className="text-muted">그룹이 없습니다.</ListGroup.Item>
                )}
              </ListGroup>
            </div>
            <div className="col-md-8">
              {!selectedGroup ? (
                <p className="text-muted">그룹을 선택하세요.</p>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">{selectedGroup.name}</h6>
                    {selectedGroup.owned && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={handleDeleteGroup}
                      >
                        그룹 삭제
                      </Button>
                    )}
                  </div>
                  {selectedGroup.owned && (
                    <>
                      <div className="mb-2 fw-semibold small">멤버</div>
                      <ListGroup className="mb-3">
                        {contacts.map((contact) => (
                          <ListGroup.Item key={contact.id}>
                            <Form.Check
                              type="checkbox"
                              id={`member-${contact.id}`}
                              label={`${contact.displayName || contact.email} <${contact.email}>`}
                              checked={memberIds.includes(contact.id)}
                              onChange={(e) => {
                                setMemberIds((prev) =>
                                  e.target.checked
                                    ? [...prev, contact.id]
                                    : prev.filter((id) => id !== contact.id)
                                );
                              }}
                            />
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      <Button className="mb-3" onClick={handleSaveMembers}>
                        멤버 저장
                      </Button>
                    </>
                  )}
                  {!selectedGroup.owned && (
                    <ListGroup className="mb-3">
                      {(selectedGroup.members ?? []).map((member) => (
                        <ListGroup.Item key={member.id}>
                          {member.displayName || member.email} &lt;{member.email}&gt;
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {selectedGroup.owned && (
                    <>
                      <div className="mb-2 fw-semibold small">공유</div>
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
                            <option value="READ">READ</option>
                            <option value="WRITE">WRITE</option>
                          </Form.Select>
                        </div>
                        <div className="col-md-4">
                          <Button type="submit" className="w-100">
                            공유
                          </Button>
                        </div>
                      </Form>
                      <ListGroup>
                        {shares.map((share) => (
                          <ListGroup.Item
                            key={share.id}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <span>
                              {share.sharedWithUserId} · {share.permission}
                            </span>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => handleRevoke(share.id)}
                            >
                              회수
                            </Button>
                          </ListGroup.Item>
                        ))}
                        {shares.length === 0 && (
                          <ListGroup.Item className="text-muted">
                            공유 대상이 없습니다.
                          </ListGroup.Item>
                        )}
                      </ListGroup>
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
