import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from "../../api/apiConfig";

export const generateDocuments = createAsyncThunk(
  'project/generateDocuments',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API_URL.post('/generate-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      });

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'documents.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^"']+)['"]?$/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/%20/g, ' '));
        } else {
          const simpleFilenameMatch = contentDisposition.match(/filename=['"]?([^"']+)['"]?/i);
          if (simpleFilenameMatch && simpleFilenameMatch[1]) {
            filename = decodeURIComponent(simpleFilenameMatch[1]);
          }
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { filename };

    } catch (error) {
      if (error.response?.data?.type === 'application/json') {
        const errorData = await error.response.data.text();
        return rejectWithValue(JSON.parse(errorData).error || "Server error");
      }
      return rejectWithValue(error.message || "Document generation failed");
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    title: '',
    description: '',
    leadFirm: '',
    jvFirm: '',
    documentDate: new Date().toISOString().split('T')[0],
    loading: false,
    error: null,
    geminiApiKey: '',
    downloadStatus: 'idle',
    downloadFilename: '',
    personName: '',
    personAddress: '',
    projectTitle: '', // New state for project title
    country: '', // New state for country
  },
  reducers: {
    setProjectDetails: (state, action) => {
      if (action.payload.description !== undefined) {
        state.description = action.payload.description;
      }
      if (action.payload.title !== undefined) {
        state.title = action.payload.title;
      }
    },
    setLeadFirm: (state, action) => {
      state.leadFirm = action.payload;
    },
    setJvFirm: (state, action) => {
      state.jvFirm = action.payload;
    },
    setDocumentDate: (state, action) => {
      state.documentDate = action.payload;
    },
    setGeminiApiKey: (state, action) => {
      state.geminiApiKey = action.payload;
    },
    setPersonName: (state, action) => {
      state.personName = action.payload;
    },
    setPersonAddress: (state, action) => {
      state.personAddress = action.payload;
    },
    setProjectTitle: (state, action) => { // New reducer
      state.projectTitle = action.payload;
    },
    setCountry: (state, action) => { // New reducer
      state.country = action.payload;
    },
    clearDownloadStatus: (state) => {
      state.downloadStatus = 'idle';
      state.downloadFilename = '';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadStatus = 'in-progress';
        state.downloadFilename = '';
      })
      .addCase(generateDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.downloadStatus = 'success';
        state.downloadFilename = action.payload.filename;
        state.error = null;
      })
      .addCase(generateDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.downloadStatus = 'failed';
        state.downloadFilename = '';
      });
  },
});

export const {
  setProjectDetails,
  setLeadFirm,
  setJvFirm,
  setDocumentDate,
  setGeminiApiKey,
  setPersonName,
  setPersonAddress,
  setProjectTitle, // Export new action
  setCountry, // Export new action
  clearDownloadStatus,
} = projectSlice.actions;

export default projectSlice.reducer;