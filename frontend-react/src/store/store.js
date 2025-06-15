// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import authReducer from './slices/authSlice';
import coachReducer from './slices/coachSlice';

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