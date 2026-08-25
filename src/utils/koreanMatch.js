const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG_EXPAND = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ",
  "ㅗ", "ㅗㅏ", "ㅗㅐ", "ㅗㅣ", "ㅛ",
  "ㅜ", "ㅜㅓ", "ㅜㅔ", "ㅜㅣ", "ㅠ",
  "ㅡ", "ㅡㅣ", "ㅣ",
];
const JONG_EXPAND = [
  "",
  "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ",
  "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ",
  "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const COMPAT_CONSONANT = [
  "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄸ", "ㄹ",
  "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ",
  "ㅁ", "ㅂ", "ㅃ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/** 비교용으로 공백을 빼고 소문자로 맞춘다. */
const normalize = (value) => {
  if (!value) {
    return "";
  }
  return value.normalize("NFC").toLowerCase().replace(/\s+/g, "");
};

/** 한글 음절·자모를 풀어 자모 문자열로 바꾼다. */
const toJamo = (cp) => {
  if (cp >= 0xac00 && cp <= 0xd7a3) {
    const s = cp - 0xac00;
    const cho = Math.floor(s / 588);
    const jung = Math.floor((s % 588) / 28);
    const jong = s % 28;
    return CHO[cho] + JUNG_EXPAND[jung] + JONG_EXPAND[jong];
  }
  // ㄱㄴㄷ / ㅏㅑ / 옛한글 자모는 음절이 아니라 따로 펼친다.
  if (cp >= 0x3131 && cp <= 0x314e) {
    return COMPAT_CONSONANT[cp - 0x3131];
  }
  if (cp >= 0x314f && cp <= 0x3163) {
    return JUNG_EXPAND[cp - 0x314f];
  }
  if (cp >= 0x1100 && cp <= 0x1112) {
    return CHO[cp - 0x1100];
  }
  if (cp >= 0x1161 && cp <= 0x1175) {
    return JUNG_EXPAND[cp - 0x1161];
  }
  if (cp >= 0x11a8 && cp <= 0x11c2) {
    return JONG_EXPAND[cp - 0x11a8 + 1];
  }
  return String.fromCodePoint(cp);
};

/** 글자마다 자모로 풀어 배열로 만든다. */
const jamoChars = (text) => {
  return [...text].map((ch) => toJamo(ch.codePointAt(0)));
};

/** start부터 쿼리 자모가 접두로 이어지는지. */
const matchFrom = (query, hay, start) => {
  let qi = 0;
  let hi = start;
  while (qi < query.length) {
    if (hi >= hay.length || !hay[hi].startsWith(query[qi])) {
      return false;
    }
    qi += 1;
    hi += 1;
  }
  return true;
};

/** 부분 문자열 또는 자모 접두가 hay에 있는지. */
const contains = (query, hay) => {
  if (hay.includes(query)) {
    return true;
  }
  // ㄱ / 기처럼 음절이 덜 된 입력은 자모 접두로 본다.
  const hayJamo = jamoChars(hay);
  const queryJamo = jamoChars(query);
  for (let start = 0; start < hayJamo.length; start += 1) {
    if (matchFrom(queryJamo, hayJamo, start)) {
      return true;
    }
  }
  return false;
};

/** 한글 부분 입력·초성 검색. ㄱ / 기 / 김 / ㄱㅊㅅ 모두 김철수를 찾는다. */
export const koreanMatches = (query, ...fields) => {
  const needle = normalize(query);
  if (!needle) {
    return true;
  }
  return fields.some((field) => field && contains(needle, normalize(field)));
};
