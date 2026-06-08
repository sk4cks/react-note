import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  storePkceSession,
} from "@/oauth/pkce.js";
import { oauthConfig } from "@/oauth/oauthConfig.js";

/**
 * SNS 로그인 — Auth Server oauth2Login + PKCE 브릿지.
 * 1) PKCE를 sessionStorage에 저장
 * 2) /auth/social/prepare/{provider} 에 state·challenge 전달
 * 3) Google 인증 후 SPA /oauth/callback 으로 code → API token 교환
 */
export async function startSnsLogin(provider) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  storePkceSession({ codeVerifier, state });

  const params = new URLSearchParams({
    state,
    code_challenge: codeChallenge,
    redirect_uri: oauthConfig.redirectUri,
  });

  window.location.assign(
    `${oauthConfig.authServerUrl}/auth/social/prepare/${provider}?${params.toString()}`
  );
}
