// frontend-react/src/services/chessApiService.js
// Simple HTTP service for AI chess games

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ChessApiService {
  constructor() {
    this.currentGameId = null;
    this.baseURL = `${API_BASE_URL}/api`;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error(`❌ API Response Error: ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Start a new game against AI
   * @param {number} aiLevel - AI difficulty (1-10)
   * @param {string} playerColor - 'white' or 'black'
   * @returns {Promise<Object>} Game data
   */
  async newGame(aiLevel = 5, playerColor = 'white') {
    try {
      const response = await this.api.post('/chess/new-game', {
        ai_level: aiLevel,
        player_color: playerColor
      });

      if (response.data.success) {
        this.currentGameId = response.data.game_id;
        console.log(`🎮 New game started: ${this.currentGameId.slice(0, 8)} - AI Level ${aiLevel}`);
        return response.data;
      } else {
        throw new Error('Failed to create new game');
      }
    } catch (error) {
      this.handleError('newGame', error);
      throw error;
    }
  }

  /**
   * Make a move and get AI response
   * @param {string} move - Move in UCI format (e.g., "e2e4")
   * @returns {Promise<Object>} Move result with AI response
   */
  async makeMove(move) {
    if (!this.currentGameId) {
      throw new Error('No active game. Please start a new game first.');
    }

    try {
      // Convert chess.js move object to UCI if needed
      const uciMove = this.convertToUCI(move);

      const response = await this.api.post('/chess/move', {
        game_id: this.currentGameId,
        move: uciMove
      });

      if (response.data.success) {
        console.log(`♟️ Move made: ${uciMove} → AI responded: ${response.data.ai_move?.move}`);
        
        // Clear game ID if game is over
        if (response.data.game_over) {
          console.log(`🏁 Game ended: ${response.data.game_result}`);
          this.currentGameId = null;
        }
        
        return response.data;
      } else {
        throw new Error('Failed to make move');
      }
    } catch (error) {
      this.handleError('makeMove', error);
      throw error;
    }
  }

  /**
   * Get current game state
   * @returns {Promise<Object>} Current game state
   */
  async getGameState() {
    if (!this.currentGameId) {
      throw new Error('No active game');
    }

    try {
      const response = await this.api.get(`/chess/game/${this.currentGameId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error('Failed to get game state');
      }
    } catch (error) {
      this.handleError('getGameState', error);
      throw error;
    }
  }

  /**
   * Resign the current game
   * @returns {Promise<Object>} Resignation result
   */
  async resign() {
    if (!this.currentGameId) {
      throw new Error('No active game to resign');
    }

    try {
      const response = await this.api.post('/chess/resign', {
        game_id: this.currentGameId
      });

      if (response.data.success) {
        console.log(`🏳️ Game resigned: ${response.data.result}`);
        this.currentGameId = null;
        return response.data;
      } else {
        throw new Error('Failed to resign game');
      }
    } catch (error) {
      this.handleError('resign', error);
      throw error;
    }
  }

  /**
   * Convert move to UCI format
   * @param {string|Object} move - Move in various formats
   * @returns {string} UCI format move
   */
  convertToUCI(move) {
    if (typeof move === 'string') {
      // Already in UCI format (e.g., "e2e4")
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
        return move;
      }
      throw new Error(`Invalid move format: ${move}`);
    }
    
    if (typeof move === 'object' && move.from && move.to) {
      // Chess.js format: {from: "e2", to: "e4", promotion: "q"}
      return move.from + move.to + (move.promotion || '');
    }
    
    throw new Error('Invalid move format. Expected UCI string or {from, to} object');
  }

  /**
   * Get current game ID
   * @returns {string|null} Current game ID
   */
  getCurrentGameId() {
    return this.currentGameId;
  }

  /**
   * Check if there's an active game
   * @returns {boolean} True if game is active
   */
  isGameActive() {
    return this.currentGameId !== null;
  }

  /**
   * Clear current game (for cleanup)
   */
  clearGame() {
    this.currentGameId = null;
    console.log('🧹 Game cleared from service');
  }

  /**
   * Handle API errors consistently
   * @param {string} method - Method name that failed
   * @param {Error} error - The error object
   */
  handleError(method, error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'Unknown server error';
      
      console.error(`❌ ${method} failed [${status}]:`, message);
      
      // Handle specific error cases
      if (status === 404 && message.includes('Game not found')) {
        console.log('🧹 Game not found, clearing local game ID');
        this.currentGameId = null;
      }
    } else if (error.request) {
      // Network error
      console.error(`❌ ${method} network error:`, error.message);
    } else {
      // Other error
      console.error(`❌ ${method} error:`, error.message);
    }
  }

  /**
   * Get service status and configuration
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      baseURL: this.baseURL,
      currentGameId: this.currentGameId,
      isGameActive: this.isGameActive(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const chessApiService = new ChessApiService();
export default chessApiService;