/** 메일 목록·쓰기·주소록·상세. RequireAuth 아래. */
import MailInboxView from "../views/mail/MailInboxView";
import MailDetailView from "../views/mail/MailDetailView";
import MailComposeView from "../views/mail/MailComposeView";
import MailContactsView from "../views/mail/MailContactsView";
import MailLayoutView from "../views/mail/MailLayoutView";

export const MailRoutes = [
  {
    element: <MailLayoutView />,
    children: [
      { path: "mail", element: <MailInboxView /> },
      { path: "mail/compose", element: <MailComposeView /> },
      { path: "mail/contacts", element: <MailContactsView /> },
      { path: "mail/:id", element: <MailDetailView /> },
    ],
  },
];
