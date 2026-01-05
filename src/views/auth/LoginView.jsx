import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/api";
import Login from "../../components/auth/Login"

const LoginView = () => {
    
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({
        userId: "",
        password: ""
    });
    
    const handleLogin = async () => {
        // 실제로는 서버 인증 필요
        if (userInfo.userId && userInfo.password) {
            await issueTempToken();
            alert(`Welcome, ${userInfo.userId}!`);
            navigate("/"); // 로그인 후 홈으로 이동
        } else {
            alert("Please enter username and password");
        }
    };

    const issueTempToken = async () => {
        API.authAPI.issueTempToken({...userInfo})
        .then((response) => {
            if (response.status === 200) {
            }
        })
        .catch((error) => {
            console.log(error);
        });
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