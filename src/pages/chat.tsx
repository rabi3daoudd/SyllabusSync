"use client";

import ChatBot from "../components/assistant/Chat";
import Navbar from "../components/navigation/Navbar";

export default function Chat() {
  return (
    <div className="flex flex-col space-y-4 items-center justify-center h-screen">
        <Navbar />
      <ChatBot />
    </div>
  );
}