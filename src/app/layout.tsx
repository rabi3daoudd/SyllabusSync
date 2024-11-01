"use client";

import React, { useState, useEffect } from "react";
import { SidebarNavigation } from "@/components/navigation/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "../firebase-config";
import "./globals.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user && pathname === '/') {
        router.push('/dashboard');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading component
  }

  const isLandingPage = pathname === '/';
  const shouldShowSidebar = !isLandingPage && pathname !== "/login" && pathname !== "/signup";

  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
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
        </ThemeProvider>
      </body>
    </html>
  );
}