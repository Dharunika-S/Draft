import React from "react";
import logo from "../assets/Union 2.png";
import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    <div className="w-[270px] border-r h-full p-2 flex flex-col">
      <div className="flex items-center justify-center mb-3">
        <img src={logo} className="w-24 h-24 object-contain" onClick={() => navigate('/')}/>
      </div>

      
      <div className="flex items-center border rounded-full px-4 py-2 mb-5">
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none text-base w-full"
        />
        <FaSearch className="text-gray-100" />
      </div>

      <div className="p-2 flex-col text-base space-y-4">
        <div className="flex justify-between items-center cursor-pointer border-b-1 border-[#707070] pb-3">
          <span className="text-secondary">General</span>
          <FaPlus className="text-gray-100 text-base" />
        </div>
        <div className="pt-1 flex justify-between items-center cursor-pointer border-b-1 border-[#707070] pb-3">
          <span className="text-secondary">Projects</span>
          <FaPlus
            onClick={() => navigate("/add-project")}
            className="text-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
