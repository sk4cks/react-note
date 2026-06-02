import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  storePkceSession,
} from "@/oauth/pkce.js";
import { oauthConfig } from "@/oauth/oauthConfig.js";

/**
 * SNS 로그인 — Auth Server에 oauth2Login 연동 후 사용.
 * 지금은 authorize + provider 경로만 준비 (서버 설정 필요).
 */
export async function startSnsLogin(provider) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  storePkceSession({ codeVerifier, state });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(
    `${oauthConfig.authServerUrl}/oauth2/authorization/${provider}?${params.toString()}`
  );
}
