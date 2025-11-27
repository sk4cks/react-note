import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { shoesList } from "../../temp_data/shoesData";
import List from "../../components/shop/List";

const ListView = () => {
  
  const [list, setList] = useState(shoesList);
  const [pageNum, setPageNum] = useState(1);

  const loadMore = () => {
    axios
      .get(`https://codingapple1.github.io/shop/data${pageNum + 1}.json`)
      .then((response) => {
        setList([...list, ...response.data]);
        setPageNum(pageNum + 1);
      })
      .catch(console.error);
  };

  function ProductList(props) {
    let navigate = useNavigate();
    return (
      <div
        onClick={() => {
          navigate(`/detail/${props.item.id}`, { state: { item: props.item } });
        }}
        className="col-md-4"
      >
        <img
          src={`https://codingapple1.github.io/shop/shoes${
            props.item.id + 1
          }.jpg`}
          width="80%"
        />
        <h4>{props.item.title}</h4>
        <p>{props.item.content}</p>
        <p>{props.item.price}</p>
      </div>
    );
  }

  return (
    <List
      list={list}
      pageNum={pageNum}
      ProductList={ProductList}
      loadMore={loadMore}
    />
  )
};

export default ListView;