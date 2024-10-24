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
    <>
      <ChatBot />
    </>
  );
}
