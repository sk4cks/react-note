import axios from "axios";
import { env } from "@/api/ApiEnv.js";

const ACCESS_TOKEN_KEY = "accessToken";
const SESSION_HINT_KEY = "sessionActive"; // refresh cookie가 있을 수 있음. JS는 쿠키를 못 읽음

const axiosDefaults = {
  baseURL: `${env.BASE_API_URL}${env.AUTHORIZATION_API_CONTEXT_PATH}`,
  withCredentials: true,
};

/** sessionStorage에서 access token을 읽는다. */
export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

/** refresh cookie가 있을 수 있다는 표시. JS에서 쿠키는 못 읽는다. */
export const hasSessionHint = () => sessionStorage.getItem(SESSION_HINT_KEY) === "1";

/** 로그인 세션이 있다고 표시한다. refresh cookie만 있을 때 쓴다. */
export const markSessionActive = () => {
  sessionStorage.setItem(SESSION_HINT_KEY, "1");
};

/** 로그인 응답의 access_token을 저장한다. */
export const saveAccessToken = ({ access_token }) => {
  if (access_token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    markSessionActive();
  }
};

/** access token만 바꾸거나 지운다. */
export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/** 로컬 토큰을 지우고 서버 로그아웃을 시도한다. */
export const clearAuth = async () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_HINT_KEY);

  try {
    await refreshClient.post("/api/auth/logout");

  } catch {
    /* cookie 없거나 API down — 로컬만 정리 */
  }
};

const httpClient = axios.create(axiosDefaults);

/** refresh 호출은 interceptor 없이 (무한 루프 방지) */
const refreshClient = axios.create(axiosDefaults);

let refreshPromise = null; // 동시에 여러 401이 나도 refresh는 하나

/** refresh cookie로 access token을 다시 받는다. */
const refreshAccessToken = async () => {
  const { data } = await refreshClient.post("/api/auth/refresh");
  saveAccessToken(data);
  return data.access_token;
};

/** 동시에 여러 401이 나도 refresh는 한 번만 한다. */
export const refreshAccessTokenOnce = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

/** 요청마다 Bearer access token을 붙인다. */
httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** 401이면 refresh 한 번 후 원래 요청을 다시 보낸다. */
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("/api/auth/refresh");
    const isAuthLogin = originalRequest?.url?.includes("/api/auth/login");
    const isAuthToken = originalRequest?.url?.includes("/api/auth/token");
    const isAuthLogout = originalRequest?.url?.includes("/api/auth/logout");

    // login/token/refresh는 401이어도 재시도하면 루프가 난다.
    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshCall ||
      isAuthLogin ||
      isAuthToken ||
      isAuthLogout
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // 새 access token으로 원래 요청만 한 번 더 보낸다.
      const newAccessToken = await refreshAccessTokenOnce();
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return httpClient(originalRequest);

    } catch (refreshError) {
      await clearAuth();
      return Promise.reject(refreshError);
    }
  }
);

export default httpClient;
