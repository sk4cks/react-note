import { createBrowserRouter } from "react-router-dom";
import { MailRoutes } from "./MailRoutes";
import { AuthRoutes } from "./AuthRoutes";
import HomeRedirect from "./HomeRedirect";
import RequireAuth from "./RequireAuth";
import NotFoundView from "../views/errors/NotFoundView";
import Layout from "../layout/Layout";

export const router = createBrowserRouter([
  { path: "/", element: <HomeRedirect /> },
  {
    element: <Layout />,
    children: [
      {
        element: <RequireAuth />,
        children: MailRoutes,
      },
    ],
  },
  ...AuthRoutes,
  { path: "*", element: <NotFoundView /> },
]);
