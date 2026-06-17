import { createBrowserRouter } from 'react-router-dom';
import { ShopRoutes } from './ShopRoutes';
import { MailRoutes } from './MailRoutes';
import { AuthRoutes } from './AuthRoutes';
import NotFoundView from "../views/errors/NotFoundView";
import Layout from '../layout/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...ShopRoutes,
      ...MailRoutes,
    ],
  },
  ...AuthRoutes,
  { path: "*", element: <NotFoundView /> }, // 404 항상 맨 뒤에 있어야함
]);