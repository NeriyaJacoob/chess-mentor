// frontend-react/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';

// בדיקה שה-store קיים
if (!store) {
  console.error('❌ Redux store is not defined!');
} else {
  console.log('✅ Redux store loaded successfully');
}

// בדיקה שהgameSlice עובד
try {
  const gameState = store.getState().game;
  console.log('✅ Game slice loaded:', {
    fen: gameState?.fen?.substring(0, 20) + '...',
    boardTheme: gameState?.boardTheme,
    pieceStyle: gameState?.pieceStyle,
    isGameActive: gameState?.isGameActive,
    selectedSquare: gameState?.selectedSquare,
    legalMoves: gameState?.legalMoves?.length || 0
  });
  
  // Test that Redux actions work
  console.log('🧪 Testing Redux action...');
  store.dispatch({ type: 'game/selectSquare', payload: 'e2' });
  
  setTimeout(() => {
    const newState = store.getState().game;
    console.log('🧪 After test action:', {
      selectedSquare: newState?.selectedSquare,
      legalMoves: newState?.legalMoves?.length || 0
    });
  }, 100);
  
} catch (error) {
  console.error('❌ Game slice error:', error);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// הוספת debug listeners לדיבוג
if (process.env.NODE_ENV === 'development') {
  store.subscribe(() => {
    const state = store.getState();
    console.log('🔄 Redux state updated:', {
      selectedSquare: state.game?.selectedSquare,
      legalMoves: state.game?.legalMoves?.length || 0,
      legalMovesArray: state.game?.legalMoves || [],
      isGameActive: state.game?.isGameActive,
      currentPlayer: state.game?.currentPlayer,
      fen: state.game?.fen?.substring(0, 30) + '...'
    });
  });
  
  // Test Redux actions
  setTimeout(() => {
    console.log('🧪 Testing Redux...');
    const testState = store.getState();
    console.log('🧪 Initial state:', {
      hasGameSlice: !!testState.game,
      fen: testState.game?.fen?.substring(0, 30),
      isGameActive: testState.game?.isGameActive
    });
  }, 1000);
}