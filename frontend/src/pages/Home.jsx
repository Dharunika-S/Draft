import React from "react";
import logo from "./../assets/Union 2.png";
import icon from "./../assets/Icon ion-library.png";

const Home = () => {
  return (
    <div className="relative flex w-full h-full items-center justify-center">
      <img src={icon} alt="icon" className="w-7 h-7 absolute top-4 right-4" />

      <div className="flex flex-col items-center justify-center">
        <img
          src={logo}
          alt="logo"
          className="w-36 h-36 object-contain opacity-60"
        />

        <h1 className="uppercase tracking-widest opacity-60 text-center text-md">
          Dynamic Response & AI-driven Filing Tool
        </h1>
      </div>
    </div>
  );
};

export default Home;
