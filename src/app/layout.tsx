"use client";

import { LayoutClient } from "@/app/layout-client";
import "./globals.css";
import React from "react";

interface RootLayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = React.isValidElement(children) ? children.props?.childProp?.segment : '';
  const isLandingPage = pathname === '(landing)' || pathname === 'login' || pathname === 'signup';
  const shouldShowSidebar = !isLandingPage;

  return (
    <html lang="en">
      <body>
        <LayoutClient shouldShowSidebar={shouldShowSidebar}>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}