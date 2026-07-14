import httpClient from "@/api/httpClient.js";

const userAPI = {
  getMe: () => httpClient.get("/api/me"),
};

export { userAPI };
