import httpClient, { saveAccessToken } from "@/api/httpClient.js";

/** "login"처럼 함수 이름을 문자열로 넘겨 authAPI.login을 부르던 예전 방식. */
const authAPIDFN = {
  authAPI: (APIName, conditions, paths) => {
    return authAPI[APIName](conditions, paths);
  },
};

/** 응답의 access_token을 저장하고 응답은 그대로 돌려주는 처리. */
const saveTokenFromResponse = (response) => {
  saveAccessToken(response.data ?? {});

  return response;
};

const authAPI = {
  /** 프론트에서 API를 거쳐 Auth Server /auth/login으로 가는 로컬 계정 로그인. */
  login: async (conditions, paths) => {
    const uri = paths || "/api/auth/login";
    const response = await httpClient.post(uri, conditions);

    return saveTokenFromResponse(response);
  },

  /** API가 Auth Server /auth/check-userid로 보는 회원가입 전 아이디 중복 확인. */
  checkUserId: async (userId) => {
    return httpClient.get("/api/auth/check-userid", { params: { userId } });
  },

  /** 프론트에서 API를 거쳐 Auth Server /auth/register로 가는 로컬 회원가입. */
  register: async ({ userId, password }) => {
    return httpClient.post("/api/auth/register", { userId, password });
  },

  /** SNS 첫 로그인과 SYS_USER 등록이 더 필요한지 확인. */
  getOnboardingStatus: async () => {
    return httpClient.get("/api/auth/onboarding-status");
  },

  /** SNS 첫 로그인에서 userId를 정한 뒤의 토큰 재발급. */
  completeSocialOnboarding: async ({ userId }) => {
    const response = await httpClient.post("/api/auth/social/complete", { userId });

    return saveTokenFromResponse(response);
  },

  /** SNS 콜백 authorization_code의 토큰 교환. */
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
