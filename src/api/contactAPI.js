import httpClient from "@/api/httpClient.js";

const contactAPI = {
  /** q가 있으면 검색하고, 없으면 전체를 가져오는 개인 연락처 조회. */
  listContacts: (q) =>
    httpClient.get("/api/contacts", { params: q ? { q } : {} }),

  /** 개인 연락처 추가. */
  createContact: (payload) =>
    httpClient.post("/api/contacts", payload),

  /** 개인 연락처 삭제. */
  deleteContact: (id) =>
    httpClient.post(`/api/contacts/${id}/delete`),

  /** 내가 만든 그룹과 공유받은 그룹을 함께 가져오는 조회. */
  listGroups: () =>
    httpClient.get("/api/contact-groups"),

  /** 새 그룹 생성. */
  createGroup: (payload) =>
    httpClient.post("/api/contact-groups", payload),

  /** 그룹 이름 같은 정보 수정. */
  updateGroup: (id, payload) =>
    httpClient.post(`/api/contact-groups/${id}/update`, payload),

  /** 그룹 삭제. */
  deleteGroup: (id) =>
    httpClient.post(`/api/contact-groups/${id}/delete`),

  /** 그룹 멤버 전체 교체. */
  replaceMembers: (id, { contactIds, accountUserSeqs }) =>
    httpClient.post(`/api/contact-groups/${id}/members`, {
      contactIds,
      accountUserSeqs,
    }),

  /** 이 그룹을 공유 중인 계정 목록 조회. */
  listShares: (id) =>
    httpClient.get(`/api/contact-groups/${id}/shares`),

  /** 다른 계정에 대한 그룹 공유. */
  shareGroup: (id, payload) =>
    httpClient.post(`/api/contact-groups/${id}/shares`, payload),

  /** 공유 회수. */
  revokeShare: (id, shareId) =>
    httpClient.post(`/api/contact-groups/${id}/shares/${shareId}/delete`),

  /** 메일 쓸 때 자동완성에 쓰는 수신자 검색. */
  suggestRecipients: (q) =>
    httpClient.get("/api/mail/recipients/suggest", {
      params: q ? { q } : {},
    }),
};

export { contactAPI };
