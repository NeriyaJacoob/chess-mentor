#!/usr/bin/env node
// start.js - סקריפט הפעלה מעודכן לעבודה עם Python בלבד
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ChessMentorLauncher {
  constructor() {
    this.processes = [];
    this.isWindows = os.platform() === 'win32';
    this.projectRoot = process.cwd();
    this.services = {
      python: null,
      frontend: null
    };
  }

  log(message, color = 'cyan') {
    console.log(`${colors[color]}[ChessMentor]${colors.reset} ${message}`);
  }

  success(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  }

  error(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
  }

  warning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  }

  info(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
  }

  // Check if directories exist
  checkDirectories() {
    const requiredDirs = [
      'frontend-react',
      'backend-python'
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        this.error(`Directory ${dir} not found!`);
        return false;
      }
    }

    this.success('All required directories found');
    return true;
  }

  // Install dependencies
  async installDependencies() {
    this.log('Installing dependencies...');

    // Frontend dependencies
    if (!fs.existsSync(path.join(this.projectRoot, 'frontend-react', 'node_modules'))) {
      this.log('Installing Frontend dependencies...');
      await this.runCommand('npm install', path.join(this.projectRoot, 'frontend-react'));
      this.success('Frontend dependencies installed');
    } else {
      this.info('Frontend dependencies already installed');
    }

    // Python dependencies
    try {
      await this.runCommand('python -c "import fastapi, uvicorn, chess, openai"', 
        path.join(this.projectRoot, 'backend-python'));
      this.success('Python dependencies are available');
    } catch (error) {
      this.warning('Python dependencies missing. Installing...');
      try {
        await this.runCommand('pip install -r requirements.txt', 
          path.join(this.projectRoot, 'backend-python'));
        this.success('Python dependencies installed');
      } catch (installError) {
        this.error('Failed to install Python dependencies');
        this.error('Please run: pip install -r backend-python/requirements.txt');
        throw installError;
      }
    }
  }

  // Check Python and Stockfish
  async checkPythonEnvironment() {
    this.log('Checking Python environment...');
    
    try {
      const pythonVersion = await this.runCommand('python --version');
      this.success(`Python version: ${pythonVersion.trim()}`);
    } catch (error) {
      this.error('Python not found! Please install Python 3.8+');
      throw error;
    }

    // Check Stockfish
    try {
      const stockfishVersion = await this.runCommand('stockfish quit');
      this.success('Stockfish found in PATH');
    } catch (error) {
      this.warning('Stockfish not found in PATH');
      this.warning('AI games may not work. Please install Stockfish:');
      this.warning('Windows: Download from https://stockfishchess.org/');
      this.warning('macOS: brew install stockfish');
      this.warning('Linux: sudo apt install stockfish');
    }
  }

  // Run command and return promise
  runCommand(command, cwd = this.projectRoot) {
    return new Promise((resolve, reject) => {
      const options = { cwd, shell: true };
      
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  // Start a service
  startService(name, command, cwd, color = 'cyan') {
    return new Promise((resolve) => {
      this.log(`Starting ${name}...`, color);
      
      const options = {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      };

      const process = spawn(command, [], options);
      this.processes.push(process);
      
      // Handle process output
      process.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`${colors[color]}[${name}]${colors.reset} ${output}`);
        }
      });

      process.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('warning')) {
          console.log(`${colors.yellow}[${name}]${colors.reset} ${output}`);
        }
      });

      process.on('close', (code) => {
        if (code !== 0) {
          this.error(`${name} exited with code ${code}`);
        } else {
          this.log(`${name} stopped gracefully`);
        }
      });

      process.on('error', (error) => {
        this.error(`${name} error: ${error.message}`);
      });

      // Resolve after a short delay to allow service to start
      setTimeout(() => {
        this.success(`${name} started successfully`);
        resolve(process);
      }, 2000);
    });
  }

  // Check if port is available
  async checkPort(port) {
    return new Promise((resolve) => {
      const cmd = this.isWindows 
        ? `netstat -an | findstr :${port}`
        : `lsof -i :${port}`;
        
      exec(cmd, (error, stdout) => {
        resolve(!stdout || stdout.trim() === '');
      });
    });
  }

  // Kill process on port
  async killPort(port) {
    try {
      if (this.isWindows) {
        const { stdout } = await this.runCommand(`netstat -ano | findstr :${port}`);
        if (stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/\s+(\d+)$/);
            if (match) {
              await this.runCommand(`taskkill /F /PID ${match[1]}`);
              this.warning(`Killed process on port ${port}`);
            }
          }
        }
      } else {
        await this.runCommand(`lsof -ti:${port} | xargs kill -9`);
        this.warning(`Killed process on port ${port}`);
      }
    } catch (error) {
      // Port not in use - that's fine
    }
  }

  // Check and kill conflicting processes
  async checkPorts() {
    const ports = [3000, 5001]; // רק Python ו-React
    
    for (const port of ports) {
      const isAvailable = await this.checkPort(port);
      if (!isAvailable) {
        this.warning(`Port ${port} is in use. Attempting to free it...`);
        await this.killPort(port);
        
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isNowAvailable = await this.checkPort(port);
        if (!isNowAvailable) {
          this.error(`Failed to free port ${port}. Please close any applications using this port.`);
          return false;
        }
      }
    }
    
    this.success('All required ports are available');
    return true;
  }

  // Open browser
  openBrowser() {
    setTimeout(() => {
      this.log('Opening browser...');
      const url = 'http://localhost:3000';
      
      const command = this.isWindows 
        ? `start ${url}`
        : process.platform === 'darwin' 
        ? `open ${url}`
        : `xdg-open ${url}`;
        
      exec(command, (error) => {
        if (error) {
          this.warning(`Could not open browser automatically. Please go to: ${url}`);
        } else {
          this.success('Browser opened');
        }
      });
    }, 6000); // Wait for services to be ready
  }

  // Setup signal handlers
  setupSignalHandlers() {
    const cleanup = () => {
      this.log('Shutting down services...');
      
      this.processes.forEach((process, index) => {
        try {
          if (!process.killed) {
            process.kill();
            this.log(`Service ${index + 1} stopped`);
          }
        } catch (error) {
          // Ignore errors during cleanup
        }
      });
      
      this.success('All services stopped');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);
    
    // Windows
    if (this.isWindows) {
      process.on('SIGBREAK', cleanup);
    }
  }

  // Show startup info
  showStartupInfo() {
    console.clear();
    console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════╗
║              🚀 ChessMentor v2.0             ║
║         Complete Python Architecture         ║
╚══════════════════════════════════════════════╝${colors.reset}
`);
    
    this.log('Starting ChessMentor with Python backend...');
    this.log(`Platform: ${os.platform()} ${os.arch()}`);
    this.log(`Node.js: ${process.version}`);
    this.log(`Working directory: ${this.projectRoot}`);
    console.log('');
  }

  // Show final info
  showFinalInfo() {
    console.log(`
${colors.bright}${colors.green}🎉 ChessMentor v2.0 is running!${colors.reset}

${colors.bright}📍 Services:${colors.reset}
${colors.cyan}Frontend:${colors.reset}  http://localhost:3000
${colors.magenta}Python API:${colors.reset} http://localhost:5001
${colors.cyan}WebSocket:${colors.reset}  ws://localhost:5001/ws
${colors.cyan}Health:${colors.reset}     http://localhost:5001/health

${colors.bright}🎮 New Features:${colors.reset}
• ${colors.green}Complete Python backend${colors.reset}
• ${colors.green}Integrated OpenAI API${colors.reset}
• ${colors.green}Real-time WebSocket games${colors.reset}
• ${colors.green}Advanced Stockfish integration${colors.reset}

${colors.bright}🎯 Quick Tips:${colors.reset}
• ${colors.yellow}Ctrl+C${colors.reset} to stop all services
• Configure OpenAI API key in the web interface
• Python server handles both REST API and WebSocket
• All chess logic runs in Python for better performance

${colors.bright}🔧 Troubleshooting:${colors.reset}
• If Python service fails, check requirements.txt installation
• For Stockfish issues, ensure it's installed and in PATH
• OpenAI API key needed for coach features

${colors.bright}📚 Documentation:${colors.reset} Check README.md for more details
`);
  }

  // Main startup sequence
  async start() {
    try {
      this.showStartupInfo();
      
      // Pre-flight checks
      if (!this.checkDirectories()) {
        process.exit(1);
      }
      
      await this.checkPythonEnvironment();
      await this.checkPorts();
      
      // Setup
      await this.installDependencies();
      
      // Setup signal handlers
      this.setupSignalHandlers();
      
      // Start services
      this.log('Starting services...');
      console.log('');
      
      const frontendPath = path.join(this.projectRoot, 'frontend-react');
      const pythonPath = path.join(this.projectRoot, 'backend-python');
      
      // Start Python Server (handles everything)
      await this.startService('Python Server', 'python main_server.py', pythonPath, 'magenta');
      
      // Start Frontend (React)
      const frontendEnv = { 
        ...process.env, 
        BROWSER: 'none',  // Prevent auto-opening browser
        GENERATE_SOURCEMAP: 'false',  // Faster builds
        REACT_APP_API_URL: 'http://localhost:5001'  // Point to Python server
      };
      
      const frontendProcess = spawn('npm', ['start'], {
        cwd: frontendPath,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: frontendEnv
      });
      
      this.processes.push(frontendProcess);
      
      frontendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`${colors.green}[Frontend]${colors.reset} ${output}`);
        }
      });
      
      frontendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('warning')) {
          console.log(`${colors.yellow}[Frontend]${colors.reset} ${output}`);
        }
      });
      
      this.success('Frontend started successfully');
      
      // Open browser
      this.openBrowser();
      
      // Show final info
      setTimeout(() => {
        this.showFinalInfo();
      }, 3000);
      
    } catch (error) {
      this.error(`Startup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const launcher = new ChessMentorLauncher();
  launcher.start();
}

module.exports = ChessMentorLauncher;