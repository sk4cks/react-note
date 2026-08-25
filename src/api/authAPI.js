import httpClient, { saveAccessToken } from "@/api/httpClient.js";

/** 예전 호출 방식 호환. API.authAPI.login 을 쓴다. */
const authAPIDFN = {
  authAPI: (APIName, conditions, paths) => {
    return authAPI[APIName](conditions, paths);
  },
};

/** 응답 JSON의 access_token을 저장하고 그대로 돌려준다. */
const saveTokenFromResponse = (response) => {
  saveAccessToken(response.data ?? {});
  return response;
};

const authAPI = {
  /** 로컬 계정 — 프론트 → API → Auth Server /auth/login */
  login: async (conditions, paths) => {
    const uri = paths || "/api/auth/login";
    const response = await httpClient.post(uri, conditions);
    return saveTokenFromResponse(response);
  },

  /** 회원가입 전 아이디 중복 확인 — API → Auth Server /auth/check-userid */
  checkUserId: async (userId) => {
    return httpClient.get("/api/auth/check-userid", { params: { userId } });
  },

  /** 로컬 회원가입 — 프론트 → API → Auth Server /auth/register */
  register: async ({ userId, password }) => {
    return httpClient.post("/api/auth/register", { userId, password });
  },

  /** SNS 최초 로그인 — SYS_USER 등록 필요 여부 */
  getOnboardingStatus: async () => {
    return httpClient.get("/api/auth/onboarding-status");
  },

  /** SNS 최초 로그인 — userId 선택 후 토큰 재발급 */
  completeSocialOnboarding: async ({ userId }) => {
    const response = await httpClient.post("/api/auth/social/complete", { userId });
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
