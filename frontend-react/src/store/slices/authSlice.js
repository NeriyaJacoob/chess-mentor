// frontend-react/src/store/slices/authSlice.js
// Manages authentication with MongoDB backend
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Async thunk for user registration
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      // אחרי הרשמה מוצלחת, התחבר אוטומטית
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: userData.username,
        password: userData.password
      });
      
      return loginResponse.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Registration failed'
      );
    }
  }
);

// Async thunk for user login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Login failed'
      );
    }
  }
);

// Async thunk for guest login
export const guestLogin = createAsyncThunk(
  'auth/guestLogin',
  async (guestData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/guest`, guestData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Guest login failed'
      );
    }
  }
);

// Async thunk for OpenAI authentication (existing)
export const authenticateOpenAI = createAsyncThunk(
  'auth/authenticateOpenAI',
  async (apiKey, { getState, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/openai`, {
        apiKey
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'OpenAI authentication failed'
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
        error.response?.data?.detail || 'Logout failed'
      );
    }
  }
);

const initialState = {
  // User authentication
  isAuthenticated: false,
  user: null,
  sessionId: null,
  
  // OpenAI integration
  isOpenAIConnected: false,
  openAISessionId: null,
  
  // UI state
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
    },
    updateUserPreferences: (state, action) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // User Registration
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.sessionId = action.payload.session_id;
        state.lastAuthTime = Date.now();
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        state.error = action.payload;
      })
      
      // User Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.sessionId = action.payload.session_id;
        state.lastAuthTime = Date.now();
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        state.error = action.payload;
      })
      
      // Guest Login
      .addCase(guestLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(guestLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.sessionId = action.payload.session_id;
        state.lastAuthTime = Date.now();
        state.error = null;
      })
      .addCase(guestLogin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.sessionId = null;
        state.error = action.payload;
      })
      
      // OpenAI Authentication
      .addCase(authenticateOpenAI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateOpenAI.fulfilled, (state, action) => {
        state.loading = false;
        state.isOpenAIConnected = true;
        state.openAISessionId = action.payload.sessionId;
        state.error = null;
      })
      .addCase(authenticateOpenAI.rejected, (state, action) => {
        state.loading = false;
        state.isOpenAIConnected = false;
        state.openAISessionId = null;
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
        state.user = null;
        state.sessionId = null;
        state.isOpenAIConnected = false;
        state.openAISessionId = null;
      });
  },
});

export const { clearError, clearAuth, updateUserPreferences } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsGuest = (state) => state.auth.user?.is_guest || false;
export const selectUserElo = (state) => state.auth.user?.elo_rating || 1200;
export const selectIsOpenAIConnected = (state) => state.auth.isOpenAIConnected;

export default authSlice.reducer;