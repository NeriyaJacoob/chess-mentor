// config.js - Global configuration for ChessMentor project
const os = require('os');
const path = require('path');

const config = {
  // Project Info
  project: {
    name: 'ChessMentor',
    version: '1.0.0',
    description: 'Advanced Chess Training Platform with AI Coach',
    author: 'ChessMentor Team',
    license: 'MIT'
  },

  // Environment Settings
  environment: {
    node: process.env.NODE_ENV || 'development',
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version
  },

  // Server Ports
  ports: {
    frontend: parseInt(process.env.FRONTEND_PORT) || 3000,
    python: parseInt(process.env.PYTHON_PORT) || 5001,
    websocket: parseInt(process.env.WEBSOCKET_PORT) || 5001
  },

  // URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    python: process.env.PYTHON_URL || 'http://localhost:5001',
    websocket: process.env.WEBSOCKET_URL || 'ws://localhost:5001/ws'
  },

  // Database (Future)
  database: {
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017/chessmentor',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      }
    }
  },

  // External APIs
  apis: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },
    lichess: {
      baseUrl: 'https://lichess.org/api',
      enabled: process.env.LICHESS_INTEGRATION === 'true'
    },
    chesscom: {
      baseUrl: 'https://api.chess.com/pub',
      enabled: process.env.CHESSCOM_INTEGRATION === 'true'
    }
  },

  // Chess Engine Settings
  chess: {
    stockfish: {
      // Platform-specific paths
      paths: {
        win32: process.env.STOCKFISH_PATH || 'C:\\stockfish\\stockfish.exe',
        darwin: process.env.STOCKFISH_PATH || '/usr/local/bin/stockfish',
        linux: process.env.STOCKFISH_PATH || '/usr/bin/stockfish'
      },
      defaultPath: function() {
        return this.paths[os.platform()] || '/usr/bin/stockfish';
      },
      options: {
        depth: parseInt(process.env.STOCKFISH_DEPTH) || 15,
        time: parseInt(process.env.STOCKFISH_TIME) || 1000,
        threads: parseInt(process.env.STOCKFISH_THREADS) || Math.max(1, os.cpus().length - 1),
        hash: parseInt(process.env.STOCKFISH_HASH) || 128
      }
    },
    
    // Game Settings
    game: {
      defaultTimeControl: {
        initial: 10, // minutes
        increment: 0 // seconds per move
      },
      aiLevels: [
        { level: 1, name: 'Beginner', elo: 800, depth: 5 },
        { level: 2, name: 'Casual', elo: 1000, depth: 8 },
        { level: 3, name: 'Intermediate', elo: 1200, depth: 10 },
        { level: 4, name: 'Advanced', elo: 1400, depth: 12 },
        { level: 5, name: 'Expert', elo: 1600, depth: 15 },
        { level: 6, name: 'Master', elo: 1800, depth: 18 }
      ],
      maxGameHistory: 100,
      autoSaveInterval: 30000 // 30 seconds
    }
  },

  // Security Settings
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'chessmentor-super-secret-key-2024',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: 'Too many requests, please try again later'
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    }
  },

  // File Paths
  paths: {
    root: process.cwd(),
    frontend: path.join(process.cwd(), 'frontend-react'),
    python: path.join(process.cwd(), 'backend-python'),
    uploads: path.join(process.cwd(), 'uploads'),
    logs: path.join(process.cwd(), 'logs'),
    assets: path.join(process.cwd(), 'frontend-react', 'public', 'assets')
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_TO_FILE === 'true',
      path: path.join(process.cwd(), 'logs', 'app.log'),
      maxSize: '10MB',
      maxFiles: 5
    },
    console: {
      enabled: true,
      colorize: true,
      timestamp: true
    }
  },

  // Performance
  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024
    },
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    clustering: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers: parseInt(process.env.CLUSTER_WORKERS) || os.cpus().length
    }
  },

  // Features Flags
  features: {
    multiplayer: process.env.FEATURE_MULTIPLAYER !== 'false',
    aiCoach: process.env.FEATURE_AI_COACH !== 'false',
    puzzles: process.env.FEATURE_PUZZLES !== 'false',
    analysis: process.env.FEATURE_ANALYSIS !== 'false',
    tournaments: process.env.FEATURE_TOURNAMENTS === 'true',
    social: process.env.FEATURE_SOCIAL === 'true',
    mobile: process.env.FEATURE_MOBILE === 'true',
    vr: process.env.FEATURE_VR === 'true'
  },

  // UI Settings
  ui: {
    themes: ['light', 'dark', 'auto'],
    defaultTheme: process.env.DEFAULT_THEME || 'light',
    pieceStyles: ['classic', 'modern', 'svg', 'unicode'],
    defaultPieceStyle: process.env.DEFAULT_PIECE_STYLE || 'classic',
    boardThemes: ['classic', 'blue', 'green', 'purple'],
    defaultBoardTheme: process.env.DEFAULT_BOARD_THEME || 'classic',
    animations: {
      enabled: process.env.ANIMATIONS_ENABLED !== 'false',
      speed: process.env.ANIMATION_SPEED || 'normal' // fast, normal, slow
    },
    sounds: {
      enabled: process.env.SOUNDS_ENABLED !== 'false',
      volume: parseFloat(process.env.SOUND_VOLUME) || 0.5
    }
  },

  // Development Settings
  development: {
    hotReload: true,
    debugMode: process.env.DEBUG === 'true',
    mockData: process.env.USE_MOCK_DATA === 'true',
    skipAuth: process.env.SKIP_AUTH === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true'
  },

  // Production Settings
  production: {
    minify: true,
    compression: true,
    caching: true,
    monitoring: true,
    analytics: process.env.ANALYTICS_ENABLED === 'true'
  },

  // Monitoring & Analytics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    endpoint: process.env.MONITORING_ENDPOINT,
    interval: parseInt(process.env.MONITORING_INTERVAL) || 60000, // 1 minute
    metrics: {
      performance: true,
      errors: true,
      usage: true,
      games: true
    }
  },

  // Backup & Recovery
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    interval: parseInt(process.env.BACKUP_INTERVAL) || 24 * 60 * 60 * 1000, // 24 hours
    retention: parseInt(process.env.BACKUP_RETENTION) || 7, // days
    destination: process.env.BACKUP_DESTINATION || 'local'
  }
};

// Helper functions
config.helpers = {
  // Check if running in development
  isDevelopment: () => config.environment.node === 'development',
  
  // Check if running in production
  isProduction: () => config.environment.node === 'production',
  
  // Get Stockfish path for current platform
  getStockfishPath: () => config.chess.stockfish.defaultPath(),
  
  // Get AI level by number
  getAILevel: (level) => {
    return config.chess.game.aiLevels.find(ai => ai.level === level) || config.chess.game.aiLevels[2];
  },
  
  // Check if feature is enabled
  isFeatureEnabled: (feature) => {
    return config.features[feature] === true;
  },
  
  // Get full URL for service
  getServiceUrl: (service) => {
    return config.urls[service] || `http://localhost:${config.ports[service]}`;
  },
  
  // Validate configuration
  validate: () => {
    const errors = [];
    
    // Check required environment variables
    if (config.isProduction() && !process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
    
    // Check Stockfish path
    const fs = require('fs');
    const stockfishPath = config.getStockfishPath();
    if (!fs.existsSync(stockfishPath)) {
      errors.push(`Stockfish not found at: ${stockfishPath}`);
    }
    
    // Check port conflicts
    const ports = Object.values(config.ports);
    const uniquePorts = [...new Set(ports)];
    if (ports.length !== uniquePorts.length) {
      errors.push('Port conflicts detected');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Export configuration
module.exports = config;