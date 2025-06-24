import React, { useState, useRef } from "react";
import icon2 from "../../assets/icon2.png";
import group45 from "../../assets/Group 45.png";
import { IoMdAdd } from "react-icons/io";
import { LuMic } from "react-icons/lu";

import { RxCrossCircled } from "react-icons/rx";
import {
  AiFillFilePdf,
  AiFillFileExcel,
  AiFillFileWord,
  AiFillFileImage,
  AiFillFile,
} from "react-icons/ai";
import { API_URL } from "../../api/apiConfig";

const ChatHome = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  const getFileIcon = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return <AiFillFilePdf className="text-red-500" size={42} />;
      case "xls":
      case "xlsx":
        return <AiFillFileExcel className="text-green-500" size={42} />;
      case "doc":
      case "docx":
        return <AiFillFileWord className="text-blue-500" size={42} />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <AiFillFileImage className="text-yellow-500" size={42} />;
      default:
        return <AiFillFile className="text-gray-500" size={42} />;
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (message.trim() || files.length > 0) {
      const formData = new FormData();
      formData.append("message", message);
      files.forEach((file) => {
        formData.append("files", file);
      });

      try {
        const response = await API_URL.post("/chat", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("Message and files sent successfully:", response.data);
        // You might want to update your UI with the response from the backend
      } catch (error) {
        console.error("Error sending message and files:", error);
      }

      setMessage("");
      setFiles([]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <>
      {listening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white text-black rounded-lg p-6 w-[300px] text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Listening...</h2>
            <p className="italic text-gray-700">
              {transcript || "Speak now..."}
            </p>
            <button
              onClick={() => {
                recognitionInstance?.stop();
                setListening(false);
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Stop
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col justify-between items-center bg-[#F7F7F7] w-full min-h-screen text-black px-4 pb-4">
        {/* Top Divider */}
        <div className="w-full max-w-screen-xl border-b border-black pt-10 mb-4" />

        <div className="flex gap-2 absolute mt-5 mr-5 right-0">
          <img src={group45} alt="icon1" className="w-14 h-14 object-contain" />
          <img src={icon2} alt="icon2" className="w-14 h-14 object-contain" />
        </div>

        {/* Center section*/}
        <div className="w-40 h-40 sm:w-64 sm:h-64 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(3,162,208,0.4)_0%,_rgba(37,190,187,0.4)_100%)] flex justify-center items-center">
          <div className="flex flex-col items-center text-center px-2">
            <img
              src={icon2}
              alt="Icon2"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain opacity-50"
            />
            <h1 className="text-base sm:text-lg font-semibold opacity-50">D.R.A.F.T.</h1>
            <p className="text-xs sm:text-sm opacity-50">A proud product of AlphaP</p>
          </div>
        </div>

        
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 ml-5 w-full max-w-screen-md">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-md px-2 py-1 shadow-md text-base w-full h-14 sm:w-auto"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(file)}
                  <span className="truncate max-w-[160px]">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500"
                >
                  <RxCrossCircled size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chat Input Section */}
        <div className="w-full max-w-screen-md px-3 flex items-end relative">
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md px-3 py-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything..."
              className="outline-none py-5 resize-none w-full min-h-[40px] max-h-[100px] bg-transparent text-sm sm:text-base"
              rows={1}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <IoMdAdd
                  size={24}
                  className="cursor-pointer"
                  onClick={triggerFileSelect}
                />
                <LuMic
                  size={20}
                  className="cursor-pointer"
                  onClick={() => {
                    const SpeechRecognition =
                      window.SpeechRecognition ||
                      window.webkitSpeechRecognition;

                    if (!SpeechRecognition) {
                      alert(
                        "Your browser does not support Speech Recognition."
                      );
                      return;
                    }

                    const recognition = new SpeechRecognition();
                    recognition.lang = "en-US";
                    recognition.interimResults = true;
                    recognition.continuous = false;

                    recognition.onresult = (event) => {
                      const currentTranscript = Array.from(event.results)
                        .map((result) => result[0].transcript)
                        .join("");
                      setTranscript(currentTranscript);
                      setMessage(currentTranscript);
                    };

                    recognition.onerror = (event) => {
                      console.error("Speech recognition error", event.error);
                      setListening(false);
                    };

                    recognition.onend = () => {
                      setListening(false);
                    };

                    setRecognitionInstance(recognition);
                    setTranscript("");
                    setListening(true);
                    recognition.start();
                  }}
                />
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSend}
            className="absolute bottom-0 right-3 bg-gradient-to-b from-gradientStart to-gradientEnd rounded-lg rounded-tr-none py-1 px-4 sm:px-5 text-white shadow-md text-sm sm:text-base"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatHome;