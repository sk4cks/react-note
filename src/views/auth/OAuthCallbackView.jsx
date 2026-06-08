import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/api";
import { consumePkceSession } from "@/oauth/pkce.js";

const OAuthCallbackView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(searchParams.get("error_description") ?? oauthError);
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code or state.");
      return;
    }

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
      .then(() => navigate("/"))
      .catch((err) => {
        console.error(err);
        setError("Token exchange failed.");
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{ marginTop: "50px", textAlign: "center" }}>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/login")}>
          Back to login
        </button>
      </div>
    );
  }

  return <div style={{ marginTop: "50px", textAlign: "center" }}>Signing in…</div>;
};

export default OAuthCallbackView;
