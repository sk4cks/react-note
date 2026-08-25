/** 없는 주소(404). */
import { Container, Button } from "react-bootstrap";

const NotFound = ({ onHome }) => {
  return (
    <Container style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>404</h1>
      <h3>Page Not Found</h3>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <Button onClick={onHome} variant="primary">
        Home으로 이동
      </Button>
    </Container>
  );
};

export default NotFound;
