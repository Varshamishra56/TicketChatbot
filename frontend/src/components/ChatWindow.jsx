import React, { useRef, useEffect, useLayoutEffect } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import { AnimatePresence, motion } from "framer-motion";
import { FaRegQuestionCircle } from "react-icons/fa";
import isTicketNumber from "../utils/isTicketNumber";

const ChatWindow = ({
  onClose,
  messages,
  setMessages,
  input,
  setInput,
  isLoading,
  setIsLoading,
  suggestions,
  setSuggestions,
}) => {
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on updates
  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, suggestions, isLoading]);

  // Handle suggestion click
  const handleSuggestionClick = (faq) => {
    setSuggestions([]);
    const userSelection = { sender: "user", text: faq.Question };
    const botReply = { sender: "bot", text: faq.Answer };
    setMessages((prev) => [...prev, userSelection, botReply]);
  };

  // Send user message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 🧾 If input is a ticket number, use ticket-based route
      if (isTicketNumber(userMsg.text)) {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/ask_by_ticket`,
          {
            ticket_number: userMsg.text,
          }
        );
        const data = res.data;

        const reply =
          Array.isArray(data) && data.length > 0
            ? data.map((item) => item.Answer).join("\n\n")
            : "Sorry, no relevant answer found for that ticket.";
        setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
        return;
      }

      // 💬 Regular FAQ query flow
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/ask`, {
        query: userMsg.text,
      });
      const data = res.data;

      const onlyFallback =
        Array.isArray(data) &&
        data.length === 1 &&
        data[0].Answer?.toLowerCase().includes("no relevant answer");

      if (Array.isArray(data) && data.length > 0 && !onlyFallback) {
        setSuggestions(data);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Sorry, I couldn't find anything relevant." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Server error. Try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col z-50"
    >
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-t-lg flex justify-between items-center shadow">
        <span className="text-base tracking-wide">FAQ Assistant</span>
        <button
          onClick={onClose}
          className="text-white text-xl hover:scale-110 transform transition-transform duration-150"
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>

      {/* Messages + Suggestions */}
      <div ref={chatRef} className="flex-1 p-2 overflow-y-auto space-y-2">
        {messages.map((msg, idx) => (
          <motion.div
            key={`msg-${idx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <ChatBubble sender={msg.sender} text={msg.text} />
          </motion.div>
        ))}

        {suggestions.length > 0 && (
          <motion.div
            key="suggestions-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-1"
          >
            <ChatBubble sender="bot" text="Did you mean one of these?" />
            {suggestions.map((item, idx) => (
              <div
                key={`suggestion-${idx}`}
                onClick={() => handleSuggestionClick(item)}
                className="cursor-pointer bg-white hover:bg-blue-50 border border-blue-300 text-sm px-4 py-2 rounded-lg shadow transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start gap-2">
                  <FaRegQuestionCircle
                    className="text-blue-500 shrink-0 mt-1"
                    size={16}
                  />
                  <span className="text-sm">{item.Question}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded p-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your question..."
          disabled={suggestions.length > 0}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          disabled={suggestions.length > 0}
        >
          Send
        </button>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
