import ListView from "../views/shop/ListView";
import DetailView from "../views/shop/DetailView";
import CartView from "../views/shop/CartView";

export const shopRoutes = [
  { index: true, element: <ListView /> },
  { path: "detail/:id", element: <DetailView /> },
  { path: "cart", element: <CartView /> },
];