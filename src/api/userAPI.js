import httpClient from "@/api/httpClient.js";

const userAPI = {
  /** 로그인한 계정. */
  getMe: () => httpClient.get("/api/me"),
};

export { userAPI };
