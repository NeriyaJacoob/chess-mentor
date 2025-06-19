# backend-python/main_server_fixed.py
"""
ChessMentor Python Server - גרסה מתוקנת
"""

import asyncio
import json
import uuid
import time
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

# FastAPI & WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# OpenAI
try:
    from openai import OpenAI
except ImportError:
    print("❌ OpenAI not installed. Run: pip install openai")
    OpenAI = None

# MongoDB (אופציונלי)
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    import bcrypt
    MONGODB_AVAILABLE = True
except ImportError:
    print("⚠️ MongoDB dependencies not installed. Running without database.")
    MONGODB_AVAILABLE = False

# Environment variables
from dotenv import load_dotenv
load_dotenv()

# Internal imports
try:
    from ChessGame import ChessGame
    from ChessCoach import ChessCoach
except ImportError as e:
    print(f"❌ Chess modules not found: {e}")

@dataclass
class Player:
    id: str
    websocket: WebSocket
    name: str
    elo: int = 1200
    is_in_game: bool = False
    game_id: Optional[str] = None
    session_id: Optional[str] = None

class ChessMentorServer:
    def __init__(self, stockfish_path: str = None):
        self.app = FastAPI(title="ChessMentor Server", version="2.1.0")
        self.stockfish_path = stockfish_path or self._detect_stockfish_path()
        
        # אחסון נתונים
        self.games: Dict[str, Any] = {}
        self.players: Dict[str, Player] = {}
        self.active_sessions: Dict[str, Dict] = {}
        
        # הגדרת האפליקציה
        self.setup_app()
        
    def _detect_stockfish_path(self) -> str:
        """זיהוי אוטומטי של נתיב Stockfish"""
        import platform
        import shutil
        
        system = platform.system()
        
        # נסה למצוא Stockfish ב-PATH
        stockfish_cmd = shutil.which('stockfish')
        if stockfish_cmd:
            return stockfish_cmd
            
        # נתיבים נפוצים
        if system == "Windows":
            possible_paths = [
                r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe",
                r"C:\stockfish\stockfish.exe",
                r"C:\Program Files\stockfish\stockfish.exe"
            ]
        elif system == "Darwin":
            possible_paths = ["/usr/local/bin/stockfish", "/opt/homebrew/bin/stockfish"]
        else:
            possible_paths = ["/usr/bin/stockfish", "/usr/local/bin/stockfish"]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
                
        print("⚠️ Stockfish not found!")
        return None

    def setup_app(self):
        """הגדרת FastAPI"""
        
        # CORS - תיקון
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Health check
        @self.app.get("/health")
        async def health_check():
            return {
                "status": "OK",
                "server": "ChessMentor Fixed Server",
                "stockfish_available": bool(self.stockfish_path),
                "openai_available": OpenAI is not None,
                "active_sessions": len(self.active_sessions),
                "timestamp": datetime.now().isoformat()
            }

        # נתיבי OpenAI - תיקון הנתיבים
        @self.app.post("/auth/openai")
        @self.app.post("/auth/openai")  # הוסף גם את הנתיב הקצר
        async def authenticate_openai(request_data: dict):
            """אימות מפתח OpenAI - תיקון"""
            try:
                api_key = request_data.get('apiKey')
                if not api_key:
                    raise HTTPException(status_code=400, detail="API key is required")

                if not OpenAI:
                    raise HTTPException(status_code=500, detail="OpenAI not available")

                # בדיקת תקינות המפתח
                client = OpenAI(api_key=api_key)
                
                try:
                    # בדיקה פשוטה
                    models = client.models.list()
                    print(f"✅ OpenAI API key validated, found {len(list(models.data))} models")
                    
                    # יצירת session ID
                    session_id = str(uuid.uuid4())
                    
                    # שמירת המפתח
                    self.active_sessions[session_id] = {
                        'api_key': api_key,
                        'timestamp': time.time(),
                        'client': client
                    }
                    
                    return JSONResponse({
                        'success': True,
                        'sessionId': session_id,
                        'message': 'API key validated successfully',
                        'available_models': ['gpt-4o-mini', 'gpt-4o', 'gpt-4']
                    })
                    
                except Exception as e:
                    print(f"❌ OpenAI API validation failed: {e}")
                    raise HTTPException(status_code=401, detail=f"Invalid OpenAI API key: {str(e)}")
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"❌ Error validating API key: {e}")
                raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

        # נתיב המאמן - תיקון
        @self.app.post("/api/chess/coach")
        async def chess_coach_chat(request_data: dict):
            """צ'אט עם המאמן AI - גרסה מתוקנת"""
            try:
                session_id = request_data.get('sessionId')
                message = request_data.get('message')
                game_state = request_data.get('gameState', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
                analysis_type = request_data.get('analysisType', 'general')
                
                print(f"🤖 Coach request: {message[:50]}...")
                
                if not session_id or session_id not in self.active_sessions:
                    raise HTTPException(status_code=401, detail="Invalid or expired session")
                
                session = self.active_sessions[session_id]
                
                if 'client' not in session:
                    raise HTTPException(status_code=400, detail="OpenAI not configured")
                    
                client = session['client']
                
                # Prompt בעברית מתוקן
                system_prompt = f"""
אתה מאמן שחמט מקצועי ומנוסה. 
תמיד תגיב בעברית בצורה ברורה, ידידותית ומועילה.
תן טיפים מעשיים ופשוטים.
השתמש בסימון שחמט באנגלית (e4, Nf3, וכו').

סוג הניתוח: {analysis_type}
"""
                
                if analysis_type == 'position':
                    system_prompt += "\nנתח את המצב בלוח ותן המלצות אסטרטגיות קצרות ופרקטיות."
                elif analysis_type == 'move':
                    system_prompt += "\nהסבר את המהלך - טוב או רע, ולמה."
                else:
                    system_prompt += "\nענה על שאלות כלליות על שחמט."
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"מצב הלוח: {game_state}\nשאלה: {message}"}
                ]
                
                # קריאה ל-OpenAI
                start_time = time.time()
                response = client.chat.completions.create(
                    model="gpt-4o-mini",  # זול ומהיר
                    messages=messages,
                    max_tokens=400,
                    temperature=0.7
                )
                
                processing_time = time.time() - start_time
                print(f"✅ Coach responded in {processing_time:.2f}s")
                
                return JSONResponse({
                    'success': True,
                    'response': response.choices[0].message.content,
                    'timestamp': datetime.now().isoformat(),
                    'processing_time': f"{processing_time:.2f}s",
                    'model': "gpt-4o-mini"
                })
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"❌ Coach error: {e}")
                return JSONResponse({
                    'success': False,
                    'error': 'המאמן זמנית לא זמין',
                    'details': str(e)
                }, status_code=500)

        # WebSocket
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            player_id = str(uuid.uuid4())
            print(f"🔗 Player connected: {player_id}")
            
            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    print(f"📨 Received {message.get('action', 'unknown')} from {player_id}")
                    
                    if message.get('action') == 'join':
                        player = Player(
                            id=player_id,
                            websocket=websocket,
                            name=message.get('data', {}).get('name', 'Player'),
                            elo=message.get('data', {}).get('elo', 1200)
                        )
                        self.players[player_id] = player
                        
                        await websocket.send_text(json.dumps({
                            'type': 'connected',
                            'data': {'message': 'Connected to server'}
                        }))
                        
            except WebSocketDisconnect:
                if player_id in self.players:
                    print(f"🔌 Player disconnected: {self.players[player_id].name}")
                    del self.players[player_id]

    def run(self, host: str = "localhost", port: int = 5001):
        """הפעלת השרת"""
        print("🚀 ChessMentor Fixed Server starting...")
        print(f"🌐 Server: http://{host}:{port}")
        print(f"🏥 Health: http://{host}:{port}/health")
        print(f"🤖 OpenAI: http://{host}:{port}/auth/openai")
        print(f"♟️ Stockfish: {self.stockfish_path or 'Not found'}")
        print("")
        
        uvicorn.run(self.app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    STOCKFISH_PATH = r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe"
    
    server = ChessMentorServer(STOCKFISH_PATH)
    server.run()