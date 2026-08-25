import { useEffect, useMemo, useRef, useState } from "react";
import { parseMailAddresses } from "../../utils/mailAttachment";
import { koreanMatches } from "../../utils/koreanMatch";
import { avatarColor, avatarLabel, isImeComposing } from "../../utils/mailField";

const SUGGEST_LIMIT = 8; // 드롭다운에 보여줄 후보 수

/** 칩 키. pending / 계정 / 개인 연락처를 구분한다. */
const contactKey = (contact) => {
  if (contact.pending) {
    return `p:${(contact.email || "").toLowerCase()}`;
  }
  return contact.fromAccount ? `a:${contact.accountUserSeq}` : `c:${contact.id}`;
};

/** 칩에 보여줄 이름. 없으면 이메일. */
const contactLabel = (contact) => {
  return contact.displayName || contact.email;
};

/** 입력이 새 이메일 한 개처럼 보이면 그 주소를 돌려준다. */
const looksLikeEmail = (value) => {
  const emails = parseMailAddresses(value);
  if (emails.length !== 1) {
    return null;
  }
  const email = emails[0];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return email;
};

/** 이름 또는 이메일이 정확히 같은 후보. */
const findExact = (candidates, raw, selectedKeys) => {
  const needle = raw.trim().toLowerCase();
  if (!needle) {
    return null;
  }

  return (
    candidates.find((contact) => {
      if (selectedKeys.has(contactKey(contact))) {
        return false;
      }
      return (
        contact.email.toLowerCase() === needle ||
        (contact.displayName || "").toLowerCase() === needle
      );
    }) ?? null
  );
};

/**
 * 그룹 멤버: 검색해 고르거나, 없는 이메일은 저장 전까지 임시로 넣는다.
 */
const MailGroupMemberField = ({
  members = [],
  candidates = [],
  readOnly = false,
  onChange,
}) => {
  const [draft, setDraft] = useState(""); // 아직 칩이 안 된 입력
  const [open, setOpen] = useState(false); // 제안 목록
  const [activeIndex, setActiveIndex] = useState(-1); // 키보드로 고른 제안
  const inputRef = useRef(null);
  const blurTimer = useRef(null); // 포커스가 나가도 클릭할 틈을 줌

  const selectedKeys = useMemo(() => new Set(members.map(contactKey)), [members]); // 이미 넣은 칩
  const membersRef = useRef(members); // 최신 멤버. 콜백에서 읽음
  membersRef.current = members;
  /** 입력에 맞는, 아직 안 넣은 후보. */
  const suggestions = useMemo(() => {
    return candidates
      .filter(
        (contact) =>
          !selectedKeys.has(contactKey(contact)) &&
          koreanMatches(draft, contact.displayName, contact.email)
      )
      .slice(0, SUGGEST_LIMIT);
  }, [candidates, draft, selectedKeys]);
  /** 주소록에 없는 새 이메일이면 그 주소를 돌려준다. */
  const newEmail = useMemo(() => {
    const email = looksLikeEmail(draft);
    if (!email) {
      return null;
    }
    const lower = email.toLowerCase();
    if (members.some((member) => member.email.toLowerCase() === lower)) {
      return null;
    }
    if (candidates.some((contact) => contact.email.toLowerCase() === lower)) {
      return null;
    }

    return email;
  }, [candidates, draft, members]);
  /** 후보 + (있으면) 새 이메일 행. */
  const menuItems = useMemo(() => {
    const items = suggestions.map((contact) => ({ kind: "contact", contact }));
    if (newEmail) {
      items.push({ kind: "new", email: newEmail });
    }

    return items;
  }, [newEmail, suggestions]);

  useEffect(() => {
    return () => clearTimeout(blurTimer.current);
  }, []);

  /** 이미 없는 멤버면 칩에 넣는다. */
  const addMember = (contact) => {
    const current = membersRef.current;
    if (!contact || current.some((member) => contactKey(member) === contactKey(contact))) {
      return;
    }

    const next = [...current, contact];
    membersRef.current = next;
    onChange(next);
    setDraft("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  /** 칩을 뺀다. */
  const removeAt = (index) => {
    const next = membersRef.current.filter((_, i) => i !== index);
    membersRef.current = next;
    onChange(next);
  };

  /** 없는 이메일은 저장 전까지 pending 칩으로 넣는다. */
  const addNewEmail = (email) => {
    if (!email) {
      return;
    }
    addMember({ email, displayName: "", fromAccount: false, pending: true });
  };

  /** Enter/쉼표로 초안을 멤버로 확정한다. */
  const commitDraft = ({ preferHighlight = false } = {}) => {
    const exact = findExact(candidates, draft, selectedKeys);
    if (exact) {
      addMember(exact);
      return;
    }
    // Enter로 고른 하이라이트가 있으면 그걸 넣는다.
    if (preferHighlight && activeIndex >= 0 && menuItems[activeIndex]) {
      const item = menuItems[activeIndex];
      if (item.kind === "new") {
        addNewEmail(item.email);
      } else {
        addMember(item.contact);
      }
      return;
    }
    if (newEmail) {
      addNewEmail(newEmail);
      return;
    }
    // 후보가 하나면 Enter만으로 넣는다.
    if (suggestions.length === 1) {
      addMember(suggestions[0]);
    }
  };

  /** 화살표·Enter·Backspace. 한글 조합 중에는 무시. */
  const handleKeyDown = (e) => {
    if (isImeComposing(e)) {
      return;
    }

    // 제안이 열려 있으면 화살표는 목록만 움직인다.
    if (open && menuItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % menuItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? menuItems.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }

    // 쉼표·Enter로 초안을 멤버로 확정한다. Enter는 하이라이트를 우선한다.
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      commitDraft({ preferHighlight: e.key === "Enter" && open && activeIndex >= 0 });
      return;
    }
    if (e.key === "Backspace" && !draft && members.length > 0 && !readOnly) {
      e.preventDefault();
      removeAt(members.length - 1);
    }
  };

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="fw-semibold small mb-0">멤버</div>
        <div className="small text-muted">{members.length}명</div>
      </div>
      <div className="mail-recipient-wrap">
        <div
          className="mail-recipient-field"
          onClick={() => {
            if (!readOnly) {
              inputRef.current?.focus();
            }
          }}
        >
          {members.map((contact, index) => (
            <span
              key={contactKey(contact)}
              className="mail-recipient-chip"
              title={contact.email}
            >
              <span
                className="mail-recipient-avatar"
                style={{ backgroundColor: avatarColor(contact.email) }}
                aria-hidden
              >
                {avatarLabel(contact.email)}
              </span>
              <span className="mail-recipient-chip-text">{contactLabel(contact)}</span>
              {!readOnly && (
                <button
                  type="button"
                  className="mail-recipient-chip-remove"
                  aria-label={`${contactLabel(contact)} 제거`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {!readOnly && (
            <input
              ref={inputRef}
              type="text"
              className="mail-recipient-input"
              value={draft}
              placeholder={members.length === 0 ? "이름 또는 이메일" : "추가"}
              onChange={(e) => {
                const value = e.target.value;
                setDraft(value);
                setOpen(true);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setOpen(true);
                setActiveIndex(menuItems.length > 0 ? 0 : -1);
              }}
              onBlur={() => {
                blurTimer.current = setTimeout(() => {
                  if (looksLikeEmail(draft)) {
                    commitDraft();
                  }
                  setOpen(false);
                }, 150);
              }}
              autoComplete="off"
            />
          )}
        </div>
        {!readOnly && open && menuItems.length > 0 && (
          <ul className="mail-recipient-suggest" role="listbox">
            {menuItems.map((item, index) => (
              <li key={item.kind === "new" ? `new:${item.email}` : contactKey(item.contact)}>
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "mail-recipient-suggest-item active"
                      : "mail-recipient-suggest-item"
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (item.kind === "new") {
                      addNewEmail(item.email);
                    } else {
                      addMember(item.contact);
                    }
                  }}
                >
                  <span className="mail-recipient-suggest-type">
                    {item.kind === "new"
                      ? "추가"
                      : item.contact.fromAccount
                        ? "계정"
                        : "연락처"}
                  </span>
                  <span className="mail-recipient-suggest-label">
                    {item.kind === "new"
                      ? item.email
                      : item.contact.displayName
                        ? `${item.contact.displayName} <${item.contact.email}>`
                        : item.contact.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!readOnly && (
        <div className="small text-muted mt-1">
          주소록에서 고르거나 이메일을 입력하세요. 아래 멤버 저장을 눌러야 그룹에 반영됩니다.
        </div>
      )}
    </div>
  );
};

export default MailGroupMemberField;
export { contactKey };
