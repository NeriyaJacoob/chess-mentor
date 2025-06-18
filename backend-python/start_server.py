# backend-python/start_server.py
"""
Simple startup script for ChessMentor server
בדיקה ראשונית של השרת בלי dependencies מסובכים
"""

import os
import sys
import subprocess
import platform

def check_python_version():
    """בדיקת גרסת Python"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher required")
        print(f"   Current version: {version.major}.{version.minor}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """בדיקת חבילות נדרשות"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'chess',
        'openai'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Missing packages: {', '.join(missing_packages)}")
        print("   Install with: pip install fastapi uvicorn python-chess openai")
        return False
    
    return True

def find_stockfish():
    """חיפוש Stockfish"""
    import shutil
    
    # נסה למצוא ב-PATH
    stockfish_cmd = shutil.which('stockfish')
    if stockfish_cmd:
        print(f"✅ Stockfish found: {stockfish_cmd}")
        return stockfish_cmd
    
    # נתיבים נפוצים
    system = platform.system()
    
    if system == "Windows":
        possible_paths = [
            r"C:\stockfish\stockfish.exe",
            r"C:\Program Files\stockfish\stockfish.exe",
            r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe"
        ]
    elif system == "Darwin":  # macOS
        possible_paths = [
            "/usr/local/bin/stockfish",
            "/opt/homebrew/bin/stockfish"
        ]
    else:  # Linux
        possible_paths = [
            "/usr/bin/stockfish",
            "/usr/local/bin/stockfish"
        ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ Stockfish found: {path}")
            return path
    
    print("⚠️ Stockfish not found - AI will use random moves")
    print("   Download from: https://stockfishchess.org/download/")
    return None

def create_env_file(stockfish_path=None):
    """יצירת קובץ .env"""
    env_content = f"""# ChessMentor Environment Variables
STOCKFISH_PATH={stockfish_path if stockfish_path else ""}
API_HOST=localhost
API_PORT=5001
FRONTEND_URL=http://localhost:3000
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file created")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def test_server_imports():
    """בדיקת import של השרת"""
    try:
        # נסה לייבא את המודולים שלנו
        from main_server import ChessMentorServer
        print("✅ Server imports successful")
        return True
    except ImportError as e:
        print(f"❌ Server import failed: {e}")
        return False

def start_server():
    """הפעלת השרת"""
    print("\n🚀 Starting ChessMentor Server...")
    
    try:
        # נסה לייבא ולהפעיל
        from main_server import ChessMentorServer
        
        # מצא Stockfish
        stockfish_path = find_stockfish()
        
        # צור שרת
        server = ChessMentorServer(stockfish_path)
        
        print("\n" + "="*60)
        print("🎮 ChessMentor Server Ready!")
        print("="*60)
        print("📍 API: http://localhost:5001")
        print("🔗 WebSocket: ws://localhost:5001/ws")
        print("🏥 Health Check: http://localhost:5001/health")
        print("🤖 OpenAI Auth: http://localhost:5001/auth/openai")
        print("📊 Active Games: http://localhost:5001/api/games")
        print("\n⌨️ Press Ctrl+C to stop the server")
        print("="*60)
        
        # הפעל שרת
        server.run(host="localhost", port=5001)
        
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server startup failed: {e}")
        print("   Check the error messages above")

def run_diagnostics():
    """בדיקה מלאה של המערכת"""
    print("🔍 ChessMentor Server Diagnostics")
    print("="*40)
    
    all_good = True
    
    # בדיקת Python
    if not check_python_version():
        all_good = False
    
    print()
    
    # בדיקת dependencies
    if not check_dependencies():
        all_good = False
    
    print()
    
    # בדיקת Stockfish
    stockfish_path = find_stockfish()
    
    print()
    
    # בדיקת imports
    if not test_server_imports():
        all_good = False
    
    print()
    
    # יצירת .env
    create_env_file(stockfish_path)
    
    print("\n" + "="*40)
    
    if all_good:
        print("✅ All systems ready!")
        print("   Run: python start_server.py")
    else:
        print("❌ Some issues found")
        print("   Fix the issues above and try again")
    
    return all_good

def install_dependencies():
    """התקנת dependencies"""
    print("📦 Installing required packages...")
    
    packages = [
        'fastapi==0.104.1',
        'uvicorn[standard]==0.24.0',
        'python-chess==1.999',
        'openai==1.3.5',
        'python-dotenv==1.0.0',
        'websockets==12.0'
    ]
    
    for package in packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ {package}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    print("✅ All packages installed!")
    return True

def main():
    """main function"""
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'install':
            install_dependencies()
        elif command == 'check':
            run_diagnostics()
        elif command == 'start':
            start_server()
        elif command == 'help':
            print_help()
        else:
            print(f"Unknown command: {command}")
            print_help()
    else:
        # ברירת מחדל - הפעל diagnostics ואז שרת
        print("🎮 ChessMentor Server Startup")
        print("="*30)
        
        if run_diagnostics():
            print("\n" + "="*30)
            response = input("Start server now? (y/n): ").lower().strip()
            if response in ['y', 'yes', '']:
                start_server()
        else:
            print("\n💡 Try: python start_server.py install")

def print_help():
    """הדפסת עזרה"""
    print("""
🎮 ChessMentor Server Startup Script

Usage:
    python start_server.py [command]

Commands:
    install     Install required Python packages
    check       Run system diagnostics
    start       Start the server directly
    help        Show this help message
    
    (no command)    Run diagnostics and optionally start server

Examples:
    python start_server.py install
    python start_server.py check
    python start_server.py start
    python start_server.py
""")

if __name__ == "__main__":
    main()