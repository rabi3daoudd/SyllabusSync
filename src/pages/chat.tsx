import { useRouter } from "next/router";
import { useEffect } from "react";

import ChatBot from "../components/assistant/Chat";
import { auth } from "../firebase-config";

import "../app/globals.css";

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
  }, []);

  return (
    <div className="flex flex-col min-h-screen z-40">
      <div className="flex flex-col space-y-4 items-center justify-center h-screen z-40">
        <ChatBot />
      </div>
    </div>
  );
}
