import { useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addList } from "../../store/store";
import Detail from "../../components/shop/Detail";
import DetailNav from "../../components/shop/DetailNav";

function DetailView() {

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
      <Detail
        location={location}
        dispatch={dispatch}
        addList={addList}
      />

      <DetailNav
        content={content}
        tabState={tabState}
        setTabState={setTabState}
      />
    </div>
  );
}

export default DetailView;
