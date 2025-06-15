const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 ChessMentor - הפעלה');
console.log('====================');

const runCommand = (command, cwd = '.') => {
    return new Promise((resolve, reject) => {
        console.log(`📝 מריץ: ${command}`);
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ שגיאה: ${error.message}`);
                reject(error);
            } else {
                if (stdout) console.log(stdout);
                resolve(stdout);
            }
        });
    });
};

const main = async () => {
    try {
        // בדיקת תיקיות
        if (!fs.existsSync('backend-nodejs')) {
            console.log('❌ תיקיית backend-nodejs לא נמצאה');
            return;
        }
        
        if (!fs.existsSync('frontend-react')) {
            console.log('❌ תיקיית frontend-react לא נמצאה');
            return;
        }
        
        // התקנת תלויות Backend
        console.log('\n📦 Backend Dependencies:');
        if (!fs.existsSync('backend-nodejs/node_modules')) {
            await runCommand('npm install', 'backend-nodejs');
        } else {
            console.log('✅ כבר מותקן');
        }
        
        // התקנת תלויות Frontend
        console.log('\n📦 Frontend Dependencies:');
        if (!fs.existsSync('frontend-react/node_modules')) {
            await runCommand('npm install', 'frontend-react');
        } else {
            console.log('✅ כבר מותקן');
        }
        
        // יצירת .env
        const envPath = 'backend-nodejs/.env';
        if (!fs.existsSync(envPath)) {
            console.log('\n📝 יוצר .env file...');
            const envContent = `PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=chessmentor-secret-key`;
            fs.writeFileSync(envPath, envContent);
            console.log('✅ .env נוצר');
        }
        
        console.log('\n🚀 מפעיל שרתים...');
        
        // הפעלת Backend
        console.log('🔧 מפעיל Backend...');
        exec('start "ChessMentor Backend" cmd /k "npm run dev"', { cwd: 'backend-nodejs' });
        
        // המתנה ואז הפעלת Frontend
        setTimeout(() => {
            console.log('🌐 מפעיל Frontend...');
            exec('start "ChessMentor Frontend" cmd /k "npm start"', { cwd: 'frontend-react' });
            
            // פתיחת דפדפן
            setTimeout(() => {
                console.log('🔍 פותח דפדפן...');
                exec('start http://localhost:3000');
                
                console.log('\n✅ ChessMentor פועל!');
                console.log('🌐 Frontend: http://localhost:3000');
                console.log('🔧 Backend: http://localhost:5000');
                
            }, 8000);
        }, 3000);
        
    } catch (error) {
        console.log('❌ שגיאה:', error.message);
    }
};

main();