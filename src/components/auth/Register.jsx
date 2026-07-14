import { Button, Form, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const RegisterForm = ({
  userInfo,
  setUserInfo,
  handleRegister,
  isSubmitting,
}) => {
  return (
    <Container style={{ maxWidth: "400px", marginTop: "50px" }}>
      <h2>회원가입</h2>
      <p className="text-muted small">
        가입 시 <code>아이디@도메인</code> 메일함이 함께 생성됩니다.
      </p>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSubmitting) {
            handleRegister();
          }
        }}
      >
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
              placeholder="영문, 숫자, 밑줄 (3자 이상)"
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
              placeholder="4자 이상"
              autoComplete="new-password"
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3 row">
          <Form.Label column sm={3}>
            Confirm
          </Form.Label>
          <div className="col-sm-9">
            <Form.Control
              type="password"
              value={userInfo.passwordConfirm}
              onChange={(e) =>
                setUserInfo((prev) => ({
                  ...prev,
                  passwordConfirm: e.target.value,
                }))
              }
              placeholder="비밀번호 확인"
              autoComplete="new-password"
            />
          </div>
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "가입 중…" : "회원가입"}
        </Button>
      </Form>

      <p className="text-center mt-3 small">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </Container>
  );
};

export default RegisterForm;
