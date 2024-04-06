import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "../firebase-config";
import ChatBot from "../components/assistant/Chat";
import Navbar from "../components/navigation/Navbar";
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
    <div className="flex flex-col space-y-4 items-center justify-center h-screen">
      <Navbar />
      <ChatBot />
    </div>
  );
}