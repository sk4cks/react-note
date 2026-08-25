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

    // 로그인 시작할 때 넣어 둔 verifier·state와 맞는지 본다.
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
        // SNS 첫 로그인이면 아이디를 고르게 한다.
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
    <OAuthCallback error={error} onBackToLogin={() => navigate("/login")} />
  );
};

export default OAuthCallbackView;
