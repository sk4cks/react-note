const AVATAR_COLORS = ["#c4783a", "#3d7a6a", "#5a6b8c", "#8b5a6b", "#6b7a3d", "#7a5a3d"];

/** 칩 아바타에 넣을 첫 글자. */
export const avatarLabel = (email) => {
  const local = (email.split("@")[0] || email).trim();
  if (!local) {
    return "?";
  }
  const first = [...local][0];

  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
};

/** 이메일을 색으로 나눠 아바타 배경을 고른다. */
export const avatarColor = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/** 한글 IME 조합 중인지. Enter로 커밋하면 안 될 때 쓴다. */
export const isImeComposing = (event) => {
  return event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229;
};
