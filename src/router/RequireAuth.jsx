import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, hasSessionHint } from "@/api/httpClient.js";

/** 로그인 필요한 메뉴. 토큰 없으면 /login. */
const RequireAuth = () => {
  const location = useLocation();

  // access token이 없어도 refresh cookie 힌트가 있으면 통과한다.
  if (!getAccessToken() && !hasSessionHint()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
