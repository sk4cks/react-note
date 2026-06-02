import httpClient, { setAccessToken } from "@/api/httpClient.js";

const authAPIDFN = {
  authAPI: (APIName, conditions, paths) => {
    return authAPI[APIName](conditions, paths);
  },
};

const saveTokenFromResponse = (response) => {
  const accessToken = response.data?.access_token;
  if (accessToken) {
    setAccessToken(accessToken);
  }
  return response;
};

const authAPI = {
  /** 로컬 계정 — 프론트 → API → Auth Server /auth/login */
  login: async (conditions, paths) => {
    const uri = paths || "/api/auth/login";
    const response = await httpClient.post(uri, conditions);
    return saveTokenFromResponse(response);
  },

  /** SNS — authorization_code 콜백 후 토큰 교환 */
  exchangeToken: async ({ code, codeVerifier, redirectUri }) => {
    const response = await httpClient.post("/api/auth/token", {
      code,
      codeVerifier,
      redirectUri,
    });
    return saveTokenFromResponse(response);
  },
};

export { authAPIDFN, authAPI };
