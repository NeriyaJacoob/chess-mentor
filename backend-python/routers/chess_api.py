# backend-python/routers/chess_api.py - Fast Response Version
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from chess_engine import ChessEngine
from database.mongo_client import mongodb
import uuid
import time
import asyncio

router = APIRouter()

# In-memory storage for active games
active_games = {}
game_metadata = {}

@router.post("/chess/new-game")
async def new_chess_game(request_data: dict):
    """יצירת משחק חדש מהיר נגד AI"""
    try:
        user_id = request_data.get('user_id')
        ai_level = request_data.get('ai_level', 3)  # ✅ רמה נמוכה יותר כברירת מחדל
        player_color = request_data.get('player_color', 'white')
        
        # ✅ הגבל רמת AI למהירות
        ai_level = max(1, min(8, ai_level))
        
        game_id = str(uuid.uuid4())
        engine = ChessEngine()
        
        # ✅ הגדרות מהירות
        stockfish_skill = ai_level  # ישיר ללא הכפלה
        engine.set_skill_level(stockfish_skill)
        engine.set_fast_mode(True)  # מצב מהיר
        
        print(f"🎮 Starting FAST game {game_id[:8]} - Level {ai_level}")
        
        # ✅ אתחול מהיר עם timeout
        start_time = time.time()
        engine.start_engine()
        init_time = time.time() - start_time
        print(f"⚡ Engine started in {init_time:.2f}s")
        
        game_state = engine.new_game()
        
        # Store game with metadata
        active_games[game_id] = engine
        game_metadata[game_id] = {
            'game_id': game_id,
            'user_id': user_id,
            'ai_level': ai_level,
            'player_color': player_color,
            'created_at': time.time(),
            'moves': [],
            'positions': [engine.board.fen()],
            'game_result': None,
            'fast_mode': True
        }
        
        # ✅ אם השחקן שחור, AI מהיר ראשון
        ai_move_result = None
        if player_color == 'black':
            print(f"🤖 AI making opening move...")
            start_time = time.time()
            ai_move_result = engine.get_ai_move(time_limit=0.3)  # מהלך פתיחה מהיר
            move_time = time.time() - start_time
            
            if ai_move_result['success']:
                game_metadata[game_id]['moves'].append(ai_move_result['san'])
                game_metadata[game_id]['positions'].append(engine.board.fen())
                print(f"⚡ AI opened with {ai_move_result['san']} in {move_time:.2f}s")
        
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
            'ai_move': ai_move_result,
            'fast_mode': True,
            'init_time': init_time
        })
        
    except Exception as e:
        print(f"❌ Failed to create fast game: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chess/move")
async def make_chess_move(request_data: dict):
    """ביצוע מהלך מהיר עם תגובת AI"""
    try:
        game_id = request_data.get('game_id')
        move = request_data.get('move')
        
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        engine = active_games[game_id]
        metadata = game_metadata[game_id]
        
        print(f"🎯 Processing move {move} in game {game_id[:8]}")
        
        # ✅ מהלך השחקן מהיר
        start_time = time.time()
        player_result = engine.make_move(move)
        player_time = time.time() - start_time
        
        if not player_result['success']:
            raise HTTPException(status_code=400, detail=player_result['error'])
        
        # Store player move
        metadata['moves'].append(player_result['san'])
        metadata['positions'].append(engine.board.fen())
        
        print(f"✅ Player move {player_result['san']} processed in {player_time:.3f}s")
        
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
        
        # ✅ תגובת AI מהירה
        print(f"🤖 AI thinking (Level {metadata['ai_level']})...")
        ai_start_time = time.time()
        
        # חישוב זמן חשיבה לפי רמה
        think_times = {
            1: 0.1,  # מיידי
            2: 0.15, # מהיר מאוד  
            3: 0.2,  # מהיר
            4: 0.3,  # נורמלי
            5: 0.4,  # בינוני
            6: 0.5,  # חכם
            7: 0.6,  # מומחה
            8: 0.8   # רמה גבוהה
        }
        
        think_time = think_times.get(metadata['ai_level'], 0.3)
        ai_result = engine.get_ai_move(time_limit=think_time)
        ai_total_time = time.time() - ai_start_time
        
        if not ai_result['success']:
            raise HTTPException(status_code=500, detail=f"AI error: {ai_result['error']}")
        
        # Store AI move
        metadata['moves'].append(ai_result['san'])
        metadata['positions'].append(engine.board.fen())
        
        print(f"⚡ AI responded with {ai_result['san']} in {ai_total_time:.2f}s")
        
        # Check if game over after AI move
        game_over = ai_result['is_game_over']
        game_result = None
        
        if game_over:
            game_result = engine.get_game_result()
            metadata['game_result'] = game_result
            
            # Save to MongoDB if user_id exists
            if metadata.get('user_id'):
                await save_game_to_db(game_id)
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'player_move': {'move': move, 'san': player_result['san']},
            'ai_move': {
                'move': ai_result['move'], 
                'san': ai_result['san'],
                'think_time': ai_total_time
            },
            'position': {
                'fen': ai_result['fen'],
                'turn': ai_result['turn'],
                'legal_moves': ai_result['legal_moves'],
            },
            'game_result': game_result,
            'game_over': game_over,
            'fast_mode': True
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Move processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_game_to_db(game_id: str):
    """Save completed game to MongoDB - async version"""
    try:
        if not mongodb.is_connected():
            print("⚠️ MongoDB not connected, skipping game save")
            return
            
        metadata = game_metadata[game_id]
        engine = active_games[game_id]
        
        game_document = {
            'game_id': game_id,
            'user_id': metadata['user_id'],
            'ai_level': metadata['ai_level'],
            'player_color': metadata['player_color'],
            'moves': metadata['moves'],
            'positions': metadata['positions'],
            'game_result': metadata['game_result'],
            'created_at': metadata['created_at'],
            'completed_at': time.time(),
            'fast_mode': metadata.get('fast_mode', True)
        }
        
        # Use asyncio to run the sync operation
        await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: mongodb.db.games.insert_one(game_document)
        )
        
        print(f"💾 Fast game {game_id[:8]} saved to database")
        
    except Exception as e:
        print(f"❌ Failed to save game to database: {e}")

@router.get("/chess/game/{game_id}")
async def get_game_state(game_id: str):
    """קבלת מצב משחק נוכחי"""
    try:
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        engine = active_games[game_id]
        metadata = game_metadata[game_id]
        
        return JSONResponse({
            'success': True,
            'game_id': game_id,
            'position': {
                'fen': engine.board.fen(),
                'turn': 'black' if engine.board.turn else 'white',
                'legal_moves': [move.uci() for move in engine.board.legal_moves],
            },
            'metadata': {
                'ai_level': metadata['ai_level'],
                'player_color': metadata['player_color'],
                'move_count': len(metadata['moves']),
                'game_result': metadata['game_result'],
                'fast_mode': metadata.get('fast_mode', True)
            },
            'history': metadata['moves']
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chess/resign")
async def resign_game(request_data: dict):
    """הפסדה מהירה"""
    try:
        game_id = request_data.get('game_id')
        
        if game_id not in active_games:
            raise HTTPException(status_code=404, detail="Game not found")
        
        # Update game result
        metadata = game_metadata[game_id]
        metadata['game_result'] = f"{metadata['player_color']} resigned"
        
        # Save to database if needed
        if metadata.get('user_id'):
            await save_game_to_db(game_id)
        
        # Cleanup
        engine = active_games[game_id]
        engine.stop_engine()
        del active_games[game_id]
        del game_metadata[game_id]
        
        print(f"🏳️ Game {game_id[:8]} resigned and cleaned up")
        
        return JSONResponse({
            'success': True,
            'result': metadata['game_result'],
            'message': 'Game resigned successfully'
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Cleanup endpoint למשחקים ישנים
@router.delete("/chess/cleanup")
async def cleanup_old_games():
    """ניקוי משחקים ישנים"""
    try:
        current_time = time.time()
        old_games = []
        
        for game_id, metadata in game_metadata.items():
            # משחקים ישנים מ-1 שעה
            if current_time - metadata['created_at'] > 3600:
                old_games.append(game_id)
        
        cleaned_count = 0
        for game_id in old_games:
            if game_id in active_games:
                active_games[game_id].stop_engine()
                del active_games[game_id]
                del game_metadata[game_id]
                cleaned_count += 1
        
        print(f"🧹 Cleaned up {cleaned_count} old games")
        
        return JSONResponse({
            'success': True,
            'cleaned_games': cleaned_count,
            'active_games': len(active_games)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))