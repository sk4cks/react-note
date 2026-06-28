export const mailFolders = [
  { id: "inbox", label: "받은편지함" },
  { id: "sent", label: "보낸편지함" },
  { id: "draft", label: "임시보관함" },
];

export const mailMessages = [
  {
    id: "1",
    folder: "inbox",
    from: "Google Cloud",
    fromEmail: "noreply@google.com",
    to: "me@gmail.com",
    subject: "Gmail API 사용을 위한 프로젝트 설정 안내",
    preview: "Google Cloud Console에서 Gmail API를 활성화하고 OAuth 동의 화면을 구성하세요...",
    body: `안녕하세요,

웹메일 연동을 위해 Gmail API를 사용하려면 다음 단계를 완료해 주세요.

1. Google Cloud Console에서 프로젝트 선택
2. Gmail API 활성화
3. OAuth 동의 화면에 gmail.readonly scope 추가

자세한 내용은 공식 문서를 참고해 주세요.

감사합니다.
Google Cloud Team`,
    date: "2026-06-14T09:30:00",
    unread: true,
  },
  {
    id: "2",
    folder: "inbox",
    from: "Argo CD",
    fromEmail: "argocd@note.local",
    to: "me@gmail.com",
    subject: "[note-app] Sync succeeded",
    preview: "Application note-app has been successfully synced. Health: Healthy",
    body: `Application: note-app
Project: default
Sync Status: Synced
Health: Healthy

Revision: main@abc1234
`,
    date: "2026-06-13T18:45:00",
    unread: true,
  },
  {
    id: "3",
    folder: "inbox",
    from: "Jenkins",
    fromEmail: "jenkins@13.239.220.205.nip.io",
    to: "me@gmail.com",
    subject: "Build react-note-api #42 — SUCCESS",
    preview: "Pipeline react-note-api completed successfully in 3m 12s",
    body: `Build: #42
Job: react-note-api
Status: SUCCESS
Duration: 3m 12s

Stages:
- Checkout: OK
- Build & Test: OK
- Docker Push: OK
- GitOps bump: OK
`,
    date: "2026-06-12T11:20:00",
    unread: false,
  },
  {
    id: "4",
    folder: "inbox",
    from: "나",
    fromEmail: "me@gmail.com",
    to: "team@example.com",
    subject: "EC2 k3s 부팅 복구 정리 완료",
    preview: "note-boot-k3s-cleanup → ECR → k3s start 체인으로 변경했습니다.",
    body: `팀에게,

EC2 Stop/Start 후 k3s가 안 올라오던 이슈를 정리했습니다.
부팅 순서: cleanup → ECR 갱신 → k3s start

확인 부탁드립니다.`,
    date: "2026-06-11T08:00:00",
    unread: false,
  },
  {
    id: "5",
    folder: "sent",
    from: "나",
    fromEmail: "me@gmail.com",
    to: "dev@example.com",
    subject: "웹메일 MVP — 화면 프로토타입",
    preview: "일단 UI만 목업 데이터로 만들고, 이후 BFF + Gmail API 연동 예정입니다.",
    body: `안녕하세요,

웹메일 기능 1단계로 Google 계정 연동을 계획 중입니다.
우선 프론트 화면만 프로토타입으로 만들었습니다.

다음 단계: BFF /api/mail/* + Gmail API`,
    date: "2026-06-10T14:30:00",
    unread: false,
  },
];

export function getMessagesByFolder(folderId) {
  return mailMessages.filter((m) => m.folder === folderId);
}

export function getMessageById(id) {
  return mailMessages.find((m) => m.id === id);
}

export function formatMailDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
