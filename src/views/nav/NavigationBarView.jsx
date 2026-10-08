/** 상단 바(Note Mail, Mail, Login/Logout). 로그인 후 메일 화면에 항상 표시. */
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "@/api";
import { clearAuth, getAccessToken, hasSessionHint } from "@/api/httpClient.js";
import NavigationBar from "../../components/nav/NavigationBar"

const NavigationBarView = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!getAccessToken() || hasSessionHint()
  );
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!getAccessToken() && !hasSessionHint()) {
      setIsLoggedIn(false);
      setUserId("");
      return;
    }

    // access token 또는 refresh cookie가 있을 때 /api/me로 맞추는 로그인 표시.
    API.userAPI.getMe()
      .then((response) => {
        setIsLoggedIn(true);
        setUserId(
          response.data.preferredUsername ?? response.data.userId ?? ""
        );
      })
      .catch(async () => {
        await clearAuth();
        setIsLoggedIn(false);
        setUserId("");
      });
  }, [location]);

  /** 로그인 화면으로 보내거나 세션을 지우는 로그아웃. */
  const handleAuth = async () => {
    if (isLoggedIn) {
      await clearAuth();
      setIsLoggedIn(false);
      setUserId("");
      navigate("/", { replace: true });

      return;
    }

    navigate("/login");
  };

  return (
    <NavigationBar
      navigate = {navigate} // 상단 메뉴 이동
      handleAuth = {handleAuth} // 로그인 화면 또는 로그아웃
      isLoggedIn = {isLoggedIn} // 로그인 여부
      userId = {userId} // 로그아웃 버튼에 보일 아이디
    />
  );
};

export default NavigationBarView;
