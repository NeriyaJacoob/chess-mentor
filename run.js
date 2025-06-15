const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 ChessMentor - הפעלה מהירה');
console.log('===============================');

// Check if directories exist
if (!fs.existsSync('backend-nodejs')) {
    console.log('❌ תיקיית backend-nodejs לא נמצאה');
    process.exit(1);
}

if (!fs.existsSync('frontend-react')) {
    console.log('❌ תיקיית frontend-react לא נמצאה');
    process.exit(1);
}

// Install dependencies if needed
const installBackend = () => {
    return new Promise((resolve) => {
        if (!fs.existsSync('backend-nodejs/node_modules')) {
            console.log('📦 מתקין תלויות Backend...');
            const install = spawn('npm', ['install'], {
                cwd: 'backend-nodejs',
                stdio: 'inherit',
                shell: true
            });
            install.on('close', resolve);
        } else {
            console.log('✅ תלויות Backend כבר מותקנות');
            resolve();
        }
    });
};

const installFrontend = () => {
    return new Promise((resolve) => {
        if (!fs.existsSync('frontend-react/node_modules')) {
            console.log('📦 מתקין תלויות Frontend...');
            const install = spawn('npm', ['install'], {
                cwd: 'frontend-react',
                stdio: 'inherit',
                shell: true
            });
            install.on('close', resolve);
        } else {
            console.log('✅ תלויות Frontend כבר מותקנות');
            resolve();
        }
    });
};

// Start servers
const startBackend = () => {
    console.log('🔧 מפעיל Backend...');
    const backend = spawn('npm', ['run', 'dev'], {
        cwd: 'backend-nodejs',
        stdio: 'inherit',
        shell: true
    });
    return backend;
};

const startFrontend = () => {
    setTimeout(() => {
        console.log('🌐 מפעיל Frontend...');
        const frontend = spawn('npm', ['start'], {
            cwd: 'frontend-react',
            stdio: 'inherit',
            shell: true
        });
        return frontend;
    }, 3000);
};

// Main execution
const main = async () => {
    try {
        await installBackend();
        await installFrontend();
        
        console.log('\n🚀 מפעיל שרתים...\n');
        
        const backend = startBackend();
        startFrontend();
        
        // Handle Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n🛑 עוצר שרתים...');
            backend.kill();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ שגיאה:', error);
        process.exit(1);
    }
};

main();