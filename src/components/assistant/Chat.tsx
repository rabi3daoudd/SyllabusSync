"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { readDataStream } from "@/lib/read-data-stream";
import { AssistantStatus, Message } from "ai/react";
import { ChangeEvent, useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

// const roleToColorMap: Record<Message["role"], string> = {
//   system: "lightred",
//   user: "white",
//   function: "lightblue",
//   assistant: "lightgreen",
// };

const DotAnimation = () => {
  const dotVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  // Stagger children animations
  const containerVariants = {
    initial: { transition: { staggerChildren: 0 } },
    animate: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
    exit: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
  };

  const [key, setKey] = useState(0);

  return (
    <motion.div
      key={key}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex gap-x-0.5 -ml-1"
      variants={containerVariants}
      onAnimationComplete={() => setKey((prevKey) => prevKey + 1)}
    >
      {[...Array(3)].map((_, i) => (
        <motion.span key={i} variants={dotVariants}>
          .
        </motion.span>
      ))}
    </motion.div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | undefined>(undefined);
  const [threadId, setThreadId] = useState<string>("");
  const [error, setError] = useState<unknown | undefined>(undefined);
  const [status, setStatus] = useState<AssistantStatus>("awaiting_message");
  const [isEmpty, setIsEmpty] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFormSubmit(e);
    }
  };

  const handleFormSubmit = async (
    e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    setStatus("in_progress");

    setMessages((messages: Message[]) => [
      ...messages,
      { id: "", role: "user", content: message! },
    ]);

    const formData = new FormData();
    formData.append("message", message as string);
    formData.append("threadId", threadId);
    if (file) {
      formData.append("file", file);
    }
    const result = await fetch("/api/assistant", {
      method: "POST",
      body: formData,
    });

    setFile(undefined);

    if (result.body == null) {
      throw new Error("The response body is empty.");
    }

    try {
      for await (const { type, value } of readDataStream(
        result.body.getReader()
      )) {
        switch (type) {
          case "assistant_message": {
            const messageContent = value.content
              .map((c) => c.text.value)
              .join("");
            if (messageContent.trim() !== "") {
              setMessages((prevMessages) => [
                ...prevMessages,
                {
                  id: value.id,
                  role: value.role,
                  content: messageContent,
                },
              ]);
            }
            break;
          }
          case "assistant_control_data": {
            setThreadId(value.threadId);
            setMessages((prevMessages) => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              lastMessage.id = value.messageId;
              return [
                ...prevMessages.slice(0, prevMessages.length - 1),
                lastMessage,
              ];
            });
            break;
          }
          case "error": {
            setError(value);
            break;
          }
        }
      }
    } catch (error) {
      setError(error);
    }

    setStatus("awaiting_message");
    setMessage("");
    setIsEmpty(true); // Reset isEmpty to true after sending the message
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFile(file);
    setIsEmpty(!file); // Set isEmpty to false if a file is selected
  };

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsEmpty(e.target.value.trim() === ""); // Update isEmpty based on the input value
  };

  const handleOpenFileExplorer = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-10 bg-white bg-opacity-20 border border-[#18A1AD] outline-4 backdrop-blur-lg rounded-xl shadow-lg w-12/12 md:w-3/4 lg:w-2/2 h-3/5 p-4 flex flex-col z-20">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Hi Rabih, How can I help you today
          </h2>
        </div>
        {error != null && (
          <div className="relative bg-red-500 text-white px-6 py-4 rounded-md">
            <span className="block sm:inline">
              Error: {(error as Error).toString()}
            </span>
          </div>
        )}
        <div className="flex flex-col space-y-4" ref={messagesEndRef}>
          {messages.map((m: Message, index) => (
            <div
              key={m.id || index}
              className={`flex ${
                m.role === "user" ? "justify-start" : "justify-end"
              } items-start`}
            >
              {m.role === "user" ? (
                <Icons.UserIcon className="h-6 w-6 text-gray-600 mr-2" />
              ) : (
                <Icons.AssistantIcon className="h-6 w-6 text-[#1FCAD9] ml-2" />
              )}
              <div
                className={`p-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-[#1FCAD9] text-white"
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {status === "in_progress" && (
            <span className="text-left text-black flex justify-center gap-x-2">
              Reading <DotAnimation />
            </span>
          )}
          <div ref={messagesBottomRef} />
        </div>
      </div>
      <div className="border-t-2 border-[#18A1AD] px-4 pt-4 mb-2 sm:mb-0">
        <div className="relative flex">
          <span className="absolute inset-y-0 flex items-center">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Button
                className="h-10 w-10 mr-2"
                size="icon"
                variant="ghost"
                disabled={status !== "awaiting_message"}
                onClick={handleOpenFileExplorer}
              >
                <Input
                  className="hidden sr-only"
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <Icons.PaperclipIcon className="h-5 w-5 text-[#1FCAD9]" />
                <span className="sr-only">Attach a file</span>
              </Button>
            </div>
          </span>
          <Input
            className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-12 bg-transparent outline-none"
            placeholder="Message SyllabusSync Assistant ...."
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            disabled={status !== "awaiting_message"}
          />
          <div className="absolute right-0 items-center inset-y-0 sm:flex">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isEmpty ? 0 : 1, scale: isEmpty ? 0.5 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                className="h-10 w-10"
                size="icon"
                variant="ghost"
                onClick={handleFormSubmit}
                disabled={status !== "awaiting_message" || isEmpty}
              >
                <Icons.SendIcon className="h-5 w-5" />
                <span className="sr-only">Send a message</span>
              </Button>
            </motion.div>
          </div>
        </div>
        <span className="group-hover:text-white transition-colors duration-200 ease-in-out text-xs">
          {file ? file.name : ""}
        </span>
      </div>
    </div>
  );
};

export default ChatBot;
