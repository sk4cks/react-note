import NavigationBarView from "../views/nav/NavigationBarView";
import { Outlet } from "react-router-dom";

/** 상단 바와 아래 화면. */
const Layout = () => {
  
  return (
    <>
      <NavigationBarView />
      
      <Outlet />
    </>
  );
};

export default Layout;