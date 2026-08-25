/** SNS 첫 로그인 아이디 선택. 로그인 > SNS 로그인 > (아이디가 없을 때). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/api";
import Onboarding from "../../components/auth/Onboarding";

const USER_ID_PATTERN = /^[a-zA-Z0-9_]+$/; // 영문·숫자·밑줄

const OnboardingView = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** SNS 계정에 쓸 아이디를 등록하고 홈으로 간다. */
  const handleSubmit = async () => {
    if (!userId) {
      alert("아이디를 입력해 주세요.");
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

    setIsSubmitting(true);

    try {
      const response = await API.authAPI.completeSocialOnboarding({ userId });
      if (!response.data?.access_token) {
        throw new Error("access_token missing");
      }
      navigate("/");

    } catch (error) {
      console.error(error);
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        alert("이미 사용 중인 아이디입니다.");
      } else if (message) {
        alert(message);
      } else {
        alert("아이디 등록에 실패했습니다.");
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Onboarding
      userId={userId}
      setUserId={setUserId}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default OnboardingView;
