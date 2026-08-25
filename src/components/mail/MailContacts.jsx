/** 주소록(연락처·그룹·공유) 화면. */
import { Alert, Button, Form, ListGroup, Nav, Spinner, Tab, Tabs } from "react-bootstrap";
import MailGroupMemberField, { contactKey } from "./MailGroupMemberField";

/** 왼쪽 목록에 쓸 소유/공유 한 줄. */
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

const MailContacts = ({
  loading,
  error,
  onCloseError,
  tab,
  onTab,
  contactForm,
  onContactFormChange,
  onCreateContact,
  contacts,
  onDeleteContact,
  groupName,
  onGroupNameChange,
  onCreateGroup,
  groups,
  selectedGroupId,
  onSelectGroup,
  selectedGroup,
  groupPanelTab,
  onGroupPanelTab,
  canWrite,
  draftMembers,
  onDraftMembersChange,
  membersDirty,
  savingMembers,
  onSaveMembers,
  shareUserId,
  onShareUserIdChange,
  sharePermission,
  onSharePermissionChange,
  onShare,
  shares,
  myUserId,
  permissionLabel,
  onChangeSharePermission,
  onRevoke,
  renameDraft,
  onRenameDraftChange,
  savingName,
  onRenameGroup,
  onDeleteGroup,
}) => {
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
        <Alert variant="danger" className="mb-3" onClose={onCloseError} dismissible>
          {error}
        </Alert>
      )}
      <Tabs activeKey={tab} onSelect={(key) => onTab(key || "contacts")} className="mb-3">
        <Tab eventKey="contacts" title="연락처">
          <Form onSubmit={onCreateContact} className="row g-2 mb-3">
            <div className="col-md-4">
              <Form.Control
                placeholder="이름"
                value={contactForm.displayName}
                onChange={(e) => onContactFormChange("displayName", e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <Form.Control
                type="email"
                placeholder="다른 도메인 이메일"
                value={contactForm.email}
                onChange={(e) => onContactFormChange("email", e.target.value)}
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
                    onClick={() => onDeleteContact(contact.id)}
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
          <Form onSubmit={onCreateGroup} className="d-flex gap-2 mb-3">
            <Form.Control
              placeholder="새 그룹 이름"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
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
                    onClick={() => onSelectGroup(group.id)}
                  >
                    <div className="fw-semibold">{group.name}</div>
                    <div className="small">{groupCaption(group)}</div>
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
                  <div className="mb-3 border-bottom">
                    <Nav
                      variant="tabs"
                      activeKey={groupPanelTab}
                      onSelect={(key) => onGroupPanelTab(key || "members")}
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
                        onChange={onDraftMembersChange}
                      />
                      {canWrite && (
                        <Button
                          disabled={!membersDirty || savingMembers}
                          onClick={onSaveMembers}
                        >
                          {savingMembers ? "저장 중..." : "멤버 저장"}
                        </Button>
                      )}
                    </>
                  )}
                  {groupPanelTab === "share" && (
                    <>
                      {canWrite && (
                        <Form onSubmit={onShare} className="row g-2 mb-3">
                          <div className="col-md-5">
                            <Form.Control
                              placeholder="상대 USER_ID"
                              value={shareUserId}
                              onChange={(e) => onShareUserIdChange(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <Form.Select
                              value={sharePermission}
                              onChange={(e) => onSharePermissionChange(e.target.value)}
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
                                    onChangeSharePermission(share, e.target.value)
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
                                onClick={() => onRevoke(share.id)}
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
                        <Form onSubmit={onRenameGroup} className="mb-4">
                          <Form.Label>그룹 이름</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              value={renameDraft}
                              onChange={(e) => onRenameDraftChange(e.target.value)}
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
                          <Button variant="outline-danger" onClick={onDeleteGroup}>
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

export default MailContacts;
