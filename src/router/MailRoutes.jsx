import MailInboxView from "../views/mail/MailInboxView";
import MailDetailView from "../views/mail/MailDetailView";
import MailComposeView from "../views/mail/MailComposeView";
import MailLayout from "../layout/mail/MailLayout";

export const MailRoutes = [
  {
    element: <MailLayout />,
    children: [
      { path: "mail", element: <MailInboxView /> },
      { path: "mail/compose", element: <MailComposeView /> },
      { path: "mail/:id", element: <MailDetailView /> },
    ],
  },
];
