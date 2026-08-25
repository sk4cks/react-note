import { router } from './router';
import "./assets/css/App.css";
import { RouterProvider } from "react-router-dom";

/** 라우터만 붙이는 루트. */
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
