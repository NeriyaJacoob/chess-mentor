// src/store/slices/authSlice.js
// Manages OpenAI API authentication state
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunk for OpenAI authentication
export const authenticateOpenAI = createAsyncThunk(
  'auth/authenticateOpenAI',
  async (apiKey, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/openai`, {
        apiKey
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Authentication failed'
      );
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (auth.sessionId) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          sessionId: auth.sessionId
        });
      }
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Logout failed'
      );
    }
  }
);

const initialState = {
  isAuthenticated: false,
  sessionId: null,
  loading: false,
  error: null,
  lastAuthTime: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      return { ...initialState };
    }
  },
  extraReducers: (builder) => {
    builder
      // OpenAI Authentication
      .addCase(authenticateOpenAI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateOpenAI.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.sessionId = action.payload.sessionId;
        state.lastAuthTime = Date.now();
        state.error = null;
      })
      .addCase(authenticateOpenAI.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.sessionId = null;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        return { ...initialState };
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Even if logout fails on server, clear local state
        state.isAuthenticated = false;
        state.sessionId = null;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;

export default authSlice.reducer;