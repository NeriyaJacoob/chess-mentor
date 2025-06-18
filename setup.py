#!/usr/bin/env python3
"""
ChessMentor Quick Setup Script
התקנה אוטומטית של כל התלויות והגדרות
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

class ChessMentorSetup:
    def __init__(self):
        self.system = platform.system()
        self.project_root = Path.cwd()
        self.errors = []
        
    def print_header(self):
        print("🚀 ChessMentor v2.0 Setup")
        print("=" * 40)
        print(f"System: {self.system}")
        print(f"Python: {sys.version}")
        print(f"Project: {self.project_root}")
        print("")
        
    def check_python(self):
        """בדיקת גרסת Python"""
        print("🐍 Checking Python version...")
        
        if sys.version_info < (3, 8):
            self.errors.append("Python 3.8+ required")
            return False
            
        print(f"✅ Python {sys.version}")
        return True
        
    def check_node(self):
        """בדיקת Node.js"""
        print("🟢 Checking Node.js...")
        
        try:
            result = subprocess.run(['node', '--version'], 
                                 capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Node.js {result.stdout.strip()}")
                return True
        except FileNotFoundError:
            pass
            
        self.errors.append("Node.js not found")
        return False
        
    def install_python_deps(self):
        """התקנת תלויות Python"""
        print("📦 Installing Python dependencies...")
        
        requirements_file = self.project_root / "backend-python" / "requirements.txt"
        if not requirements_file.exists():
            self.errors.append("requirements.txt not found")
            return False
            
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ], check=True)
            print("✅ Python dependencies installed")
            return True
        except subprocess.CalledProcessError:
            self.errors.append("Failed to install Python dependencies")
            return False
            
    def install_frontend_deps(self):
        """התקנת תלויות Frontend"""
        print("⚛️ Installing Frontend dependencies...")
        
        frontend_dir = self.project_root / "frontend-react"
        if not frontend_dir.exists():
            self.errors.append("frontend-react directory not found")
            return False
            
        try:
            subprocess.run(['npm', 'install'], 
                         cwd=frontend_dir, check=True)
            print("✅ Frontend dependencies installed")
            return True
        except subprocess.CalledProcessError:
            self.errors.append("Failed to install Frontend dependencies")
            return False
            
    def check_stockfish(self):
        """בדיקת התקנת Stockfish"""
        print("♞ Checking Stockfish...")
        
        # נסה למצוא Stockfish
        stockfish_path = shutil.which('stockfish')
        if stockfish_path:
            print(f"✅ Stockfish found: {stockfish_path}")
            return True
            
        # בדוק נתיבים נפוצים
        possible_paths = []
        if self.system == "Windows":
            possible_paths = [
                r"C:\stockfish\stockfish.exe",
                r"C:\Program Files\stockfish\stockfish.exe"
            ]
        elif self.system == "Darwin":
            possible_paths = [
                "/usr/local/bin/stockfish",
                "/opt/homebrew/bin/stockfish"
            ]
        else:
            possible_paths = [
                "/usr/bin/stockfish",
                "/usr/local/bin/stockfish"
            ]
            
        for path in possible_paths:
            if Path(path).exists():
                print(f"✅ Stockfish found: {path}")
                return True
                
        print("⚠️ Stockfish not found!")
        print("Please install Stockfish:")
        if self.system == "Windows":
            print("  Download from: https://stockfishchess.org/download/")
        elif self.system == "Darwin":
            print("  Run: brew install stockfish")
        else:
            print("  Run: sudo apt install stockfish")
            
        return False
        
    def create_env_files(self):
        """יצירת קבצי .env"""
        print("⚙️ Creating environment files...")
        
        # Backend .env
        backend_env = self.project_root / "backend-python" / ".env"
        if not backend_env.exists():
            with open(backend_env, 'w') as f:
                f.write("""# ChessMentor Python Server Configuration
HOST=localhost
PORT=5001
DEBUG=True

# Stockfish will be auto-detected
# STOCKFISH_PATH=/path/to/stockfish

# Default settings
DEFAULT_AI_ELO=1500
SESSION_TIMEOUT=3600
ALLOWED_ORIGINS=http://localhost:3000
""")
            print("✅ Created backend-python/.env")
            
        # Frontend .env
        frontend_env = self.project_root / "frontend-react" / ".env"
        if not frontend_env.exists():
            with open(frontend_env, 'w') as f:
                f.write("""# Frontend Configuration
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WS_URL=ws://localhost:5001/ws

GENERATE_SOURCEMAP=false
BROWSER=none
SKIP_PREFLIGHT_CHECK=true
""")
            print("✅ Created frontend-react/.env")
            
    def run_setup(self):
        """הרצת ההתקנה המלאה"""
        self.print_header()
        
        # בדיקות בסיסיות
        if not self.check_python():
            self.print_errors()
            return False
            
        if not self.check_node():
            self.print_errors()
            return False
            
        # התקנת תלויות
        if not self.install_python_deps():
            self.print_errors()
            return False
            
        if not self.install_frontend_deps():
            self.print_errors()
            return False
            
        # הגדרות נוספות
        self.check_stockfish()
        self.create_env_files()
        
        # סיום
        print("\n🎉 Setup completed successfully!")
        print("\nTo start ChessMentor:")
        print("  node start.js")
        print("\nOr run services separately:")
        print("  cd backend-python && python main_server.py")
        print("  cd frontend-react && npm start")
        
        return True
        
    def print_errors(self):
        """הדפסת שגיאות"""
        if self.errors:
            print("\n❌ Setup failed with errors:")
            for error in self.errors:
                print(f"  • {error}")
            print("\nPlease fix these issues and run setup again.")

if __name__ == "__main__":
    setup = ChessMentorSetup()
    success = setup.run_setup()
    sys.exit(0 if success else 1)