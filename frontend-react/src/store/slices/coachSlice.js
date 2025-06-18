// src/store/slices/coachSlice.js - גרסה מתוקנת
// Handles chat messages and analysis replies
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Async thunk for sending message to coach - תיקון הנתיב
export const sendToCoach = createAsyncThunk(
  'coach/sendMessage',
  async ({ message, gameState, analysisType = 'general' }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // בדיקה שיש חיבור לOpenAI
      if (!auth.openAISessionId) {
        return rejectWithValue('Not connected to OpenAI. Please authenticate first.');
      }

      console.log('💬 Sending message to coach:', { message, analysisType });

      // שינוי הנתיב להתאים לשרת החדש
      const response = await axios.post(`${API_BASE_URL}/chess/coach`, {
        sessionId: auth.openAISessionId, // שימוש ב-OpenAI session
        message,
        gameState,
        analysisType
      });

      console.log('✅ Coach response received:', response.data);

      return {
        message,
        response: response.data.response,
        timestamp: response.data.timestamp || new Date().toISOString(),
        analysisType
      };
    } catch (error) {
      console.error('❌ Coach request failed:', error);
      
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication expired. Please reconnect to OpenAI.');
      } else if (error.response?.status === 503) {
        return rejectWithValue('OpenAI service temporarily unavailable');
      } else if (error.response?.data?.detail) {
        return rejectWithValue(error.response.data.detail);
      } else {
        return rejectWithValue('Failed to get coach response');
      }
    }
  }
);

const initialState = {
  messages: [],
  isLoading: false,
  error: null,
  lastResponse: null,
  analysisHistory: []
};

const coachSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
      state.analysisHistory = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        type: 'user',
        content: action.payload,
        timestamp: new Date().toISOString()
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendToCoach.pending, (state) => {
        console.log('🔄 Coach request pending...');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendToCoach.fulfilled, (state, action) => {
        console.log('✅ Coach request fulfilled:', action.payload);
        state.isLoading = false;
        
        const { message, response, timestamp, analysisType } = action.payload;
        
        // Add user message if not already added
        const userMessageExists = state.messages.some(
          msg => msg.content === message && msg.type === 'user'
        );
        
        if (!userMessageExists) {
          state.messages.push({
            id: Date.now() - 1,
            type: 'user',
            content: message,
            timestamp: new Date().toISOString()
          });
        }
        
        // Add coach response
        state.messages.push({
          id: Date.now(),
          type: 'coach',
          content: response,
          timestamp,
          analysisType
        });
        
        state.lastResponse = response;
        
        // Add to analysis history
        state.analysisHistory.push({
          id: Date.now(),
          userMessage: message,
          coachResponse: response,
          analysisType,
          timestamp
        });
      })
      .addCase(sendToCoach.rejected, (state, action) => {
        console.log('❌ Coach request rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, clearError, addUserMessage } = coachSlice.actions;

export default coachSlice.reducer;