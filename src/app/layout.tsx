"use client";

import React, { useState, useEffect } from "react";
import { SidebarNavigation } from "@/components/navigation/sidebar";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  const shouldShowSidebar = pathname !== "/login" && pathname !== "/signup";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <html lang="en">
      <body>
        {shouldShowSidebar ? (
          <SidebarNavigation
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {children}
          </SidebarNavigation>
        ) : (
          <main className="flex-grow overflow-auto">{children}</main>
        )}
        <Toaster />
      </body>
    </html>
  );
}