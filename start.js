#!/usr/bin/env node

// start.js - סקריפט הפעלה מאוחד ונקי
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
      backend: null,
      frontend: null,
      python: null
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
      'backend-nodejs',
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

    const installations = [
      { name: 'Root', cwd: this.projectRoot },
      { name: 'Backend', cwd: path.join(this.projectRoot, 'backend-nodejs') },
      { name: 'Frontend', cwd: path.join(this.projectRoot, 'frontend-react') }
    ];

    for (const install of installations) {
      if (!fs.existsSync(path.join(install.cwd, 'node_modules'))) {
        this.log(`Installing ${install.name} dependencies...`);
        await this.runCommand('npm install', install.cwd);
        this.success(`${install.name} dependencies installed`);
      } else {
        this.info(`${install.name} dependencies already installed`);
      }
    }

    // Check Python dependencies
    try {
      await this.runCommand('python -c "import fastapi, uvicorn, chess"', 
        path.join(this.projectRoot, 'backend-python'));
      this.success('Python dependencies are available');
    } catch (error) {
      this.warning('Python dependencies missing. Installing...');
      await this.runCommand('pip install -r requirements.txt', 
        path.join(this.projectRoot, 'backend-python'));
    }
  }

  // Create environment files
  createEnvFiles() {
    const backendEnvPath = path.join(this.projectRoot, 'backend-nodejs', '.env');
    
    if (!fs.existsSync(backendEnvPath)) {
      this.log('Creating .env file for backend...');
      const envContent = `# ChessMentor Backend Environment
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=chessmentor-super-secret-key-2024
CORS_ORIGIN=http://localhost:3000

# Python Backend
PYTHON_BACKEND_URL=http://localhost:5001

# OpenAI (will be set by user)
# OPENAI_API_KEY=your_key_here
`;
      fs.writeFileSync(backendEnvPath, envContent);
      this.success('.env file created');
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
    const ports = [3000, 5000, 5001];
    
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
    }, 8000); // Wait for services to be ready
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
║              🚀 ChessMentor                  ║
║         Advanced Chess Training              ║
╚══════════════════════════════════════════════╝${colors.reset}
`);
    
    this.log('Starting ChessMentor development environment...');
    this.log(`Platform: ${os.platform()} ${os.arch()}`);
    this.log(`Node.js: ${process.version}`);
    this.log(`Working directory: ${this.projectRoot}`);
    console.log('');
  }

  // Show final info
  showFinalInfo() {
    console.log(`
${colors.bright}${colors.green}🎉 ChessMentor is running!${colors.reset}

${colors.bright}📍 Services:${colors.reset}
${colors.cyan}Frontend:${colors.reset}  http://localhost:3000
${colors.cyan}Backend:${colors.reset}   http://localhost:5000
${colors.cyan}Python:${colors.reset}    http://localhost:5001
${colors.cyan}Health:${colors.reset}    http://localhost:5000/api/health

${colors.bright}🎮 Quick Tips:${colors.reset}
• ${colors.yellow}Ctrl+C${colors.reset} to stop all services
• Check browser console for any errors
• Backend logs appear with ${colors.blue}[Backend]${colors.reset} prefix
• Frontend logs appear with ${colors.green}[Frontend]${colors.reset} prefix
• Python logs appear with ${colors.magenta}[Python]${colors.reset} prefix

${colors.bright}🔧 Troubleshooting:${colors.reset}
• If services don't start, check port availability
• For OpenAI API, configure in the app settings
• Python server requires Stockfish installation

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
      
      await this.checkPorts();
      
      // Setup
      this.createEnvFiles();
      await this.installDependencies();
      
      // Setup signal handlers
      this.setupSignalHandlers();
      
      // Start services
      this.log('Starting all services...');
      console.log('');
      
      const backendPath = path.join(this.projectRoot, 'backend-nodejs');
      const frontendPath = path.join(this.projectRoot, 'frontend-react');
      const pythonPath = path.join(this.projectRoot, 'backend-python');
      
      // Start Backend (Node.js)
      await this.startService('Backend', 'npm run dev', backendPath, 'blue');
      
      // Start Python Backend
      await this.startService('Python', 'python chess_server.py', pythonPath, 'magenta');
      
      // Start Frontend (React)
      const frontendEnv = { 
        ...process.env, 
        BROWSER: 'none',  // Prevent auto-opening browser
        GENERATE_SOURCEMAP: 'false'  // Faster builds
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