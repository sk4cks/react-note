const BASE_API_URL = import.meta.env.VITE_BASE_API_URL ?? import.meta.env.BASE_API_URL;
const AUTHORIZATION_API_CONTEXT_PATH =
  import.meta.env.VITE_AUTHORIZATION_API_CONTEXT_PATH ?? import.meta.env.AUTHORIZATION_API_CONTEXT_PATH ?? "";

export const isRelease = false;

export const env = {
  BASE_API_URL: isRelease ? "" : BASE_API_URL,
  AUTHORIZATION_API_CONTEXT_PATH: isRelease ? "" : AUTHORIZATION_API_CONTEXT_PATH,
  AUTH_SERVER_URL: import.meta.env.VITE_AUTH_SERVER_URL,
  OAUTH_CLIENT_ID: import.meta.env.VITE_OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI: import.meta.env.VITE_OAUTH_REDIRECT_URI,
  OAUTH_SCOPE: import.meta.env.VITE_OAUTH_SCOPE,
};
