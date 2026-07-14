import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/api";
import Register from "../../components/auth/Register";

const USER_ID_PATTERN = /^[a-zA-Z0-9_]+$/;

const RegisterView = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    userId: "",
    password: "",
    passwordConfirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const { userId, password, passwordConfirm } = userInfo;
    if (!userId || !password) {
      alert("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    if (userId.length < 3) {
      alert("아이디는 3자 이상이어야 합니다.");
      return;
    }
    if (!USER_ID_PATTERN.test(userId)) {
      alert("아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.");
      return;
    }
    if (password.length < 4) {
      alert("비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await API.authAPI.register({ userId, password });
      const mailAddress = response.data?.mailAddress;
      alert(
        mailAddress
          ? `가입 완료! 메일 주소: ${mailAddress}`
          : "가입이 완료되었습니다. 로그인해 주세요."
      );
      navigate("/login");
    } catch (error) {
      console.error(error);
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        alert("이미 사용 중인 아이디입니다.");
      } else if (message) {
        alert(message);
      } else {
        alert("회원가입에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Register
      userInfo={userInfo}
      setUserInfo={setUserInfo}
      handleRegister={handleRegister}
      isSubmitting={isSubmitting}
    />
  );
};

export default RegisterView;
