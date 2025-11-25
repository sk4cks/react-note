import { useLocation, useParams } from "react-router-dom";
import { Nav } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addList } from "../../store/store";

function DetailView() {
  const params = useParams();
  const location = useLocation();
  let dispatch = useDispatch();
  let [tabState, setTabState] = useState(0);
  let content = [<div>내용0</div>, <div>내용1</div>, <div>내용2</div>];
  let [fade, setFade] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setFade("end");
    }, 100);
  }, []);

  return (
    <div className={`container start ${fade}`}>
      <div className="row">
        <div className="col-md-6">
          <img
            src={`https://codingapple1.github.io/shop/shoes${
              location.state.item.id + 1
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

      <Nav variant="tabs" defaultActiveKey="link0">
        <Nav.Item>
          <Nav.Link
            onClick={() => {
              setTabState(0);
            }}
            eventKey="link0"
          >
            버튼0
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={() => {
              setTabState(1);
            }}
            eventKey="link1"
          >
            버튼1
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={() => {
              setTabState(2);
            }}
            eventKey="link2"
          >
            버튼2
          </Nav.Link>
        </Nav.Item>
      </Nav>
      {content[tabState]}
    </div>
  );
}

export default DetailView;
