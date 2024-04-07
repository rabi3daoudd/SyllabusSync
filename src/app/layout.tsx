import React from "react";
import Navbar from "@/components/navigation/Navbar";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster"

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const shouldShowNavbar =
    pathname !== "/login" && pathname !== "/signup";

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main>{children}</main>
      <Toaster />
    </>
  );
};

export default Layout;