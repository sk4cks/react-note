import httpClient from "@/api/httpClient.js";

const contactAPI = {
  /** 개인 연락처 목록. q면 검색. */
  listContacts: (q) =>
    httpClient.get("/api/contacts", { params: q ? { q } : {} }),
  /** 개인 연락처를 추가한다. */
  createContact: (payload) => httpClient.post("/api/contacts", payload),
  /** 개인 연락처를 지운다. */
  deleteContact: (id) => httpClient.post(`/api/contacts/${id}/delete`),
  /** 내 그룹 + 공유받은 그룹. */
  listGroups: () => httpClient.get("/api/contact-groups"),
  /** 그룹을 만든다. */
  createGroup: (payload) => httpClient.post("/api/contact-groups", payload),
  /** 그룹 이름 등. */
  updateGroup: (id, payload) =>
    httpClient.post(`/api/contact-groups/${id}/update`, payload),
  /** 그룹을 삭제한다. */
  deleteGroup: (id) => httpClient.post(`/api/contact-groups/${id}/delete`),
  /** 그룹 멤버를 통째로 바꾼다. */
  replaceMembers: (id, { contactIds, accountUserSeqs }) =>
    httpClient.post(`/api/contact-groups/${id}/members`, {
      contactIds,
      accountUserSeqs,
    }),
  /** 그룹 공유 목록. */
  listShares: (id) => httpClient.get(`/api/contact-groups/${id}/shares`),
  /** 그룹을 다른 계정에 공유한다. */
  shareGroup: (id, payload) =>
    httpClient.post(`/api/contact-groups/${id}/shares`, payload),
  /** 공유를 회수한다. */
  revokeShare: (id, shareId) =>
    httpClient.post(`/api/contact-groups/${id}/shares/${shareId}/delete`),
  /** 메일 쓰기 자동완성. */
  suggestRecipients: (q) =>
    httpClient.get("/api/mail/recipients/suggest", {
      params: q ? { q } : {},
    }),
};

export { contactAPI };
