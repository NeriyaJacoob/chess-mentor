const { exec } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

const log = (message) => {
    console.log(`${colors.blue}[ChessMentor]${colors.reset} ${message}`);
};

const success = (message) => {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
};

const warning = (message) => {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
};

// Execute command
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};

// Kill processes on specific ports
const killPort = async (port) => {
    try {
        const { stdout } = await execCommand(`netstat -ano | findstr :${port}`);
        if (stdout) {
            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/\s+(\d+)$/);
                if (match) {
                    try {
                        await execCommand(`taskkill /F /PID ${match[1]}`);
                        warning(`תהליך על פורט ${port} נעצר`);
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
        }
    } catch (e) {
        // Port not in use - that's fine
    }
};

// Main execution
const main = async () => {
    console.clear();
    
    console.log('');
    console.log(`${colors.yellow}🛑 ChessMentor - עצירת שרתים${colors.reset}`);
    console.log(`${colors.yellow}===============================${colors.reset}`);
    console.log('');
    
    log('עוצר תהליכים...');
    
    // Kill processes on specific ports
    await killPort(3000);
    await killPort(5000);
    
    // Kill any ChessMentor windows
    try {
        await execCommand('taskkill /FI "WINDOWTITLE eq ChessMentor*" /F');
        warning('חלונות ChessMentor נסגרו');
    } catch (e) {
        // No windows to close
    }
    
    // Kill any remaining Node.js processes
    try {
        const { stdout } = await execCommand('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
        if (stdout) {
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('node.exe') && !line.includes('PID')) {
                    const match = line.match(/"(\d+)"/g);
                    if (match && match.length > 1) {
                        const pid = match[1].replace(/"/g, '');
                        try {
                            await execCommand(`taskkill /F /PID ${pid}`);
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                }
            }
        }
    } catch (e) {
        // No Node.js processes
    }
    
    console.log('');
    success('כל השרתים נעצרו בהצלחה!');
    console.log('');
    log('להפעלה מחדש: node windows-start.js');
    console.log('');
    
    setTimeout(() => {
        process.exit(0);
    }, 2000);
};

// Run main function
main();