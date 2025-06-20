// frontend-react/src/services/nonBlockingChessService.js
// Non-blocking chess service that doesn't freeze the UI
import chessApiService from './chessApiService';

class NonBlockingChessService {
  constructor() {
    this.pendingMoves = new Map();
    this.moveQueue = [];
    this.isProcessing = false;
    this.callbacks = new Map();
  }

  // ✅ Non-blocking move execution with immediate UI feedback
  async makeNonBlockingMove(move, onProgress = null) {
    const moveId = Date.now() + Math.random();
    
    console.log('⚡ Starting non-blocking move:', move, 'ID:', moveId);
    
    // ✅ Immediate UI feedback
    if (onProgress) {
      onProgress({ stage: 'validating', progress: 10 });
    }
    
    try {
      // ✅ Use requestIdleCallback for better performance
      return new Promise((resolve, reject) => {
        
        const processMove = async () => {
          try {
            if (onProgress) onProgress({ stage: 'sending', progress: 30 });
            
            // ✅ Break into chunks to avoid blocking UI
            await this.scheduleWork(() => {
              // Validate move format
              const uciMove = typeof move === 'string' ? move : `${move.from}${move.to}${move.promotion || ''}`;
              return uciMove;
            });
            
            if (onProgress) onProgress({ stage: 'processing', progress: 50 });
            
            // ✅ Actual API call with timeout
            const result = await chessApiService.makeMove(move);
            
            if (onProgress) onProgress({ stage: 'updating', progress: 80 });
            
            // ✅ Allow UI to update
            await this.scheduleWork(() => {
              console.log('⚡ Move completed:', result);
              return result;
            });
            
            if (onProgress) onProgress({ stage: 'complete', progress: 100 });
            
            resolve(result);
            
          } catch (error) {
            console.error('❌ Non-blocking move failed:', error);
            if (onProgress) onProgress({ stage: 'error', progress: 0, error });
            reject(error);
          }
        };
        
        // ✅ Schedule work on next frame
        requestAnimationFrame(processMove);
      });
      
    } catch (error) {
      console.error('❌ Failed to queue move:', error);
      throw error;
    }
  }

  // ✅ Schedule work during idle time
  scheduleWork(work) {
    return new Promise((resolve) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback((deadline) => {
          const result = work();
          resolve(result);
        }, { timeout: 100 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          const result = work();
          resolve(result);
        }, 0);
      }
    });
  }

  // ✅ Batch multiple moves for efficiency
  async batchMoves(moves, onBatchProgress = null) {
    const results = [];
    const total = moves.length;
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      if (onBatchProgress) {
        onBatchProgress({
          current: i + 1,
          total,
          progress: ((i + 1) / total) * 100,
          move
        });
      }
      
      try {
        const result = await this.makeNonBlockingMove(move);
        results.push(result);
        
        // ✅ Small delay between moves to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Batch move ${i} failed:`, error);
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  // ✅ Preload game for instant response
  async preloadGame(aiLevel = 3, playerColor = 'white') {
    console.log('🎮 Preloading game for instant start...');
    
    try {
      // ✅ Start game in background
      const gamePromise = chessApiService.newGame(aiLevel, playerColor);
      
      // ✅ Show loading immediately without blocking
      const result = await this.scheduleWork(() => gamePromise);
      
      console.log('✅ Game preloaded successfully');
      return await result;
      
    } catch (error) {
      console.error('❌ Game preload failed:', error);
      throw error;
    }
  }

  // ✅ Smart retry with exponential backoff
  async retryWithBackoff(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ Background health monitoring
  startHealthMonitoring() {
    const check = async () => {
      try {
        const start = performance.now();
        await chessApiService.testConnection?.();
        const responseTime = performance.now() - start;
        
        console.log(`💓 API Health: ${responseTime.toFixed(1)}ms`);
        
        // ✅ Warn if API is slow
        if (responseTime > 2000) {
          console.warn('🐌 API response is slow:', responseTime);
        }
        
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    };
    
    // Check every 30 seconds
    setInterval(check, 30000);
    
    // Initial check
    check();
  }

  // ✅ Performance monitoring
  monitorPerformance(operation, label) {
    return async (...args) => {
      const start = performance.now();
      
      try {
        const result = await operation(...args);
        const duration = performance.now() - start;
        
        console.log(`⚡ ${label}: ${duration.toFixed(1)}ms`);
        
        // ✅ Performance warnings
        if (duration > 1000) {
          console.warn(`🐌 Slow operation detected: ${label} took ${duration.toFixed(1)}ms`);
        }
        
        return result;
        
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ ${label} failed after ${duration.toFixed(1)}ms:`, error);
        throw error;
      }
    };
  }

  // ✅ Get optimized service methods
  getOptimizedMethods() {
    return {
      // ✅ Monitored versions of all methods
      newGame: this.monitorPerformance(
        (...args) => this.preloadGame(...args),
        'New Game'
      ),
      
      makeMove: this.monitorPerformance(
        (...args) => this.makeNonBlockingMove(...args),
        'Make Move'
      ),
      
      // ✅ Original methods with monitoring
      resign: this.monitorPerformance(
        chessApiService.resign.bind(chessApiService),
        'Resign'
      ),
      
      getGameState: this.monitorPerformance(
        chessApiService.getGameState.bind(chessApiService),
        'Get Game State'
      ),
      
      // ✅ Pass through other methods
      getCurrentGameId: chessApiService.getCurrentGameId.bind(chessApiService),
      isGameActive: chessApiService.isGameActive.bind(chessApiService),
      clearGame: chessApiService.clearGame.bind(chessApiService),
      getStatus: chessApiService.getStatus.bind(chessApiService)
    };
  }
}

// ✅ Create optimized service instance
const nonBlockingService = new NonBlockingChessService();

// ✅ Start health monitoring
nonBlockingService.startHealthMonitoring();

// ✅ Export optimized methods
export default nonBlockingService.getOptimizedMethods();