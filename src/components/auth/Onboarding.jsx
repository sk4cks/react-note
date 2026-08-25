import { Button, Form, Container } from "react-bootstrap";

/** SNS 첫 로그인 아이디 선택 폼. */
const OnboardingForm = ({ userId, setUserId, handleSubmit, isSubmitting }) => {
  return (
    <Container style={{ maxWidth: "400px", marginTop: "50px" }}>
      <h2>아이디 선택</h2>
      <p className="text-muted small">
        SNS 로그인이 처음입니다. 사용할 아이디를 정해 주세요.
        <br />
        메일 주소는 <code>아이디@도메인</code> 형태로 부여됩니다.
      </p>

      <Form onSubmit={(e) => e.preventDefault()}>
        <Form.Group className="mb-3">
          <Form.Label>User ID</Form.Label>
          <Form.Control
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="영문, 숫자, 밑줄 (3자 이상)"
            autoComplete="username"
          />
        </Form.Group>

        <Button
          type="button"
          onClick={handleSubmit}
          variant="primary"
          className="w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "처리 중…" : "시작하기"}
        </Button>
      </Form>
    </Container>
  );
};

export default OnboardingForm;
