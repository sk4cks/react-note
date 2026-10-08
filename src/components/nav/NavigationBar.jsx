import { Container, Nav, Navbar, Button } from "react-bootstrap";

/** 상단 Note Mail / Mail / Login·Logout. */
const NavigationBar = ({
  navigate, // 상단 메뉴 이동
  handleAuth, // 로그인 화면 또는 로그아웃
  isLoggedIn, // 로그인 여부
  userId, // 로그아웃 버튼에 보일 아이디
}) => {
  return (
    <>

      {/* 상단 바 */}
      <Navbar bg="light" variant="light">
        <Container>

          {/* 브랜드 */}
          <Navbar.Brand onClick = {() => navigate("/")}>Note Mail</Navbar.Brand>

          {/* 메뉴 */}
          <Nav className="me-auto">
            {isLoggedIn && (
              <Nav.Link onClick = {() => navigate("/mail")}>Mail</Nav.Link>
            )}
          </Nav>

          {/* 로그인·로그아웃 */}
          <Button variant="outline-primary" onClick = {handleAuth}>
            {isLoggedIn ? `Logout${userId ? ` (${userId})` : ""}` : "Login"}
          </Button>
        </Container>
      </Navbar>
    </>
  );
};

export default NavigationBar;
