// src/store/store.js - תיקון Redux Store
import { configureStore } from '@reduxjs/toolkit';

// Import reducers with error handling
let gameReducer, authReducer, coachReducer;

try {
  gameReducer = require('./slices/gameSlice').default;
} catch (error) {
  console.error('Failed to load gameSlice:', error);
  gameReducer = (state = {}) => state;
}

try {
  authReducer = require('./slices/authSlice').default;
} catch (error) {
  console.error('Failed to load authSlice:', error);
  authReducer = (state = {}) => state;
}

try {
  coachReducer = require('./slices/coachSlice').default;
} catch (error) {
  console.error('Failed to load coachSlice:', error);
  coachReducer = (state = {}) => state;
}

export const store = configureStore({
  reducer: {
    game: gameReducer,
    auth: authReducer,
    coach: coachReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['game.game'], // Ignore Chess.js instance
      },
    }),
});

export default store;