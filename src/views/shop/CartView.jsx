import { useDispatch, useSelector } from "react-redux";
import Cart from "../../components/shop/Cart";

function CartView() {

  let cartList = useSelector((state) => state.cartList);
  let dispatch = useDispatch();

  return (
    <Cart
      cartList={cartList}
      dispatch={dispatch}
    />
  );
}

export default CartView;
