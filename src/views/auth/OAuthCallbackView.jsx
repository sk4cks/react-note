/** SNS 로그인 콜백(코드→토큰). 로그인 > SNS 로그인. */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/api";
import { consumePkceSession } from "@/oauth/pkce.js";
import OAuthCallback from "../../components/auth/OAuthCallback";

const OAuthCallbackView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code"); // authorization_code
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error"); // IdP가 거절하면 옴

    if (oauthError) {
      setError(searchParams.get("error_description") ?? oauthError);
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code or state.");
      return;
    }

    // 로그인 시작할 때 넣어 둔 verifier·state와 맞는지 확인.
    const { codeVerifier, state: savedState } = consumePkceSession();
    if (!codeVerifier || state !== savedState) {
      setError("Invalid OAuth state. Please try logging in again.");
      return;
    }

    API.authAPI
      .exchangeToken({
        code,
        codeVerifier,
        redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
      })
      .then(async () => {
        // SNS 첫 로그인이면 아이디를 고르게 하는 이동.
        const statusRes = await API.authAPI.getOnboardingStatus();
        if (statusRes.data?.needsUserId) {
          navigate("/onboarding");
        } else {
          navigate("/");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Token exchange failed.");
      });
  }, [searchParams, navigate]);

  return (
    <OAuthCallback
      error = {error} // 교환 실패 메시지
      onBackToLogin = {() => navigate("/login")} // 로그인 화면으로
    />
  );
};

export default OAuthCallbackView;
