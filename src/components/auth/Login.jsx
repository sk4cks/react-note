import { Button, Form, Container} from "react-bootstrap";

const LoginForm = ({ userInfo, setUserInfo, handleLogin }) => {
    
  return (
    <Container style={{ maxWidth: "400px", marginTop: "50px" }}>
        <h2>Login</h2>
        <Form onSubmit={handleLogin}>

            <Form.Group className="mb-3 row">
                <Form.Label column sm={3}>ID</Form.Label>

                <div className="col-sm-9">
                    <Form.Control
                    type="text"
                    value={userInfo.userId}
                    onChange={(e) =>
                        setUserInfo(prevUserInfo => ({ ...prevUserInfo, userId: e.target.value }))
                    }
                    placeholder="Enter username"
                    />
                </div>
            </Form.Group>

            <Form.Group className="mb-3 row">
                <Form.Label column sm={3}>Password</Form.Label>

                <div className="col-sm-9">
                    <Form.Control
                        type="password"
                        value={userInfo.password}
                        onChange={(e) => 
                            setUserInfo(prevUserInfo => ({ ...prevUserInfo, password: e.target.value }))
                        }
                        placeholder="Enter password"
                    />
                </div>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
                Login
            </Button>

        </Form>
    </Container>
  );
};

export default LoginForm;