// frontend-react/src/services/chessApiService.js - Fast Response Version
// Chess API service with quick timeouts and cancellation

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

class ChessApiService {
  constructor() {
    this.currentGameId = null;
    this.baseURL = `${API_BASE_URL}/api`;
    this.abortController = null; // ✅ לביטול בקשות
    
    // ✅ Create axios instance with FAST timeouts
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 8000, // 8 שניות מקסימום - קצר יותר
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // ✅ Request interceptor with timing
    this.api.interceptors.request.use(
      (config) => {
        config.startTime = Date.now();
        console.log(`🚀 FAST API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // ✅ Response interceptor with timing
    this.api.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.startTime;
        console.log(`✅ FAST API Response: ${response.config.url} (${duration}ms)`, response.data);
        
        // ⚠️ Warning for slow responses
        if (duration > 3000) {
          console.warn(`🐌 Slow response detected: ${duration}ms`);
        }
        
        return response;
      },
      (error) => {
        const duration = error.config ? Date.now() - error.config.startTime : 0;
        console.error(`❌ FAST API Error: ${error.config?.url} (${duration}ms)`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // ✅ Handle timeout specifically
        if (error.code === 'ECONNABORTED') {
          console.error('⏰ Request timed out - AI might be overloaded');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Start a new FAST game against AI
   * @param {number} aiLevel - AI difficulty (1-8, limited for speed)
   * @param {string} playerColor - 'white' or 'black'
   * @returns {Promise<Object>} Game data
   */
  async newGame(aiLevel = 3, playerColor = 'white') {
    try {
      // ✅ Cancel any existing request
      this.cancelPendingRequests();
      
      // ✅ Limit AI level for speed
      const fastAiLevel = Math.max(1, Math.min(8, aiLevel));
      
      console.log(`🎮 Starting FAST game - Level ${fastAiLevel}`);
      
      // ✅ Create new abort controller
      this.abortController = new AbortController();
      
      const response = await this.api.post('/chess/new-game', {
        ai_level: fastAiLevel,
        player_color: playerColor
      }, {
        signal: this.abortController.signal,
        timeout: 6000 // ✅ Shorter timeout for game creation
      });

      if (response.data.success) {
        this.currentGameId = response.data.game_id;
        console.log(`🎮 FAST game started: ${this.currentGameId.slice(0, 8)} - Level ${fastAiLevel}`);
        
        // ✅ Log performance info
        if (response.data.init_time) {
          console.log(`⚡ Engine initialized in ${response.data.init_time.toFixed(2)}s`);
        }
        
        return response.data;
      } else {
        throw new Error('Failed to create new game');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Game creation cancelled');
        throw new Error('Game creation cancelled');
      }
      
      this.handleError('newGame', error);
      throw error;
    }
  }

  /**
   * Make a FAST move and get AI response
   * @param {string} move - Move in UCI format (e.g., "e2e4")
   * @returns {Promise<Object>} Move result with AI response
   */
  async makeMove(move) {
    if (!this.currentGameId) {
      throw new Error('No active game. Please start a new game first.');
    }

    try {
      // ✅ Cancel any pending move request
      this.cancelPendingRequests();
      
      const uciMove = this.convertToUCI(move);
      console.log(`♟️ Making FAST move: ${uciMove}`);
      
      // ✅ Start timing
      const startTime = Date.now();
      
      // ✅ Create new abort controller for this move
      this.abortController = new AbortController();

      const response = await this.api.post('/chess/move', {
        game_id: this.currentGameId,
        move: uciMove
      }, {
        signal: this.abortController.signal,
        timeout: 7000 // ✅ 7 second timeout for moves
      });

      const totalTime = Date.now() - startTime;

      if (response.data.success) {
        const aiThinkTime = response.data.ai_move?.think_time;
        
        console.log(`♟️ FAST move completed in ${totalTime}ms:`);
        console.log(`  Player: ${uciMove} → AI: ${response.data.ai_move?.move}`);
        if (aiThinkTime) {
          console.log(`  AI thought for ${(aiThinkTime * 1000).toFixed(0)}ms`);
        }
        
        // ✅ Performance warnings
        if (totalTime > 5000) {
          console.warn(`🐌 Slow move detected: ${totalTime}ms total`);
        }
        
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
      if (error.name === 'AbortError') {
        console.log('🚫 Move request cancelled');
        throw new Error('Move cancelled');
      }
      
      // ✅ Handle timeout specially
      if (error.code === 'ECONNABORTED') {
        throw new Error('Move timed out - AI is taking too long');
      }
      
      this.handleError('makeMove', error);
      throw error;
    }
  }

  /**
   * Cancel any pending requests
   */
  cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('🚫 Cancelled pending API requests');
    }
  }

  /**
   * Get current game state with timeout
   * @returns {Promise<Object>} Current game state
   */
  async getGameState() {
    if (!this.currentGameId) {
      throw new Error('No active game');
    }

    try {
      const response = await this.api.get(`/chess/game/${this.currentGameId}`, {
        timeout: 3000 // ✅ Quick timeout for game state
      });
      
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
   * Resign the current game quickly
   * @returns {Promise<Object>} Resignation result
   */
  async resign() {
    if (!this.currentGameId) {
      throw new Error('No active game to resign');
    }

    try {
      const response = await this.api.post('/chess/resign', {
        game_id: this.currentGameId
      }, {
        timeout: 3000 // ✅ Quick resignation
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
    this.cancelPendingRequests(); // ✅ Cancel any pending requests
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
      hasPendingRequests: !!this.abortController,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ✅ Force cleanup old games on server
   */
  async cleanupOldGames() {
    try {
      const response = await this.api.delete('/chess/cleanup', {
        timeout: 5000
      });
      
      console.log(`🧹 Server cleanup: ${response.data.cleaned_games} old games removed`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Server cleanup failed:', error.message);
      return null;
    }
  }

  /**
   * ✅ Test API connectivity and speed
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      
      const response = await this.api.get('/health', {
        timeout: 2000
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`🏥 API Health Check: ${responseTime}ms`);
      
      return {
        success: true,
        responseTime,
        status: response.data
      };
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ✅ Export singleton instance with fast settings
const chessApiService = new ChessApiService();
export default chessApiService;