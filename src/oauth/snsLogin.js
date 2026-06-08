import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  storePkceSession,
} from "@/oauth/pkce.js";
import { env } from "@/api/ApiEnv.js";

/**
 * SNS 로그인 — 프론트 → API(BFF) → Auth Server oauth2Login + PKCE.
 * 1) PKCE를 sessionStorage에 저장
 * 2) GET /api/auth/social/prepare/{provider} (BFF가 Auth로 redirect)
 * 3) Google 인증 후 SPA /oauth/callback → POST /api/auth/token
 */
export async function startSnsLogin(provider) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  storePkceSession({ codeVerifier, state });

  const params = new URLSearchParams({
    state,
    code_challenge: codeChallenge,
    redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
  });

  window.location.assign(
    `${env.BASE_API_URL}/api/auth/social/prepare/${provider}?${params.toString()}`
  );
}
