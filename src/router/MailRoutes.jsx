import InboxView from "../views/mail/InboxView";
import MailDetailView from "../views/mail/MailDetailView";
import ComposeView from "../views/mail/ComposeView";

export const MailRoutes = [
  { path: "mail", element: <InboxView /> },
  { path: "mail/compose", element: <ComposeView /> },
  { path: "mail/:id", element: <MailDetailView /> },
];
