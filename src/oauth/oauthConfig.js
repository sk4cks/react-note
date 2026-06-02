import { env } from "@/api/ApiEnv.js";

export const oauthConfig = {
  authServerUrl: env.AUTH_SERVER_URL,
  clientId: env.OAUTH_CLIENT_ID,
  redirectUri: env.OAUTH_REDIRECT_URI,
  scope: env.OAUTH_SCOPE,
};

export function buildAuthorizeUrl({ codeChallenge, state }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${oauthConfig.authServerUrl}/oauth2/authorize?${params.toString()}`;
}
