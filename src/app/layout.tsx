// Use client directive if using client-side hooks like usePathname
"use client"; 

// Import necessary modules and components
import React from "react";
import Navbar from "@/components/navigation/Navbar"; // Import Navbar component
import { usePathname } from "next/navigation"; // Import usePathname hook from Next.js
import { Toaster } from "@/components/ui/toaster"; // Import Toaster component
import "./globals.css";


// Define the RootLayout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get the current path using the usePathname hook

  // Determine whether to show the Navbar
  // Navbar should not be shown on the login and signup pages
  const shouldShowNavbar = pathname !== "/login" && pathname !== "/signup";

  return (
    <html lang="en">
      <head>
        {/* Place global head elements here if needed */}
      </head>
      <body>
        {shouldShowNavbar && <Navbar />}
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
