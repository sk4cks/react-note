import httpClient from "@/api/httpClient.js";

const contactAPI = {
  listContacts: (q) =>
    httpClient.get("/api/contacts", { params: q ? { q } : {} }),
  createContact: (payload) => httpClient.post("/api/contacts", payload),
  updateContact: (id, payload) => httpClient.put(`/api/contacts/${id}`, payload),
  deleteContact: (id) => httpClient.delete(`/api/contacts/${id}`),
  listGroups: () => httpClient.get("/api/contact-groups"),
  createGroup: (payload) => httpClient.post("/api/contact-groups", payload),
  updateGroup: (id, payload) => httpClient.put(`/api/contact-groups/${id}`, payload),
  deleteGroup: (id) => httpClient.delete(`/api/contact-groups/${id}`),
  replaceMembers: (id, contactIds) =>
    httpClient.put(`/api/contact-groups/${id}/members`, { contactIds }),
  listShares: (id) => httpClient.get(`/api/contact-groups/${id}/shares`),
  shareGroup: (id, payload) =>
    httpClient.post(`/api/contact-groups/${id}/shares`, payload),
  revokeShare: (id, shareId) =>
    httpClient.delete(`/api/contact-groups/${id}/shares/${shareId}`),
  suggestRecipients: (q) =>
    httpClient.get("/api/mail/recipients/suggest", {
      params: q ? { q } : {},
    }),
};

export { contactAPI };
