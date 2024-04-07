import React from "react";
import Navbar from "@/components/navigation/Navbar";
import { useRouter } from "next/router";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const shouldShowNavbar =
    router.pathname !== "/login" && router.pathname !== "/signup";

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main>{children}</main>
    </>
  );
};

export default Layout;