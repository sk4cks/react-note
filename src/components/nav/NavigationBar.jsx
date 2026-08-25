import { Container, Nav, Navbar, Button } from "react-bootstrap";

/** 상단 Note Mail / Mail / Login·Logout. */
const NavigationBar = ({ navigate, handleAuth, isLoggedIn, userId }) => {
  return (
    <>
      <Navbar bg="light" variant="light">
        <Container>
          <Navbar.Brand onClick={() => navigate("/")}>Note Mail</Navbar.Brand>
          <Nav className="me-auto">
            {isLoggedIn && (
              <Nav.Link onClick={() => navigate("/mail")}>Mail</Nav.Link>
            )}
          </Nav>

          <Button variant="outline-primary" onClick={handleAuth}>
            {isLoggedIn ? `Logout${userId ? ` (${userId})` : ""}` : "Login"}
          </Button>
        </Container>
      </Navbar>
    </>
  );
};

export default NavigationBar;
