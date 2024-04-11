// Import necessary modules and components
import React from "react";
import Navbar from "@/components/navigation/Navbar"; // Import Navbar component
import { usePathname } from "next/navigation"; // Import usePathname hook from Next.js
import { Toaster } from "@/components/ui/toaster" // Import Toaster component

// Define the type for the props of the Layout component
type LayoutProps = {
  children: React.ReactNode; // children prop will accept any valid React node
};

// Define the Layout component
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname(); // Get the current path using the usePathname hook

  // Determine whether to show the Navbar
  // Navbar should not be shown on the login and signup pages
  const shouldShowNavbar =
    pathname !== "/login" && pathname !== "/signup";

  return (
    <>
      {shouldShowNavbar && <Navbar />} // Conditionally render the Navbar
      <main>{children}</main> // Render the children inside a main tag
      <Toaster /> // Render the Toaster component
    </>
  );
};

// Export the Layout component as the default export
export default Layout;