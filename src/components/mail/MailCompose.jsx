import { Button, Card, Form } from "react-bootstrap";

const MailCompose = ({ form, onChange, onSubmit, onCancel }) => {
  return (
    <Card>
      <Card.Header>새 메일</Card.Header>
      <Card.Body>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3" controlId="mailTo">
            <Form.Label>받는 사람</Form.Label>
            <Form.Control
              type="email"
              placeholder="example@gmail.com"
              value={form.to}
              onChange={(e) => onChange("to", e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="mailSubject">
            <Form.Label>제목</Form.Label>
            <Form.Control
              type="text"
              placeholder="제목"
              value={form.subject}
              onChange={(e) => onChange("subject", e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="mailBody">
            <Form.Label>내용</Form.Label>
            <Form.Control
              as="textarea"
              rows={12}
              placeholder="메일 내용"
              value={form.body}
              onChange={(e) => onChange("body", e.target.value)}
              required
            />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary">
              보내기
            </Button>
            <Button type="button" variant="outline-secondary" onClick={onCancel}>
              취소
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MailCompose;
