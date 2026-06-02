import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/api";
import { startSnsLogin } from "@/oauth/snsLogin.js";
import Login from "../../components/auth/Login";

const LoginView = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ userId: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!userInfo.userId || !userInfo.password) {
      alert("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await API.authAPI.login({ ...userInfo });
      if (!response.data?.access_token) {
        throw new Error("access_token missing");
      }
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("로그인에 실패했습니다. (테스트 비밀번호: 1234)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnsLogin = async (provider) => {
    try {
      await startSnsLogin(provider);
    } catch (error) {
      console.error(error);
      alert("SNS 로그인은 Auth Server 연동 후 사용할 수 있습니다.");
    }
  };

  return (
    <Login
      userInfo={userInfo}
      setUserInfo={setUserInfo}
      handleLogin={handleLogin}
      onSnsLogin={handleSnsLogin}
      isSubmitting={isSubmitting}
    />
  );
};

export default LoginView;
