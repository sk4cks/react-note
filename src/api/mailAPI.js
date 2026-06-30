import httpClient from "@/api/httpClient.js";

const mailAPI = {
  listMessages: (folder = "inbox", pageToken) =>
    httpClient.get("/api/mail/messages", {
      params: { folder, ...(pageToken ? { pageToken } : {}) },
    }),
  getFolders: () => httpClient.get("/api/mail/folders"),
  getMessage: (id) => httpClient.get(`/api/mail/messages/${id}`),
  sendMail: (payload) => httpClient.post("/api/mail/send", payload),
};

export { mailAPI };
