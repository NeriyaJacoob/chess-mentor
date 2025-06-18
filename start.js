// start.js – הגרסה המעודכנת ללא Node.js כלל (Python + React בלבד)
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};

class ChessMentorLauncher {
  constructor() {
    this.processes = [];
    this.isWindows = os.platform() === 'win32';
    this.projectRoot = process.cwd();
  }

  log(message, color = 'cyan') {
    console.log(`${colors[color]}[ChessMentor]${colors.reset} ${message}`);
  }
  success(msg) { console.log(`${colors.green}✅ ${msg}${colors.reset}`); }
  error(msg) { console.log(`${colors.red}❌ ${msg}${colors.reset}`); }
  warning(msg) { console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`); }
  info(msg) { console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`); }

  checkDirectories() {
    const dirs = ['frontend-react', 'backend-python'];
    for (const dir of dirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        this.error(`Directory ${dir} not found!`);
        return false;
      }
    }
    this.success('All required directories found');
    return true;
  }

  async installDependencies() {
    this.log('Installing dependencies...');
    const installations = [
      { name: 'Root', cwd: this.projectRoot },
      { name: 'Frontend', cwd: path.join(this.projectRoot, 'frontend-react') }
    ];
    for (const i of installations) {
      if (!fs.existsSync(path.join(i.cwd, 'node_modules')))
        await this.runCommand('npm install', i.cwd);
      else this.info(`${i.name} dependencies already installed`);
    }
    try {
      await this.runCommand('python -c "import fastapi, uvicorn, chess"', path.join(this.projectRoot, 'backend-python'));
      this.success('Python dependencies are available');
    } catch {
      this.warning('Installing Python dependencies...');
      await this.runCommand('pip install -r requirements.txt', path.join(this.projectRoot, 'backend-python'));
    }
  }

  async runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd, shell: true }, (err, stdout) => err ? reject(err) : resolve(stdout));
    });
  }

  async startService(name, command, cwd, color = 'cyan') {
    return new Promise((resolve) => {
      this.log(`Starting ${name}...`, color);
      const proc = spawn(command, [], { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
      this.processes.push(proc);
      proc.stdout.on('data', (d) => console.log(`${colors[color]}[${name}]${colors.reset} ${d.toString().trim()}`));
      proc.stderr.on('data', (d) => console.log(`${colors.yellow}[${name}]${colors.reset} ${d.toString().trim()}`));
      setTimeout(() => this.success(`${name} started successfully`), 1500);
      resolve(proc);
    });
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      exec(this.isWindows ? `netstat -an | findstr :${port}` : `lsof -i :${port}`, (err, out) => resolve(!out || out.trim() === ''));
    });
  }

  async killPort(port) {
    try {
      const cmd = this.isWindows ? `netstat -ano | findstr :${port}` : `lsof -ti:${port} | xargs kill -9`;
      await this.runCommand(cmd);
      this.warning(`Killed process on port ${port}`);
    } catch {}
  }

  async checkPorts() {
    const ports = [3000, 5001];
    for (const port of ports) {
      if (!(await this.checkPort(port))) {
        this.warning(`Port ${port} is in use. Attempting to free it...`);
        await this.killPort(port);
        if (!(await this.checkPort(port))) {
          this.error(`Failed to free port ${port}`);
          return false;
        }
      }
    }
    this.success('All required ports are available');
    return true;
  }

  openBrowser() {
    setTimeout(() => {
      const url = 'http://localhost:3000';
      const cmd = this.isWindows ? `start ${url}` : (process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`);
      exec(cmd);
    }, 8000);
  }

  setupSignalHandlers() {
    const cleanup = () => {
      this.log('Shutting down services...');
      this.processes.forEach(p => { if (!p.killed) p.kill(); });
      this.success('All services stopped');
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    if (this.isWindows) process.on('SIGBREAK', cleanup);
  }

  showStartupInfo() {
    console.clear();
    console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════╗
║        🚀 ChessMentor Lite           ║
╚══════════════════════════════════════╝${colors.reset}`);
    this.log('Starting development environment...');
  }

  showFinalInfo() {
    console.log(`\n${colors.green}🎉 ChessMentor is running!${colors.reset}`);
    console.log(`${colors.cyan}Frontend:${colors.reset} http://localhost:3000`);
    console.log(`${colors.magenta}Python:${colors.reset}   http://localhost:5001`);
  }

  async start() {
    try {
      this.showStartupInfo();
      if (!this.checkDirectories()) process.exit(1);
      await this.checkPorts();
      await this.installDependencies();
      this.setupSignalHandlers();
      const frontend = path.join(this.projectRoot, 'frontend-react');
      const python = path.join(this.projectRoot, 'backend-python');
      await this.startService('Python', 'python chess_server.py', python, 'magenta');
      const env = { ...process.env, BROWSER: 'none', GENERATE_SOURCEMAP: 'false' };
      const frontendProc = spawn('npm', ['start'], { cwd: frontend, shell: true, stdio: ['ignore', 'pipe', 'pipe'], env });
      this.processes.push(frontendProc);
      frontendProc.stdout.on('data', d => console.log(`${colors.green}[Frontend]${colors.reset} ${d.toString().trim()}`));
      frontendProc.stderr.on('data', d => console.log(`${colors.yellow}[Frontend]${colors.reset} ${d.toString().trim()}`));
      this.success('Frontend started successfully');
      this.openBrowser();
      setTimeout(() => this.showFinalInfo(), 3000);
    } catch (e) {
      this.error(`Startup failed: ${e.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const launcher = new ChessMentorLauncher();
  launcher.start();
}

module.exports = ChessMentorLauncher;
