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
try:
    from ChessGame import ChessGame
    from ChessCoach import ChessCoach
except ImportError:
    print("⚠️ Warning: ChessGame or ChessCoach modules not found. Some features will be limited.")
    ChessGame = None
    ChessCoach = None

@dataclass
class Player:
    id: str
    websocket: WebSocket
    name: str
    elo: int = 1200
    is_in_game: bool = False
    game_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    is_guest: bool = True

@dataclass
class GameSession:
    id: str
    type: str  # 'ai' or 'multiplayer'
    white_player: Player
    black_player: Optional[Player]
    chess_game: Optional[Any]  # ChessGame instance
    start_time: float
    status: str = 'active'
    chat_history: List[Dict] = None
    fen: str = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    move_history: List[str] = None

    def __post_init__(self):
        if self.chat_history is None:
            self.chat_history = []
        if self.move_history is None:
            self.move_history = []

class ChessMentorServer:
    """שרת מאסטר שמטפל בהכל - משחקים, OpenAI, ניתוח"""
    
    def __init__(self, stockfish_path: str = None):
        self.app = FastAPI(title="ChessMentor Server", version="2.1.0")
        
        # טעינת משתני סביבה
        load_dotenv()
        
        # הגדרת נתיב Stockfish - קודם מ-.env, אחר כך auto-detect
        self.stockfish_path = (
            stockfish_path or 
            os.getenv('STOCKFISH_PATH') or 
            self._detect_stockfish_path()
        )
        
        # הגדרות שרת מ-.env
        self.host = os.getenv('HOST', 'localhost')
        self.port = int(os.getenv('PORT', 5001))
        self.debug = os.getenv('DEBUG', 'True').lower() == 'true'
        
        # הגדרות CORS מ-.env
        allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
        
        print(f"🔧 Loaded config:")
        print(f"   Host: {self.host}:{self.port}")
        print(f"   Debug: {self.debug}")
        print(f"   Stockfish: {self.stockfish_path}")
        print(f"   CORS Origins: {allowed_origins}")
        
        # אחסון נתונים
        self.games: Dict[str, GameSession] = {}
        self.players: Dict[str, Player] = {}
        self.waiting_queue: List[Player] = []
        self.active_sessions: Dict[str, Dict] = {}  # לניהול מפתחות OpenAI
        
        # הגדרת האפליקציה
        self.setup_app(allowed_origins)
        
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

    def setup_app(self, allowed_origins):
        """הגדרת FastAPI עם כל הנתיבים"""
        
        # CORS עם הגדרות מ-.env + OPTIONS handler
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )
        
        # הוספת OPTIONS handler מפורש
        @self.app.options("/{full_path:path}")
        async def options_handler():
            return JSONResponse(
                content={},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                }
            )

        # בדיקת בריאות
        @self.app.get("/health")
        async def health_check():
            return {
                "status": "OK",
                "server": "ChessMentor Python Server v2.1",
                "active_games": len(self.games),
                "connected_players": len(self.players),
                "players_in_queue": len(self.waiting_queue),
                "stockfish_available": bool(self.stockfish_path),
                "stockfish_path": self.stockfish_path,
                "timestamp": datetime.now().isoformat()
            }

        # נתיבי OpenAI API - תיקון לנתיבים שהפרונט מצפה להם
        @self.app.post("/auth/openai")  # הוסרנו /api
        async def authenticate_openai(request_data: dict):
            """אימות מפתח OpenAI"""
            try:
                print(f"🔍 Received OpenAI auth request: {request_data.keys()}")
                
                api_key = request_data.get('apiKey')
                if not api_key:
                    print("❌ No API key provided")
                    raise HTTPException(status_code=400, detail="API key is required")

                print(f"🔑 Testing API key: {api_key[:10]}...")

                # בדיקת תקינות המפתח עם try-catch מפורט
                try:
                    # יצירת client בלי פרמטרים מיותרים
                    client = OpenAI(api_key=api_key)
                    
                    # בדיקה קלה - רשימת מודלים
                    models = client.models.list()
                    
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
                    
                    print(f"✅ OpenAI authentication successful for session {session_id}")
                    
                    return JSONResponse(
                        content={
                            'success': True,
                            'sessionId': session_id,
                            'message': 'API key validated successfully'
                        },
                        headers={
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "POST, OPTIONS",
                            "Access-Control-Allow-Headers": "*"
                        }
                    )
                    
                except openai.AuthenticationError:
                    print("❌ OpenAI authentication failed - invalid API key")
                    raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
                except openai.RateLimitError:
                    print("❌ OpenAI rate limit exceeded")
                    raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded")
                except openai.APIConnectionError:
                    print("❌ OpenAI connection error")
                    raise HTTPException(status_code=503, detail="Cannot connect to OpenAI")
                except Exception as e:
                    print(f"❌ OpenAI validation error: {type(e).__name__}: {str(e)}")
                    if "proxies" in str(e):
                        # נסה ליצור client פשוט יותר
                        try:
                            import openai as openai_module
                            openai_module.api_key = api_key
                            
                            # בדיקה באמצעות הספרייה הישנה
                            response = openai_module.Model.list()
                            
                            session_id = str(uuid.uuid4())
                            self.active_sessions[session_id] = {
                                'api_key': api_key,
                                'timestamp': time.time(),
                                'client': None,  # נשמור None ונשתמש בגישה הישנה
                                'legacy': True
                            }
                            
                            return JSONResponse(
                                content={
                                    'success': True,
                                    'sessionId': session_id,
                                    'message': 'API key validated successfully (legacy mode)'
                                },
                                headers={
                                    "Content-Type": "application/json",
                                    "Access-Control-Allow-Origin": "*"
                                }
                            )
                        except Exception as legacy_error:
                            print(f"❌ Legacy OpenAI validation also failed: {legacy_error}")
                            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
                    else:
                        raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"❌ Unexpected error in OpenAI auth: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.app.post("/chess/coach")  # הוסרנו /api
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
                
                # בניית prompt לפי סוג הניתוח
                system_prompt = self._build_coach_prompt(analysis_type)
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Game State (FEN): {game_state}\n\nQuestion: {message}"}
                ]
                
                # קריאה ל-OpenAI - תמיכה במצב legacy ומצב חדש
                try:
                    if session.get('legacy', False):
                        # מצב legacy - השתמש בגישה הישנה
                        import openai as openai_module
                        openai_module.api_key = session['api_key']
                        
                        response = openai_module.ChatCompletion.create(
                            model="gpt-3.5-turbo",
                            messages=messages,
                            max_tokens=500,
                            temperature=0.7
                        )
                        
                        response_text = response.choices[0].message.content
                        
                    else:
                        # מצב חדש - client object
                        client = session['client']
                        response = client.chat.completions.create(
                            model="gpt-4o-mini",
                            messages=messages,
                            max_tokens=500,
                            temperature=0.7
                        )
                        
                        response_text = response.choices[0].message.content
                    
                    print(f"✅ Coach response generated for session {session_id}")
                    
                    return JSONResponse({
                        'success': True,
                        'response': response_text,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                except Exception as openai_error:
                    print(f"❌ OpenAI API error: {openai_error}")
                    raise HTTPException(status_code=503, detail="OpenAI service unavailable")
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"❌ Coach endpoint error: {e}")
                raise HTTPException(status_code=500, detail="Failed to get response from chess coach")

        @self.app.get("/auth/status")
        async def auth_status():
            """בדיקת סטטוס authentication"""
            return JSONResponse({
                "active_sessions": len(self.active_sessions),
                "session_ids": list(self.active_sessions.keys()),
                "timestamp": datetime.now().isoformat()
            })

        @self.app.post("/auth/logout")  # הוסרנו /api
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

        @self.app.get("/games")  # הוסרנו /api
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
                        "move_count": len(game.move_history)
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
        
        # יצירת משחק - עם fallback אם ChessGame לא זמין
        chess_game = None
        if ChessGame and self.stockfish_path:
            try:
                chess_game = ChessGame(self.stockfish_path, elo_level=1500)
            except Exception as e:
                print(f"⚠️ Failed to initialize ChessGame: {e}")
        
        game_session = GameSession(
            id=game_id,
            type='ai',
            white_player=player,
            black_player=None,
            chess_game=chess_game,
            start_time=time.time()
        )
        
        self.games[game_id] = game_session
        player.is_in_game = True
        player.game_id = game_id
        
        print(f"🤖 Started AI game {game_id} for {player.name}")
        
        # מידע על המיקום הראשוני
        position_info = {
            'fen': game_session.fen,
            'turn': 'white',
            'legal_moves': self._get_legal_moves_from_fen(game_session.fen),
            'move_count': 0,
            'is_check': False,
            'is_checkmate': False,
            'is_stalemate': False,
            'is_game_over': False
        }
        
        await self.send_websocket_message(player.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white',
                'opponent': {'name': 'ChessMentor AI', 'elo': 1500},
                'position': position_info
            }
        })

    def _get_legal_moves_from_fen(self, fen: str) -> List[str]:
        """קבלת מהלכים חוקיים מ-FEN"""
        try:
            board = chess.Board(fen)
            return [move.uci() for move in board.legal_moves]
        except:
            return []

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

    async def start_multiplayer_game(self, player1: Player, player2: Player):
        """התחלת משחק בין שני שחקנים"""
        game_id = str(uuid.uuid4())
        
        # צבעים אקראיים
        import random
        is_player1_white = random.choice([True, False])
        
        white_player = player1 if is_player1_white else player2
        black_player = player2 if is_player1_white else player1
        
        chess_game = None
        if ChessGame:
            try:
                chess_game = ChessGame(self.stockfish_path)
            except Exception as e:
                print(f"⚠️ Failed to initialize ChessGame: {e}")
        
        game_session = GameSession(
            id=game_id,
            type='multiplayer',
            white_player=white_player,
            black_player=black_player,
            chess_game=chess_game,
            start_time=time.time()
        )
        
        self.games[game_id] = game_session
        
        # עדכון שחקנים
        for p in [player1, player2]:
            p.is_in_game = True
            p.game_id = game_id
        
        print(f"👥 Started multiplayer game {game_id}: {white_player.name} vs {black_player.name}")
        
        position_info = {
            'fen': game_session.fen,
            'turn': 'white',
            'legal_moves': self._get_legal_moves_from_fen(game_session.fen),
            'move_count': 0,
            'is_check': False,
            'is_checkmate': False,
            'is_stalemate': False,
            'is_game_over': False
        }
        
        # הודעה לשני השחקנים
        await self.send_websocket_message(player1.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white' if is_player1_white else 'black',
                'opponent': {'name': player2.name, 'elo': player2.elo},
                'position': position_info
            }
        })
        
        await self.send_websocket_message(player2.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'black' if is_player1_white else 'white',
                'opponent': {'name': player1.name, 'elo': player1.elo},
                'position': position_info
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
        
        move_uci = data.get('move')
        if not move_uci:
            await self.send_websocket_error(websocket, "Move required")
            return
        
        # בדיקת תקינות המהלך
        try:
            board = chess.Board(game.fen)
            move = chess.Move.from_uci(move_uci)
            
            if move not in board.legal_moves:
                await self.send_websocket_error(websocket, f"Invalid move: {move_uci}")
                return
            
            # ביצוע המהלך
            board.push(move)
            game.fen = board.fen()
            game.move_history.append(move_uci)
            
            print(f"♟️ {player.name} played {move_uci}")
            
            # מידע מעודכן על המיקום
            position_info = {
                'fen': game.fen,
                'turn': 'white' if board.turn else 'black',
                'legal_moves': [m.uci() for m in board.legal_moves],
                'move_count': len(game.move_history),
                'is_check': board.is_check(),
                'is_checkmate': board.is_checkmate(),
                'is_stalemate': board.is_stalemate(),
                'is_game_over': board.is_game_over()
            }
            
            # שידור המהלך לכל השחקנים במשחק
            await self.broadcast_to_game(game.id, {
                'type': 'move_made',
                'data': {
                    'move': move_uci,
                    'player': player.name,
                    'position': position_info
                }
            })
            
            # בדיקת סיום משחק
            if board.is_game_over():
                result = self._get_game_result(board)
                await self.end_game(game.id, result)
                return
            
            # תגובת AI במשחקי AI
            if game.type == 'ai' and not board.turn:  # תור השחור (AI)
                await self.make_ai_move(game.id)
                
        except Exception as e:
            print(f"Move error: {e}")
            await self.send_websocket_error(websocket, f"Move failed: {e}")

    def _get_game_result(self, board: chess.Board) -> str:
        """קביעת תוצאת המשחק"""
        if board.is_checkmate():
            winner = "Black" if board.turn else "White"
            return f"{winner} wins by checkmate"
        elif board.is_stalemate():
            return "Draw by stalemate"
        elif board.is_insufficient_material():
            return "Draw by insufficient material"
        elif board.is_seventyfive_moves():
            return "Draw by 75-move rule"
        elif board.is_fivefold_repetition():
            return "Draw by repetition"
        else:
            return "Game in progress"

    async def make_ai_move(self, game_id: str):
        """מהלך AI"""
        game = self.games.get(game_id)
        if not game:
            return

        print("🤖 AI thinking...")
        
        # השהיה קטנה לריאליזם
        await asyncio.sleep(0.5)
        
        try:
            board = chess.Board(game.fen)
            
            # אם יש מנוע חזק - השתמש בו
            if game.chess_game and game.chess_game.engine:
                ai_move = game.chess_game.computer_move(thinking_time=1.0)
                if ai_move:
                    move_uci = ai_move.uci()
                else:
                    # fallback למהלך אקראי
                    legal_moves = list(board.legal_moves)
                    if legal_moves:
                        import random
                        move_uci = random.choice(legal_moves).uci()
                    else:
                        return
            else:
                # fallback למהלך אקראי
                legal_moves = list(board.legal_moves)
                if legal_moves:
                    import random
                    move_uci = random.choice(legal_moves).uci()
                else:
                    return
            
            # ביצוע המהלך
            move = chess.Move.from_uci(move_uci)
            board.push(move)
            game.fen = board.fen()
            game.move_history.append(move_uci)
            
            print(f"🤖 AI played {move_uci}")
            
            position_info = {
                'fen': game.fen,
                'turn': 'white' if board.turn else 'black',
                'legal_moves': [m.uci() for m in board.legal_moves],
                'move_count': len(game.move_history),
                'is_check': board.is_check(),
                'is_checkmate': board.is_checkmate(),
                'is_stalemate': board.is_stalemate(),
                'is_game_over': board.is_game_over()
            }
            
            await self.broadcast_to_game(game_id, {
                'type': 'move_made',
                'data': {
                    'move': move_uci,
                    'player': 'ChessMentor AI',
                    'position': position_info
                }
            })
            
            # בדיקת סיום משחק
            if board.is_game_over():
                result = self._get_game_result(board)
                await self.end_game(game_id, result)
                
        except Exception as e:
            print(f"AI move error: {e}")

    async def handle_analyze_move(self, websocket: WebSocket, player_id: str, data: dict):
        """ניתוח מהלך"""
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game:
            return
        
        move_uci = data.get('move')
        if not move_uci:
            await self.send_websocket_error(websocket, "Move required for analysis")
            return
        
        # ניתוח פשוט
        try:
            board = chess.Board(game.fen)
            move = chess.Move.from_uci(move_uci)
            
            if move in board.legal_moves:
                analysis = f"Move {move_uci} is legal. "
                
                # בדיקות בסיסיות
                if board.is_capture(move):
                    analysis += "This is a capture. "
                if board.gives_check(move):
                    analysis += "This move gives check. "
                
                # השתמש במאמן אם זמין
                if game.chess_game and hasattr(game.chess_game, 'chess_coach'):
                    try:
                        explanation = game.chess_game.chess_coach.explain_move(board, move, player.elo)
                        analysis = explanation
                    except:
                        pass
                
                await self.send_websocket_message(websocket, {
                    'type': 'move_analysis',
                    'data': {
                        'move': move_uci,
                        'explanation': analysis,
                        'analysis': {'evaluation': 0}  # placeholder
                    }
                })
            else:
                await self.send_websocket_error(websocket, f"Illegal move: {move_uci}")
                
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
        
        try:
            board = chess.Board(game.fen)
            position_info = {
                'fen': game.fen,
                'turn': 'white' if board.turn else 'black',
                'legal_moves': [move.uci() for move in board.legal_moves],
                'move_count': len(game.move_history),
                'is_check': board.is_check(),
                'is_checkmate': board.is_checkmate(),
                'is_stalemate': board.is_stalemate(),
                'is_game_over': board.is_game_over()
            }
            
            await self.send_websocket_message(websocket, {
                'type': 'position_update',
                'data': {
                    'position': position_info
                }
            })
        except Exception as e:
            await self.send_websocket_error(websocket, f"Failed to get position: {e}")

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
                if opponent and opponent.websocket:
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
        """סיום משחק"""
        game = self.games.get(game_id)
        if not game:
            return
        
        if not result:
            try:
                board = chess.Board(game.fen)
                result = self._get_game_result(board)
            except:
                result = "Game ended"
        
        game.status = 'finished'
        
        print(f"🏁 Game {game_id} ended: {result}")
        
        # עדכון שחקנים
        for player in [game.white_player, game.black_player]:
            if player:
                player.is_in_game = False
                player.game_id = None
        
        # PGN פשוט
        pgn = self._create_simple_pgn(game, result)
        
        # הודעה לשחקנים
        await self.broadcast_to_game(game_id, {
            'type': 'game_end',
            'data': {
                'result': result,
                'pgn': pgn,
                'final_position': {
                    'fen': game.fen,
                    'move_count': len(game.move_history)
                }
            }
        })
        
        # סגירת מנוע שחמט
        if game.chess_game and hasattr(game.chess_game, 'close'):
            try:
                game.chess_game.close()
            except:
                pass
        
        # ניקוי אחרי השהיה
        await asyncio.sleep(60)
        if game_id in self.games:
            del self.games[game_id]

    def _create_simple_pgn(self, game: GameSession, result: str) -> str:
        """יצירת PGN פשוט"""
        try:
            pgn_lines = []
            pgn_lines.append('[Event "ChessMentor Game"]')
            pgn_lines.append(f'[Date "{datetime.now().strftime("%Y.%m.%d")}"]')
            pgn_lines.append(f'[White "{game.white_player.name}"]')
            pgn_lines.append(f'[Black "{game.black_player.name if game.black_player else "AI"}"]')
            pgn_lines.append(f'[Result "{result}"]')
            pgn_lines.append('')
            
            # הוספת מהלכים
            board = chess.Board()
            moves_text = []
            
            for i, move_uci in enumerate(game.move_history):
                try:
                    move = chess.Move.from_uci(move_uci)
                    if move in board.legal_moves:
                        san = board.san(move)
                        board.push(move)
                        
                        if i % 2 == 0:  # מהלך לבן
                            moves_text.append(f"{(i//2)+1}. {san}")
                        else:  # מהלך שחור
                            moves_text[-1] += f" {san}"
                except:
                    continue
            
            pgn_lines.append(' '.join(moves_text))
            pgn_lines.append(result)
            
            return '\n'.join(pgn_lines)
        except Exception as e:
            print(f"PGN creation error: {e}")
            return f"Game between {game.white_player.name} and {game.black_player.name if game.black_player else 'AI'}"

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

    def run(self, host: str = None, port: int = None):
        """הפעלת השרת"""
        # השתמש בהגדרות מ-.env אם לא סופקו פרמטרים
        run_host = host or self.host
        run_port = port or self.port
        
        print("🚀 ChessMentor Python Server starting...")
        print(f"🌐 Server: {run_host}:{run_port}")
        print(f"♟️ Stockfish: {self.stockfish_path if self.stockfish_path else 'Not available'}")
        print(f"🔗 WebSocket: ws://{run_host}:{run_port}/ws")
        print(f"🏥 Health: http://{run_host}:{run_port}/health")
        print(f"🤖 OpenAI API: http://{run_host}:{run_port}/auth/openai")
        print(f"💬 Coach API: http://{run_host}:{run_port}/chess/coach")
        print(f"📊 Games API: http://{run_host}:{run_port}/games")
        print("")
        
        if not self.stockfish_path:
            print("⚠️ WARNING: Stockfish not found! AI will use random moves.")
            print("   Please install Stockfish for better AI gameplay.")
        
        try:
            uvicorn.run(
                self.app, 
                host=run_host, 
                port=run_port, 
                log_level="debug" if self.debug else "info"
            )
        except KeyboardInterrupt:
            print("\n👋 Server shutting down...")
        except Exception as e:
            print(f"❌ Server error: {e}")

if __name__ == "__main__":
    # הגדרת נתיב Stockfish - עדכן לפי המיקום שלך
    STOCKFISH_PATH = os.getenv('STOCKFISH_PATH') or r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe"
    
    server = ChessMentorServer(STOCKFISH_PATH)
    server.run()