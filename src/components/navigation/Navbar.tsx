"use client";

import * as React from "react";
import { SidebarNavigation } from "./sidebar";

export default function Navbar() {
  return (
    <>
      <SidebarNavigation
        isOpen={false}
        onToggle={function (): void {
          throw new Error("Function not implemented.");
        } } children={undefined}      />
    </>
  );
}
