import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    listening: false,
    transcript: '',
   
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setListening: (state, action) => {
      state.listening = action.payload;
    },
    setTranscript: (state, action) => {
      state.transcript = action.payload;
    },
  
  },
});

export const { addMessage, setListening, setTranscript } = chatSlice.actions;
export default chatSlice.reducer;