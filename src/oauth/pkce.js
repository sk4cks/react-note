const PKCE_VERIFIER_KEY = "oauth_code_verifier";
const PKCE_STATE_KEY = "oauth_state"; // CSRF. 콜백 query와 같아야 함

/** PKCE용 URL-safe base64. */
const base64UrlEncode = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** PKCE code_verifier를 만든다. */
export const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

/** verifier의 SHA-256 challenge. */
export const generateCodeChallenge = async (verifier) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
};

/** CSRF 방지용 state. */
export const generateState = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

/** 콜백에서 쓸 verifier·state를 저장한다. */
export const storePkceSession = ({ codeVerifier, state }) => {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(PKCE_STATE_KEY, state);
};

/** 저장해 둔 verifier·state를 읽고 지운다. */
export const consumePkceSession = () => {
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const state = sessionStorage.getItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
  return { codeVerifier, state };
};
