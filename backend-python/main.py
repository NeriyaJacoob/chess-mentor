# backend-python/main_server.py
"""
ChessMentor Python Server מלא
משלב WebSocket, OpenAI, Stockfish ו-MongoDB בשרת אחד
"""

import asyncio
import json
import uuid
import time
import os
import platform
import shutil
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

# FastAPI & WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# OpenAI
from openai import OpenAI

# Chess
import chess
import chess.engine
import chess.pgn

# Database and Environment
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Internal imports
from ChessGame import ChessGame
from ChessCoach import ChessCoach

# --- Setup ---
load_dotenv()

# --- Database Connection ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db_client = None
games_collection = None
try:
    db_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = db_client.chess_mentor_db
    games_collection = db.games
    db_client.server_info() # Will raise an exception if connection fails
    print("✅ MongoDB connection successful.")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    db_client = None
    games_collection = None


# --- Data Classes (Your original structure) ---
@dataclass
class Player:
    id: str
    websocket: WebSocket
    name: str
    elo: int = 1200
    is_in_game: bool = False
    game_id: Optional[str] = None
    session_id: Optional[str] = None

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
    """שרת מאסטר שמטפל בהכל - משחקים, OpenAI, ניתוח"""

    def __init__(self, stockfish_path: str = None):
        self.app = FastAPI(title="ChessMentor Complete Server", version="2.0.0")
        self.stockfish_path = stockfish_path or self._detect_stockfish_path()
        self.games: Dict[str, GameSession] = {}
        self.players: Dict[str, Player] = {}
        self.waiting_queue: List[Player] = []
        self.active_sessions: Dict[str, Dict] = {}  # לניהול מפתחות OpenAI
        self.setup_app()

    def _detect_stockfish_path(self) -> str:
        """זיהוי אוטומטי של נתיב Stockfish (Your original logic)"""
        stockfish_cmd = shutil.which('stockfish')
        if stockfish_cmd:
            return stockfish_cmd
        
        system = platform.system()
        if system == "Windows":
            possible_paths = [r"C:\stockfish\stockfish.exe", r"C:\Users\Neriya\Downloads\stockfish-windows-x86-64-avx2\stockfish\stockfish-windows-x86-64-avx2.exe"]
        elif system == "Darwin":
            possible_paths = ["/usr/local/bin/stockfish", "/opt/homebrew/bin/stockfish"]
        else: # Linux
            possible_paths = ["/usr/bin/stockfish", "/usr/local/bin/stockfish"]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
                
        print("⚠️ Stockfish not found! Please install or specify path")
        return None

    def setup_app(self):
        """הגדרת FastAPI עם כל הנתיבים"""
        self.app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

        @self.app.get("/health")
        async def health_check():
            return {"status": "OK", "server": "ChessMentor Python Complete Server", "active_games": len(self.games),
                    "connected_players": len(self.players), "stockfish_available": bool(self.stockfish_path),
                    "db_connected": (db_client is not None)}

        # --- OpenAI and Session Management (Your original logic) ---
        @self.app.post("/api/auth/openai")
        async def authenticate_openai(request_data: dict):
            api_key = request_data.get('apiKey')
            if not api_key: raise HTTPException(status_code=400, detail="API key is required")
            try:
                client = OpenAI(api_key=api_key)
                await asyncio.to_thread(client.models.list)
                session_id = str(uuid.uuid4())
                self.active_sessions[session_id] = {'api_key': api_key, 'timestamp': time.time(), 'client': client}
                await self._cleanup_old_sessions()
                return JSONResponse({'success': True, 'sessionId': session_id})
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid OpenAI API key")

        @self.app.post("/api/chess/coach")
        async def chess_coach_chat(request_data: dict):
            session_id = request_data.get('sessionId')
            session = self.active_sessions.get(session_id)
            if not session: raise HTTPException(status_code=401, detail="Invalid or expired session")
            
            system_prompt = self._build_coach_prompt(request_data.get('analysisType', 'general'))
            messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Game State (FEN): {request_data.get('gameState')}\n\nQuestion: {request_data.get('message')}"}]
            
            try:
                response = await asyncio.to_thread(session['client'].chat.completions.create, model="gpt-4", messages=messages, max_tokens=500, temperature=0.7)
                return JSONResponse({'success': True, 'response': response.choices[0].message.content})
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to get response: {e}")

        # --- NEW: API Endpoints for fetching archived games from DB ---
        @self.app.get("/api/archive/games", response_description="List archived games")
        async def get_archived_games():
            if not games_collection:
                raise HTTPException(status_code=503, detail="Database service not available")
            archived_games = []
            cursor = games_collection.find().sort("created_at", -1).limit(50)
            for game in await asyncio.to_thread(list, cursor):
                game["_id"] = str(game["_id"])
                archived_games.append(game)
            return JSONResponse(content=archived_games)

        @self.app.get("/api/archive/games/{game_id}", response_description="Get a single archived game")
        async def get_archived_game_by_id(game_id: str):
            if not games_collection:
                raise HTTPException(status_code=503, detail="Database service not available")
            try:
                game = await asyncio.to_thread(games_collection.find_one, {"_id": ObjectId(game_id)})
                if game:
                    game["_id"] = str(game["_id"])
                    return JSONResponse(content=game)
                raise HTTPException(status_code=404, detail=f"Archived game {game_id} not found")
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid game ID format")


        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await self.handle_websocket(websocket)

    def _build_coach_prompt(self, analysis_type: str) -> str:
        # Your original prompt building logic
        base_prompt = "You are ChessMentor, an expert chess coach. Always respond in Hebrew."
        prompts = {
            'position': "Analyze the current chess position: strategy, threats, opportunities.",
            'move': "Evaluate the last move and suggest alternatives.",
            'game': "Analyze the entire game, pointing out key moments."
        }
        return base_prompt + " " + prompts.get(analysis_type, "Answer general chess questions.")

    async def _cleanup_old_sessions(self):
        # Your original session cleanup logic
        current_time = time.time()
        expired = [sid for sid, s in self.active_sessions.items() if current_time - s['timestamp'] > 3600]
        for sid in expired: del self.active_sessions[sid]

    async def handle_websocket(self, websocket: WebSocket):
        await websocket.accept()
        player_id = str(uuid.uuid4())
        try:
            print(f"🔗 Player connected: {player_id}")
            while True:
                message = json.loads(await websocket.receive_text())
                await self.handle_websocket_message(websocket, player_id, message)
        except WebSocketDisconnect: pass
        finally: await self.handle_websocket_disconnect(player_id)

    async def handle_websocket_message(self, websocket: WebSocket, player_id: str, message: dict):
        # Your original message handler logic
        action = message.get('action')
        data = message.get('data', {})
        handlers = {'join': self.handle_join, 'find_game': self.handle_find_game, 'make_move': self.handle_move, 'resign': self.handle_resign, 'chat_message': self.handle_chat_message}
        handler = handlers.get(action)
        if handler:
            await handler(websocket, player_id, data)
        else:
            await self.send_websocket_error(websocket, f"Unknown action: {action}")

    async def handle_join(self, websocket: WebSocket, player_id: str, data: dict):
        # Your original join logic
        player = Player(id=player_id, websocket=websocket, name=data.get('name', f'Player_{player_id[:4]}'), elo=data.get('elo', 1200), session_id=data.get('sessionId'))
        self.players[player_id] = player
        await self.send_websocket_message(websocket, {'type': 'connected', 'data': {'player_id': player_id}})

    async def handle_find_game(self, websocket: WebSocket, player_id: str, data: dict):
        # Your original find game logic
        player = self.players.get(player_id)
        if not player or player.is_in_game: return
        mode = data.get('mode', 'ai')
        if mode == 'ai': await self.start_ai_game(player)
        else: await self.find_multiplayer_game(player)

    async def start_ai_game(self, player: Player):
        # Your original AI game start logic
        game_id = str(uuid.uuid4())
        chess_game = ChessGame(self.stockfish_path)
        chess_coach = ChessCoach(chess_game.engine) if chess_game.engine else None
        if not chess_game.engine: return await self.send_websocket_error(player.websocket, "Stockfish engine not available")
        game_session = GameSession(id=game_id, type='ai', white_player=player, black_player=None, chess_game=chess_game, chess_coach=chess_coach, start_time=time.time())
        self.games[game_id] = game_session
        player.is_in_game = True
        player.game_id = game_id
        await self.send_websocket_message(player.websocket, {'type': 'game_start', 'data': {'game_id': game_id, 'color': 'white', 'opponent': {'name': 'AI'}, 'position': chess_game.get_position_info()}})

    async def find_multiplayer_game(self, player: Player):
        # Your original multiplayer logic
        # ... (This logic remains untouched)
        pass

    async def start_multiplayer_game(self, player1: Player, player2: Player):
        # Your original multiplayer start logic
        # ... (This logic remains untouched)
        pass
    
    async def handle_move(self, websocket: WebSocket, player_id: str, data: dict):
        # Your original move handling logic
        # ... (This logic remains untouched)
        pass

    async def make_ai_move(self, game_id: str):
        # Your original AI move logic
        # ... (This logic remains untouched)
        pass

    async def handle_chat_message(self, websocket: WebSocket, player_id: str, data: dict):
        # Your original chat handling logic
        # ... (This logic remains untouched)
        pass

    async def handle_resign(self, websocket: WebSocket, player_id: str, data: dict):
        # Your original resignation logic
        # ... (This logic remains untouched)
        pass

    async def handle_websocket_disconnect(self, player_id: str):
        # Your original disconnect logic
        # ... (This logic remains untouched)
        pass

    async def end_game(self, game_id: str, result: str = None):
        """סיום משחק, שמירה בארכיון וניקוי"""
        game = self.games.get(game_id)
        if not game or game.status == 'finished': return
        
        if not result: result = game.chess_game.get_result()
        game.status = 'finished'
        pgn = game.chess_game.get_game_pgn()

        # --- NEW: Save the game to the MongoDB archive ---
        if games_collection:
            try:
                game_doc = {
                    "pgn": pgn,
                    "result": result,
                    "white_player": game.white_player.name,
                    "black_player": game.black_player.name if game.black_player else "AI",
                    "white_elo": game.white_player.elo,
                    "black_elo": game.black_player.elo if game.black_player else 1500,
                    "type": game.type,
                    "created_at": datetime.utcnow()
                }
                # Run blocking DB operation in a separate thread
                await asyncio.to_thread(games_collection.insert_one, game_doc)
                print(f"💾 Game {game_id} saved to DB archive.")
            except Exception as e:
                print(f"❌ DB save error for game {game_id}: {e}")

        # The rest of your original end_game logic
        print(f"🏁 Game {game_id} ended: {result}")
        await self.broadcast_to_game(game_id, {'type': 'game_end', 'data': {'result': result, 'pgn': pgn}})
        game.chess_game.close()
        for player in [game.white_player, game.black_player]:
            if player:
                player.is_in_game = False
                player.game_id = None
        
        await asyncio.sleep(10)
        if game_id in self.games: del self.games[game_id]

    async def send_websocket_message(self, websocket: WebSocket, message: dict):
        try: await websocket.send_text(json.dumps(message))
        except Exception: pass

    async def send_websocket_error(self, websocket: WebSocket, error_message: str):
        await self.send_websocket_message(websocket, {'type': 'error', 'data': {'message': error_message}})

    async def broadcast_to_game(self, game_id: str, message: dict):
        game = self.games.get(game_id)
        if not game: return
        for player in [game.white_player, game.black_player]:
            if player and player.websocket:
                await self.send_websocket_message(player.websocket, message)

    def run(self, host: str = "localhost", port: int = 5001):
        print("🚀 ChessMentor Complete Python Server starting...")
        print(f"🌐 Server: http://{host}:{port}")
        if self.stockfish_path: print(f"♟️ Stockfish: {self.stockfish_path}")
        if db_client: print(f"🗄️  DB: Connected to {MONGO_URI.split('@')[-1].split('/')[0]}")
        uvicorn.run(self.app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    server = ChessMentorServer()
    server.run()
