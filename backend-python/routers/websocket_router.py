# backend-python/routers/websocket_router.py - FIXED FOR STOCKFISH
"""
WebSocket Routes - עם מנוע Stockfish אמיתי
"""

import json
import uuid
import asyncio
import time
from datetime import datetime
import chess
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.mock_data import mock_db
from chess_engine import chess_engine, init_engine

router = APIRouter()

class WebSocketManager:
    """מנהל חיבורי WebSocket עם מנוע שחמט"""
    
    def __init__(self):
        self.active_connections: dict = {}
        self.engine_initialized = False
    
    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = {
            'websocket': websocket,
            'player_data': None,
            'game_data': None
        }
        
        # אתחול מנוע אם צריך
        if not self.engine_initialized:
            try:
                await init_engine(skill_level=5)  # רמה בינונית
                self.engine_initialized = True
                print("🤖 Chess engine initialized")
            except Exception as e:
                print(f"❌ Failed to initialize chess engine: {e}")
    
    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
    
    async def send_message(self, player_id: str, message: dict):
        if player_id in self.active_connections:
            try:
                websocket = self.active_connections[player_id]['websocket']
                await websocket.send_text(json.dumps(message))
                return True
            except:
                self.disconnect(player_id)
                return False
        return False

manager = WebSocketManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    player_id = str(uuid.uuid4())
    await manager.connect(websocket, player_id)
    
    try:
        print(f"🔗 Player connected: {player_id[:8]}")
        
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await handle_websocket_message(player_id, message)
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

async def handle_websocket_message(player_id: str, message: dict):
    """טיפול בהודעות WebSocket"""
    action = message.get('action')
    data = message.get('data', {})
    
    print(f"📨 {action} from {player_id[:8]}")
    
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
    ai_level = data.get('ai_level', 5)  # 1-10 (נמיר ל0-20)
    
    if mode == 'ai':
        await start_ai_game(player_id, ai_level)
    else:
        await send_error(player_id, "Only AI games are supported currently")

async def start_ai_game(player_id: str, ai_level: int = 5):
    """התחלת משחק נגד AI עם Stockfish"""
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
                'player_color': 'white',  # השחקן תמיד לבן
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
                'position': {
                    'fen': game_state['fen'],
                    'legal_moves': game_state['legal_moves'],
                    'turn': game_state['turn'],
                    'move_count': game_state['move_count']
                }
            }
        })
        
        print(f"🤖 Started AI game {game_id[:8]} - Level {ai_level} (Stockfish {stockfish_level})")
        
    except Exception as e:
        print(f"❌ Failed to start AI game: {e}")
        await send_error(player_id, f"Failed to start game: {str(e)}")

async def handle_make_move(player_id: str, data: dict):
    """טיפול במהלך השחקן"""
    move_uci = data.get('move')
    if not move_uci:
        await send_error(player_id, "Move is required")
        return
    
    # בדיקת נתונים
    connection = manager.active_connections.get(player_id)
    if not connection or not connection.get('player_data', {}).get('is_in_game'):
        await send_error(player_id, "Not in game")
        return
    
    game_data = connection.get('game_data')
    if not game_data:
        await send_error(player_id, "Game data not found")
        return
    
    try:
        # ביצוע מהלך השחקן
        result = chess_engine.make_move(move_uci)
        
        if not result['success']:
            await send_error(player_id, result['error'])
            return
        
        print(f"♟️ Player move: {move_uci} ({result['san']})")
        
        # שליחת עדכון על מהלך השחקן
        await manager.send_message(player_id, {
            'type': 'move_made',
            'data': {
                'move': move_uci,
                'san': result['san'],
                'player': connection['player_data']['name'],
                'position': {
                    'fen': result['fen'],
                    'legal_moves': result['legal_moves'],
                    'turn': result['turn'],
                    'move_count': result['move_count'],
                    'is_check': result['is_check'],
                    'is_checkmate': result['is_checkmate'],
                    'is_game_over': result['is_game_over']
                }
            }
        })
        
        # בדיקה אם המשחק נגמר
        if result['is_game_over']:
            await end_game(player_id, result)
            return
        
        # תור של AI - רק אם זה תור השחור
        if result['turn'] == 'black':
            await make_ai_move(player_id)
            
    except Exception as e:
        print(f"❌ Move error: {e}")
        await send_error(player_id, f"Move failed: {str(e)}")

async def make_ai_move(player_id: str):
    """ביצוע מהלך AI עם Stockfish"""
    try:
        # זמן חשיבה בהתאם לרמה
        connection = manager.active_connections.get(player_id)
        game_data = connection.get('game_data', {})
        ai_level = game_data.get('ai_level', 5)
        
        # זמן חשיבה: רמה נמוכה = פחות זמן
        think_time = 0.5 + (ai_level * 0.2)  # 0.7-2.5 שניות
        
        print(f"🤖 AI thinking... (Level {ai_level}, Time: {think_time}s)")
        
        # קבלת מהלך מהמנוע
        result = await chess_engine.get_ai_move(time_limit=think_time)
        
        if not result['success']:
            await send_error(player_id, f"AI error: {result['error']}")
            return
        
        print(f"🤖 AI move: {result['move']} ({result['san']})")
        
        # שליחת מהלך AI
        await manager.send_message(player_id, {
            'type': 'move_made',
            'data': {
                'move': result['move'],
                'san': result['san'],
                'player': 'ChessMentor AI',
                'position': {
                    'fen': result['fen'],
                    'legal_moves': result['legal_moves'],
                    'turn': result['turn'],
                    'move_count': result['move_count'],
                    'is_check': result['is_check'],
                    'is_checkmate': result['is_checkmate'],
                    'is_game_over': result['is_game_over']
                }
            }
        })
        
        # בדיקה אם המשחק נגמר
        if result['is_game_over']:
            await end_game(player_id, result)
            
    except Exception as e:
        print(f"❌ AI move error: {e}")
        await send_error(player_id, f"AI move failed: {str(e)}")

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
            'elo': chess_engine._skill_to_elo(stockfish_level),
            'message': f'AI level set to {ai_level}'
        }
    })

async def handle_resign(player_id: str, data: dict):
    """כניעה"""
    connection = manager.active_connections.get(player_id)
    if not connection or not connection.get('player_data', {}).get('is_in_game'):
        return
    
    await end_game(player_id, {
        'result': 'black wins by resignation',
        'reason': 'Player resigned'
    })

async def end_game(player_id: str, game_result: dict):
    """סיום משחק"""
    try:
        # קביעת תוצאה
        if 'result' in game_result:
            result = game_result['result']
        elif game_result.get('is_checkmate'):
            current_turn = chess_engine.board.turn
            winner = "black" if current_turn == chess.BLACK else "white"
            result = f"{winner} wins by checkmate"
        elif game_result.get('is_stalemate'):
            result = "draw by stalemate"
        else:
            result = chess_engine.get_game_result()
        
        print(f"🏁 Game ended: {result}")
        
        await manager.send_message(player_id, {
            'type': 'game_end',
            'data': {
                'result': result,
                'final_position': chess_engine.get_position_info(),
                'reason': game_result.get('reason', 'Game completed')
            }
        })
        
        # ניקוי נתוני משחק
        connection = manager.active_connections.get(player_id)
        if connection:
            if connection.get('player_data'):
                connection['player_data']['is_in_game'] = False
                connection['player_data']['game_id'] = None
            connection['game_data'] = None
            
    except Exception as e:
        print(f"❌ End game error: {e}")

def handle_disconnect(player_id: str):
    """טיפול בניתוק"""
    print(f"🔌 Player disconnected: {player_id[:8]}")
    manager.disconnect(player_id)

async def send_error(player_id: str, error_message: str):
    """שליחת שגיאה"""
    await manager.send_message(player_id, {
        'type': 'error',
        'data': {'message': error_message}
    })
    print(f"❌ Error sent to {player_id[:8]}: {error_message}")