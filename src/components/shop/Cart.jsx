import { Table } from "react-bootstrap";
import { countUp } from "../../store/store";

const Cart = ({ cartList, dispatch }) => {

    return (
        <div>
            <Table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>상품명</th>
                        <th>수량</th>
                        <th>변경하기</th>
                    </tr>
                </thead>
                <tbody>
                    {cartList.map((item, index) => {
                        return (
                            <tr key={index}>
                                <td>{item.id}</td>
                                <td>{item.name}</td>
                                <td>{item.count}</td>
                                <td>
                                    <button
                                        onClick={() => {
                                            dispatch(countUp(item.id));
                                        }}
                                    >
                                        +
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default Cart;