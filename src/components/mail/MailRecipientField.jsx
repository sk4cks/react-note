import { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { API } from "@/api";
import { parseMailAddresses } from "../../utils/mailAttachment";
import { avatarColor, avatarLabel, isImeComposing } from "../../utils/mailField";

function suggestionLabel(item) {
  if (item.type === "group") {
    return item.displayName || "그룹";
  }
  if (item.displayName) {
    return `${item.displayName} <${item.email}>`;
  }

  return item.email;
}

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
  const suggestReq = useRef(0);

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
    onChange(next);
    setDraft("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
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

  const fetchSuggestions = (value, immediate = false) => {
    clearTimeout(suggestTimer.current);
    const run = async () => {
      const req = (suggestReq.current += 1);
      try {
        const response = await API.contactAPI.suggestRecipients(value);
        if (req !== suggestReq.current) {
          return;
        }
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
        if (req !== suggestReq.current) {
          return;
        }
        setSuggestions([]);
        setOpen(false);
      }
    };
    if (immediate) {
      run();
      return;
    }
    suggestTimer.current = setTimeout(run, 200);
  };

  const removeAt = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (isImeComposing(e)) {
      return;
    }
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
              fetchSuggestions(value, Boolean(e.nativeEvent.isComposing));
            }}
            onCompositionEnd={(e) => {
              fetchSuggestions(e.currentTarget.value, true);
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
