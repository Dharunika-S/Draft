import  { useEffect, useState } from "react";
import { IoCloudUploadOutline, IoCreateOutline } from "react-icons/io5";
import { GoGitMerge } from "react-icons/go";
import { useNavigate } from "react-router-dom";

const Loadingbar = () => {
 
    const navigate = useNavigate()
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if(prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => navigate("/chat-home"), 300);
                    return 100;
                }
                return prev + 1;
            })
        }, 30)

        return () => {
          clearInterval(interval)
        }
    }, [navigate])

  return (
    <div>
      <h1 className="border-b mt-10 border-black mx-10"></h1>

      <div className="px-12">
        <div className="flex flex-col mt-12">
          <div className="flex space-x-4 mb-5">
            <div className="bg-[#E4E4E4] rounded-full w-12 h-12 flex items-center justify-center ml-[-5px]">
              <IoCloudUploadOutline className="text-icon" size={20} />
            </div>
            <div className="bg-[#E4E4E4] rounded-full w-12 h-12 flex items-center justify-center">
              <IoCreateOutline className="text-icon" size={20} />
            </div>
            <div className="bg-[#E4E4E4] rounded-full w-12 h-12 flex items-center justify-center">
              <GoGitMerge className="text-icon" size={20} />
            </div>
          </div>
          <h1 className="text-black text-base text-start w-44">
            Upload, Cerate and Merge. A one stop solution for creating proposals
          </h1>
        </div>

        <div className="flex items-end">
          <h1 className="text-[200px] ml-[-18px] text-black text-start font-normal tracking-[4rem]">
            DRAFT
          </h1>

          <div className="flex flex-col ml-4 w-[370px] mb-10">
            <h1 className="text-black text-lg text-start pl-1 pb-1">Loading Resources</h1>
            <div className="h-4 bg-icon rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gradientStart to-gradientEnd transition-all duration-300 ease-out"
              style={{width: `${progress}%`}}></div>
            </div>
            <div className="text-right text-3xl text-gradientStart font-semibold mt-1">
                {progress}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(90deg, #03A2D0, #25BEBB)",
        }}
        className="w-full h-[200px]"
      >
        <h1 className="text-start ps-12 uppercase text-sm font-semibold pt-5 tracking-[14px]">
          Dynamic Response & AI-driven Filing Tool
        </h1>
      </div>
    </div>
  );
};

export default Loadingbar;
