# backend-python/fix_openai.py
"""
סקריפט לתיקון בעיות OpenAI והתקנת הגרסה הנכונה
"""

import subprocess
import sys
import importlib.util

def check_openai_version():
    """בדיקת גרסת OpenAI הנוכחית"""
    try:
        import openai
        version = getattr(openai, '__version__', 'unknown')
        print(f"📦 Current OpenAI version: {version}")
        return version
    except ImportError:
        print("❌ OpenAI not installed")
        return None

def test_openai_import():
    """בדיקת import של OpenAI"""
    try:
        from openai import OpenAI
        print("✅ New OpenAI client import works")
        return 'new'
    except ImportError:
        try:
            import openai
            # בדיקה אם זו גרסה ישנה
            if hasattr(openai, 'ChatCompletion'):
                print("✅ Legacy OpenAI import works")
                return 'legacy'
            else:
                print("❌ Unknown OpenAI version")
                return 'unknown'
        except ImportError:
            print("❌ OpenAI not installed")
            return None

def install_compatible_openai():
    """התקנת גרסה תואמת של OpenAI"""
    print("🔄 Installing compatible OpenAI version...")
    
    try:
        # נסה גרסה חדשה
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', 
            'openai>=1.0.0,<2.0.0', '--upgrade'
        ])
        print("✅ Installed modern OpenAI version")
        return True
    except subprocess.CalledProcessError:
        try:
            # אם לא הצליח, נסה גרסה ישנה יציבה
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 
                'openai==0.28.1', '--force-reinstall'
            ])
            print("✅ Installed legacy OpenAI version")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install OpenAI: {e}")
            return False

def test_openai_functionality():
    """בדיקת פונקציונליות OpenAI"""
    print("🧪 Testing OpenAI functionality...")
    
    try:
        # נסה גרסה חדשה
        from openai import OpenAI
        print("  ✅ New client import successful")
        
        # נסה ליצור client (ללא API key אמיתי)
        try:
            client = OpenAI(api_key="test-key")
            print("  ✅ Client creation successful")
        except Exception as e:
            if "proxies" in str(e):
                print(f"  ❌ Client creation failed (proxies issue): {e}")
                return False
            else:
                print("  ✅ Client creation works (auth error expected)")
        
        return True
        
    except ImportError:
        # נסה גרסה ישנה
        try:
            import openai
            if hasattr(openai, 'ChatCompletion'):
                print("  ✅ Legacy OpenAI works")
                return True
            else:
                print("  ❌ OpenAI version incompatible")
                return False
        except ImportError:
            print("  ❌ OpenAI not available")
            return False

def main():
    print("🔧 OpenAI Compatibility Checker & Fixer")
    print("=" * 40)
    
    # בדיקת גרסה נוכחית
    current_version = check_openai_version()
    print()
    
    # בדיקת import
    import_status = test_openai_import()
    print()
    
    # בדיקת פונקציונליות
    functionality_ok = test_openai_functionality()
    print()
    
    if functionality_ok:
        print("🎉 OpenAI is working correctly!")
        print("   Your ChessMentor server should work fine.")
    else:
        print("⚠️ OpenAI has issues. Attempting to fix...")
        print()
        
        if install_compatible_openai():
            print("🔄 Testing after reinstall...")
            if test_openai_functionality():
                print("🎉 OpenAI fixed successfully!")
            else:
                print("❌ Still having issues. Manual intervention needed.")
                print()
                print("💡 Try these manual steps:")
                print("   1. pip uninstall openai")
                print("   2. pip install openai==0.28.1")
                print("   3. Restart your terminal")
                print("   4. Run this script again")
        else:
            print("❌ Failed to fix OpenAI automatically")
    
    print()
    print("=" * 40)
    
    # סיכום
    if functionality_ok or test_openai_functionality():
        print("✅ Status: READY - You can start the ChessMentor server")
        return True
    else:
        print("❌ Status: NOT READY - Fix OpenAI issues first")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)