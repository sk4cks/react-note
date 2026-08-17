import httpClient from "@/api/httpClient.js";

const mailAPI = {
  listMessages: (folder = "inbox", pageToken) =>
    httpClient.get("/api/mail/messages", {
      params: { folder, ...(pageToken ? { pageToken } : {}) },
    }),
  getFolders: () => httpClient.get("/api/mail/folders"),
  getMessage: (id, folder = "inbox") =>
    httpClient.get(`/api/mail/messages/${id}`, { params: { folder } }),
  downloadAttachment: (id, attachmentId, folder = "inbox") =>
    httpClient.get(
      `/api/mail/messages/${id}/attachments/${encodeURIComponent(attachmentId)}`,
      { params: { folder }, responseType: "blob" }
    ),
  sendMail: (payload) => httpClient.post("/api/mail/send", payload),
};

export { mailAPI };
