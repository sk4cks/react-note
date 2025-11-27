const List = ({ list, pageNum, ProductList, loadMore }) => {
    
    return (
        <>
            <div className="main-bg"></div>

            <div className="container">
                <div className="row">
                    {list.map((item, index) => (
                        <ProductList item={item} key={index} />
                    ))}
                </div>

                {pageNum === 3 ? (
                    <p>마지막 페이지입니다.</p>
                ) : (
                    <button onClick={loadMore}>더보기</button>
                )}
            </div>
        </>
    );
};

export default List;