import { Navigate } from "react-router-dom";
import { getAccessToken, hasSessionHint } from "@/api/httpClient.js";

/** `/` — 로그인돼 있으면 메일, 아니면 로그인. */
const HomeRedirect = () => {
  if (getAccessToken() || hasSessionHint()) {
    return <Navigate to="/mail" replace />;
  }
  return <Navigate to="/login" replace />;
};

export default HomeRedirect;
