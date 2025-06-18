# backend-python/debug_frontend.py
"""
סקריפט לבדיקת התקשורת בין הפרונט לבקנד
"""

import requests
import json
import sys

def test_cors():
    """בדיקת CORS"""
    print("🔍 Testing CORS...")
    try:
        response = requests.options("http://localhost:5001/auth/openai")
        print(f"  Status: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        return response.status_code == 200
    except Exception as e:
        print(f"  ❌ CORS test failed: {e}")
        return False

def test_openai_auth(api_key):
    """בדיקת OpenAI authentication עם API key אמיתי"""
    print(f"🔑 Testing OpenAI auth with key: {api_key[:20]}...")
    
    try:
        url = "http://localhost:5001/auth/openai"
        headers = {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
        payload = {"apiKey": api_key}
        
        print(f"  📤 Sending request to: {url}")
        print(f"  📤 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"  📥 Status: {response.status_code}")
        print(f"  📥 Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"  📥 Response: {json.dumps(response_data, indent=2)}")
            
            # בדיקה שהתגובה תואמת למה שהפרונט מצפה
            if response.status_code == 200:
                if response_data.get('success') and response_data.get('sessionId'):
                    print("  ✅ Response format is correct for frontend")
                    return response_data.get('sessionId')
                else:
                    print("  ❌ Response format incorrect - missing success/sessionId")
                    return None
            else:
                print(f"  ❌ Auth failed: {response_data.get('detail', 'Unknown error')}")
                return None
                
        except json.JSONDecodeError:
            print(f"  ❌ Invalid JSON response: {response.text}")
            return None
            
    except Exception as e:
        print(f"  ❌ Request failed: {e}")
        return None

def test_coach_endpoint(session_id):
    """בדיקת coach endpoint"""
    if not session_id:
        print("⚠️ Skipping coach test - no session ID")
        return False
        
    print(f"💬 Testing coach endpoint with session: {session_id}")
    
    try:
        url = "http://localhost:5001/chess/coach"
        headers = {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
        payload = {
            "sessionId": session_id,
            "message": "What's the best opening move?",
            "gameState": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            "analysisType": "general"
        }
        
        print(f"  📤 Sending request to: {url}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        print(f"  📥 Status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            coach_response = response_data.get('response', '')
            print(f"  ✅ Coach responded: {coach_response[:100]}...")
            return True
        else:
            print(f"  ❌ Coach failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Coach test failed: {e}")
        return False

def test_auth_status():
    """בדיקת auth status endpoint"""
    print("📊 Testing auth status...")
    try:
        response = requests.get("http://localhost:5001/auth/status")
        if response.status_code == 200:
            data = response.json()
            print(f"  📥 Active sessions: {data.get('active_sessions', 0)}")
            print(f"  📥 Session IDs: {data.get('session_ids', [])}")
            return True
        else:
            print(f"  ❌ Status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Status check error: {e}")
        return False

def main():
    print("🐛 ChessMentor Frontend-Backend Debug Tool")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage: python debug_frontend.py <your-openai-api-key>")
        print("Example: python debug_frontend.py sk-proj-abc123...")
        return
    
    api_key = sys.argv[1]
    
    # Test 1: CORS
    print("\n1️⃣ CORS Test")
    cors_ok = test_cors()
    
    # Test 2: Auth Status
    print("\n2️⃣ Auth Status Test")
    status_ok = test_auth_status()
    
    # Test 3: OpenAI Auth
    print("\n3️⃣ OpenAI Authentication Test")
    session_id = test_openai_auth(api_key)
    
    # Test 4: Coach (if auth worked)
    print("\n4️⃣ Coach Endpoint Test")
    coach_ok = test_coach_endpoint(session_id)
    
    # Test 5: Auth Status After
    print("\n5️⃣ Auth Status After Test")
    status_after_ok = test_auth_status()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print(f"  CORS: {'✅' if cors_ok else '❌'}")
    print(f"  Auth Status: {'✅' if status_ok else '❌'}")
    print(f"  OpenAI Auth: {'✅' if session_id else '❌'}")
    print(f"  Coach: {'✅' if coach_ok else '❌'}")
    print(f"  Status After: {'✅' if status_after_ok else '❌'}")
    
    if session_id and coach_ok:
        print("\n🎉 All tests passed! Your frontend should work.")
        print(f"   Session ID: {session_id}")
        print("\n💡 If frontend still doesn't update:")
        print("   1. Check browser console for errors")
        print("   2. Clear browser cache")
        print("   3. Check Redux state in browser DevTools")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
    
    return bool(session_id and coach_ok)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)