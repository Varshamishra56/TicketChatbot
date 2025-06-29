import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import { AnimatePresence, motion } from "framer-motion";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Persist chat state
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `👋 Hey there! Need help with something? 🤖\n\nYou can ask me questions directly OR enter your Ticket Number (if you have one) to check the status.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  return (
    <>
      {/* Floating bubble icon with tooltip and animation */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative group">
          <div
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer animate-pulse hover:animate-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaCommentDots size={24} />
          </div>
          {!isOpen && (
            <div className="absolute bottom-14 right-1/2 translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded shadow opacity-80 group-hover:opacity-100 transition-opacity duration-200">
              Need help? Click me!
            </div>
          )}
        </div>
      </motion.div>

      {/* AnimatePresence wraps conditional render */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <ChatWindow
            key="chat"
            onClose={() => setIsOpen(false)}
            {...{
              messages,
              setMessages,
              suggestions,
              setSuggestions,
              input,
              setInput,
              isLoading,
              setIsLoading,
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
