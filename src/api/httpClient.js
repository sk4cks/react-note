import axios from "axios";
import { env } from "@/api/ApiEnv.js";

const ACCESS_TOKEN_KEY = "accessToken";

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const clearAuth = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

const httpClient = axios.create({
  baseURL: `${env.BASE_API_URL}${env.AUTHORIZATION_API_CONTEXT_PATH}`,
});

httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default httpClient;
