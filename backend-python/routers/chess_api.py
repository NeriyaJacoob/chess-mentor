# backend-python/routers/chess_api.py
"""
Simple HTTP Chess API - For AI Games Only
פשוט, יעיל, עובד
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from chess_engine import ChessEngine
import uuid
from typing import Dict, Optional
import time

router = APIRouter()

# In-memory storage for active games (simple dict)
active_games: Dict[str, ChessEngine] = {}
game_metadata: Dict[str, dict] = {}

def cleanup_old_games():
    """ניקוי משחקים ישנים (מעל 2 שעות)"""
    current_time = time.time()
    to_remove = []
    
    for game_id, metadata in game_metadata.items():
        if current_time - metadata['last_activity'] > 7200:  # 2 hours
            to_remove.append(game_id)
    
    for game_id in to_remove:
        if game_id in active_games:
            del active_games[game_id]
        if game_id in game_metadata:
            del game_metadata[game_id]
    
    if to_remove:
        print(f"🧹 Cleaned up {len(to_remove)} old games")

@router.post("/chess/new-game")
async def new_chess_game(request_data: dict):
    """יצירת משחק חדש נגד AI"""
    try:
        cleanup_old_games()
        
        ai_level = request_data.get('ai_level', 5)  # 1-10
        player_color = request_data.get('player_color', 'white')
        
        # Validate inputs
        ai_level = max(1, min(10, ai_level))
        if player_color not in ['white', 'black']:
            player_color = 'white'
        
        # Create new game
        game_id = str(uuid.uuid4())
        engine = ChessEngine()
        
        # Convert AI level (1-10) to Stockfish skill (0-20)
        stockfish_skill = (ai_level - 1) * 2
        engine.set_skill_level(stockfish_skill)
        
        # Initialize engine
        engine.start_engine()  # Remove await
        
        # Start new game
        game_state = engine.new_game()
        
        # Store game
        active_games[game_id] = engine
        game_metadata[game_id] = {
            'game_id': game_id,
            'ai_level': ai_level,
            'stockfish_skill': stockfish_skill,
            'player_color': player_color,
            'created_at': time.time(),
            'last_activity': time.time(),
            'moves_count': 0
        }
        
        print(f"🎮 New game created: {game_id[:8]} - AI Level {ai_level} (Stockfish {stockfish_skill})")
        
        # If player is black, AI makes first move
        ai_move_result = None
        if player_color == 'black':
            ai_move_result = engine.get_ai_move(time_limit=1.0)  # Remove await
            if ai_move_result['success']:
                game_metadata[game_id]['moves_count'] += 1
                game_metadata[game_id]['last_activity'] = time.time()
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'ai_level': ai_level,
            'ai_elo': engine._skill_to_elo(stockfish_skill),
            'player_color': player_color,
            'position': {
                'fen': engine.board.fen(),
                'turn': 'black' if engine.board.turn else 'white',
                'legal_moves': [move.uci() for move in engine.board.legal_moves],
                'move_count': len(engine.game_history),
                'is_check': engine.board.is_check(),
                'is_checkmate': engine.board.is_checkmate(),
                'is_game_over': engine.board.is_game_over()
            },
            'ai_move': ai_move_result if ai_move_result and ai_move_result['success'] else None
        })
        
    except Exception as e:
        print(f"❌ Error creating game: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create game: {str(e)}")

@router.post("/chess/move")
async def make_chess_move(request_data: dict):
    """ביצוע מהלך ומקבלת תגובה מהAI"""
    try:
        game_id = request_data.get('game_id')
        move = request_data.get('move')  # UCI format: "e2e4"
        
        if not game_id or not move:
            raise HTTPException(status_code=400, detail="game_id and move are required")
        
        # Find game
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        engine = active_games[game_id]
        metadata = game_metadata[game_id]
        
        # Update activity
        metadata['last_activity'] = time.time()
        
        # Make player move
        player_result = engine.make_move(move)
        if not player_result['success']:
            raise HTTPException(status_code=400, detail=player_result['error'])
        
        metadata['moves_count'] += 1
        print(f"♟️ Player move: {move} in game {game_id[:8]}")
        
        # Check if game over after player move
        if player_result['is_game_over']:
            return JSONResponse({
                'success': True,
                'game_id': game_id,
                'player_move': {
                    'move': move,
                    'san': player_result['san']
                },
                'position': {
                    'fen': player_result['fen'],
                    'turn': player_result['turn'],
                    'legal_moves': player_result['legal_moves'],
                    'move_count': player_result['move_count'],
                    'is_check': player_result['is_check'],
                    'is_checkmate': player_result['is_checkmate'],
                    'is_game_over': player_result['is_game_over']
                },
                'ai_move': None,
                'game_result': engine.get_game_result(),
                'game_over': True
            })
        
        # Get AI response
        ai_level = metadata['ai_level']
        think_time = 0.5 + (ai_level * 0.2)  # 0.7-2.5 seconds
        
        ai_result = engine.get_ai_move(time_limit=think_time)  # Remove await
        
        if not ai_result['success']:
            raise HTTPException(status_code=500, detail=f"AI error: {ai_result['error']}")
        
        metadata['moves_count'] += 1
        metadata['last_activity'] = time.time()
        
        print(f"🤖 AI response: {ai_result['move']} in game {game_id[:8]}")
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'player_move': {
                'move': move,
                'san': player_result['san']
            },
            'ai_move': {
                'move': ai_result['move'],
                'san': ai_result['san']
            },
            'position': {
                'fen': ai_result['fen'],
                'turn': ai_result['turn'],
                'legal_moves': ai_result['legal_moves'],
                'move_count': ai_result['move_count'],
                'is_check': ai_result['is_check'],
                'is_checkmate': ai_result['is_checkmate'],
                'is_game_over': ai_result['is_game_over']
            },
            'game_result': engine.get_game_result() if ai_result['is_game_over'] else None,
            'game_over': ai_result['is_game_over']
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error making move: {e}")
        raise HTTPException(status_code=500, detail=f"Move failed: {str(e)}")

@router.get("/chess/game/{game_id}")
async def get_game_state(game_id: str):
    """קבלת מצב המשחק הנוכחי"""
    try:
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        engine = active_games[game_id]
        metadata = game_metadata[game_id]
        
        position_info = engine.get_position_info()
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'metadata': {
                'ai_level': metadata['ai_level'],
                'player_color': metadata['player_color'],
                'moves_count': metadata['moves_count'],
                'created_at': metadata['created_at']
            },
            'position': position_info,
            'game_result': engine.get_game_result() if position_info['is_game_over'] else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting game state: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get game state: {str(e)}")

@router.post("/chess/resign")
async def resign_game(request_data: dict):
    """כניעה"""
    try:
        game_id = request_data.get('game_id')
        
        if not game_id:
            raise HTTPException(status_code=400, detail="game_id is required")
        
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        metadata = game_metadata[game_id]
        player_color = metadata['player_color']
        
        # Determine winner
        winner = 'black' if player_color == 'white' else 'white'
        result = f"{winner} wins by resignation"
        
        print(f"🏳️ Game {game_id[:8]} - Player resigned")
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'result': result,
            'game_over': True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error resigning: {e}")
        raise HTTPException(status_code=500, detail=f"Resign failed: {str(e)}")

@router.delete("/chess/game/{game_id}")
async def delete_game(game_id: str):
    """מחיקת משחק"""
    try:
        if game_id in active_games:
            engine = active_games[game_id]
            await engine.stop_engine()
            del active_games[game_id]
        
        if game_id in game_metadata:
            del game_metadata[game_id]
        
        print(f"🗑️ Game {game_id[:8]} deleted")
        
        return JSONResponse({
            'success': True,
            'message': 'Game deleted successfully'
        })
        
    except Exception as e:
        print(f"❌ Error deleting game: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/chess/games/active")
async def get_active_games():
    """רשימת משחקים פעילים (למטרות ניהול)"""
    try:
        cleanup_old_games()
        
        games_list = []
        for game_id, metadata in game_metadata.items():
            engine = active_games.get(game_id)
            if engine:
                games_list.append({
                    'game_id': game_id,
                    'ai_level': metadata['ai_level'],
                    'player_color': metadata['player_color'],
                    'moves_count': metadata['moves_count'],
                    'duration': int(time.time() - metadata['created_at']),
                    'is_game_over': engine.board.is_game_over() if engine.board else False
                })
        
        return JSONResponse({
            'success': True,
            'active_games': games_list,
            'total_games': len(games_list)
        })
        
    except Exception as e:
        print(f"❌ Error getting active games: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get active games: {str(e)}")

# Utility endpoint for testing
@router.post("/chess/test-engine")
async def test_stockfish_engine():
    """בדיקת Stockfish (לפיתוח)"""
    try:
        engine = ChessEngine()
        await engine.start_engine()
        
        # Test basic functionality
        game_state = engine.new_game()
        test_move = engine.make_move("e2e4")
        ai_move = await engine.get_ai_move(time_limit=1.0)
        
        await engine.stop_engine()
        
        return JSONResponse({
            'success': True,
            'message': 'Stockfish engine test passed',
            'test_results': {
                'initial_state': game_state,
                'player_move': test_move,
                'ai_move': ai_move
            }
        })
        
    except Exception as e:
        print(f"❌ Engine test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Engine test failed: {str(e)}")