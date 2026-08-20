import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Form } from "react-bootstrap";
import { API } from "@/api";
import { parseMailAddresses } from "../../utils/mailAttachment";

const AVATAR_COLORS = ["#c4783a", "#3d7a6a", "#5a6b8c", "#8b5a6b", "#6b7a3d", "#7a5a3d"];

function avatarLabel(email) {
  const local = (email.split("@")[0] || email).trim();
  if (!local) {
    return "?";
  }
  const first = [...local][0];

  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

function avatarColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function suggestionLabel(item) {
  if (item.type === "group") {
    return item.displayName || "그룹";
  }
  if (item.displayName) {
    return `${item.displayName} <${item.email}>`;
  }

  return item.email;
}

/**
 * Gmail식 수신자 칩 입력 + 주소록/히스토리 자동완성.
 */
const MailRecipientField = ({
  id,
  label,
  values = [],
  onChange,
  placeholder = "이메일 주소",
  required = false,
  trailing = null,
}) => {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const blurTimer = useRef(null);
  const suggestTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(suggestTimer.current);
      clearTimeout(blurTimer.current);
    };
  }, []);

  const addEmails = (emails) => {
    const next = [...values];
    for (const address of emails) {
      if (address && !next.includes(address)) {
        next.push(address);
      }
    }
    flushSync(() => {
      onChange(next);
      setDraft("");
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
    });
  };

  const commitDraft = (raw = draft) => {
    const parsed = parseMailAddresses(raw);
    if (parsed.length === 0) {
      setDraft("");
      return;
    }
    addEmails(parsed);
  };

  const applySuggestion = (item) => {
    if (!item) {
      return;
    }
    if (item.type === "group") {
      addEmails(item.emails ?? []);
      return;
    }
    if (item.email) {
      addEmails([item.email]);
    }
  };

  const fetchSuggestions = (value) => {
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      try {
        const response = await API.contactAPI.suggestRecipients(value);
        const items = (response.data ?? []).filter((item) => {
          if (item.type === "group") {
            return (item.emails ?? []).some((email) => !values.includes(email));
          }

          return item.email && !values.includes(item.email);
        });
        setSuggestions(items);
        setOpen(items.length > 0);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);
  };

  const removeAt = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && !draft && values.length > 0) {
      e.preventDefault();
      removeAt(values.length - 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (!text || !/[,;\s]/.test(text)) {
      return;
    }
    e.preventDefault();
    commitDraft(`${draft}${text}`);
  };

  return (
    <Form.Group className="mb-3" controlId={id}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <Form.Label className="mb-0">{label}</Form.Label>
        {trailing ? <div className="mail-recipient-trailing">{trailing}</div> : null}
      </div>
      <div className="mail-recipient-wrap">
        <div
          className="mail-recipient-field"
          onClick={() => inputRef.current?.focus()}
        >
          {values.map((email, index) => (
            <span key={`${email}-${index}`} className="mail-recipient-chip">
              <span
                className="mail-recipient-avatar"
                style={{ backgroundColor: avatarColor(email) }}
                aria-hidden
              >
                {avatarLabel(email)}
              </span>
              <span className="mail-recipient-chip-text">{email}</span>
              <button
                type="button"
                className="mail-recipient-chip-remove"
                aria-label={`${email} 제거`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="mail-recipient-input"
            value={draft}
            placeholder={values.length === 0 ? placeholder : ""}
            onChange={(e) => {
              const value = e.target.value;
              setDraft(value);
              fetchSuggestions(value);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (draft || values.length === 0) {
                fetchSuggestions(draft);
              }
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => {
                commitDraft();
                setOpen(false);
              }, 150);
            }}
            onPaste={handlePaste}
            autoComplete="off"
            required={required && values.length === 0 && !draft}
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul className="mail-recipient-suggest" role="listbox">
            {suggestions.map((item, index) => (
              <li key={`${item.type}-${item.id ?? item.email}-${index}`}>
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "mail-recipient-suggest-item active"
                      : "mail-recipient-suggest-item"
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item);
                  }}
                >
                  <span className="mail-recipient-suggest-type">
                    {item.type === "group"
                      ? "그룹"
                      : item.type === "history"
                        ? "최근"
                        : "주소록"}
                  </span>
                  <span className="mail-recipient-suggest-label">
                    {suggestionLabel(item)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Form.Group>
  );
};

export default MailRecipientField;
