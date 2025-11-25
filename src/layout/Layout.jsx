import NavigationBarView from "../views/nav/NavigationBarView";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <NavigationBarView />
      
      <Outlet />
    </>
  );
};

export default Layout;