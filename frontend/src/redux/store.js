import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './slices/projectSlice';
import templateReducer from './slices/templateSlice';
import chatReducer from './slices/chatSlice'; 
export const store = configureStore({
  reducer: {
    project: projectReducer,
    templates: templateReducer,
    chat: chatReducer,
  },
});