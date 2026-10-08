import httpClient, { getAccessToken } from "@/api/httpClient.js";
import { env } from "@/api/ApiEnv.js";

const mailAPI = {
  /** pageToken이 있으면 다음 페이지인 폴더 메일 목록 조회. */
  listMessages: (folder = "inbox", pageToken) =>
    httpClient.get("/api/mail/messages", {
      params: { folder, ...(pageToken ? { pageToken } : {}) },
    }),

  /** 편지함별 메일 건수 조회. */
  getFolders: () =>
    httpClient.get("/api/mail/folders"),

  /** 메일 한 통의 내용 조회. */
  getMessage: (id, folder = "inbox") =>
    httpClient.get(`/api/mail/messages/${id}`, { params: { folder } }),

  /** blob으로 받는 첨부 다운로드. */
  downloadAttachment: (id, attachmentId, folder = "inbox") =>
    httpClient.get(
      `/api/mail/messages/${id}/attachments/${encodeURIComponent(attachmentId)}`,
      { params: { folder }, responseType: "blob" }
    ),

  /** 메일 발송. */
  sendMail: (payload) =>
    httpClient.post("/api/mail/send", payload),

  /** 휴지통이 아니면 휴지통으로 옮기는 메일 삭제. */
  deleteMessages: (folder, ids) =>
    httpClient.post("/api/mail/messages/delete", { folder, ids }),

  /** 휴지통 메일을 원래 편지함으로 되돌리는 복원. */
  restoreMessages: (ids) =>
    httpClient.post("/api/mail/messages/restore", { ids }),

  /** id가 있으면 그 초안을 교체하는 임시저장. */
  saveDraft: (payload, config) =>
    httpClient.post("/api/mail/drafts", payload, config),

  /** 페이지가 사라져도 요청이 남는, 창을 닫을 때의 임시저장. */
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
