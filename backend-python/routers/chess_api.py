# backend-python/routers/chess_api.py - Enhanced with game saving
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from chess_engine import ChessEngine
from database.mongo_client import mongodb
import uuid
import time

router = APIRouter()

# In-memory storage for active games
active_games = {}
game_metadata = {}

@router.post("/chess/new-game")
async def new_chess_game(request_data: dict):
    """יצירת משחק חדש נגד AI"""
    try:
        user_id = request_data.get('user_id')  # NEW: Get user ID
        ai_level = request_data.get('ai_level', 5)
        player_color = request_data.get('player_color', 'white')
        
        game_id = str(uuid.uuid4())
        engine = ChessEngine()
        
        stockfish_skill = (ai_level - 1) * 2
        engine.set_skill_level(stockfish_skill)
        engine.start_engine()
        
        game_state = engine.new_game()
        
        # Store game with user_id
        active_games[game_id] = engine
        game_metadata[game_id] = {
            'game_id': game_id,
            'user_id': user_id,  # NEW: Track user
            'ai_level': ai_level,
            'player_color': player_color,
            'created_at': time.time(),
            'moves': [],
            'positions': [engine.board.fen()],  # NEW: Track all positions
            'game_result': None
        }
        
        # If player is black, AI makes first move
        ai_move_result = None
        if player_color == 'black':
            ai_move_result = engine.get_ai_move(time_limit=1.0)
            if ai_move_result['success']:
                game_metadata[game_id]['moves'].append(ai_move_result['san'])
                game_metadata[game_id]['positions'].append(engine.board.fen())
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'ai_level': ai_level,
            'player_color': player_color,
            'position': {
                'fen': engine.board.fen(),
                'turn': 'black' if engine.board.turn else 'white',
                'legal_moves': [move.uci() for move in engine.board.legal_moves],
            },
            'ai_move': ai_move_result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chess/move")
async def make_chess_move(request_data: dict):
    """ביצוע מהלך ומקבלת תגובה מהAI"""
    try:
        game_id = request_data.get('game_id')
        move = request_data.get('move')
        
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        engine = active_games[game_id]
        metadata = game_metadata[game_id]
        
        # Make player move
        player_result = engine.make_move(move)
        if not player_result['success']:
            raise HTTPException(status_code=400, detail=player_result['error'])
        
        # Store player move
        metadata['moves'].append(player_result['san'])
        metadata['positions'].append(engine.board.fen())
        
        # Check if game over after player move
        if player_result['is_game_over']:
            result = engine.get_game_result()
            metadata['game_result'] = result
            
            # Save to MongoDB if user_id exists
            if metadata.get('user_id'):
                await save_game_to_db(game_id)
            
            return JSONResponse({
                'success': True,
                'game_id': game_id,
                'player_move': {'move': move, 'san': player_result['san']},
                'position': {
                    'fen': player_result['fen'],
                    'turn': player_result['turn'],
                    'legal_moves': player_result['legal_moves'],
                },
                'ai_move': None,
                'game_result': result,
                'game_over': True
            })
        
        # Get AI response
        ai_result = engine.get_ai_move(time_limit=0.5 + (metadata['ai_level'] * 0.2))
        
        if not ai_result['success']:
            raise HTTPException(status_code=500, detail=f"AI error: {ai_result['error']}")
        
        # Store AI move
        metadata['moves'].append(ai_result['san'])
        metadata['positions'].append(engine.board.fen())
        
        # Check if game over after AI move
        if ai_result['is_game_over']:
            result = engine.get_game_result()
            metadata['game_result'] = result
            
            # Save to MongoDB if user_id exists
            if metadata.get('user_id'):
                await save_game_to_db(game_id)
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'player_move': {'move': move, 'san': player_result['san']},
            'ai_move': {'move': ai_result['move'], 'san': ai_result['san']},
            'position': {
                'fen': ai_result['fen'],
                'turn': ai_result['turn'],
                'legal_moves': ai_result['legal_moves'],
            },
            'game_result': metadata['game_result'],
            'game_over': ai_result['is_game_over']
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def save_game_to_db(game_id: str):
    """Save completed game to MongoDB"""
    try:
        metadata = game_metadata[game_id]
        
        game_data = {
            'moves': metadata['moves'],
            'positions': metadata['positions'],
            'result': metadata['game_result'],
            'ai_level': metadata['ai_level'],
            'player_color': metadata['player_color'],
            'duration': int(time.time() - metadata['created_at'])
        }
        
        saved_id = await mongodb.save_game(metadata['user_id'], game_data)
        print(f"💾 Game saved to MongoDB: {saved_id}")
        
        # Clean up memory
        if game_id in active_games:
            await active_games[game_id].stop_engine()
            del active_games[game_id]
        if game_id in game_metadata:
            del game_metadata[game_id]
            
    except Exception as e:
        print(f"❌ Failed to save game: {e}")

@router.post("/chess/resign")
async def resign_game(request_data: dict):
    """כניעה"""
    try:
        game_id = request_data.get('game_id')
        
        if game_id not in game_metadata:
            raise HTTPException(status_code=404, detail="Game not found")
        
        metadata = game_metadata[game_id]
        player_color = metadata['player_color']
        
        winner = 'black' if player_color == 'white' else 'white'
        result = f"{winner} wins by resignation"
        metadata['game_result'] = result
        
        # Save to MongoDB if user_id exists
        if metadata.get('user_id'):
            await save_game_to_db(game_id)
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'result': result,
            'game_over': True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))