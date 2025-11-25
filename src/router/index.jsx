import { createBrowserRouter } from 'react-router-dom';
import { shopRoutes } from './ShopRoutes';
import { authRoutes } from './AuthRoutes';
import Layout from '../layout/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...shopRoutes
    ],
  },
  ...authRoutes,
]);