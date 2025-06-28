
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
  setPersonName,
  setPersonAddress,
  setProjectTitle, 
  setCountry, 
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
    personName,
    personAddress,
    projectTitle, // Get from state
    country, // Get from state
  } = useSelector((state) => state.project);
  const {
    list: templates,
    loading: templatesLoading,
    error: templatesError,
  } = useSelector((state) => state.templates);

  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [projectFile, setProjectFile] = useState(null);
  const [projectDescriptionPreview, setProjectDescriptionPreview] = useState("");
  const [personNamePreview, setPersonNamePreview] = useState("");
  const [personAddressPreview, setPersonAddressPreview] = useState("");
  const [projectTitlePreview, setProjectTitlePreview] = useState(""); // State for project title preview
  const [countryPreview, setCountryPreview] = useState(""); // State for country preview

  const [descriptionExtractionLoading, setDescriptionExtractionLoading] = useState(false);
  const [descriptionExtractionError, setDescriptionExtractionError] = useState(null);

  const [dropdowns, setDropdowns] = useState([{ id: Date.now() }]);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  useEffect(() => {
    setProjectDescriptionPreview(description);
  }, [description]);

  // Update previews when Redux state for personName/Address/projectTitle/country changes
  useEffect(() => {
    setPersonNamePreview(personName);
  }, [personName]);

  useEffect(() => {
    setPersonAddressPreview(personAddress);
  }, [personAddress]);

  useEffect(() => {
    setProjectTitlePreview(projectTitle);
  }, [projectTitle]);

  useEffect(() => {
    setCountryPreview(country);
  }, [country]);


  useEffect(() => {
    if (downloadStatus === 'in-progress') {
      navigate('/loading');
    } else if (downloadStatus === 'success') {
      alert(`Document(s) '${downloadFilename}' downloaded successfully!`);
      dispatch(clearDownloadStatus());
      navigate('/chat');
    } else if (downloadStatus === 'failed') {
      // Ensure error is a string
      alert(`Document generation or download failed: ${error || 'Unknown error'}`);
      dispatch(clearDownloadStatus());
    }
  }, [downloadStatus, downloadFilename, error, navigate, dispatch]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProjectFile(file);
      setProjectDescriptionPreview("Extracting description...");
      setPersonNamePreview("Extracting name...");
      setPersonAddressPreview("Extracting address...");
      setProjectTitlePreview("Extracting project title..."); // Set loading state for project title
      setCountryPreview("Extracting country..."); // Set loading state for country

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
          // If the server response has a data.error, use it, otherwise a generic message
          const errorMessage = response.data?.error || "Failed to extract description from server.";
          throw new Error(errorMessage);
        }

        const data = response.data;
        setProjectDescriptionPreview(data.description);
        setPersonNamePreview(data.person_name);
        setPersonAddressPreview(data.person_address);
        setProjectTitlePreview(data.project_title); // Update project title preview
        setCountryPreview(data.country); // Update country preview

        dispatch(setProjectDetails({ description: data.description }));
        dispatch(setPersonName(data.person_name));
        dispatch(setPersonAddress(data.person_address));
        dispatch(setProjectTitle(data.project_title)); // Dispatch new data
        dispatch(setCountry(data.country)); // Dispatch new data

      } catch (err) {
        // More robust error message extraction for fetch errors
        const errorMessage = err.response?.data?.error || err.message || "Failed to extract description.";
        setProjectDescriptionPreview("Failed to extract description.");
        setPersonNamePreview("Failed to extract name.");
        setPersonAddressPreview("Failed to extract address.");
        setProjectTitlePreview("Failed to extract project title."); // Error state for project title
        setCountryPreview("Failed to extract country."); // Error state for country
        setDescriptionExtractionError(errorMessage);
        dispatch(setProjectDetails({ description: "" }));
        dispatch(setPersonName(""));
        dispatch(setPersonAddress(""));
        dispatch(setProjectTitle("")); // Clear project title on error
        dispatch(setCountry("")); // Clear country on error
        console.error("Error extracting description:", err);
      } finally {
        setDescriptionExtractionLoading(false);
      }
    } else {
      setProjectFile(null);
      setProjectDescriptionPreview("");
      setPersonNamePreview("");
      setPersonAddressPreview("");
      setProjectTitlePreview(""); // Clear project title preview
      setCountryPreview(""); // Clear country preview
      setDescriptionExtractionLoading(false);
      setDescriptionExtractionError(null);
      dispatch(setProjectDetails({ description: "" }));
      dispatch(setPersonName(""));
      dispatch(setPersonAddress(""));
      dispatch(setProjectTitle("")); // Clear project title
      dispatch(setCountry("")); // Clear country
    }
  };

  const handleTemplateFileChange = async (event) => {
    const files = event.target.files; // Get all selected files
    if (files.length > 0) {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("template", file);
        try {
          const response = await API_URL.post("/templates", formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          // Backend now returns 200 on success, not 201
          if (response.status === 200) {
            return { success: true, name: file.name };
          } else {
            // Attempt to parse error message from response data
            let errorMsg = 'Unknown error during upload';
            if (response.data && typeof response.data === 'object' && response.data.error) {
              errorMsg = response.data.error;
            } else if (response.statusText) {
              errorMsg = response.statusText;
            }
            return { success: false, name: file.name, error: errorMsg };
          }
        } catch (error) {
          console.error("Error uploading template:", error);
          // More robust error message extraction for network/fetch errors
          const errorMsg = error.response?.data?.error || error.message || "Network error or server unreachable";
          return { success: false, name: file.name, error: errorMsg };
        }
      });

      const results = await Promise.all(uploadPromises);
      let successMessages = [];
      let errorMessages = [];

      results.forEach(result => {
        if (result.success) {
          successMessages.push(result.name);
        } else {
          errorMessages.push(`${result.name}: ${result.error}`);
        }
      });

      if (successMessages.length > 0) {
        alert(`Successfully uploaded templates:\n${successMessages.join('\n')}`);
      }
      if (errorMessages.length > 0) {
        alert(`Failed to upload some templates:\n${errorMessages.join('\n')}`);
      }

      dispatch(fetchTemplates()); // Refresh template list after attempts
      // Clear the file input after upload attempts
      event.target.value = '';
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
          // Robust error handling for delete
          const errorData = response.data;
          alert(`Failed to delete template: ${errorData?.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error deleting template:", error);
        alert(`Error deleting template: ${error.response?.data?.error || error.message || 'Network error'}`);
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
  formData.append("personName", personName);
  formData.append("personAddress", personAddress);
  formData.append("projectTitle", projectTitle); // Append new field
  formData.append("country", country); // Append new field

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
                placeholder="Project Title (auto-filled from doc)"
                className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={projectTitlePreview}
                onChange={(e) => {
                  setProjectTitlePreview(e.target.value);
                  dispatch(setProjectTitle(e.target.value));
                }}
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

            {/* New fields for Person Name and Address */}
            <input
                type="text"
                placeholder="Person Name (auto-filled from doc)"
                className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={personNamePreview}
                onChange={(e) => {
                  setPersonNamePreview(e.target.value);
                  dispatch(setPersonName(e.target.value));
                }}
              />
              <input
                type="text"
                placeholder="Person Address (auto-filled from doc)"
                className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={personAddressPreview}
                onChange={(e) => {
                  setPersonAddressPreview(e.target.value);
                  dispatch(setPersonAddress(e.target.value));
                }}
              />

              <input
                type="text"
                placeholder="Country (auto-filled from doc)"
                className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={countryPreview}
                onChange={(e) => {
                  setCountryPreview(e.target.value);
                  dispatch(setCountry(e.target.value));
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
                {descriptionExtractionLoading && <p className="text-blue-400 mt-2">Extracting details...</p>}
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
              {templatesLoading && <p className="text-gray-400 mt-2">Loading templates...</p>}
              {templatesError && <p className="text-red-500 mt-2">Error fetching templates: {templatesError}</p>}
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