/** SNS 로그인 콜백 화면. */
const OAuthCallback = ({ error, onBackToLogin }) => {
  if (error) {
    return (
      <div style={{ marginTop: "50px", textAlign: "center" }}>
        <p>{error}</p>
        <button type="button" onClick={onBackToLogin}>
          Back to login
        </button>
      </div>
    );
  }

  return <div style={{ marginTop: "50px", textAlign: "center" }}>Signing in…</div>;
};

export default OAuthCallback;
