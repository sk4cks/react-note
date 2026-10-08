/** SNS 로그인 콜백 화면. */
const OAuthCallback = ({
  error, // 교환 실패 메시지
  onBackToLogin, // 로그인 화면으로
}) => {
  if (error) {
    return (
      <div style = {{ marginTop: "50px", textAlign: "center" }}>

        {/* 실패 */}
        <p>{error}</p>
        <button type="button" onClick = {onBackToLogin}>
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div style = {{ marginTop: "50px", textAlign: "center" }}>

      {/* 진행 */}
      Signing in…
    </div>
  );
};

export default OAuthCallback;
