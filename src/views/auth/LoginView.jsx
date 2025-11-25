import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../../components/auth/Login"

const LoginView = () => {
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({
        userId: "",
        password: ""
    });
    
    const handleLogin = (e) => {
        e.preventDefault();
        // 실제로는 서버 인증 필요
        if (userInfo.userId && userInfo.password) {
        alert(`Welcome, ${userInfo.userId}!`);
        navigate("/"); // 로그인 후 홈으로 이동
        } else {
        alert("Please enter username and password");
        }
    };

    return (
        <Login 
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            handleLogin={handleLogin}
        />
    );
};

export default LoginView;