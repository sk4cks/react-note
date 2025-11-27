import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import NavigationBar from "../../components/nav/NavigationBar"

const NavigationBarView = () => {
  
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태

  const handleAuth = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false); // 로그아웃
    } else {
      navigate("/login");   // 로그인 페이지로 이동
    }
  };

  return (
    <NavigationBar 
        navigate={navigate}
        handleAuth={handleAuth}
        isLoggedIn={isLoggedIn}
    />
  );
};

export default NavigationBarView;