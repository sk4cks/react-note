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

  /** 로그인 화면으로 보내거나 로그아웃한다. */
  const handleAuth = async () => {
    if (isLoggedIn) {
      await clearAuth();
      setIsLoggedIn(false);
      setUserId("");
      navigate("/", { replace: true });
    } else {
      navigate("/login");
    }
  };

  return (
    <NavigationBar 
        navigate={navigate}
        handleAuth={handleAuth}
        isLoggedIn={isLoggedIn}
        userId={userId}
    />
  );
};

export default NavigationBarView;
