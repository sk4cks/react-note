/** 없는 주소(404). 잘못된 URL. */
import { useNavigate } from "react-router-dom";
import NotFound from "../../components/errors/NotFound";

const NotFoundView = () => {
  const navigate = useNavigate();

  return (
    <NotFound
      onHome = {() => navigate("/")} // 홈으로
    />
  );
};

export default NotFoundView;
