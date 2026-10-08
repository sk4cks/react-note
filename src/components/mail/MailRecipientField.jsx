import { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { parseMailAddresses } from "../../utils/mailAttachment";
import { avatarColor, avatarLabel, isImeComposing } from "../../utils/mailField";

/** 자동완성 한 줄에 쓸 이름. */
const suggestionLabel = (item) => {
  if (item.type === "group") {
    return item.displayName || "그룹";
  }

  if (item.displayName) {
    return `${item.displayName} <${item.email}>`;
  }

  return item.email;
};

/** 받는/참조/숨은참조 칩 입력. 주소록 자동완성. */
const MailRecipientField = ({
  id, // input id
  label, // 받는 사람·참조·숨은참조
  values = [], // 칩으로 확정된 주소
  onChange, // 칩 목록 수정
  placeholder = "이메일 주소", // 입력칸 안내
  required = false, // 받는 사람만 필수
  trailing = null, // 참조·숨은참조 버튼
  onSuggest, // 주소록·최근 수신자 조회
}) => {
  const [draft, setDraft] = useState(""); // 아직 칩이 안 된 입력
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false); // 제안 목록
  const [activeIndex, setActiveIndex] = useState(-1); // 키보드로 고른 제안
  const inputRef = useRef(null);
  const blurTimer = useRef(null); // 포커스가 나가도 클릭할 틈을 줌
  const suggestTimer = useRef(null); // debounce
  const suggestReq = useRef(0); // 늦게 온 응답 버리기

  useEffect(() => {
    return () => {
      clearTimeout(suggestTimer.current);
      clearTimeout(blurTimer.current);
    };
  }, []);

  /** 주소를 칩에 넣고 입력칸을 비우는 추가. */
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

  /** 입력 중인 글을 주소로 파싱해 칩에 넣는 확정. */
  const commitDraft = (raw = draft) => {
    const parsed = parseMailAddresses(raw);
    if (parsed.length === 0) {
      setDraft("");
      return;
    }

    addEmails(parsed);
  };

  /** 제안한 그룹·연락처를 수신자 칩에 넣는 추가. */
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

  /** 한글 조합 중에는 바로 치는 주소록·히스토리 제안 조회. */
  const fetchSuggestions = (value, immediate = false) => {
    if (!onSuggest) {
      return;
    }

    clearTimeout(suggestTimer.current);
    const run = async () => {
      const req = (suggestReq.current += 1);

      try {
        const data = await onSuggest(value);
        // 더 최근 입력이 있으면 버리는 응답.
        if (req !== suggestReq.current) {
          return;
        }

        // 이미 칩에 넣은 주소·그룹을 빼는 제안 목록.
        const items = (data ?? []).filter((item) => {
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

    // 한글 조합 중 debounce를 피해야 ㄱ이 나가는 입력.
    if (immediate) {
      run();
      return;
    }

    suggestTimer.current = setTimeout(run, 200);
  };

  /** 칩 삭제. */
  const removeAt = (index) => {
    onChange(values.filter((_, i) => i !== index));
  };

  /** 화살표·Enter·Backspace. 한글 조합 중에는 무시. */
  const handleKeyDown = (e) => {
    if (isImeComposing(e)) {
      return;
    }

    // 제안이 열려 있으면 칩이 아니라 목록을 움직이는 화살표·Enter.
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

    // 쉼표·Enter로 입력 중인 글을 칩으로 확정.
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

  /** 여러 주소가 붙은 붙여넣기를 바로 나누는 칩 분리. */
  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (!text || !/[,;\s]/.test(text)) {
      return;
    }

    e.preventDefault();
    commitDraft(`${draft}${text}`);
  };

  return (
    <Form.Group className="mb-3" controlId = {id}>

      {/* 라벨과 참조 버튼 */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <Form.Label className="mb-0">{label}</Form.Label>
        {trailing ? <div className="mail-recipient-trailing">{trailing}</div> : null}
      </div>

      {/* 칩과 입력 */}
      <div className="mail-recipient-wrap">
        <div
          className="mail-recipient-field"
          onClick = {() => inputRef.current?.focus()}
        >
          {values.map((email, index) => (
            <span key = {`${email}-${index}`} className="mail-recipient-chip">
              <span
                className="mail-recipient-avatar"
                style = {{ backgroundColor: avatarColor(email) }}
                aria-hidden
              >
                {avatarLabel(email)}
              </span>
              <span className="mail-recipient-chip-text">{email}</span>
              <button
                type="button"
                className="mail-recipient-chip-remove"
                aria-label = {`${email} 제거`}
                onClick = {(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref = {inputRef}
            id = {id}
            type="text"
            className="mail-recipient-input"
            value = {draft}
            placeholder = {values.length === 0 ? placeholder : ""}
            onChange = {(e) => {
              const value = e.target.value;
              setDraft(value);
              fetchSuggestions(value, Boolean(e.nativeEvent.isComposing));
            }}
            onCompositionEnd = {(e) => {
              fetchSuggestions(e.currentTarget.value, true);
            }}
            onKeyDown = {handleKeyDown}
            onFocus = {() => {
              if (draft || values.length === 0) {
                fetchSuggestions(draft);
              }
            }}
            onBlur = {() => {
              blurTimer.current = setTimeout(() => {
                commitDraft();
                setOpen(false);
              }, 150);
            }}
            onPaste = {handlePaste}
            autoComplete="off"
            required = {required && values.length === 0 && !draft}
          />
        </div>

        {/* 자동완성 */}
        {open && suggestions.length > 0 && (
          <ul className="mail-recipient-suggest" role="listbox">
            {suggestions.map((item, index) => (
              <li key = {`${item.type}-${item.id ?? item.email}-${index}`}>
                <button
                  type="button"
                  className = {
                    index === activeIndex
                      ? "mail-recipient-suggest-item active"
                      : "mail-recipient-suggest-item"
                  }
                  onMouseDown = {(e) => {
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
