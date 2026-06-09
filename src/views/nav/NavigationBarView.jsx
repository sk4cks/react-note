import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "@/api";
import { clearAuth, getAccessToken } from "@/api/httpClient.js";
import NavigationBar from "../../components/nav/NavigationBar"

const NavigationBarView = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAccessToken());
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
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
      .catch(() => {
        clearAuth();
        setIsLoggedIn(false);
        setUserId("");
      });
  }, [location]);

  const handleAuth = () => {
    if (isLoggedIn) {
      clearAuth();
      setIsLoggedIn(false);
      setUserId("");
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