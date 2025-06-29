import React from "react";

const ChatBubble = ({ sender, text }) => {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 my-1 text-sm whitespace-pre-wrap rounded-2xl shadow-md
          ${
            isUser
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white self-end"
              : "bg-gradient-to-r from-blue-100 to-blue-200 text-black self-start"
          }
        `}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
