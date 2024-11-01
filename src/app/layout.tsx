"use client";

import React, { useState, useEffect } from "react";
import { SidebarNavigation } from "@/components/navigation/sidebar";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import {ColorProvider} from "@/components/ColorProvider"

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
        
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            <ColorProvider>
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
            </ColorProvider>
          </ThemeProvider>
        
      </body>
    </html>
  );
}
