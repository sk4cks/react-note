import httpClient from "@/api/httpClient.js";

const userAPI = {
  getMe: () => httpClient.get("/api/me"),
  getPhotos: () => httpClient.get("/photos"),
};

export { userAPI };
