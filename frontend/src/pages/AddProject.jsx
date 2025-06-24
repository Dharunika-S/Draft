import React, { useState, useEffect } from "react";
import { GrAttachment } from "react-icons/gr";
import { FiChevronDown } from "react-icons/fi";
import { IoMdAdd, IoMdTrash } from "react-icons/io";
import { FaArrowCircleRight } from "react-icons/fa";
import { BsMic } from "react-icons/bs";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setProjectDetails, setLeadFirm, setJvFirm, setDocumentDate, generateDocuments, setGeminiApiKey } from "../redux/slices/projectSlice";
import { fetchTemplates, uploadTemplate, deleteTemplate } from "../redux/slices/templateSlice";

const AddProject = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { title, description, leadFirm, jvFirm, documentDate, generatedDocs, loading, error, geminiApiKey } = useSelector((state) => state.project);
  const { list: templates, loading: templatesLoading, error: templatesError } = useSelector((state) => state.templates);

  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [projectFile, setProjectFile] = useState(null);
  const [projectDescriptionPreview, setProjectDescriptionPreview] = useState("");
  const [dropdowns, setDropdowns] = useState([{ id: Date.now() }]);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (generatedDocs && !loading && !error) {
      const { blob, filename } = generatedDocs;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      navigate('/loading');
    }
  }, [generatedDocs, loading, error, navigate]);


  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setProjectFile(file);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          setProjectDescriptionPreview("Docx file uploaded. Content will be processed by backend.");
        } else if (file.type === "application/pdf") {
          setProjectDescriptionPreview("PDF file uploaded. Content will be processed by backend.");
        } else {
          setProjectDescriptionPreview(fileContent.substring(0, 500) + (fileContent.length > 500 ? "..." : ""));
          dispatch(setProjectDetails({ title, description: fileContent }));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTemplateUpload = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      for (const file of Array.from(files)) {
        await dispatch(uploadTemplate({ file, fileName: file.name }));
        dispatch(fetchTemplates());
      }
    }
  };

  const handleDeleteTemplate = async (templateName) => {
    await dispatch(deleteTemplate(templateName));
    dispatch(fetchTemplates());
  };

  const handleSubmit = async () => {
    if (!geminiApiKey) {
      alert("Please configure Gemini API Key.");
      return;
    }
    if (!projectFile || !leadFirm) {
      alert("Please upload a project description document and provide a lead firm.");
      return;
    }
    if (selectedTemplates.length === 0) {
      alert("Please select at least one template to generate.");
      return;
    }

    const projectData = {
      projectDescription: description || projectDescriptionPreview,
      leadFirm,
      jvFirm,
      date: documentDate,
      selectedTemplates,
      geminiApiKey,
    };

    dispatch(generateDocuments(projectData));
  };


  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <div className="w-full max-w-4xl bg-[#1C1C1C] rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gradient-to-r from-gradientStart to-gradientEnd">
            Add New Project
          </h1>

          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">API Configuration</h2>
            <input
              type="password"
              placeholder="Enter Gemini API Key"
              className="w-full px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={geminiApiKey}
              onChange={(e) => dispatch(setGeminiApiKey(e.target.value))}
            />
            {geminiApiKey && <p className="text-green-400 mt-2">✅ API Key Configured</p>}
          </div>

          <div className="mb-6 bg-[#282828] p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-3">Project Details</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Project Title"
                className="flex-1 px-4 py-3 border border-secondary bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
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
              value={description}
              onChange={(e) => dispatch(setProjectDetails({ title, description: e.target.value }))}
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
                  accept=".pdf,.docx,.txt"
                />
              </label>
            </div>
            {projectFile && (
              <div className="text-sm text-gray-400 mt-2">
                Attached: {projectFile.name}
                <div className="text-xs max-h-24 overflow-y-auto mt-1 p-2 bg-secondary rounded">
                  Preview: {projectDescriptionPreview || "No preview available or file content being processed."}
                </div>
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
                      className="text-secondary cursor-pointer hover:text-white"
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
                  onChange={handleTemplateUpload}
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
            disabled={loading || templatesLoading}
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