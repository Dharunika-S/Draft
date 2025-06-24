import React, { useState, useRef, useEffect } from "react";

import { IoMdAdd } from "react-icons/io";
import { LuMic } from "react-icons/lu";
import { IoSend } from "react-icons/io5";
import { RxCrossCircled } from "react-icons/rx";
import {
  AiFillFilePdf,
  AiFillFileExcel,
  AiFillFileWord,
  AiFillFileImage,
  AiFillFile,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setListening, setTranscript } from "../../redux/slices/chatSlice";


const AiGenerator = () => {
  const dispatch = useDispatch();
  const { messages, listening, transcript } = useSelector((state) => state.chat);

  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [recognitionInstance, setRecognitionInstance] = useState(null); // Local state for recognition instance

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getFileIcon = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf": return <AiFillFilePdf className="text-red-500" size={32} />;
      case "xls": case "xlsx": return <AiFillFileExcel className="text-green-500" size={32} />;
      case "doc": case "docx": return <AiFillFileWord className="text-blue-500" size={32} />;
      case "png": case "jpg": case "jpeg": case "gif": return <AiFillFileImage className="text-purple-500" size={32} />;
      default: return <AiFillFile className="text-gray-500" size={32} />;
    }
  };

  const handleFileChange = (event) => {
    setFiles([...files, ...Array.from(event.target.files)]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      const newMessage = {
        id: Date.now(),
        text: message.trim(),
        sender: "user",
        files: files.map(file => ({ name: file.name, type: file.type })) 
      };
      dispatch(addMessage(newMessage));
      setMessage("");
      setFiles([]);

      
      // API_URL.post('/chat/ai-generator', { message: newMessage.text, files: files })
      //   .then(response => {
      //     dispatch(addMessage({ id: Date.now(), text: response.data.reply, sender: "ai" }));
      //   })
      //   .catch(error => {
      //     console.error("AI Generation error:", error);
      //     dispatch(addMessage({ id: Date.now(), text: "Error generating response.", sender: "ai" }));
      //   });
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in your browser. Please use Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      dispatch(setListening(true));
      dispatch(setTranscript(""));
    };

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      dispatch(setTranscript(currentTranscript));
      setMessage(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      dispatch(setListening(false));
    };

    recognition.onend = () => {
      dispatch(setListening(false));
    };

    setRecognitionInstance(recognition);
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      dispatch(setListening(false));
    }
  };


  return (
    <div className="flex flex-col h-full bg-black text-white p-4">
      <div className="flex-1 overflow-y-auto pr-4" ref={chatContainerRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                }`}
            >
              <p>{msg.text}</p>
              {msg.files && msg.files.length > 0 && (
                <div className="mt-2 text-sm text-gray-300">
                  Attached Files:
                  <ul className="list-disc list-inside">
                    {msg.files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {listening && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white text-black rounded-lg p-6 w-[300px] text-center shadow-lg">
              <h2 className="text-xl font-bold mb-4">Listening...</h2>
              <p className="text-gray-700">{transcript || "Speak now..."}</p>
              <BsMic size={40} className="mx-auto mt-4 text-blue-600 animate-pulse" />
              <button
                onClick={stopListening}
                className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Stop Listening
              </button>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {getFileIcon(file)}
              <span className="ml-2">{file.name}</span>
              <RxCrossCircled
                className="ml-2 text-red-400 cursor-pointer"
                onClick={() => removeFile(index)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 relative p-2 bg-gray-800 rounded-lg">
        <div className="flex items-center border border-gray-600 rounded-md p-2 bg-gray-900">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            className="outline-none resize-none w-full min-h-[40px] max-h-[100px] bg-transparent text-sm sm:text-base"
            rows={1}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <IoMdAdd
                size={24}
                className="cursor-pointer"
                onClick={triggerFileSelect}
              />
              <LuMic size={20} className="cursor-pointer" onClick={startListening} />
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
          className="absolute bottom-3 right-3 bg-gradient-to-b from-gradientStart to-gradientEnd rounded-lg rounded-tr-none py-1 px-4 sm:px-5 text-white shadow-md text-sm sm:text-base"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AiGenerator;