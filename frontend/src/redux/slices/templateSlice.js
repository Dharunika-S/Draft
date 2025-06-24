import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from "../../api/apiConfig";

// Async Thunks for API calls
export const uploadTemplate = createAsyncThunk(
  'templates/uploadTemplate',
  async ({ file, fileName }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('template', file, fileName); 

      const response = await API_URL.post('/templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API_URL.get('/templates');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (templateName, { rejectWithValue }) => {
    try {
      await API_URL.delete(`/templates/${templateName}`);
      return templateName; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const templateSlice = createSlice({
  name: 'templates',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Upload Template
      .addCase(uploadTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadTemplate.fulfilled, (state) => {
        state.loading = false;
        
      })
      .addCase(uploadTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
     
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(template => template.name !== action.payload);
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default templateSlice.reducer;