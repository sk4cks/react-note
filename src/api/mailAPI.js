import httpClient, { getAccessToken } from "@/api/httpClient.js";
import { env } from "@/api/ApiEnv.js";

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
  /** 임시저장. id가 있으면 그 초안을 교체한다. */
  saveDraft: (payload) => httpClient.post("/api/mail/drafts", payload),
  /** 창을 닫을 때 쓰는 임시저장. 페이지가 내려가도 요청이 남는다. */
  saveDraftKeepalive: async (payload) => {
    const token = getAccessToken();
    const response = await fetch(
      `${env.BASE_API_URL}${env.AUTHORIZATION_API_CONTEXT_PATH}/api/mail/drafts`,
      {
        method: "POST",
        keepalive: true,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error("draft keepalive failed");
    }

    return response.json();
  },
};

export { mailAPI };
