// frontend-react/src/store/slices/authSlice.js - גרסה מתוקנת
// Manages authentication with MongoDB backend + OpenAI
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Async thunk for OpenAI authentication - תיקון הנתיב והטיפול בתגובה
export const authenticateOpenAI = createAsyncThunk(
  'auth/authenticateOpenAI',
  async (apiKey, { rejectWithValue }) => {
    try {
      console.log('🔑 Authenticating OpenAI with server...');
      
      // שינוי הנתיב להתאים לשרת החדש
      const response = await axios.post(`${API_BASE_URL}/auth/openai`, {
        apiKey
      });
      
      console.log('✅ OpenAI authentication response:', response.data);
      
      // וידוא שהתגובה תקינה
      if (response.data.success && response.data.sessionId) {
        return {
          sessionId: response.data.sessionId,
          message: response.data.message || 'Connected successfully'
        };
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ OpenAI authentication failed:', error);
      
      if (error.response?.data?.detail) {
        return rejectWithValue(error.response.data.detail);
      } else if (error.response?.status === 401) {
        return rejectWithValue('Invalid OpenAI API key');
      } else if (error.response?.status === 503) {
        return rejectWithValue('OpenAI service unavailable');
      } else {
        return rejectWithValue('Failed to connect to server');
      }
    }
  }
);

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

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // נקה את session של OpenAI
      if (auth.openAISessionId) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          sessionId: auth.openAISessionId
        });
      }
      
      // נקה את session של המשתמש (אם קיים)
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
  
  // OpenAI integration - תיקון השמות והלוגיקה
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
      // OpenAI Authentication - תיקון הטיפול ב-state
      .addCase(authenticateOpenAI.pending, (state) => {
        console.log('🔄 OpenAI authentication pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateOpenAI.fulfilled, (state, action) => {
        console.log('✅ OpenAI authentication fulfilled:', action.payload);
        state.loading = false;
        state.isOpenAIConnected = true; // תיקון: עדכון הstate הנכון
        state.openAISessionId = action.payload.sessionId;
        state.error = null;
        state.lastAuthTime = Date.now();
      })
      .addCase(authenticateOpenAI.rejected, (state, action) => {
        console.log('❌ OpenAI authentication rejected:', action.payload);
        state.loading = false;
        state.isOpenAIConnected = false;
        state.openAISessionId = null;
        state.error = action.payload;
      })
      
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
export const selectIsOpenAIConnected = (state) => state.auth.isOpenAIConnected; // תיקון Selector

export default authSlice.reducer;