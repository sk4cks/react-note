import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, hasSessionHint } from "@/api/httpClient.js";

/** 로그인 필요한 메뉴. 토큰 없으면 /login. */
const RequireAuth = () => {
  const location = useLocation();
  if (!getAccessToken() && !hasSessionHint()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

export default RequireAuth;
