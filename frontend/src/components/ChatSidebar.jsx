import React from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { LiaPenAltSolid } from "react-icons/lia";

const ChatSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAiGenerator = location.pathname === "/ai-generator";
  const isMainChat = location.pathname === "/chat-home";
  return (
    <div className="bg-white">
      <div className="w-[290px] bg-gradient-to-bl from-[rgba(3,162,208,0.5)] to-[rgba(37,190,187,0.5)] rounded-2xl border my-2 ml-3 h-[710px] p-2 flex flex-col">
        <div className="flex items-center justify-center mb-5 mt-5 space-x-4 text-black">
          {/* AI Generator */}
          <div
            onClick={() => navigate("/ai-generator")}
            className={`cursor-pointer px-4 py-2 rounded-full ${
              isAiGenerator ? "bg-white text-black shadow" : ""
            }`}
          >
            <h1>AI Generator</h1>
          </div>

          {/* Divider */}
          <div className="h-6 w-[1.2px] bg-black opacity-100"></div>

          {/* Main Chat */}
          <div
            onClick={() => navigate("/chat-home")}
            className={`cursor-pointer px-4 py-2 rounded-full ${
              isMainChat ? "bg-white text-black shadow" : ""
            }`}
          >
            <h1>Main Chat</h1>
          </div>
        </div>

        <div
          className="flex items-center justify-between bg-black rounded-lg px-2 py-1.5 mb-3"
          onClick={() => navigate("/add-project")}
        >
          <h1 className="text-[16px] text-white">New Chat</h1>
          <LiaPenAltSolid className="text-gray-100" size={20} />
        </div>

        <div className="p-1 flex-col text-base space-y-1">
          <h1 className="text-black text-start">Today</h1>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
