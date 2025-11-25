import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NotFoundView = () => {
  const navigate = useNavigate();

  return (
    <Container style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>404</h1>
      <h3>Page Not Found</h3>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <Button onClick={() => navigate("/")} variant="primary">
        Home으로 이동
      </Button>
    </Container>
  );
};

export default NotFoundView;