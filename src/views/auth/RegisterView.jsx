import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/api";
import Register from "../../components/auth/Register";

const USER_ID_PATTERN = /^[a-zA-Z0-9_]+$/;

/**
 * 아이디 중복확인 결과.
 * - idle: 미확인 (초기 / 아이디 변경 / 확인 요청 실패)
 * - available: 사용 가능
 * - taken: 이미 사용 중
 */
const IDLE_USER_ID_CHECK = { status: "idle", userId: "" };

const RegisterView = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    userId: "",
    password: "",
    passwordConfirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  /** 위 status + 확인 당시 userId (폼 아이디와 다를 때는 결과를 무시) */
  const [userIdCheck, setUserIdCheck] = useState(IDLE_USER_ID_CHECK);

  const updateUserInfo = (updater) => {
    setUserInfo((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next.userId !== prev.userId) {
        setUserIdCheck(IDLE_USER_ID_CHECK);
      }
      return next;
    });
  };

  const validateUserIdFormat = (userId) => {
    if (!userId) {
      alert("아이디를 입력해 주세요.");
      return false;
    }
    if (userId.length < 3) {
      alert("아이디는 3자 이상이어야 합니다.");
      return false;
    }
    if (!USER_ID_PATTERN.test(userId)) {
      alert("아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.");
      return false;
    }
    return true;
  };

  const handleCheckUserId = async () => {
    const { userId } = userInfo;
    if (!validateUserIdFormat(userId)) {
      return;
    }

    setIsChecking(true);
    try {
      const response = await API.authAPI.checkUserId(userId);
      const available = response.data?.available === true;
      setUserIdCheck({
        status: available ? "available" : "taken",
        userId,
      });
      if (available) {
        alert("사용 가능한 아이디입니다.");
      } else {
        alert("이미 사용 중인 아이디입니다.");
      }
    } catch (error) {
      console.error(error);
      setUserIdCheck(IDLE_USER_ID_CHECK);
      const message = error.response?.data?.message;
      alert(message || "중복 확인에 실패했습니다.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegister = async () => {
    const { userId, password, passwordConfirm } = userInfo;
    if (!validateUserIdFormat(userId)) {
      return;
    }
    if (userIdCheck.status !== "available" || userIdCheck.userId !== userId) {
      alert("아이디 중복 확인을 먼저 해 주세요.");
      return;
    }
    if (!password) {
      alert("비밀번호를 입력해 주세요.");
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
        setUserIdCheck({ status: "taken", userId });
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

  const userIdCheckStatus =
    userIdCheck.userId === userInfo.userId ? userIdCheck.status : "idle";

  return (
    <Register
      userInfo={userInfo}
      setUserInfo={updateUserInfo}
      handleRegister={handleRegister}
      handleCheckUserId={handleCheckUserId}
      isSubmitting={isSubmitting}
      isChecking={isChecking}
      userIdCheckStatus={userIdCheckStatus}
    />
  );
};

export default RegisterView;
