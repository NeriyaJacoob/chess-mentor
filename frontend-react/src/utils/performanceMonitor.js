// frontend-react/src/utils/performanceMonitor.js
// Real-time performance monitoring for chess game
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      clickToResponse: [],
      moveProcessing: [],
      apiCalls: [],
      renders: [],
      memoryUsage: []
    };
    
    this.thresholds = {
      clickResponse: 100, // ms
      moveProcessing: 1000, // ms
      apiCall: 3000, // ms
      render: 16.67 // ms (60fps)
    };
    
    this.isMonitoring = false;
    this.startTime = null;
  }

  // ✅ Start performance monitoring
  start() {
    this.isMonitoring = true;
    this.startTime = performance.now();
    
    console.log('🔍 Performance monitoring started');
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor frame rate
    this.startFrameRateMonitoring();
    
    return this;
  }

  // ✅ Stop monitoring
  stop() {
    this.isMonitoring = false;
    console.log('🛑 Performance monitoring stopped');
    return this.getReport();
  }

  // ✅ Track click to response time
  trackClickResponse(startTime, endTime = performance.now()) {
    if (!this.isMonitoring) return;
    
    const duration = endTime - startTime;
    this.metrics.clickToResponse.push({
      duration,
      timestamp: Date.now(),
      fast: duration < this.thresholds.clickResponse
    });
    
    console.log(`⚡ Click response: ${duration.toFixed(1)}ms ${
      duration > this.thresholds.clickResponse ? '🐌' : '✅'
    }`);
    
    return duration;
  }

  // ✅ Track move processing time
  trackMoveProcessing(moveData, startTime, endTime = performance.now()) {
    if (!this.isMonitoring) return;
    
    const duration = endTime - startTime;
    this.metrics.moveProcessing.push({
      move: moveData,
      duration,
      timestamp: Date.now(),
      phases: moveData.phases || [],
      fast: duration < this.thresholds.moveProcessing
    });
    
    console.log(`♟️ Move processing: ${duration.toFixed(1)}ms ${
      duration > this.thresholds.moveProcessing ? '🐌' : '✅'
    }`);
    
    return duration;
  }

  // ✅ Track API call performance
  trackApiCall(endpoint, startTime, endTime = performance.now(), success = true) {
    if (!this.isMonitoring) return;
    
    const duration = endTime - startTime;
    this.metrics.apiCalls.push({
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
      fast: duration < this.thresholds.apiCall
    });
    
    console.log(`🌐 API ${endpoint}: ${duration.toFixed(1)}ms ${
      success ? '✅' : '❌'
    } ${duration > this.thresholds.apiCall ? '🐌' : ''}`);
    
    return duration;
  }

  // ✅ Track render performance
  trackRender(componentName, startTime, endTime = performance.now()) {
    if (!this.isMonitoring) return;
    
    const duration = endTime - startTime;
    this.metrics.renders.push({
      component: componentName,
      duration,
      timestamp: Date.now(),
      fast: duration < this.thresholds.render
    });
    
    if (duration > this.thresholds.render) {
      console.warn(`🎨 Slow render ${componentName}: ${duration.toFixed(1)}ms`);
    }
    
    return duration;
  }

  // ✅ Monitor memory usage
  startMemoryMonitoring() {
    if (!window.performance.memory) {
      console.warn('⚠️ Memory monitoring not available');
      return;
    }
    
    const checkMemory = () => {
      if (!this.isMonitoring) return;
      
      const memory = window.performance.memory;
      this.metrics.memoryUsage.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      });
      
      // Check for memory leaks
      const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usage > 80) {
        console.warn(`🧠 High memory usage: ${usage.toFixed(1)}%`);
      }
      
      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };
    
    checkMemory();
  }

  // ✅ Monitor frame rate
  startFrameRateMonitoring() {
    let lastFrame = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;
    
    const checkFrame = (currentFrame) => {
      if (!this.isMonitoring) return;
      
      const frameTime = currentFrame - lastFrame;
      frameCount++;
      totalFrameTime += frameTime;
      
      // Log slow frames
      if (frameTime > 33.33) { // Slower than 30fps
        console.warn(`🎞️ Slow frame: ${frameTime.toFixed(1)}ms (${(1000/frameTime).toFixed(1)}fps)`);
      }
      
      // Calculate average FPS every 60 frames
      if (frameCount >= 60) {
        const avgFrameTime = totalFrameTime / frameCount;
        const avgFPS = 1000 / avgFrameTime;
        
        console.log(`📊 Average FPS: ${avgFPS.toFixed(1)} (${avgFrameTime.toFixed(1)}ms/frame)`);
        
        frameCount = 0;
        totalFrameTime = 0;
      }
      
      lastFrame = currentFrame;
      requestAnimationFrame(checkFrame);
    };
    
    requestAnimationFrame(checkFrame);
  }

  // ✅ Create performance-aware wrapper for functions
  wrapFunction(fn, name) {
    return (...args) => {
      const start = performance.now();
      
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          return result.then(value => {
            this.trackApiCall(name, start);
            return value;
          }).catch(error => {
            this.trackApiCall(name, start, performance.now(), false);
            throw error;
          });
        } else {
          this.trackRender(name, start);
          return result;
        }
      } catch (error) {
        this.trackRender(name, start, performance.now());
        throw error;
      }
    };
  }

  // ✅ Performance report
  getReport() {
    const report = {
      duration: performance.now() - this.startTime,
      summary: {},
      details: this.metrics,
      recommendations: []
    };
    
    // ✅ Calculate summaries
    Object.keys(this.metrics).forEach(key => {
      const data = this.metrics[key];
      if (data.length === 0) return;
      
      const durations = data.map(item => item.duration).filter(d => d);
      if (durations.length === 0) return;
      
      report.summary[key] = {
        count: data.length,
        average: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        fastCount: data.filter(item => item.fast).length,
        slowCount: data.filter(item => !item.fast).length
      };
    });
    
    // ✅ Generate recommendations
    if (report.summary.clickToResponse) {
      const clicks = report.summary.clickToResponse;
      if (clicks.average > this.thresholds.clickResponse) {
        report.recommendations.push({
          type: 'click_response',
          message: `Average click response (${clicks.average.toFixed(1)}ms) is slower than ${this.thresholds.clickResponse}ms`,
          suggestions: [
            'Optimize handleSquareClick function',
            'Reduce Redux state complexity',
            'Use React.memo for components',
            'Minimize re-renders with useCallback'
          ]
        });
      }
    }
    
    if (report.summary.moveProcessing) {
      const moves = report.summary.moveProcessing;
      if (moves.average > this.thresholds.moveProcessing) {
        report.recommendations.push({
          type: 'move_processing',
          message: `Average move processing (${moves.average.toFixed(1)}ms) is slower than ${this.thresholds.moveProcessing}ms`,
          suggestions: [
            'Optimize API timeout settings',
            'Use non-blocking service',
            'Implement move caching',
            'Reduce Stockfish thinking time'
          ]
        });
      }
    }
    
    console.log('📊 Performance Report:', report);
    return report;
  }

  // ✅ Quick benchmark test
  async runBenchmark() {
    console.log('🏃 Running performance benchmark...');
    
    const results = {
      clickSimulation: await this.benchmarkClicks(),
      memoryStress: await this.benchmarkMemory(),
      renderStress: await this.benchmarkRenders()
    };
    
    console.log('🏁 Benchmark results:', results);
    return results;
  }

  // ✅ Benchmark click handling
  async benchmarkClicks(count = 50) {
    const times = [];
    
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      
      // Simulate click processing
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const end = performance.now();
      times.push(end - start);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return {
      count,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }

  // ✅ Benchmark memory usage
  async benchmarkMemory() {
    if (!window.performance.memory) {
      return { error: 'Memory API not available' };
    }
    
    const initialMemory = window.performance.memory.usedJSHeapSize;
    
    // Create some objects to stress test
    const objects = [];
    for (let i = 0; i < 10000; i++) {
      objects.push({ id: i, data: new Array(100).fill(Math.random()) });
    }
    
    const peakMemory = window.performance.memory.usedJSHeapSize;
    
    // Clean up
    objects.length = 0;
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalMemory = window.performance.memory.usedJSHeapSize;
    
    return {
      initial: initialMemory,
      peak: peakMemory,
      final: finalMemory,
      increase: peakMemory - initialMemory,
      recovered: peakMemory - finalMemory
    };
  }

  // ✅ Benchmark render performance
  async benchmarkRenders(count = 100) {
    const times = [];
    
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      
      // Simulate component render
      const element = document.createElement('div');
      element.innerHTML = `<span>Test ${i}</span>`;
      document.body.appendChild(element);
      
      const end = performance.now();
      times.push(end - start);
      
      // Clean up
      document.body.removeChild(element);
      
      // Yield control
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    return {
      count,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }
}

// ✅ Create global monitor instance
const performanceMonitor = new PerformanceMonitor();

// ✅ Auto-start in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.start();
  
  // Add to window for debugging
  window.performanceMonitor = performanceMonitor;
  
  console.log('🔍 Performance monitoring enabled for development');
}

export default performanceMonitor;