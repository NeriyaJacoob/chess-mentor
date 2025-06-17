"""
ChessMentor Python Server
FastAPI + WebSocket + Stockfish Integration
"""

import asyncio
import json
import uuid
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import our chess modules
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

class ChessServer:
    def __init__(self, stockfish_path: str):
        self.app = FastAPI(title="ChessMentor Chess Server", version="1.0.0")
        self.stockfish_path = stockfish_path
        
        # Game storage
        self.games: Dict[str, GameSession] = {}
        self.players: Dict[str, Player] = {}
        self.waiting_queue: List[Player] = []
        
        self.setup_app()

    def setup_app(self):
        # CORS for React frontend
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Health check endpoint
        @self.app.get("/health")
        async def health_check():
            return {
                "status": "OK",
                "server": "ChessMentor Chess Server",
                "active_games": len(self.games),
                "connected_players": len(self.players),
                "players_in_queue": len(self.waiting_queue),
                "stockfish_path": self.stockfish_path
            }

        # Game info endpoint
        @self.app.get("/games")
        async def get_games():
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

    async def handle_websocket(self, websocket: WebSocket):
        await websocket.accept()
        player_id = str(uuid.uuid4())
        
        try:
            print(f"🔗 Player connected: {player_id}")
            
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self.handle_message(websocket, player_id, message)
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await self.send_error(websocket, "Invalid JSON format")
                except Exception as e:
                    print(f"❌ Message handling error: {e}")
                    await self.send_error(websocket, str(e))
                    
        except WebSocketDisconnect:
            pass
        finally:
            await self.handle_disconnect(player_id)

    async def handle_message(self, websocket: WebSocket, player_id: str, message: dict):
        action = message.get('action')
        data = message.get('data', {})
        
        print(f"📨 Received {action} from {player_id}")
        
        if action == 'join':
            await self.handle_join(websocket, player_id, data)
        elif action == 'find_game':
            await self.handle_find_game(player_id, data.get('mode', 'ai'))
        elif action == 'make_move':
            await self.handle_move(player_id, data)
        elif action == 'get_position':
            await self.handle_get_position(player_id)
        elif action == 'resign':
            await self.handle_resign(player_id)
        elif action == 'analyze_move':
            await self.handle_analyze_move(player_id, data)
        else:
            await self.send_error(websocket, f"Unknown action: {action}")

    async def handle_join(self, websocket: WebSocket, player_id: str, data: dict):
        player = Player(
            id=player_id,
            websocket=websocket,
            name=data.get('name', f'Player_{player_id[:8]}'),
            elo=data.get('elo', 1200)
        )
        
        self.players[player_id] = player
        
        await self.send_message(websocket, {
            'type': 'connected',
            'data': {
                'player_id': player_id,
                'name': player.name,
                'elo': player.elo,
                'message': 'Connected to ChessMentor Chess Server'
            }
        })

    async def handle_find_game(self, player_id: str, mode: str):
        player = self.players.get(player_id)
        if not player or player.is_in_game:
            return

        print(f"🎮 {player.name} looking for {mode} game")

        if mode == 'ai':
            await self.start_ai_game(player)
        else:
            await self.find_multiplayer_game(player)

    async def start_ai_game(self, player: Player):
        game_id = str(uuid.uuid4())
        
        # Create chess game instance
        chess_game = ChessGame(self.stockfish_path, elo_level=1500)
        chess_coach = ChessCoach(chess_game.engine) if chess_game.engine else None
        
        if not chess_game.engine:
            await self.send_error(player.websocket, "Stockfish engine not available")
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
        
        await self.send_message(player.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white',
                'opponent': {'name': 'ChessMentor AI', 'elo': 1500},
                'position': chess_game.get_position_info()
            }
        })

    async def find_multiplayer_game(self, player: Player):
        # Simple matchmaking
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
            await self.send_message(player.websocket, {
                'type': 'searching',
                'data': {'message': f'Looking for opponent (ELO ~{player.elo})...'}
            })
            
            # Auto-timeout after 30 seconds
            await asyncio.sleep(30)
            if player in self.waiting_queue:
                self.waiting_queue.remove(player)
                await self.send_message(player.websocket, {
                    'type': 'search_timeout',
                    'data': {'message': 'No opponent found. Try AI mode?'}
                })

    async def start_multiplayer_game(self, player1: Player, player2: Player):
        game_id = str(uuid.uuid4())
        
        # Random colors
        import random
        is_player1_white = random.choice([True, False])
        
        white_player = player1 if is_player1_white else player2
        black_player = player2 if is_player1_white else player1
        
        # Create chess game
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
        
        # Update players
        for p in [player1, player2]:
            p.is_in_game = True
            p.game_id = game_id
        
        print(f"👥 Started multiplayer game {game_id}: {white_player.name} vs {black_player.name}")
        
        # Notify both players
        await self.send_message(player1.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'white' if is_player1_white else 'black',
                'opponent': {'name': player2.name, 'elo': player2.elo},
                'position': chess_game.get_position_info()
            }
        })
        
        await self.send_message(player2.websocket, {
            'type': 'game_start',
            'data': {
                'game_id': game_id,
                'color': 'black' if is_player1_white else 'white',
                'opponent': {'name': player1.name, 'elo': player1.elo},
                'position': chess_game.get_position_info()
            }
        })

    async def handle_move(self, player_id: str, data: dict):
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game or game.status != 'active':
            return
        
        # Determine player color
        player_color = 'white' if game.white_player.id == player_id else 'black'
        current_turn = 'white' if game.chess_game.board.turn else 'black'
        
        if current_turn != player_color:
            await self.send_error(player.websocket, "Not your turn")
            return
        
        # Make the move
        move_uci = data.get('move')
        if not move_uci:
            await self.send_error(player.websocket, "Move required")
            return
        
        success = game.chess_game.player_move(move_uci)
        if not success:
            await self.send_error(player.websocket, f"Invalid move: {move_uci}")
            return
        
        print(f"♟️ {player.name} played {move_uci}")
        
        # Broadcast move to all players in game
        await self.broadcast_to_game(game.id, {
            'type': 'move_made',
            'data': {
                'move': move_uci,
                'player': player.name,
                'position': game.chess_game.get_position_info()
            }
        })
        
        # Check game over
        if game.chess_game.is_game_over():
            await self.end_game(game.id)
            return
        
        # AI response for AI games
        if game.type == 'ai' and current_turn == 'white':  # Player just moved as white
            await self.make_ai_move(game.id)

    async def make_ai_move(self, game_id: str):
        game = self.games.get(game_id)
        if not game:
            return
        
        print("🤖 AI thinking...")
        
        # Add small delay for realism
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
            
            # Check game over
            if game.chess_game.is_game_over():
                await self.end_game(game_id)

    async def handle_analyze_move(self, player_id: str, data: dict):
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game or not game.chess_coach:
            await self.send_error(player.websocket, "Analysis not available")
            return
        
        move_uci = data.get('move')
        if not move_uci:
            await self.send_error(player.websocket, "Move required for analysis")
            return
        
        try:
            import chess
            move = chess.Move.from_uci(move_uci)
            explanation = game.chess_coach.explain_move(game.chess_game.board, move, player.elo)
            analysis = game.chess_coach.analyze_position(game.chess_game.board)
            
            await self.send_message(player.websocket, {
                'type': 'move_analysis',
                'data': {
                    'move': move_uci,
                    'explanation': explanation,
                    'analysis': analysis
                }
            })
        except Exception as e:
            await self.send_error(player.websocket, f"Analysis failed: {e}")

    async def handle_get_position(self, player_id: str):
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game:
            return
        
        await self.send_message(player.websocket, {
            'type': 'position_update',
            'data': {
                'position': game.chess_game.get_position_info()
            }
        })

    async def handle_resign(self, player_id: str):
        player = self.players.get(player_id)
        if not player or not player.is_in_game:
            return
        
        game = self.games.get(player.game_id)
        if not game:
            return
        
        # Determine winner
        player_color = 'white' if game.white_player.id == player_id else 'black'
        winner = 'black' if player_color == 'white' else 'white'
        
        await self.end_game(game.id, f"{winner.title()} wins by resignation")

    async def handle_disconnect(self, player_id: str):
        player = self.players.get(player_id)
        if not player:
            return
        
        print(f"🔌 Player disconnected: {player.name}")
        
        # Remove from waiting queue
        if player in self.waiting_queue:
            self.waiting_queue.remove(player)
        
        # Handle game disconnection
        if player.is_in_game and player.game_id:
            game = self.games.get(player.game_id)
            if game and game.type == 'multiplayer' and game.black_player:
                # Notify opponent
                opponent = game.black_player if game.white_player.id == player_id else game.white_player
                await self.send_message(opponent.websocket, {
                    'type': 'opponent_disconnected',
                    'data': {'message': f'{player.name} disconnected'}
                })
                
                # End game after short delay
                await asyncio.sleep(10)
                if game.id in self.games:
                    player_color = 'white' if game.white_player.id == player_id else 'black'
                    winner = 'black' if player_color == 'white' else 'white'
                    await self.end_game(game.id, f"{winner.title()} wins by abandonment")
        
        # Cleanup
        if player_id in self.players:
            del self.players[player_id]

    async def end_game(self, game_id: str, result: str = None):
        game = self.games.get(game_id)
        if not game:
            return
        
        if not result:
            result = game.chess_game.get_result()
        
        game.status = 'finished'
        
        print(f"🏁 Game {game_id} ended: {result}")
        
        # Update players
        for player in [game.white_player, game.black_player]:
            if player:
                player.is_in_game = False
                player.game_id = None
        
        # Notify players
        await self.broadcast_to_game(game_id, {
            'type': 'game_end',
            'data': {
                'result': result,
                'pgn': game.chess_game.get_game_pgn(),
                'final_position': game.chess_game.get_position_info()
            }
        })
        
        # Close chess engine
        game.chess_game.close()
        
        # Clean up after delay
        await asyncio.sleep(60)
        if game_id in self.games:
            del self.games[game_id]

    async def send_message(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"❌ Failed to send message: {e}")

    async def send_error(self, websocket: WebSocket, error_message: str):
        await self.send_message(websocket, {
            'type': 'error',
            'data': {'message': error_message}
        })

    async def broadcast_to_game(self, game_id: str, message: dict):
        game = self.games.get(game_id)
        if not game:
            return
        
        for player in [game.white_player, game.black_player]:
            if player and player.websocket:
                await self.send_message(player.websocket, message)

    def run(self, host: str = "localhost", port: int = 5001):
        print(f"🚀 ChessMentor Chess Server starting...")
        print(f"📍 Server: {host}:{port}")
        print(f"🐟 Stockfish: {self.stockfish_path}")
        print(f"🌐 WebSocket: ws://{host}:{port}/ws")
        print(f"💚 Health: http://{host}:{port}/health")
        
        uvicorn.run(self.app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    # Update this path to your Stockfish location
    STOCKFISH_PATH = "C:\\Users\\Neriya\\Downloads\\stockfish-windows-x86-64-avx2\\stockfish\\stockfish-windows-x86-64-avx2.exe"

    server = ChessServer(STOCKFISH_PATH)
    server.run()