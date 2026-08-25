import httpClient from "@/api/httpClient.js";

const mailAPI = {
  /** 폴더 메일 목록. pageToken이면 다음 페이지. */
  listMessages: (folder = "inbox", pageToken) =>
    httpClient.get("/api/mail/messages", {
      params: { folder, ...(pageToken ? { pageToken } : {}) },
    }),
  /** 편지함별 건수. */
  getFolders: () => httpClient.get("/api/mail/folders"),
  /** 메일 한 통. */
  getMessage: (id, folder = "inbox") =>
    httpClient.get(`/api/mail/messages/${id}`, { params: { folder } }),
  /** 첨부를 blob으로 받는다. */
  downloadAttachment: (id, attachmentId, folder = "inbox") =>
    httpClient.get(
      `/api/mail/messages/${id}/attachments/${encodeURIComponent(attachmentId)}`,
      { params: { folder }, responseType: "blob" }
    ),
  /** 메일을 보낸다. */
  sendMail: (payload) => httpClient.post("/api/mail/send", payload),
};

export { mailAPI };
