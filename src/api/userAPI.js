import httpClient from "@/api/httpClient.js";

const userAPI = {
  /** 지금 로그인한 계정 조회. */
  getMe: () =>
    httpClient.get("/api/me"),
};

export { userAPI };
