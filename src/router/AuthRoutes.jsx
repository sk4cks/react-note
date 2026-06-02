import LoginView from "../views/auth/LoginView";
import OAuthCallbackView from "../views/auth/OAuthCallbackView";

export const AuthRoutes = [
  { path: "/login", element: <LoginView /> },
  { path: "/oauth/callback", element: <OAuthCallbackView /> },
];
