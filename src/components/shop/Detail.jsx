const Detail = ({ location, dispatch, addList }) => {
    
    return (
        <div className="row">
            <div className="col-md-6">
                <img
                    src={`https://codingapple1.github.io/shop/shoes${location.state.item.id + 1
                        }.jpg`}
                    width="100%"
                ></img>
            </div>
            <div className="col-md-6 mt-4">
                <h4 className="pt-5">{location.state.item.title}</h4>
                <p>{location.state.item.content}</p>
                <p>{location.state.item.price}원</p>
                <button
                    className="btn btn-danger"
                    onClick={() => {
                        dispatch(
                            addList({
                                id: location.state.item.id + 4,
                                name: location.state.item.title,
                                count: 1,
                            })
                        );
                    }}
                >
                    주문하기
                </button>
            </div>
        </div>
    );
};

export default Detail;