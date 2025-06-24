import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AddProject from "./pages/AddProject";
import Loadingbar from "./components/Loadingbar";
import ChatHome from "./pages/chats/ChatHome";

import SidebarLayout from "./layouts/SidebarLayout";
import ChatSidebarLayout from "./layouts/ChatSidebarLayout";
import AiGenerator from "./pages/chats/AiGenerator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/add-project" element={<AddProject />} />
        </Route>

        <Route element={<ChatSidebarLayout />}>
          <Route path="/chat-home" element={<ChatHome />} />
          <Route path="/ai-generator" element={<AiGenerator />} />
        </Route>
        <Route path="/loading" element={<Loadingbar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
