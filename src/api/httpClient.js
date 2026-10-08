import axios from "axios";
import { env } from "@/api/ApiEnv.js";

const ACCESS_TOKEN_KEY = "accessToken";
const SESSION_HINT_KEY = "sessionActive"; // JS에서는 쿠키를 읽을 수 없어, refresh cookie가 있을 수 있다는 표시

const axiosDefaults = {
  baseURL: `${env.BASE_API_URL}${env.AUTHORIZATION_API_CONTEXT_PATH}`,
  withCredentials: true,
};

/** sessionStorage에 들어 있는 access token 조회. */
export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

/** JS는 쿠키를 읽지 못하고, refresh cookie가 있을 수 있는지만 보는 확인. */
export const hasSessionHint = () => sessionStorage.getItem(SESSION_HINT_KEY) === "1";

/** access token 없이 refresh cookie만 남은 경우의 로그인 상태 표시. */
export const markSessionActive = () => {
  sessionStorage.setItem(SESSION_HINT_KEY, "1");
};

/** 로그인 응답으로 온 access_token 저장. */
export const saveAccessToken = ({ access_token }) => {
  if (access_token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    markSessionActive();
  }
};

/** 다른 로그인 정보는 그대로 두고 access token만 교체하거나 삭제. */
export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/** 로컬 토큰을 지우고 서버 로그아웃도 시도. */
export const clearAuth = async () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_HINT_KEY);

  try {
    await refreshClient.post("/api/auth/logout");

  } catch {
    /* 쿠키가 없거나 API가 내려간 경우 로컬만 정리 */
  }
};

const httpClient = axios.create(axiosDefaults);

/** interceptor를 피해서 무한 루프를 막는 refresh 전용 클라이언트. */
const refreshClient = axios.create(axiosDefaults);

let refreshPromise = null; // 401이 동시에 여러 개여도 하나로 모으는 refresh

/** refresh cookie로 다시 받는 access token 재발급. */
const refreshAccessToken = async () => {
  const { data } = await refreshClient.post("/api/auth/refresh");

  saveAccessToken(data);

  return data.access_token;
};

/** 401이 몰려도 한 번만 실행하고 결과를 같이 쓰는 refresh. */
export const refreshAccessTokenOnce = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

/** 나가는 요청마다 붙이는 Bearer access token. */
httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/** 401이면 refresh를 한 번 한 뒤 원래 요청을 다시 보내는 재시도. */
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("/api/auth/refresh");
    const isAuthLogin = originalRequest?.url?.includes("/api/auth/login");
    const isAuthToken = originalRequest?.url?.includes("/api/auth/token");
    const isAuthLogout = originalRequest?.url?.includes("/api/auth/logout");

    // 401이어도 다시 보내면 루프가 되는 로그인, 토큰 교환, refresh, 로그아웃.
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
      // 새로 받은 access token으로 실패했던 요청만 한 번 더 보내는 재전송.
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
