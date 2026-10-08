import NavigationBarView from "../views/nav/NavigationBarView";
import { Outlet } from "react-router-dom";

/** 상단 바와 아래 화면. */
const Layout = () => {
  
  return (
    <>

      {/* 상단 바 */}
      <NavigationBarView />

      {/* 아래 화면 */}
      <Outlet />
    </>
  );
};

export default Layout;