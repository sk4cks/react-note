import { Button, Form, Container } from "react-bootstrap";

const SNS_PROVIDERS = [
  { id: "google", label: "Google로 로그인", enabled: true },
  { id: "kakao", label: "Kakao로 로그인", enabled: true },
  { id: "naver", label: "Naver로 로그인", enabled: true },
];

const LoginForm = ({
  userInfo,
  setUserInfo,
  handleLogin,
  onSnsLogin,
  isSubmitting,
}) => {
  return (
    <Container style={{ maxWidth: "400px", marginTop: "50px" }}>
      <h2>Login</h2>

      <Form onSubmit={(e) => e.preventDefault()}>
        <Form.Group className="mb-3 row">
          <Form.Label column sm={3}>
            ID
          </Form.Label>
          <div className="col-sm-9">
            <Form.Control
              type="text"
              value={userInfo.userId}
              onChange={(e) =>
                setUserInfo((prev) => ({ ...prev, userId: e.target.value }))
              }
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label column sm={3}>
            Password
          </Form.Label>
          <div className="col-sm-9">
            <Form.Control
              type="password"
              value={userInfo.password}
              onChange={(e) =>
                setUserInfo((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
        </Form.Group>

        <Button
          type="button"
          onClick={handleLogin}
          variant="primary"
          className="w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "로그인"}
        </Button>
      </Form>

      <hr className="my-4" />

      <p className="text-muted small text-center mb-3">SNS 계정으로 로그인</p>
      <div className="d-grid gap-2">
        {SNS_PROVIDERS.map(({ id, label, enabled }) => (
          <Button
            key={id}
            type="button"
            variant="outline-secondary"
            disabled={!enabled}
            onClick={() => onSnsLogin(id)}
          >
            {label}
            {!enabled && " (준비 중)"}
          </Button>
        ))}
      </div>
    </Container>
  );
};

export default LoginForm;
