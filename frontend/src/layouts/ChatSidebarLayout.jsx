import React from "react";
import ChatSidebar from "../components/ChatSidebar";
import { Outlet } from "react-router-dom";

const ChatSidebarLayout = () => {
  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <ChatSidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default ChatSidebarLayout;
