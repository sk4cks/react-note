const BASE_API_URL = import.meta.env.BASE_API_URL;
const AUTHORIZATION_API_CONTEXT_PATH = import.meta.env.AUTHORIZATION_API_CONTEXT_PATH;

export const isRelease = false;

export const env = {
  BASE_API_URL: isRelease ? "" : BASE_API_URL,
  AUTHORIZATION_API_CONTEXT_PATH: isRelease ? "" : AUTHORIZATION_API_CONTEXT_PATH
};