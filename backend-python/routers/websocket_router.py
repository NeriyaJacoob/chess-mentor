# backend-python/routers/websocket_router.py
"""
WebSocket routes for chess games
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import uuid
from datetime import datetime
from typing import Dict, Optional
import asyncio
import random

router = APIRouter()

# מנהל חיבורי WebSocket למשחקים
class GameWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, dict] = {}
        self.engine_initialized = True  # Stockfish stub
        
    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = {
            'websocket': websocket,
            'player_data': {},
            'game_data': None
        }
        
    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
            
    async def send_message(self, player_id: str, message: dict):
        if player_id in self.active_connections:
            try:
                websocket = self.active_connections[player_id]['websocket']
                await websocket.send_json(message)
                return True
            except:
                self.disconnect(player_id)
                return False
        return False

# מנהל מדומה למשחקי שח
class ChessEngineStub:
    def __init__(self):
        self.skill_level = 10
        self.current_position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        
    def new_game(self):
        self.current_position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        return {
            'fen': self.current_position,
            'legal_moves': self._get_mock_legal_moves(),
            'turn': 'white',
            'move_count': 0,
            'is_check': False,
            'is_checkmate': False,
            'is_game_over': False
        }
    
    def make_move(self, move: str):
        # מהלך מדומה
        return {
            'success': True,
            'move': move,
            'san': self._uci_to_san(move),
            'fen': self.current_position,
            'legal_moves': self._get_mock_legal_moves(),
            'turn': 'black',
            'move_count': 1,
            'is_check': False,
            'is_checkmate': False,
            'is_game_over': False
        }
    
    def get_best_move(self):
        # מהלך אקראי מדומה
        moves = ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'e2e3', 'd2d3']
        return random.choice(moves)
    
    def set_skill_level(self, level: int):
        self.skill_level = max(0, min(20, level))
    
    def get_position_info(self):
        return {
            'fen': self.current_position,
            'legal_moves': self._get_mock_legal_moves(),
            'turn': 'white',
            'move_count': 0
        }
    
    def _get_mock_legal_moves(self):
        return ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'e2e3', 'd2d3', 'c2c4', 'g2g3']
    
    def _uci_to_san(self, uci: str):
        # המרה פשוטה מ-UCI ל-SAN
        piece_map = {'e2e4': 'e4', 'd2d4': 'd4', 'g1f3': 'Nf3', 'b1c3': 'Nc3'}
        return piece_map.get(uci, uci)
    
    def _skill_to_elo(self, skill: int):
        # המרת רמה ל-ELO
        return 800 + (skill * 70)

# יצירת instances
manager = GameWebSocketManager()
chess_engine = ChessEngineStub()

@router.websocket("/ws/game/{player_id}")
async def game_websocket(websocket: WebSocket, player_id: str):
    """WebSocket endpoint למשחקי שח"""
    await manager.connect(websocket, player_id)
    
    try:
        while True:
            try:
                # קבלת הודעה מהלקוח
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # טיפול בהודעה
                await handle_game_message(player_id, message)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await send_error(player_id, "Invalid JSON format")
            except Exception as e:
                print(f"WebSocket error: {e}")
                await send_error(player_id, str(e))
                
    except WebSocketDisconnect:
        pass
    finally:
        handle_disconnect(player_id)

async def handle_game_message(player_id: str, message: dict):
    """טיפול בהודעות משחק"""
    action = message.get('action')
    data = message.get('data', {})
    
    print(f"📨 Game action {action} from {player_id[:8]}")
    
    handlers = {
        'join': handle_join,
        'find_game': handle_find_game,
        'make_move': handle_make_move,
        'resign': handle_resign,
        'new_game': handle_new_game,
        'get_position': handle_get_position,
        'set_ai_level': handle_set_ai_level
    }
    
    handler = handlers.get(action)
    if handler:
        await handler(player_id, data)
    else:
        await send_error(player_id, f"Unknown action: {action}")

async def handle_join(player_id: str, data: dict):
    """הצטרפות שחקן"""
    name = data.get('name', f'Player_{player_id[:8]}')
    elo = data.get('elo', 1200)
    
    # שמירת נתוני השחקן
    if player_id in manager.active_connections:
        manager.active_connections[player_id]['player_data'] = {
            'name': name,
            'elo': elo,
            'is_in_game': False,
            'game_id': None
        }
    
    await manager.send_message(player_id, {
        'type': 'connected',
        'data': {
            'player_id': player_id,
            'name': name,
            'elo': elo,
            'message': 'Connected to ChessMentor Server',
            'engine_ready': manager.engine_initialized
        }
    })

async def handle_find_game(player_id: str, data: dict):
    """חיפוש משחק - רק AI כרגע"""
    mode = data.get('mode', 'ai')
    ai_level = data.get('ai_level', 5)
    
    if mode == 'ai':
        await start_ai_game(player_id, ai_level)
    else:
        await send_error(player_id, "Only AI games are supported currently")

async def start_ai_game(player_id: str, ai_level: int = 5):
    """התחלת משחק נגד AI"""
    try:
        # המרת רמה 1-10 לרמה 0-20 של Stockfish
        stockfish_level = max(0, min(20, (ai_level - 1) * 2))
        chess_engine.set_skill_level(stockfish_level)
        
        # יצירת משחק חדש
        game_state = chess_engine.new_game()
        game_id = str(uuid.uuid4())
        
        # שמירת נתוני המשחק
        if player_id in manager.active_connections:
            manager.active_connections[player_id]['player_data']['is_in_game'] = True
            manager.active_connections[player_id]['player_data']['game_id'] = game_id
            manager.active_connections[player_id]['game_data'] = {
                'game_id': game_id,
                'player_color': 'white',
                'ai_level': ai_level,
                'stockfish_level': stockfish_level
            }
        
        await manager.send_message(player_id, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white',
                'opponent': {
                    'name': f'ChessMentor AI (Level {ai_level})',
                    'elo': chess_engine._skill_to_elo(stockfish_level)
                },
                'position': game_state
            }
        })
        
        print(f"🤖 Started AI game {game_id[:8]} - Level {ai_level}")
        
    except Exception as e:
        print(f"❌ Failed to start AI game: {e}")
        await send_error(player_id, f"Failed to start game: {str(e)}")

async def handle_make_move(player_id: str, data: dict):
    """טיפול במהלך השחקן"""
    move_uci = data.get('move')
    if not move_uci:
        await send_error(player_id, "Move is required")
        return
    
    try:
        # ביצוע מהלך
        result = chess_engine.make_move(move_uci)
        
        if not result['success']:
            await send_error(player_id, "Invalid move")
            return
        
        # שליחת אישור מהלך
        await manager.send_message(player_id, {
            'type': 'move_made',
            'data': {
                'move': move_uci,
                'san': result['san'],
                'player': 'You',
                'position': {
                    'fen': result['fen'],
                    'legal_moves': result['legal_moves'],
                    'turn': result['turn'],
                    'move_count': result['move_count']
                }
            }
        })
        
        # אם המשחק לא נגמר, AI משחק
        if not result['is_game_over']:
            await asyncio.sleep(0.5)  # השהייה קטנה
            
            # מהלך AI
            ai_move = chess_engine.get_best_move()
            ai_result = chess_engine.make_move(ai_move)
            
            await manager.send_message(player_id, {
                'type': 'move_made',
                'data': {
                    'move': ai_move,
                    'san': ai_result['san'],
                    'player': 'ChessMentor AI',
                    'position': {
                        'fen': ai_result['fen'],
                        'legal_moves': ai_result['legal_moves'],
                        'turn': ai_result['turn'],
                        'move_count': ai_result['move_count']
                    }
                }
            })
            
    except Exception as e:
        print(f"❌ Move error: {e}")
        await send_error(player_id, str(e))

async def handle_resign(player_id: str, data: dict):
    """כניעה"""
    connection = manager.active_connections.get(player_id)
    if connection and connection['player_data'].get('is_in_game'):
        await manager.send_message(player_id, {
            'type': 'game_end',
            'data': {
                'result': 'resignation',
                'winner': 'ChessMentor AI',
                'reason': 'Player resigned'
            }
        })
        
        # איפוס נתוני משחק
        connection['player_data']['is_in_game'] = False
        connection['player_data']['game_id'] = None
        connection['game_data'] = None

async def handle_new_game(player_id: str, data: dict):
    """משחק חדש"""
    ai_level = data.get('ai_level', 5)
    await start_ai_game(player_id, ai_level)

async def handle_get_position(player_id: str, data: dict):
    """קבלת מצב הלוח הנוכחי"""
    try:
        position_info = chess_engine.get_position_info()
        
        await manager.send_message(player_id, {
            'type': 'position_update',
            'data': {
                'position': position_info
            }
        })
        
    except Exception as e:
        await send_error(player_id, f"Position error: {str(e)}")

async def handle_set_ai_level(player_id: str, data: dict):
    """עדכון רמת AI"""
    ai_level = data.get('level', 5)
    stockfish_level = max(0, min(20, (ai_level - 1) * 2))
    
    chess_engine.set_skill_level(stockfish_level)
    
    # עדכון נתוני המשחק
    connection = manager.active_connections.get(player_id)
    if connection and connection.get('game_data'):
        connection['game_data']['ai_level'] = ai_level
        connection['game_data']['stockfish_level'] = stockfish_level
    
    await manager.send_message(player_id, {
        'type': 'ai_level_changed',
        'data': {
            'ai_level': ai_level,
            'elo': chess_engine._skill_to_elo(stockfish_level)
        }
    })

def handle_disconnect(player_id: str):
    """טיפול בניתוק"""
    print(f"🔌 Player disconnected: {player_id[:8]}")
    manager.disconnect(player_id)

async def send_error(player_id: str, message: str):
    """שליחת הודעת שגיאה"""
    await manager.send_message(player_id, {
        'type': 'error',
        'data': {
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
    })