import axios from "axios";
import { env } from "@/api/ApiEnv.js";

const ACCESS_TOKEN_KEY = "accessToken";
const SESSION_HINT_KEY = "sessionActive";

const axiosDefaults = {
  baseURL: `${env.BASE_API_URL}${env.AUTHORIZATION_API_CONTEXT_PATH}`,
  withCredentials: true,
};

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

/** refresh_token은 HttpOnly cookie — JS에서 읽을 수 없음 */
export const hasSessionHint = () => sessionStorage.getItem(SESSION_HINT_KEY) === "1";

export const markSessionActive = () => {
  sessionStorage.setItem(SESSION_HINT_KEY, "1");
};

export const saveAccessToken = ({ access_token }) => {
  if (access_token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    markSessionActive();
  }
};

export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

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

let refreshPromise = null;

async function refreshAccessToken() {
  const { data } = await refreshClient.post("/api/auth/refresh");
  saveAccessToken(data);
  return data.access_token;
}

export function refreshAccessTokenOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("/api/auth/refresh");
    const isAuthLogin = originalRequest?.url?.includes("/api/auth/login");
    const isAuthToken = originalRequest?.url?.includes("/api/auth/token");
    const isAuthLogout = originalRequest?.url?.includes("/api/auth/logout");

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
