// // src/components/AddProject.jsx - Corrected Frontend Code

// import React, { useState, useEffect } from "react";
// import { GrAttachment } from "react-icons/gr";
// import { IoMdAdd, IoMdTrash } from "react-icons/io";
// import { FaArrowCircleRight } from "react-icons/fa";

// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   setProjectDetails,
//   setLeadFirm,
//   setJvFirm,
//   setDocumentDate,
//   generateDocuments,
//   setGeminiApiKey,
//   clearDownloadStatus, // Import the new action
// } from "../redux/slices/projectSlice";
// import {
//   fetchTemplates,
//   // uploadTemplate, // Direct fetch used for simpler handling in component
//   // deleteTemplate  // Direct fetch used for simpler handling in component
// } from "../redux/slices/templateSlice";
// import { API_URL } from "../api/apiConfig"; // Import API_URL for direct Axios calls

// const AddProject = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const {
//     // title, // Not currently used in UI, but in Redux state
//     description,
//     leadFirm,
//     jvFirm,
//     documentDate,
//     loading, // Redux loading state for generateDocuments
//     error,   // Redux error for generateDocuments
//     geminiApiKey,
//     downloadStatus, // New: 'idle', 'in-progress', 'success', 'failed'
//     downloadFilename, // New: Stores the name of the downloaded file
//   } = useSelector((state) => state.project);
//   const {
//     list: templates,
//     loading: templatesLoading, // Redux loading state for template actions
//     error: templatesError,   // Redux error for template actions
//   } = useSelector((state) => state.templates);

//   const [selectedTemplates, setSelectedTemplates] = useState([]);
//   const [projectFile, setProjectFile] = useState(null);
//   // This state is for displaying the extracted/manual description in the textarea.
//   // It is synced with Redux 'description' state.
//   const [projectDescriptionPreview, setProjectDescriptionPreview] = useState("");
  
//   // States for description extraction feedback
//   const [descriptionExtractionLoading, setDescriptionExtractionLoading] = useState(false);
//   const [descriptionExtractionError, setDescriptionExtractionError] = useState(null);

//   // For dynamic JV Partner Firm inputs (if needed beyond one)
//   const [dropdowns, setDropdowns] = useState([{ id: Date.now() }]);


//   // Effect to fetch templates on component mount
//   useEffect(() => {
//     dispatch(fetchTemplates());
//   }, [dispatch]);

//   // Sync projectDescriptionPreview with Redux 'description' state
//   // This ensures that if description is updated by handleFileChange, the textarea reflects it.
//   useEffect(() => {
//     setProjectDescriptionPreview(description);
//   }, [description]);


//   // Effect to handle navigation based on downloadStatus
//   useEffect(() => {
//     if (downloadStatus === 'in-progress') {
//       navigate('/loading'); // Navigate to a loading page as soon as generation starts
//     } else if (downloadStatus === 'success') {
//       alert(`Document(s) '${downloadFilename}' downloaded successfully!`);
//       dispatch(clearDownloadStatus()); // Clear status after displaying message
//       navigate('/chat'); // Navigate to your success/chat page
//     } else if (downloadStatus === 'failed') {
//       alert(`Document generation or download failed: ${error}`);
//       dispatch(clearDownloadStatus());
//       // Optionally, navigate back or to an error page
//     }
//   }, [downloadStatus, downloadFilename, error, navigate, dispatch]);


//   // Handle project file upload for description extraction
//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setProjectFile(file);
//       setProjectDescriptionPreview("Extracting description..."); // Show loading text
//       setDescriptionExtractionLoading(true);
//       setDescriptionExtractionError(null); // Clear previous errors

//       // Create FormData to send the file and API key to the backend
//       const formData = new FormData();
//       formData.append("projectFile", file);
//       formData.append("geminiApiKey", geminiApiKey); // Ensure API key is sent for extraction

//       try {
//         const response = await API_URL.post("/extract-description", formData, {
//           headers: {
//             // Axios automatically sets Content-Type for FormData, but explicit for clarity
//             'Content-Type': 'multipart/form-data', 
//           },
//         });

//         if (response.status !== 200) { // Axios throws for 4xx/5xx by default, but this is a double-check
//           throw new Error(response.data?.error || "Failed to extract description from server.");
//         }

//         const data = response.data; // Axios automatically parses JSON response
//         // Update both local preview state and Redux state with the extracted description
//         setProjectDescriptionPreview(data.description);
//         dispatch(setProjectDetails({ description: data.description }));

//       } catch (err) {
//         // Handle Axios errors (err.response for server errors, err.message for network)
//         const errorMessage = err.response?.data?.error || err.message || "Failed to extract description.";
//         setProjectDescriptionPreview("Failed to extract description.");
//         setDescriptionExtractionError(errorMessage);
//         dispatch(setProjectDetails({ description: "" })); // Clear Redux description on error
//         console.error("Error extracting description:", err);
//       } finally {
//         setDescriptionExtractionLoading(false); // End loading
//       }
//     } else {
//       // If no file selected, clear related states
//       setProjectFile(null);
//       setProjectDescriptionPreview("");
//       setDescriptionExtractionLoading(false);
//       setDescriptionExtractionError(null);
//       dispatch(setProjectDetails({ description: "" })); // Clear Redux description if no file
//     }
//   };


//   // Handle template file upload
//   const handleTemplateFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const formData = new FormData();
//       formData.append("template", file);
//       try {
//         const response = await API_URL.post("/templates", formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         });
//         if (response.status === 201) { // 201 Created is typical for successful POST
//           alert("Template uploaded successfully!");
//           dispatch(fetchTemplates()); // Refresh template list after upload
//         } else {
//           // Axios throws for 4xx/5xx, so this might be redundant for network errors, but good for custom backend errors
//           const errorData = response.data;
//           alert(`Failed to upload template: ${errorData.error}`);
//         }
//       } catch (error) {
//         console.error("Error uploading template:", error);
//         alert(`Error uploading template: ${error.response?.data?.error || error.message}`);
//       }
//     }
//   };

//   // Handle template deletion
//   const handleDeleteTemplate = async (templateName) => {
//     if (window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
//       try {
//         const response = await API_URL.delete(`/templates/${templateName}`);
//         if (response.status === 200) {
//           alert("Template deleted successfully!");
//           dispatch(fetchTemplates()); // Refresh template list after deletion
//         } else {
//           const errorData = response.data;
//           alert(`Failed to delete template: ${errorData.error}`);
//         }
//       } catch (error) {
//         console.error("Error deleting template:", error);
//         alert(`Error deleting template: ${error.response?.data?.error || error.message}`);
//       }
//     }
//   };


//   // Handle document generation submission
//   // const handleSubmit = async () => {
//   //   // Ensure all required fields are filled based on current state values

//   //     console.log("--- Debugging handleSubmit ---");
//   // console.log("geminiApiKey:", geminiApiKey);
//   // console.log("description (from Redux):", description);
//   // console.log("leadFirm:", leadFirm);
//   // console.log("selectedTemplates:", selectedTemplates);
//   // console.log("selectedTemplates.length:", selectedTemplates.length);
//   // console.log("--- End Debug ---");

//   //   if (!geminiApiKey) {
//   //     alert("Please configure Gemini API Key.");
//   //     return;
//   //   }
//   //   // Use the `description` from Redux state, which is synced from `projectDescriptionPreview`
//   //   if (!description || !leadFirm) { 
//   //     alert("Please provide a project description and lead firm.");
//   //     return;
//   //   }
//   //   if (selectedTemplates.length === 0) {
//   //     alert("Please select at least one template to generate.");
//   //     return;
//   //   }

//   //   // Create FormData for the generate-document endpoint
//   //   // The backend expects form-data due to Flask's request.form and request.files
//   //   const formData = new FormData();
//   //   formData.append("projectDescription", description);
//   //   formData.append("leadFirm", leadFirm);
//   //   formData.append("jvFirm", jvFirm);
//   //   formData.append("date", documentDate);
//   //   selectedTemplates.forEach(template => {
//   //     formData.append("selectedTemplates", template); // Append each selected template name
//   //   });
//   //   formData.append("geminiApiKey", geminiApiKey);

//   //   // Dispatch the thunk with FormData
//   //   dispatch(generateDocuments(formData));
//   // };


//   const handleSubmit = async () => {
//   if (!geminiApiKey) {
//     alert("Please configure Gemini API Key.");
//     return;
//   }
//   if (!description || !leadFirm) {
//     alert("Please provide a project description and lead firm.");
//     return;
//   }
//   if (selectedTemplates.length === 0) {
//     alert("Please select at least one template to generate.");
//     return;
//   }

//   // Create FormData with proper field names
//   const formData = new FormData();
//   formData.append("projectDescription", description);
//   formData.append("leadFirm", leadFirm);
//   formData.append("jvFirm", jvFirm || ""); // Send empty string if null
//   formData.append("date", documentDate || new Date().toISOString().split('T')[0]);
  
//   // Append each selected template separately
//   selectedTemplates.forEach(template => {
//     formData.append("selectedTemplates", template);
//   });
  
//   formData.append("geminiApiKey", geminiApiKey);

//   // Debug the FormData before sending
//   for (let [key, value] of formData.entries()) {
//     console.log(key, value);
//   }

//   dispatch(generateDocuments(formData));
// };

//   return (
//     <>
//       <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
//         <div className="w-full max-w-4xl bg-[#1C1C1C] rounded-lg shadow-lg p-6 sm:p-8">
//           <h1 className="text-3xl font-bold mb-6 text-center text-gradient-to-r from-gradientStart to-gradientEnd">
//             Add New Project
//           </h1>

//           {/* Gemini API Key Input */}
//           <div className="mb-6 bg-[#282828] p-4 rounded-md">
//             <h2 className="text-xl font-semibold mb-3">API Configuration</h2>
//             <input
//               type="password" // Remains password type for security
//               placeholder="Enter Gemini API Key"
//               className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={geminiApiKey}
//               onChange={(e) => dispatch(setGeminiApiKey(e.target.value))}
//             />
//             <p className="text-gray-400 text-xs mt-2">
//               You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
//             </p>
//             {geminiApiKey && <p className="text-green-400 mt-2">✅ API Key Configured</p>}
//           </div>

//           <div className="mb-6 bg-[#282828] p-4 rounded-md">
//             <h2 className="text-xl font-semibold mb-3">Project Details</h2>
//             <div className="flex flex-col sm:flex-row gap-4 mb-4">
//               <input
//                 type="text"
//                 placeholder="Project Title"
//                 className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
//                 onChange={(e) => dispatch(setProjectDetails({ title: e.target.value, description }))}
//               />
//               <div className="relative flex-1">
//                 <input
//                   type="date"
//                   className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   value={documentDate}
//                   onChange={(e) => dispatch(setDocumentDate(e.target.value))}
//                 />
//               </div>
//             </div>

//             <textarea
//               placeholder="Project Description (will be auto-filled if you upload a document)"
//               className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md resize-y min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               value={projectDescriptionPreview} // Controlled by local state, synced from Redux 'description'
//               onChange={(e) => {
//                 setProjectDescriptionPreview(e.target.value); // Update local state for immediate feedback
//                 dispatch(setProjectDetails({description: e.target.value })); // Also update Redux state
//               }}
//             />

//             <div className="flex items-center gap-4 mb-4">
//               <input
//                 type="text"
//                 placeholder="Lead Firm Name"
//                 className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={leadFirm}
//                 onChange={(e) => dispatch(setLeadFirm(e.target.value))}
//               />
//               <label htmlFor="project-file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center gap-2">
//                 <GrAttachment size={18} /> Attach Project Doc
//                 <input
//                   id="project-file-upload"
//                   type="file"
//                   className="hidden"
//                   onChange={handleFileChange}
//                   accept=".docx,.pdf,.txt" // Allow DOCX, PDF, TXT for description extraction
//                 />
//               </label>
//             </div>
//             {projectFile && (
//               <div className="text-sm text-gray-400 mt-2">
//                 Attached: {projectFile.name}
//                 {descriptionExtractionLoading && <p className="text-blue-400 mt-2">Extracting description...</p>}
//                 {descriptionExtractionError && <p className="text-red-500 mt-2">Error: {descriptionExtractionError}</p>}
//               </div>
//             )}
//           </div>

//           <div className="mb-6 bg-[#282828] p-4 rounded-md">
//             <h2 className="text-xl font-semibold mb-3">Partner Firms</h2>
//             {/* The dropdowns state and map are for adding multiple JV partners.
//                 Currently, only `jvFirm` (single string) is used in Redux.
//                 If multiple JV partners are needed, `jvFirm` in Redux and the backend
//                 would need to be an array or a more complex structure.
//                 For now, it supports one JV partner input with add/remove UI. */}
//             {dropdowns.map((dropdown, index) => (
//               <div key={dropdown.id} className="flex items-center gap-4 mb-3">
//                 <input
//                   type="text"
//                   placeholder="JV Partner Firm"
//                   className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   value={jvFirm} // This will only show the single jvFirm from Redux
//                   onChange={(e) => dispatch(setJvFirm(e.target.value))}
//                 />
//                 <div className="flex items-center gap-2">
//                   {dropdowns.length > 1 && (
//                     <IoMdTrash
//                       onClick={() => setDropdowns(dropdowns.filter(d => d.id !== dropdown.id))}
//                       className="text-gray-400 cursor-pointer hover:text-white" // Changed to gray-400 for consistency
//                       size={22}
//                     />
//                   )}
//                   {index === dropdowns.length - 1 && (
//                     <IoMdAdd
//                       onClick={() => setDropdowns([...dropdowns, { id: Date.now() }])}
//                       className="text-white cursor-pointer"
//                       size={22}
//                     />
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="mb-6 bg-[#282828] p-4 rounded-md">
//             <h2 className="text-xl font-semibold mb-3">Template Management</h2>
//             <div className="mb-4">
//               <label htmlFor="template-upload" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
//                 <GrAttachment size={18} /> Upload New Templates (.docx)
//                 <input
//                   id="template-upload"
//                   type="file"
//                   multiple
//                   className="hidden"
//                   onChange={handleTemplateFileChange}
//                   accept=".docx"
//                 />
//               </label>
//               {templatesLoading && <p className="text-gray-400 mt-2">Uploading templates...</p>}
//               {templatesError && <p className="text-red-500 mt-2">Error uploading templates: {templatesError}</p>}
//             </div>

//             <h3 className="text-lg font-semibold mb-2">Saved Templates</h3>
//             {templatesLoading ? (
//               <p className="text-gray-400">Loading templates...</p>
//             ) : templatesError ? (
//               <p className="text-red-500">Error fetching templates: {templatesError}</p>
//             ) : templates.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 {templates.map((template) => (
//                   <div key={template.name} className="flex items-center justify-between bg-black p-3 rounded-md">
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         id={`template-${template.name}`}
//                         checked={selectedTemplates.includes(template.name)}
//                         onChange={() => {
//                           setSelectedTemplates((prev) =>
//                             prev.includes(template.name)
//                               ? prev.filter((name) => name !== template.name)
//                               : [...prev, template.name]
//                           );
//                         }}
//                         className="form-checkbox h-5 w-5 text-blue-600"
//                       />
//                       <label htmlFor={`template-${template.name}`} className="text-white cursor-pointer">
//                         {template.name}
//                       </label>
//                     </div>
//                     <IoMdTrash
//                       onClick={() => handleDeleteTemplate(template.name)}
//                       className="text-red-500 cursor-pointer hover:text-red-400"
//                       size={20}
//                     />
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-400">No templates saved yet. Upload templates to get started.</p>
//             )}
//           </div>

//           <button
//             className="cursor-pointer bg-[#F7F7F7] px-4 py-2 rounded text-black text-lg flex items-center justify-center gap-2 w-full font-semibold hover:bg-gray-300 transition-colors"
//             onClick={handleSubmit}
//             disabled={loading || templatesLoading || descriptionExtractionLoading}
//           >
//             {loading ? "Generating..." : "Generate"}
//             <FaArrowCircleRight size={17} />
//           </button>
//           {error && <p className="text-red-500 text-center mt-3">Error: {error}</p>}
//         </div>
//       </div>
//     </>
//   );
// };

// export default AddProject;

// src/components/AddProject.jsx - Fixed Form Data Submission

import React, { useState, useEffect } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoMdAdd, IoMdTrash } from "react-icons/io";
import { FaArrowCircleRight } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setProjectDetails,
  setLeadFirm,
  setJvFirm,
  setDocumentDate,
  generateDocuments,
  setGeminiApiKey,
  clearDownloadStatus,
} from "../redux/slices/projectSlice";
import {
  fetchTemplates,
} from "../redux/slices/templateSlice";
import { API_URL } from "../api/apiConfig";

const AddProject = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    description,
    leadFirm,
    jvFirm,
    documentDate,
    loading,
    error,
    geminiApiKey,
    downloadStatus,
    downloadFilename,
  } = useSelector((state) => state.project);
  const {
    list: templates,
    loading: templatesLoading,
    error: templatesError,
  } = useSelector((state) => state.templates);

  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [projectFile, setProjectFile] = useState(null);
  const [projectDescriptionPreview, setProjectDescriptionPreview] = useState("");
  
  const [descriptionExtractionLoading, setDescriptionExtractionLoading] = useState(false);
  const [descriptionExtractionError, setDescriptionExtractionError] = useState(null);

  const [dropdowns, setDropdowns] = useState([{ id: Date.now() }]);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  useEffect(() => {
    setProjectDescriptionPreview(description);
  }, [description]);

  useEffect(() => {
    if (downloadStatus === 'in-progress') {
      navigate('/loading');
    } else if (downloadStatus === 'success') {
      alert(`Document(s) '${downloadFilename}' downloaded successfully!`);
      dispatch(clearDownloadStatus());
      navigate('/chat');
    } else if (downloadStatus === 'failed') {
      alert(`Document generation or download failed: ${error}`);
      dispatch(clearDownloadStatus());
    }
  }, [downloadStatus, downloadFilename, error, navigate, dispatch]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProjectFile(file);
      setProjectDescriptionPreview("Extracting description...");
      setDescriptionExtractionLoading(true);
      setDescriptionExtractionError(null);

      const formData = new FormData();
      formData.append("projectFile", file);
      formData.append("geminiApiKey", geminiApiKey);

      try {
        const response = await API_URL.post("/extract-description", formData, {
          headers: {
            'Content-Type': 'multipart/form-data', 
          },
        });

        if (response.status !== 200) {
          throw new Error(response.data?.error || "Failed to extract description from server.");
        }

        const data = response.data;
        setProjectDescriptionPreview(data.description);
        dispatch(setProjectDetails({ description: data.description }));

      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || "Failed to extract description.";
        setProjectDescriptionPreview("Failed to extract description.");
        setDescriptionExtractionError(errorMessage);
        dispatch(setProjectDetails({ description: "" }));
        console.error("Error extracting description:", err);
      } finally {
        setDescriptionExtractionLoading(false);
      }
    } else {
      setProjectFile(null);
      setProjectDescriptionPreview("");
      setDescriptionExtractionLoading(false);
      setDescriptionExtractionError(null);
      dispatch(setProjectDetails({ description: "" }));
    }
  };

  const handleTemplateFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("template", file);
      try {
        const response = await API_URL.post("/templates", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.status === 201) {
          alert("Template uploaded successfully!");
          dispatch(fetchTemplates());
        } else {
          const errorData = response.data;
          alert(`Failed to upload template: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error uploading template:", error);
        alert(`Error uploading template: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleDeleteTemplate = async (templateName) => {
    if (window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      try {
        const response = await API_URL.delete(`/templates/${templateName}`);
        if (response.status === 200) {
          alert("Template deleted successfully!");
          dispatch(fetchTemplates());
        } else {
          const errorData = response.data;
          alert(`Failed to delete template: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error deleting template:", error);
        alert(`Error deleting template: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // FIXED: Form submission with proper FormData handling
const handleSubmit = async () => {
  console.log("--- DEBUG: Starting form submission ---");
  
  // Validation
  if (!geminiApiKey) {
    alert("Please configure Gemini API Key.");
    return;
  }
  if (!description || !leadFirm) {
    alert("Please provide a project description and lead firm.");
    return;
  }
  if (selectedTemplates.length === 0) {
    alert("Please select at least one template to generate.");
    return;
  }

  // Create FormData
  const formData = new FormData();
  formData.append("projectDescription", description);
  formData.append("leadFirm", leadFirm);
  formData.append("jvFirm", jvFirm || "");
  formData.append("date", documentDate || new Date().toISOString().split('T')[0]);
  formData.append("geminiApiKey", geminiApiKey);
  
  // Append each template individually
  selectedTemplates.forEach(template => {
    formData.append("selectedTemplates", template);
  });

  // Debug FormData contents
  console.log("--- DEBUG: FormData contents ---");
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }
  console.log("--- End FormData Debug ---");

  // Dispatch to Redux thunk
  dispatch(generateDocuments(formData));
};
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <div className="w-full max-w-4xl bg-[#1C1C1C] rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gradient-to-r from-gradientStart to-gradientEnd">
            Add New Project
          </h1>

          {/* Gemini API Key Input */}
          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">API Configuration</h2>
            <input
              type="password"
              placeholder="Enter Gemini API Key"
              className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={geminiApiKey}
              onChange={(e) => dispatch(setGeminiApiKey(e.target.value))}
            />
            <p className="text-gray-400 text-xs mt-2">
              You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
            </p>
            {geminiApiKey && <p className="text-green-400 mt-2">✅ API Key Configured</p>}
          </div>

          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">Project Details</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Project Title"
                className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => dispatch(setProjectDetails({ title: e.target.value, description }))}
              />
              <div className="relative flex-1">
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={documentDate}
                  onChange={(e) => dispatch(setDocumentDate(e.target.value))}
                />
              </div>
            </div>

            <textarea
              placeholder="Project Description (will be auto-filled if you upload a document)"
              className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md resize-y min-h-[100px] mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={projectDescriptionPreview}
              onChange={(e) => {
                setProjectDescriptionPreview(e.target.value);
                dispatch(setProjectDetails({description: e.target.value }));
              }}
            />

            <div className="flex items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Lead Firm Name"
                className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={leadFirm}
                onChange={(e) => dispatch(setLeadFirm(e.target.value))}
              />
              <label htmlFor="project-file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center gap-2">
                <GrAttachment size={18} /> Attach Project Doc
                <input
                  id="project-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".docx,.pdf,.txt"
                />
              </label>
            </div>
            {projectFile && (
              <div className="text-sm text-gray-400 mt-2">
                Attached: {projectFile.name}
                {descriptionExtractionLoading && <p className="text-blue-400 mt-2">Extracting description...</p>}
                {descriptionExtractionError && <p className="text-red-500 mt-2">Error: {descriptionExtractionError}</p>}
              </div>
            )}
          </div>

          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">Partner Firms</h2>
            {dropdowns.map((dropdown, index) => (
              <div key={dropdown.id} className="flex items-center gap-4 mb-3">
                <input
                  type="text"
                  placeholder="JV Partner Firm"
                  className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={jvFirm}
                  onChange={(e) => dispatch(setJvFirm(e.target.value))}
                />
                <div className="flex items-center gap-2">
                  {dropdowns.length > 1 && (
                    <IoMdTrash
                      onClick={() => setDropdowns(dropdowns.filter(d => d.id !== dropdown.id))}
                      className="text-gray-400 cursor-pointer hover:text-white"
                      size={22}
                    />
                  )}
                  {index === dropdowns.length - 1 && (
                    <IoMdAdd
                      onClick={() => setDropdowns([...dropdowns, { id: Date.now() }])}
                      className="text-white cursor-pointer"
                      size={22}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">Template Management</h2>
            <div className="mb-4">
              <label htmlFor="template-upload" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
                <GrAttachment size={18} /> Upload New Templates (.docx)
                <input
                  id="template-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleTemplateFileChange}
                  accept=".docx"
                />
              </label>
              {templatesLoading && <p className="text-gray-400 mt-2">Uploading templates...</p>}
              {templatesError && <p className="text-red-500 mt-2">Error uploading templates: {templatesError}</p>}
            </div>

            <h3 className="text-lg font-semibold mb-2">Saved Templates</h3>
            {templatesLoading ? (
              <p className="text-gray-400">Loading templates...</p>
            ) : templatesError ? (
              <p className="text-red-500">Error fetching templates: {templatesError}</p>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <div key={template.name} className="flex items-center justify-between bg-black p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`template-${template.name}`}
                        checked={selectedTemplates.includes(template.name)}
                        onChange={() => {
                          setSelectedTemplates((prev) =>
                            prev.includes(template.name)
                              ? prev.filter((name) => name !== template.name)
                              : [...prev, template.name]
                          );
                        }}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <label htmlFor={`template-${template.name}`} className="text-white cursor-pointer">
                        {template.name}
                      </label>
                    </div>
                    <IoMdTrash
                      onClick={() => handleDeleteTemplate(template.name)}
                      className="text-red-500 cursor-pointer hover:text-red-400"
                      size={20}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No templates saved yet. Upload templates to get started.</p>
            )}
          </div>

          <button
            className="cursor-pointer bg-[#F7F7F7] px-4 py-2 rounded text-black text-lg flex items-center justify-center gap-2 w-full font-semibold hover:bg-gray-300 transition-colors"
            onClick={handleSubmit}
            disabled={loading || templatesLoading || descriptionExtractionLoading}
          >
            {loading ? "Generating..." : "Generate"}
            <FaArrowCircleRight size={17} />
          </button>
          {error && <p className="text-red-500 text-center mt-3">Error: {error}</p>}
        </div>
      </div>
    </>
  );
};

export default AddProject;