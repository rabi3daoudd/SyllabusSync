"use client";

import React, { useState, useEffect } from "react";
import { SidebarNavigation } from "@/components/navigation/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "../firebase-config";
import { ColorProvider } from "@/components/ColorProvider";

interface LayoutClientProps {
  children: React.ReactNode;
}

export function LayoutClient({ children }: LayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);

      if (user && pathname === '/') {
        router.push('/dashboard');
      } else if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      }
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
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      <ColorProvider>
        {!isPublicRoute && isAuthenticated ? (
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
  );
}
