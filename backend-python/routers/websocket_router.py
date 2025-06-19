# backend-python/routers/websocket_router.py  
"""
WebSocket Routes - טיפול בחיבורי WebSocket
"""

import json
import uuid
import asyncio
import random
import time
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.mock_data import mock_db

router = APIRouter()

class WebSocketManager:
    """מנהל חיבורי WebSocket"""
    
    def __init__(self):
        self.active_connections: dict = {}
    
    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = {
            'websocket': websocket,
            'player_data': None
        }
    
    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
    
    async def send_message(self, player_id: str, message: dict):
        if player_id in self.active_connections:
            try:
                websocket = self.active_connections[player_id]['websocket']
                await websocket.send_text(json.dumps(message))
            except:
                self.disconnect(player_id)
    
    async def broadcast_to_game(self, game_id: str, message: dict):
        """שידור הודעה לכל השחקנים במשחק"""
        game = mock_db.games.get(game_id)
        if not game:
            return
        
        players = [game['white_player'], game['black_player']]
        for player_id in players:
            if player_id != 'AI':  # לא לשלוח ל-AI
                await self.send_message(player_id, message)

manager = WebSocketManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    player_id = str(uuid.uuid4())
    await manager.connect(websocket, player_id)
    
    try:
        print(f"🔗 Player connected: {player_id}")
        
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
        'make_move': handle_move,
        'resign': handle_resign,
        'chat_message': handle_chat,
        'get_position': handle_get_position,
        'analyze_move': handle_analyze_move
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
            'message': 'Connected to ChessMentor Server'
        }
    })

async def handle_find_game(player_id: str, data: dict):
    """חיפוש משחק"""
    mode = data.get('mode', 'ai')
    
    if mode == 'ai':
        await start_ai_game(player_id)
    else:
        await find_multiplayer_game(player_id)

async def start_ai_game(player_id: str):
    """התחלת משחק AI"""
    game_id = mock_db.create_game('ai', player_id, 'AI')
    
    # עדכון השחקן
    if player_id in manager.active_connections:
        manager.active_connections[player_id]['player_data']['is_in_game'] = True
        manager.active_connections[player_id]['player_data']['game_id'] = game_id
    
    await manager.send_message(player_id, {
        'type': 'game_start',
        'data': {
            'game_id': game_id,
            'color': 'white',
            'opponent': {'name': 'ChessMentor AI', 'elo': 1500},
            'position': get_starting_position()
        }
    })
    
    print(f"🤖 Started AI game {game_id}")

async def find_multiplayer_game(player_id: str):
    """חיפוש משחק מולטיפלייר"""
    # חיפוש יריב בתור
    opponent_id = None
    for waiting_player in mock_db.waiting_queue:
        if waiting_player != player_id:
            opponent_id = waiting_player
            break
    
    if opponent_id:
        mock_db.waiting_queue.remove(opponent_id)
        await start_multiplayer_game(player_id, opponent_id)
    else:
        mock_db.waiting_queue.append(player_id)
        await manager.send_message(player_id, {
            'type': 'searching',
            'data': {'message': 'Looking for opponent...'}
        })

async def start_multiplayer_game(player1_id: str, player2_id: str):
    """התחלת משחק מולטיפלייר"""
    # קביעת צבעים רנדומלית
    is_player1_white = random.choice([True, False])
    white_player = player1_id if is_player1_white else player2_id
    black_player = player2_id if is_player1_white else player1_id
    
    game_id = mock_db.create_game('multiplayer', white_player, black_player)
    
    # הודעה לשני השחקנים
    for i, pid in enumerate([player1_id, player2_id]):
        color = 'white' if (i == 0 and is_player1_white) or (i == 1 and not is_player1_white) else 'black'
        opponent_name = f'Player_{player2_id[:8]}' if i == 0 else f'Player_{player1_id[:8]}'
        
        await manager.send_message(pid, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': color,
                'opponent': {'name': opponent_name, 'elo': 1200},
                'position': get_starting_position()
            }
        })

async def handle_move(player_id: str, data: dict):
    """טיפול במהלך"""
    move = data.get('move')
    if not move:
        return
    
    # מציאת המשחק
    player_data = manager.active_connections.get(player_id, {}).get('player_data')
    if not player_data or not player_data.get('is_in_game'):
        return
    
    game_id = player_data.get('game_id')
    game = mock_db.games.get(game_id)
    if not game:
        return
    
    # הוספת המהלך
    game['moves'].append(move)
    move_count = len(game['moves'])
    
    print(f"♟️ Move: {move} in game {game_id}")
    
    # שידור המהלך
    await manager.broadcast_to_game(game_id, {
        'type': 'move_made',
        'data': {
            'move': move,
            'player': player_data['name'],
            'position': get_mock_position(move_count)
        }
    })
    
    # מהלך AI אם צריך
    if game['type'] == 'ai' and move_count % 2 == 1:
        await make_ai_move(game_id)

async def make_ai_move(game_id: str):
    """מהלך AI"""
    await asyncio.sleep(0.5)  # זמן חשיבה
    
    ai_moves = ['e7e5', 'd7d6', 'g8f6', 'b8c6', 'f7f6']
    ai_move = random.choice(ai_moves)
    
    game = mock_db.games.get(game_id)
    if game:
        game['moves'].append(ai_move)
        move_count = len(game['moves'])
        
        print(f"🤖 AI played: {ai_move}")
        
        await manager.broadcast_to_game(game_id, {
            'type': 'move_made',
            'data': {
                'move': ai_move,
                'player': 'ChessMentor AI',
                'position': get_mock_position(move_count)
            }
        })

async def handle_resign(player_id: str, data: dict):
    """כניעה"""
    player_data = manager.active_connections.get(player_id, {}).get('player_data')
    if not player_data or not player_data.get('is_in_game'):
        return
    
    game_id = player_data.get('game_id')
    game = mock_db.games.get(game_id)
    if not game:
        return
    
    # קביעת המנצח
    winner = 'black' if game['white_player'] == player_id else 'white'
    
    await end_game(game_id, f"{winner.title()} wins by resignation")

async def handle_chat(player_id: str, data: dict):
    """טיפול בצ'אט"""
    message = data.get('message', '').strip()
    if not message:
        return
    
    player_data = manager.active_connections.get(player_id, {}).get('player_data')
    if not player_data or not player_data.get('is_in_game'):
        return
    
    game_id = player_data.get('game_id')
    chat_message = {
        'player': player_data['name'],
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    
    await manager.broadcast_to_game(game_id, {
        'type': 'chat_message',
        'data': chat_message
    })

async def handle_get_position(player_id: str, data: dict):
    """קבלת מצב הלוח"""
    player_data = manager.active_connections.get(player_id, {}).get('player_data')
    if not player_data or not player_data.get('is_in_game'):
        return
    
    game_id = player_data.get('game_id')
    game = mock_db.games.get(game_id)
    if not game:
        return
    
    await manager.send_message(player_id, {
        'type': 'position_update',
        'data': {
            'position': get_mock_position(len(game['moves']))
        }
    })

async def handle_analyze_move(player_id: str, data: dict):
    """ניתוח מהלך"""
    move = data.get('move')
    if not move:
        return
    
    # ניתוח דמה
    analysis = {
        'move': move,
        'explanation': f"המהלך {move} הוא מהלך סביר. זה מפתח את הכלים ושולט במרכז.",
        'analysis': {
            'evaluation': random.randint(-100, 100) / 100,
            'best_move': random.choice(['e2e4', 'd2d4', 'g1f3']),
            'depth': 8
        }
    }
    
    await manager.send_message(player_id, {
        'type': 'move_analysis',
        'data': analysis
    })

async def end_game(game_id: str, result: str):
    """סיום משחק"""
    game = mock_db.games.get(game_id)
    if not game:
        return
    
    game['status'] = 'finished'
    game['result'] = result
    
    print(f"🏁 Game {game_id} ended: {result}")
    
    await manager.broadcast_to_game(game_id, {
        'type': 'game_end',
        'data': {
            'result': result,
            'final_position': get_mock_position(len(game['moves']))
        }
    })
    
    # ניקוי שחקנים
    for player_id in manager.active_connections:
        player_data = manager.active_connections[player_id].get('player_data')
        if player_data and player_data.get('game_id') == game_id:
            player_data['is_in_game'] = False
            player_data['game_id'] = None

def handle_disconnect(player_id: str):
    """טיפול בניתוק"""
    print(f"🔌 Player disconnected: {player_id}")
    
    # הסרה מתור המתנה
    if player_id in mock_db.waiting_queue:
        mock_db.waiting_queue.remove(player_id)
    
    # ניקוי חיבור
    manager.disconnect(player_id)

async def send_error(player_id: str, error_message: str):
    """שליחת שגיאה"""
    await manager.send_message(player_id, {
        'type': 'error',
        'data': {'message': error_message}
    })

def get_starting_position() -> dict:
    """מיקום התחלתי של המשחק"""
    return {
        'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'turn': 'white',
        'legal_moves': ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'g1h3', 'b1a3'],
        'move_count': 0,
        'is_check': False,
        'is_checkmate': False,
        'is_game_over': False
    }

def get_mock_position(move_count: int) -> dict:
    """מיקום דמה לפי מספר מהלכים"""
    return {
        'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',  # FEN קבוע לפשטות
        'turn': 'black' if move_count % 2 == 1 else 'white',
        'legal_moves': ['e2e4', 'd2d4', 'g1f3'] if move_count % 2 == 0 else ['e7e5', 'd7d6', 'g8f6'],
        'move_count': move_count,
        'is_check': False,
        'is_checkmate': False,
        'is_game_over': move_count >= 50  # סיום אחרי 50 מהלכים
    }