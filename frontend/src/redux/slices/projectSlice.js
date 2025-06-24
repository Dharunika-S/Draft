import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from "../../api/apiConfig";


export const generateDocuments = createAsyncThunk(
  'project/generateDocuments',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await API_URL.post('/generate-document', projectData, {
        responseType: 'blob' 
      });
      
      return { blob: response.data, filename: response.headers['content-disposition']?.split('filename=')[1].replace(/"/g, '') || 'documents.zip' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
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
    generatedDocs: null,
    loading: false,
    error: null,
    geminiApiKey: '', 
  },
  reducers: {
    setProjectDetails: (state, action) => {
      state.title = action.payload.title;
      state.description = action.payload.description;
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
    clearGeneratedDocs: (state) => {
      state.generatedDocs = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.generatedDocs = null;
      })
      .addCase(generateDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedDocs = action.payload;
      })
      .addCase(generateDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setProjectDetails, setLeadFirm, setJvFirm, setDocumentDate, setGeminiApiKey, clearGeneratedDocs } = projectSlice.actions;
export default projectSlice.reducer;