import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, hasSessionHint } from "@/api/httpClient.js";

const RequireAuth = () => {
  const location = useLocation();
  if (!getAccessToken() && !hasSessionHint()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

export default RequireAuth;
