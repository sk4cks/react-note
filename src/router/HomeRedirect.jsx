import { Navigate } from "react-router-dom";
import { getAccessToken, hasSessionHint } from "@/api/httpClient.js";

const HomeRedirect = () => {
  if (getAccessToken() || hasSessionHint()) {
    return <Navigate to="/mail" replace />;
  }
  return <Navigate to="/login" replace />;
};

export default HomeRedirect;
