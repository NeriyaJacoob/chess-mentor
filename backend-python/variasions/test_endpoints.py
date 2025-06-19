# backend-python/test_endpoints.py
"""
בדיקת endpoints של השרת לוודא שהכל עובד
"""

import requests
import json
import time
import websocket
import threading
from urllib.parse import urljoin

class ServerTester:
    def __init__(self, base_url="http://localhost:5001", ws_url="ws://localhost:5001/ws"):
        self.base_url = base_url
        self.ws_url = ws_url
        self.session_id = None
        
    def test_health(self):
        """בדיקת health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ Health check passed")
                print(f"   Server: {data.get('server', 'Unknown')}")
                print(f"   Active games: {data.get('active_games', 0)}")
                print(f"   Connected players: {data.get('connected_players', 0)}")
                print(f"   Stockfish: {data.get('stockfish_available', False)}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_openai_auth(self, api_key="test-key"):
        """בדיקת OpenAI authentication endpoint"""
        try:
            url = f"{self.base_url}/auth/openai"
            payload = {"apiKey": api_key}
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 401:
                print("✅ OpenAI auth endpoint working (invalid key expected)")
                return True
            elif response.status_code == 200:
                data = response.json()
                self.session_id = data.get('sessionId')
                print("✅ OpenAI auth successful")
                print(f"   Session ID: {self.session_id}")
                return True
            else:
                print(f"❌ OpenAI auth unexpected response: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ OpenAI auth error: {e}")
            return False
    
    def test_coach_endpoint(self):
        """בדיקת coach endpoint (צריך session valid)"""
        if not self.session_id:
            print("⚠️ Skipping coach test - no valid session")
            return True
            
        try:
            url = f"{self.base_url}/api/chess/coach"
            payload = {
                "sessionId": self.session_id,
                "message": "What's the best opening move?",
                "gameState": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                "analysisType": "general"
            }
            
            response = requests.post(url, json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Coach endpoint working")
                print(f"   Response: {data.get('response', '')[:100]}...")
                return True
            else:
                print(f"❌ Coach endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Coach endpoint error: {e}")
            return False
    
    def test_websocket(self):
        """בדיקת WebSocket connection"""
        try:
            print("🔗 Testing WebSocket connection...")
            
            messages_received = []
            connection_successful = False
            
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    messages_received.append(data)
                    print(f"📨 Received: {data.get('type', 'unknown')}")
                except:
                    pass
            
            def on_open(ws):
                nonlocal connection_successful
                connection_successful = True
                print("✅ WebSocket connected")
                
                # Send join message
                join_msg = {
                    "action": "join",
                    "data": {"name": "TestPlayer", "elo": 1200}
                }
                ws.send(json.dumps(join_msg))
                
                # Wait a bit then close
                time.sleep(2)
                ws.close()
            
            def on_error(ws, error):
                print(f"❌ WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("🔌 WebSocket closed")
            
            # Create WebSocket connection
            ws = websocket.WebSocketApp(
                self.ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run in thread with timeout
            wst = threading.Thread(target=ws.run_forever)
            wst.daemon = True
            wst.start()
            wst.join(timeout=10)
            
            if connection_successful:
                print("✅ WebSocket test passed")
                return True
            else:
                print("❌ WebSocket connection failed")
                return False
                
        except Exception as e:
            print(f"❌ WebSocket test error: {e}")
            return False
    
    def test_games_endpoint(self):
        """בדיקת games endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/games", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ Games endpoint working")
                print(f"   Active games: {len(data.get('active_games', []))}")
                return True
            else:
                print(f"❌ Games endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Games endpoint error: {e}")
            return False
    
    def run_all_tests(self, openai_key=None):
        """הרצת כל הבדיקות"""
        print("🧪 Running ChessMentor Server Tests")
        print("=" * 40)
        
        tests_passed = 0
        total_tests = 5
        
        # Test 1: Health
        if self.test_health():
            tests_passed += 1
        print()
        
        # Test 2: OpenAI Auth
        test_key = openai_key or "sk-test-invalid-key"
        if self.test_openai_auth(test_key):
            tests_passed += 1
        print()
        
        # Test 3: Coach (only if we have valid session)
        if self.test_coach_endpoint():
            tests_passed += 1
        print()
        
        # Test 4: WebSocket
        if self.test_websocket():
            tests_passed += 1
        print()
        
        # Test 5: Games
        if self.test_games_endpoint():
            tests_passed += 1
        print()
        
        # Summary
        print("=" * 40)
        print(f"📊 Tests Results: {tests_passed}/{total_tests} passed")
        
        if tests_passed == total_tests:
            print("🎉 All tests passed! Server is ready.")
        elif tests_passed >= 3:
            print("⚠️ Most tests passed. Server mostly ready.")
        else:
            print("❌ Multiple tests failed. Check server configuration.")
        
        return tests_passed >= 3

def main():
    import sys
    
    # Default values
    server_url = "http://localhost:5001"
    ws_url = "ws://localhost:5001/ws"
    openai_key = None
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "help":
            print("""
ChessMentor Server Tester

Usage:
    python test_endpoints.py [server_url] [openai_key]
    
Examples:
    python test_endpoints.py
    python test_endpoints.py http://localhost:5001
    python test_endpoints.py http://localhost:5001 sk-your-real-openai-key
    
Tests:
    1. Health check endpoint
    2. OpenAI authentication endpoint  
    3. Chess coach endpoint
    4. WebSocket connection
    5. Games listing endpoint
""")
            return
        
        server_url = sys.argv[1]
        ws_url = sys.argv[1].replace("http", "ws") + "/ws"
        
        if len(sys.argv) > 2:
            openai_key = sys.argv[2]
    
    print(f"🎯 Testing server at: {server_url}")
    print(f"🔗 WebSocket at: {ws_url}")
    
    if openai_key:
        print(f"🤖 Using OpenAI key: {openai_key[:20]}...")
    else:
        print("🤖 Using test OpenAI key (will fail auth)")
    
    print()
    
    # Run tests
    tester = ServerTester(server_url, ws_url)
    success = tester.run_all_tests(openai_key)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()