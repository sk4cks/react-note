import httpClient from "@/api/httpClient.js";

const mailAPI = {
  listMessages: (folder = "inbox") =>
    httpClient.get("/api/mail/messages", { params: { folder } }),
  getMessage: (id) => httpClient.get(`/api/mail/messages/${id}`),
  sendMail: (payload) => httpClient.post("/api/mail/send", payload),
};

export { mailAPI };
