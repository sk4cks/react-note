import { Container, Nav, Navbar, Button } from "react-bootstrap";

const NavigationBar = ({ navigate, handleAuth, isLoggedIn, userId }) => {
  
  return (
    <>
      <Navbar bg="light" variant="light">
        <Container>
          <Navbar.Brand onClick={() => navigate("/")}>ShoeShop</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate("/cart")}>Cart</Nav.Link>
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