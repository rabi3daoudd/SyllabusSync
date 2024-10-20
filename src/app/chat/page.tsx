"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ChatBot from "@/components/assistant/Chat";
import { auth } from "../../firebase-config";

export default function Chat() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User is not authenticated, redirect to the login page
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen z-45">
      <div className="flex flex-col space-y-4 items-center justify-center h-screen z-45">
        <ChatBot />
      </div>
    </div>
  );
}
