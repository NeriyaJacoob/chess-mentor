# backend-python/main_server.py
"""
ChessMentor Python Server מלא
משלב WebSocket, OpenAI, Stockfish בשרת אחד
"""

import asyncio
import json
import uuid
import time
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

# FastAPI & WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# OpenAI
import openai
from openai import OpenAI

# Chess
import chess
import chess.engine
import chess.pgn

# Environment variables
from dotenv import load_dotenv
load_dotenv()

# Internal imports
from ChessGame import ChessGame
from ChessCoach import ChessCoach

@dataclass
class Player:
    id: str
    websocket: WebSocket
    name: str
    elo: int = 1200
    is_in_game: bool = False
    game_id: Optional[str] = None
    openai_key: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None  # MongoDB user ID
    is_guest: bool = True

@dataclass 
class UserProfile:
    user_id: str
    username: str
    email: Optional[str]
    elo_rating: int = 1200
    games_played: int = 0
    games_won: int = 0
    created_at: datetime
    last_active: datetime
    preferences: Dict = None
    
    def __post_init__(self):
        if self.preferences is None:
            self.preferences = {
                'theme': 'light',
                'board_theme': 'classic',
                'piece_style': 'classic',
                'sound_enabled': True
            }

@dataclass
class GameSession:
    id: str
    type: str  # 'ai' or 'multiplayer'
    white_player: Player
    black_player: Optional[Player]
    chess_game: ChessGame
    chess_coach: Optional[ChessCoach]
    start_time: float
    status: str = 'active'  # 'active', 'finished'
    chat_history: List[Dict] = None

    def __post_init__(self):
        if self.chat_history is None:
            self.chat_history = []

class ChessMentorServer:
    """שרת מאסטר שמטפל בהכל - משחקים, OpenAI, ניתוח, MongoDB"""
    
    def __init__(self, stockfish_path: str = None, mongo_uri: str = None):
        self.app = FastAPI(title="ChessMentor Complete Server", version="2.0.0")
        
        # הגדרת נתיב Stockfish
        self.stockfish_path = stockfish_path or os.getenv('STOCKFISH_PATH') or self._detect_stockfish_path()
        
        # MongoDB connection
        self.mongo_uri = mongo_uri or os.getenv('MONGO_URI')
        self.db_client = None
        self.db = None
        
        # אחסון נתונים
        self.games: Dict[str, GameSession] = {}
        self.players: Dict[str, Player] = {}
        self.waiting_queue: List[Player] = []
        self.active_sessions: Dict[str, Dict] = {}  # לניהול מפתחות OpenAI
        
        # הגדרת האפליקציה
        self.setup_app()
        
    async def connect_to_mongodb(self):
        """חיבור ל-MongoDB"""
        if not self.mongo_uri:
            print("⚠️ MongoDB URI not provided. Running without database.")
            return False
            
        try:
            self.db_client = AsyncIOMotorClient(self.mongo_uri)
            self.db = self.db_client.chessmentor
            
            # בדיקת חיבור
            await self.db_client.admin.command('ping')
            print("✅ Connected to MongoDB successfully")
            
            # יצירת אינדקסים
            await self.create_indexes()
            return True
            
        except ConnectionFailure as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
            
    async def create_indexes(self):
        """יצירת אינדקסים למסד הנתונים"""
        if not self.db:
            return
            
        # אינדקס למשתמשים
        await self.db.users.create_index("username", unique=True)
        await self.db.users.create_index("email", unique=True, sparse=True)
        
        # אינדקס למשחקים
        await self.db.games.create_index("created_at")
        await self.db.games.create_index("players.white_id")
        await self.db.games.create_index("players.black_id")
        
        print("✅ Database indexes created")

    def _detect_stockfish_path(self) -> str:
        """זיהוי אוטומטי של נתיב Stockfish"""
        import platform
        import shutil
        
        system = platform.system()
        
        # נסה למצוא Stockfish ב-PATH
        stockfish_cmd = shutil.which('stockfish')
        if stockfish_cmd:
            return stockfish_cmd
            
        # נתיבים נפוצים לפי מערכת הפעלה
        if system == "Windows":
            possible_paths = [
                r"C:\stockfish\stockfish.exe",
                r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe",
                r"C:\Program Files\stockfish\stockfish.exe"
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
                return path
                
        print("⚠️ Stockfish not found! Please install or specify path")
        return None

    def setup_app(self):
        """הגדרת FastAPI עם כל הנתיבים"""
        
        # CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # בדיקת בריאות
        @self.app.get("/health")
        async def health_check():
            db_status = "connected" if self.db else "disconnected"
            return {
                "status": "OK",
                "server": "ChessMentor Python Complete Server",
                "active_games": len(self.games),
                "connected_players": len(self.players),
                "players_in_queue": len(self.waiting_queue),
                "stockfish_available": bool(self.stockfish_path),
                "stockfish_path": self.stockfish_path,
                "database_status": db_status,
                "timestamp": datetime.now().isoformat()
            }

        # Authentication endpoints
        @self.app.post("/api/auth/register")
        async def register_user(request_data: dict):
            """רישום משתמש חדש"""
            try:
                username = request_data.get('username')
                email = request_data.get('email')
                password = request_data.get('password')
                
                if not all([username, password]):
                    raise HTTPException(status_code=400, detail="Username and password required")
                
                if not self.db:
                    raise HTTPException(status_code=503, detail="Database not available")
                
                # בדיקה אם המשתמש קיים
                existing = await self.db.users.find_one({"username": username})
                if existing:
                    raise HTTPException(status_code=409, detail="Username already exists")
                
                # הצפנת סיסמה
                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                
                # יצירת משתמש חדש
                user_data = {
                    "username": username,
                    "email": email,
                    "password": hashed_password,
                    "elo_rating": 1200,
                    "games_played": 0,
                    "games_won": 0,
                    "created_at": datetime.now(),
                    "last_active": datetime.now(),
                    "preferences": {
                        "theme": "light",
                        "board_theme": "classic", 
                        "piece_style": "classic",
                        "sound_enabled": True
                    }
                }
                
                result = await self.db.users.insert_one(user_data)
                user_id = str(result.inserted_id)
                
                return JSONResponse({
                    "success": True,
                    "user_id": user_id,
                    "username": username,
                    "message": "User registered successfully"
                })
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"Registration error: {e}")
                raise HTTPException(status_code=500, detail="Registration failed")

        @self.app.post("/api/auth/login")
        async def login_user(request_data: dict):
            """התחברות משתמש"""
            try:
                username = request_data.get('username')
                password = request_data.get('password')
                
                if not all([username, password]):
                    raise HTTPException(status_code=400, detail="Username and password required")
                
                if not self.db:
                    raise HTTPException(status_code=503, detail="Database not available")
                
                # חיפוש משתמש
                user = await self.db.users.find_one({"username": username})
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
                
                # בדיקת סיסמה
                if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
                    raise HTTPException(status_code=401, detail="Invalid credentials")
                
                # עדכון זמן פעילות אחרון
                await self.db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_active": datetime.now()}}
                )
                
                # יצירת session
                session_id = str(uuid.uuid4())
                session_data = {
                    "user_id": str(user["_id"]),
                    "username": user["username"],
                    "elo": user.get("elo_rating", 1200),
                    "timestamp": time.time()
                }
                
                self.active_sessions[session_id] = session_data
                
                return JSONResponse({
                    "success": True,
                    "session_id": session_id,
                    "user": {
                        "user_id": str(user["_id"]),
                        "username": user["username"],
                        "elo_rating": user.get("elo_rating", 1200),
                        "games_played": user.get("games_played", 0),
                        "games_won": user.get("games_won", 0),
                        "preferences": user.get("preferences", {})
                    }
                })
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"Login error: {e}")
                raise HTTPException(status_code=500, detail="Login failed")

        @self.app.post("/api/auth/guest")
        async def guest_login(request_data: dict):
            """התחברות כאורח"""
            try:
                name = request_data.get('name', f'Guest_{uuid.uuid4().hex[:8]}')
                
                session_id = str(uuid.uuid4())
                session_data = {
                    "user_id": None,
                    "username": name,
                    "elo": 1200,
                    "is_guest": True,
                    "timestamp": time.time()
                }
                
                self.active_sessions[session_id] = session_data
                
                return JSONResponse({
                    "success": True,
                    "session_id": session_id,
                    "user": {
                        "user_id": None,
                        "username": name,
                        "elo_rating": 1200,
                        "is_guest": True
                    }
                })
                
            except Exception as e:
                print(f"Guest login error: {e}")
                raise HTTPException(status_code=500, detail="Guest login failed")

        # נתיבי OpenAI API
        @self.app.post("/api/auth/openai")
        async def authenticate_openai(request_data: dict):
            """אימות מפתח OpenAI"""
            try:
                api_key = request_data.get('apiKey')
                if not api_key:
                    raise HTTPException(status_code=400, detail="API key is required")

                # בדיקת תקינות המפתח
                client = OpenAI(api_key=api_key)
                
                try:
                    # בדיקה קלה
                    models = await asyncio.to_thread(client.models.list)
                    
                    # יצירת session ID
                    session_id = str(uuid.uuid4())
                    
                    # שמירת המפתח (זמנית)
                    self.active_sessions[session_id] = {
                        'api_key': api_key,
                        'timestamp': time.time(),
                        'client': client
                    }
                    
                    # ניקוי סשנים ישנים
                    await self._cleanup_old_sessions()
                    
                    return JSONResponse({
                        'success': True,
                        'sessionId': session_id,
                        'message': 'API key validated successfully'
                    })
                    
                except Exception as e:
                    raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error validating API key: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.app.post("/api/chess/coach")
        async def chess_coach_chat(request_data: dict):
            """צ'אט עם המאמן AI"""
            try:
                session_id = request_data.get('sessionId')
                message = request_data.get('message')
                game_state = request_data.get('gameState')
                analysis_type = request_data.get('analysisType', 'general')
                
                if not session_id or session_id not in self.active_sessions:
                    raise HTTPException(status_code=401, detail="Invalid or expired session")
                
                session = self.active_sessions[session_id]
                client = session['client']
                
                # בניית prompt לפי סוג הניתוח
                system_prompt = self._build_coach_prompt(analysis_type)
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Game State (FEN): {game_state}\n\nQuestion: {message}"}
                ]
                
                # קריאה ל-OpenAI
                response = await asyncio.to_thread(
                    client.chat.completions.create,
                    model="gpt-4",
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7
                )
                
                return JSONResponse({
                    'success': True,
                    'response': response.choices[0].message.content,
                    'timestamp': datetime.now().isoformat()
                })
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error calling OpenAI: {e}")
                raise HTTPException(status_code=500, detail="Failed to get response from chess coach")

        @self.app.post("/api/auth/logout")
        async def logout(request_data: dict):
            """התנתקות"""
            try:
                session_id = request_data.get('sessionId')
                if session_id and session_id in self.active_sessions:
                    del self.active_sessions[session_id]
                
                return JSONResponse({
                    'success': True,
                    'message': 'Logged out successfully'
                })
            except Exception as e:
                print(f"Error during logout: {e}")
                raise HTTPException(status_code=500, detail="Failed to logout")

        @self.app.get("/api/games")
        async def get_active_games():
            """רשימת משחקים פעילים"""
            return {
                "active_games": [
                    {
                        "id": game.id,
                        "type": game.type,
                        "players": {
                            "white": game.white_player.name,
                            "black": game.black_player.name if game.black_player else "AI"
                        },
                        "status": game.status,
                        "move_count": len(game.chess_game.history)
                    }
                    for game in self.games.values()
                ]
            }

        # WebSocket endpoint
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await self.handle_websocket(websocket)

    def _build_coach_prompt(self, analysis_type: str) -> str:
        """בניית prompt מותאם למאמן לפי סוג הניתוח"""
        base_prompt = """You are ChessMentor, an expert chess coach and teacher. You provide clear, helpful advice to chess players of all levels. Always respond in Hebrew when possible, but chess notation should remain in English."""
        
        if analysis_type == 'position':
            return base_prompt + """ Analyze the current chess position and provide strategic insights. Focus on piece activity, pawn structure, king safety, and tactical opportunities."""
        elif analysis_type == 'move':
            return base_prompt + """ Evaluate the chess move and suggest improvements or alternatives. Explain why moves are good or bad."""
        elif analysis_type == 'game':
            return base_prompt + """ Analyze the entire game, pointing out key moments, mistakes, and learning opportunities."""
        else:
            return base_prompt + """ Answer general chess questions and provide educational content."""

    async def _cleanup_old_sessions(self):
        """ניקוי sessions ישנים (מעל שעה)"""
        current_time = time.time()
        expired_sessions = [
            session_id for session_id, session in self.active_sessions.items()
            if current_time - session['timestamp'] > 3600  # שעה
        ]
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]

    async def handle_websocket(self, websocket: WebSocket):
        """טיפול בחיבורי WebSocket"""
        await websocket.accept()
        player_id = str(uuid.uuid4())
        
        try:
            print(f"🔗 Player connected: {player_id}")
            
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self.handle_websocket_message(websocket, player_id, message)
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await self.send_websocket_error(websocket, "Invalid JSON format")
                except Exception as e:
                    print(f"WebSocket message error: {e}")
                    await self.send_websocket_error(websocket, str(e))
                    
        except WebSocketDisconnect:
            pass
        finally:
            await self.handle_websocket_disconnect(player_id)

    async def handle_websocket_message(self, websocket: WebSocket, player_id: str, message: dict):
        """טיפול בהודעות WebSocket"""
        action = message.get('action')
        data = message.get('data', {})
        
        print(f"📨 Received {action} from {player_id}")
        
        handlers = {
            'join': self.handle_join,
            'find_game': self.handle_find_game,
            'make_move': self.handle_move,
            'get_position': self.handle_get_position,
            'resign': self.handle_resign,
            'analyze_move': self.handle_analyze_move,
            'chat_message': self.handle_chat_message
        }
        
        handler = handlers.get(action)
        if handler:
            await handler(websocket, player_id, data)
        else:
            await self.send_websocket_error(websocket, f"Unknown action: {action}")

    async def handle_join(self, websocket: WebSocket, player_id: str, data: dict):
        """הצטרפות שחקן"""
        player = Player(
            id=player_id,
            websocket=websocket,
            name=data.get('name', f'Player_{player_id[:8]}'),
            elo=data.get('elo', 1200),
            session_id=data.get('sessionId')
        )
        
        self.players[player_id] = player
        
        await self.send_websocket_message(websocket, {
            'type': 'connected',
            'data': {
                'player_id': player_id,
                'name': player.name,
                'elo': player.elo,
                'message': 'Connected to ChessMentor Server'
            }
        })

    async def handle_find_game(self, websocket: WebSocket, player_id: str, data: dict):
        """חיפוש משחק"""
        player = self.players.get(player_id)
        if not player or player.is_in_game:
            return

        mode = data.get('mode', 'ai')
        print(f"🎮 {player.name} looking for {mode} game")

        if mode == 'ai':
            await self.start_ai_game(player)
        else:
            await self.find_multiplayer_game(player)

    async def start_ai_game(self, player: Player):
        """התחלת משחק נגד AI"""
        game_id = str(uuid.uuid4())
        
        # יצירת משחק
        chess_game = ChessGame(self.stockfish_path, elo_level=1500)
        chess_coach = ChessCoach(chess_game.engine) if chess_game.engine else None
        
        if not chess_game.engine:
            await self.send_websocket_error(player.websocket, "Stockfish engine not available")
            return
        
        game_session = GameSession(
            id=game_id,
            type='ai',
            white_player=player,
            black_player=None,
            chess_game=chess_game,
            chess_coach=chess_coach,
            start_time=time.time()
        )
        
        self.games[game_id] = game_session
        player.is_in_game = True
        player.game_id = game_id
        
        print(f"🤖 Started AI game {game_id} for {player.name}")
        
        await self.send_websocket_message(player.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white',
                'opponent': {'name': 'ChessMentor AI', 'elo': 1500},
                'position': chess_game.get_position_info()
            }
        })

    async def find_multiplayer_game(self, player: Player):
        """חיפוש משחק מולטיפלייר"""
        # התאמה פשוטה לפי ELO
        opponent = None
        for waiting_player in self.waiting_queue:
            if abs(waiting_player.elo - player.elo) <= 300:
                opponent = waiting_player
                break
        
        if opponent:
            self.waiting_queue.remove(opponent)
            await self.start_multiplayer_game(player, opponent)
        else:
            self.waiting_queue.append(player)
            await self.send_websocket_message(player.websocket, {
                'type': 'searching',
                'data': {'message': f'Looking for opponent (ELO ~{player.elo})...'}
            })
            
            # timeout אחרי 30 שניות
            await asyncio.sleep(30)
            if player in self.waiting_queue:
                self.waiting_queue.remove(player)
                await self.send_websocket_message(player.websocket, {
                    'type': 'search_timeout',
                    'data': {'message': 'No opponent found. Try AI mode?'}
                })

    async def start_multiplayer_game(self, player1: Player, player2: Player):
        """התחלת משחק בין שני שחקנים"""
        game_id = str(uuid.uuid4())
        
        # צבעים אקראיים
        import random
        is_player1_white = random.choice([True, False])
        
        white_player = player1 if is_player1_white else player2
        black_player = player2 if is_player1_white else player1
        
        chess_game = ChessGame(self.stockfish_path)
        chess_coach = ChessCoach(chess_game.engine) if chess_game.engine else None
        
        game_session = GameSession(
            id=game_id,
            type='multiplayer',
            white_player=white_player,
            black_player=black_player,
            chess_game=chess_game,
            chess_coach=chess_coach,
            start_time=time.time()
        )
        
        self.games[game_id] = game_session
        
        # עדכון שחקנים
        for p in [player1, player2]:
            p.is_in_game = True
            p.game_id = game_id
        
        print(f"👥 Started multiplayer game {game_id}: {white_player.name} vs {black_player.name}")
        
        # הודעה לשני השחקנים
        await self.send_websocket_message(player1.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white' if is_player1_white else 'black',
                'opponent': {'name': player2.name, 'elo': player2.elo},
                'position': chess_game.get_position_info()
            }
        })
        
        await self.send_websocket_message(player2.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'black' if is_player1_white else 'white',
                'opponent': {'name': player1.name, 'elo': player1.elo},
                'position': chess_game.get_position_info()
            }
        })

    async def handle_move(self, websocket: WebSocket, player_id: str, data: dict):
        """טיפול במהלך שחקן"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game or game.status != 'active':
            return
        
        # קביעת צבע השחקן
        player_color = 'white' if game.white_player.id == player_id else 'black'
        current_turn = 'white' if game.chess_game.board.turn else 'black'
        
        if current_turn != player_color:
            await self.send_websocket_error(websocket, "Not your turn")
            return
        
        # ביצוע המהלך
        move_uci = data.get('move')
        if not move_uci:
            await self.send_websocket_error(websocket, "Move required")
            return
        
        success = game.chess_game.player_move(move_uci)
        if not success:
            await self.send_websocket_error(websocket, f"Invalid move: {move_uci}")
            return
        
        print(f"♟️ {player.name} played {move_uci}")
        
        # שידור המהלך לכל השחקנים במשחק
        await self.broadcast_to_game(game.id, {
            'type': 'move_made',
            'data': {
                'move': move_uci,
                'player': player.name,
                'position': game.chess_game.get_position_info()
            }
        })
        
        # בדיקת סיום משחק
        if game.chess_game.is_game_over():
            await self.end_game(game.id)
            return
        
        # תגובת AI במשחקי AI
        if game.type == 'ai' and current_turn == 'white':
            await self.make_ai_move(game.id)

    async def make_ai_move(self, game_id: str):
        """מהלך AI"""
        game = self.games.get(game_id)
        if not game:
            return

        print("🤖 AI thinking...")
        
        # השהיה קטנה לריאליזם
        await asyncio.sleep(0.5)
        
        ai_move = game.chess_game.computer_move(thinking_time=1.0)
        if ai_move:
            print(f"🤖 AI played {ai_move.uci()}")
            
            await self.broadcast_to_game(game_id, {
                'type': 'move_made',
                'data': {
                    'move': ai_move.uci(),
                    'player': 'ChessMentor AI',
                    'position': game.chess_game.get_position_info()
                }
            })
            
            # בדיקת סיום משחק
            if game.chess_game.is_game_over():
                await self.end_game(game_id)

    async def handle_analyze_move(self, websocket: WebSocket, player_id: str, data: dict):
        """ניתוח מהלך"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game or not game.chess_coach:
            await self.send_websocket_error(websocket, "Analysis not available")
            return
        
        move_uci = data.get('move')
        if not move_uci:
            await self.send_websocket_error(websocket, "Move required for analysis")
            return
        
        try:
            move = chess.Move.from_uci(move_uci)
            explanation = game.chess_coach.explain_move(game.chess_game.board, move, player.elo)
            analysis = game.chess_coach.analyze_position(game.chess_game.board)
            
            await self.send_websocket_message(websocket, {
                'type': 'move_analysis',
                'data': {
                    'move': move_uci,
                    'explanation': explanation,
                    'analysis': analysis
                }
            })
        except Exception as e:
            await self.send_websocket_error(websocket, f"Analysis failed: {e}")

    async def handle_chat_message(self, websocket: WebSocket, player_id: str, data: dict):
        """טיפול בהודעות צ'אט"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game or game.type != 'multiplayer':
            return
        
        message = data.get('message', '').strip()
        if not message:
            return
        
        chat_message = {
            'player': player.name,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        game.chat_history.append(chat_message)
        
        await self.broadcast_to_game(game.id, {
            'type': 'chat_message',
            'data': chat_message
        })

    async def handle_get_position(self, websocket: WebSocket, player_id: str, data: dict):
        """קבלת מצב הלוח הנוכחי"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game:
            return
        
        await self.send_websocket_message(websocket, {
            'type': 'position_update',
            'data': {
                'position': game.chess_game.get_position_info()
            }
        })

    async def handle_resign(self, websocket: WebSocket, player_id: str, data: dict):
        """כניעה"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game:
            return
        
        # קביעת המנצח
        player_color = 'white' if game.white_player.id == player_id else 'black'
        winner = 'black' if player_color == 'white' else 'white'
        
        await self.end_game(game.id, f"{winner.title()} wins by resignation")

    async def handle_websocket_disconnect(self, player_id: str):
        """טיפול בניתוק"""
        player = self.players.get(player_id)
        if not player:
            return
        
        print(f"🔌 Player disconnected: {player.name}")
        
        # הסרה מתור המתנה
        if player in self.waiting_queue:
            self.waiting_queue.remove(player)
        
        # טיפול בניתוק ממשחק
        if player.is_in_game and player.game_id:
            game = self.games.get(player.game_id)
            if game and game.type == 'multiplayer' and game.black_player:
                # הודעה ליריב
                opponent = game.black_player if game.white_player.id == player_id else game.white_player
                await self.send_websocket_message(opponent.websocket, {
                    'type': 'opponent_disconnected',
                    'data': {'message': f'{player.name} disconnected'}
                })
                
                # סיום משחק אחרי השהיה
                await asyncio.sleep(10)
                if game.id in self.games:
                    player_color = 'white' if game.white_player.id == player_id else 'black'
                    winner = 'black' if player_color == 'white' else 'white'
                    await self.end_game(game.id, f"{winner.title()} wins by abandonment")
        
        # ניקוי
        if player_id in self.players:
            del self.players[player_id]

    async def end_game(self, game_id: str, result: str = None):
        """סיום משחק וחיסכון במסד נתונים"""
        game = self.games.get(game_id)
        if not game:
            return
        
        if not result:
            result = game.chess_game.get_result()
        
        game.status = 'finished'
        
        print(f"🏁 Game {game_id} ended: {result}")
        
        # שמירת המשחק במסד נתונים
        if self.db:
            await self.save_game_to_db(game, result)
            await self.update_player_stats(game, result)
        
        # עדכון שחקנים
        for player in [game.white_player, game.black_player]:
            if player:
                player.is_in_game = False
                player.game_id = None
        
        # הודעה לשחקנים
        await self.broadcast_to_game(game_id, {
            'type': 'game_end',
            'data': {
                'result': result,
                'pgn': game.chess_game.get_game_pgn(),
                'final_position': game.chess_game.get_position_info()
            }
        })
        
        # סגירת מנוע שחמט
        game.chess_game.close()
        
        # ניקוי אחרי השהיה
        await asyncio.sleep(60)
        if game_id in self.games:
            del self.games[game_id]

    async def save_game_to_db(self, game: GameSession, result: str):
        """שמירת משחק במסד נתונים"""
        if not self.db:
            return
            
        try:
            game_data = {
                "game_id": game.id,
                "type": game.type,
                "players": {
                    "white_id": game.white_player.user_id,
                    "white_name": game.white_player.name,
                    "black_id": game.black_player.user_id if game.black_player else None,
                    "black_name": game.black_player.name if game.black_player else "AI"
                },
                "result": result,
                "moves": [move.san for move in game.chess_game.history],
                "pgn": game.chess_game.get_game_pgn(),
                "final_fen": game.chess_game.board.fen(),
                "move_count": len(game.chess_game.history),
                "duration": time.time() - game.start_time,
                "created_at": datetime.fromtimestamp(game.start_time),
                "finished_at": datetime.now(),
                "chat_history": game.chat_history if hasattr(game, 'chat_history') else []
            }
            
            await self.db.games.insert_one(game_data)
            print(f"💾 Game {game.id} saved to database")
            
        except Exception as e:
            print(f"❌ Failed to save game to database: {e}")

    async def update_player_stats(self, game: GameSession, result: str):
        """עדכון סטטיסטיקות שחקנים"""
        if not self.db:
            return
            
        try:
            # קביעת מנצח
            winner = None
            if "white wins" in result.lower():
                winner = "white"
            elif "black wins" in result.lower():
                winner = "black"
            
            # עדכון לבן
            if game.white_player.user_id:
                update_data = {
                    "$inc": {"games_played": 1},
                    "$set": {"last_active": datetime.now()}
                }
                if winner == "white":
                    update_data["$inc"]["games_won"] = 1
                    
                await self.db.users.update_one(
                    {"_id": game.white_player.user_id}, 
                    update_data
                )
            
            # עדכון שחור (אם זה לא AI)
            if game.black_player and game.black_player.user_id:
                update_data = {
                    "$inc": {"games_played": 1},
                    "$set": {"last_active": datetime.now()}
                }
                if winner == "black":
                    update_data["$inc"]["games_won"] = 1
                    
                await self.db.users.update_one(
                    {"_id": game.black_player.user_id},
                    update_data
                )
                
        except Exception as e:
            print(f"❌ Failed to update player stats: {e}")

    async def get_user_games(self, user_id: str, limit: int = 20):
        """קבלת משחקי משתמש"""
        if not self.db:
            return []
            
        try:
            cursor = self.db.games.find({
                "$or": [
                    {"players.white_id": user_id},
                    {"players.black_id": user_id}
                ]
            }).sort("created_at", -1).limit(limit)
            
            games = await cursor.to_list(length=limit)
            return games
            
        except Exception as e:
            print(f"❌ Failed to get user games: {e}")
            return []

    async def send_websocket_message(self, websocket: WebSocket, message: dict):
        """שליחת הודעה ב-WebSocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"❌ Failed to send WebSocket message: {e}")

    async def send_websocket_error(self, websocket: WebSocket, error_message: str):
        """שליחת הודעת שגיאה"""
        await self.send_websocket_message(websocket, {
            'type': 'error',
            'data': {'message': error_message}
        })

    async def broadcast_to_game(self, game_id: str, message: dict):
        """שידור הודעה לכל השחקנים במשחק"""
        game = self.games.get(game_id)
        if not game:
            return
        
        for player in [game.white_player, game.black_player]:
            if player and player.websocket:
                await self.send_websocket_message(player.websocket, message)

    def run(self, host: str = "localhost", port: int = 5001):
        """הפעלת השרת"""
        async def startup():
            await self.connect_to_mongodb()
        
        self.app.add_event_handler("startup", startup)
        
        print("🚀 ChessMentor Complete Python Server starting...")
        print(f"🌐 Server: {host}:{port}")
        print(f"♟️ Stockfish: {self.stockfish_path}")
        print(f"🔗 WebSocket: ws://{host}:{port}/ws")
        print(f"🏥 Health: http://{host}:{port}/health")
        print(f"🤖 OpenAI API: http://{host}:{port}/api/auth/openai")
        print(f"🍃 MongoDB: {self.mongo_uri[:50]}..." if self.mongo_uri else "🍃 MongoDB: Not configured")
        print("")
        
        if not self.stockfish_path:
            print("⚠️ WARNING: Stockfish not found! AI games will not work.")
            print("   Please install Stockfish or set the correct path.")
        
        uvicorn.run(self.app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    # הגדרת נתיב Stockfish שלך
    STOCKFISH_PATH = r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe"
    
    # הגדרת MongoDB
    MONGO_URI = "mongodb+srv://neriyajacobsen:BU60Z6kVEADTm6tm@cluster0.fhzc24d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    server = ChessMentorServer(STOCKFISH_PATH, MONGO_URI)
    server.run()