/** 로그인·회원가입·온보딩·SNS 콜백. */
import LoginView from "../views/auth/LoginView";
import RegisterView from "../views/auth/RegisterView";
import OnboardingView from "../views/auth/OnboardingView";
import OAuthCallbackView from "../views/auth/OAuthCallbackView";

export const AuthRoutes = [
  { path: "/login", element: <LoginView /> },
  { path: "/register", element: <RegisterView /> },
  { path: "/onboarding", element: <OnboardingView /> },
  { path: "/oauth/callback", element: <OAuthCallbackView /> },
];
