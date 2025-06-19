# backend-python/routers/game_router.py
"""
Game Routes - נתיבים של משחקים ומאמן
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from utils.mock_data import mock_db
from utils.mock_responses import get_coach_response
from datetime import datetime
import time
import random

router = APIRouter()

@router.post("/chess/coach")
async def chess_coach_chat(request_data: dict):
    """צ'אט עם המאמן AI"""
    try:
        session_id = request_data.get('sessionId', '').strip()
        message = request_data.get('message', '').strip()
        game_state = request_data.get('gameState')
        analysis_type = request_data.get('analysisType', 'general')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # בדיקת session
        session = mock_db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # בדיקה שזה session OpenAI
        if session.get('type') != 'openai':
            raise HTTPException(status_code=401, detail="OpenAI session required")
        
        # קבלת תגובה מתואמת מהמאמן
        response_text = get_coach_response(message, analysis_type, game_state)
        
        # הוספת מידע על ה-session
        response_text += f"\n\n---\n💬 Session: {session_id[:8]}... | Type: {analysis_type}"
        
        return JSONResponse({
            'success': True,
            'response': response_text,
            'analysis_type': analysis_type,
            'timestamp': datetime.now().isoformat(),
            'session_valid_until': session.get('timestamp', 0) + 86400  # 24 שעות
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calling coach: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from chess coach")

@router.get("/games")
async def get_active_games():
    """רשימת משחקים פעילים"""
    try:
        active_games = []
        
        for game_id, game in mock_db.games.items():
            if game['status'] == 'active':
                # מידע על השחקנים
                white_name = "AI" if game['white_player'] == 'AI' else f"Player_{game['white_player'][:8]}"
                black_name = "AI" if game['black_player'] == 'AI' else f"Player_{game['black_player'][:8]}"
                
                active_games.append({
                    "id": game_id,
                    "type": game['type'],
                    "players": {
                        "white": white_name,
                        "black": black_name
                    },
                    "status": game['status'],
                    "move_count": len(game['moves']),
                    "duration": int(time.time() - game['start_time']),
                    "last_move": game['moves'][-1] if game['moves'] else None,
                    "created_at": game.get('metadata', {}).get('created_at')
                })
        
        return {
            "success": True,
            "active_games": active_games,
            "total_active": len(active_games),
            "server_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting games: {e}")
        raise HTTPException(status_code=500, detail="Failed to get games")

@router.get("/user/{user_id}/games")
async def get_user_games(user_id: str, limit: int = Query(20, ge=1, le=100)):
    """משחקי משתמש"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        # בדיקה אם המשתמש קיים
        user = mock_db.get_user_by_id(user_id)
        if not user:
            # יצירת משחקים דמה לבדיקה
            mock_user_games = generate_mock_user_games(user_id, limit)
        else:
            # משחקים אמיתיים מהמסד
            real_games = mock_db.get_user_games(user_id, limit)
            mock_user_games = []
            
            for game in real_games:
                opponent = game['black_player'] if game['white_player'] == user_id else game['white_player']
                opponent_name = "AI" if opponent == 'AI' else f"Player_{opponent[:8]}"
                
                # קביעת תוצאה
                if game.get('result'):
                    if 'white wins' in game['result'].lower():
                        result = 'win' if game['white_player'] == user_id else 'loss'
                    elif 'black wins' in game['result'].lower():
                        result = 'win' if game['black_player'] == user_id else 'loss'
                    else:
                        result = 'draw'
                else:
                    result = 'ongoing'
                
                mock_user_games.append({
                    "id": game['id'],
                    "opponent": opponent_name,
                    "opponent_type": "AI" if opponent == 'AI' else "Human",
                    "result": result,
                    "date": game.get('metadata', {}).get('created_at', datetime.now().isoformat()),
                    "moves": len(game['moves']),
                    "duration": format_game_duration(game.get('start_time', time.time())),
                    "opening": get_random_opening(),
                    "your_color": "white" if game['white_player'] == user_id else "black",
                    "elo_change": get_random_elo_change(result)
                })
            
            # אם אין משחקים אמיתיים, צור דמה
            if not mock_user_games:
                mock_user_games = generate_mock_user_games(user_id, min(limit, 5))
        
        return {
            "success": True,
            "games": mock_user_games,
            "total_games": len(mock_user_games),
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user games: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user games")

@router.get("/user/{user_id}/stats")
async def get_user_stats(user_id: str):
    """סטטיסטיקות משתמש"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        user = mock_db.get_user_by_id(user_id)
        
        if user:
            # סטטיסטיקות אמיתיות
            games_played = user.get('games_played', 0)
            games_won = user.get('games_won', 0)
            win_rate = round((games_won / max(games_played, 1)) * 100, 1)
            
            stats = {
                "elo_rating": user.get('elo_rating', 1200),
                "games_played": games_played,
                "games_won": games_won,
                "games_lost": games_played - games_won,
                "win_rate": win_rate,
                "current_streak": calculate_current_streak(user_id),
                "best_streak": user.get('best_streak', random.randint(3, 12)),
                "tactics_solved": user.get('tactics_solved', random.randint(50, 500)),
                "tactics_rating": user.get('tactics_rating', user.get('elo_rating', 1200) + random.randint(-200, 300)),
                "total_time_played": format_total_time(games_played),
                "average_game_length": f"{random.randint(8, 25)}m {random.randint(10, 59)}s",
                "favorite_opening": get_random_opening(),
                "last_active": user.get('last_active', datetime.now().isoformat())
            }
        else:
            # סטטיסטיקות דמה
            stats = {
                "elo_rating": 1200,
                "games_played": 0,
                "games_won": 0,
                "games_lost": 0,
                "win_rate": 0,
                "current_streak": 0,
                "best_streak": 0,
                "tactics_solved": 0,
                "tactics_rating": 1200,
                "total_time_played": "0h 0m",
                "average_game_length": "0m 0s",
                "favorite_opening": "None",
                "last_active": datetime.now().isoformat()
            }
        
        return {
            "success": True,
            "stats": stats,
            "user_id": user_id,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user stats")

@router.get("/leaderboard")
async def get_leaderboard(limit: int = Query(10, ge=5, le=50)):
    """טבלת ליגה"""
    try:
        # יצירת טבלת ליגה דמה מבוססת משתמשים קיימים + דמה
        leaderboard = []
        
        # הוספת משתמשים אמיתיים
        for user in mock_db.users.values():
            leaderboard.append({
                "rank": 0,  # נקבע מאוחר יותר
                "username": user['username'],
                "elo_rating": user.get('elo_rating', 1200),
                "games_played": user.get('games_played', 0),
                "games_won": user.get('games_won', 0),
                "win_rate": round((user.get('games_won', 0) / max(user.get('games_played', 1), 1)) * 100, 1),
                "is_online": random.choice([True, False])
            })
        
        # הוספת שחקנים דמה אם צריך
        while len(leaderboard) < limit:
            fake_elo = random.randint(800, 2000)
            fake_games = random.randint(10, 200)
            fake_wins = random.randint(0, fake_games)
            
            leaderboard.append({
                "rank": 0,
                "username": f"Player{random.randint(1000, 9999)}",
                "elo_rating": fake_elo,
                "games_played": fake_games,
                "games_won": fake_wins,
                "win_rate": round((fake_wins / fake_games) * 100, 1),
                "is_online": random.choice([True, False])
            })
        
        # מיון לפי ELO וקביעת דירוג
        leaderboard.sort(key=lambda x: x['elo_rating'], reverse=True)
        for i, player in enumerate(leaderboard[:limit]):
            player['rank'] = i + 1
        
        return {
            "success": True,
            "leaderboard": leaderboard[:limit],
            "total_players": len(leaderboard),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to get leaderboard")

@router.get("/statistics")
async def get_server_statistics():
    """סטטיסטיקות שרת כלליות"""
    try:
        stats = mock_db.get_statistics()
        
        # הוספת מידע נוסף
        enhanced_stats = {
            **stats,
            "server_uptime": format_uptime(),
            "average_game_length": f"{random.randint(15, 30)} minutes",
            "most_popular_time_control": "Unlimited",
            "top_opening": get_random_opening(),
            "daily_new_users": random.randint(5, 25),
            "peak_concurrent_users": random.randint(50, 200),
            "total_moves_today": random.randint(1000, 5000),
            "server_load": f"{random.randint(10, 80)}%",
            "updated_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "statistics": enhanced_stats
        }
        
    except Exception as e:
        print(f"Error getting server statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

# Helper Functions
def generate_mock_user_games(user_id: str, limit: int) -> list:
    """יצירת משחקים דמה למשתמש"""
    games = []
    
    for i in range(limit):
        result_options = ['win', 'loss', 'draw']
        result = random.choice(result_options)
        
        games.append({
            "id": f"game_{user_id[:8]}_{i}",
            "opponent": "AI" if i % 3 == 0 else f"Player{random.randint(100, 999)}",
            "opponent_type": "AI" if i % 3 == 0 else "Human",
            "result": result,
            "date": datetime.now().isoformat(),
            "moves": random.randint(20, 80),
            "duration": f"{random.randint(5, 45)}m {random.randint(10, 59)}s",
            "opening": get_random_opening(),
            "your_color": random.choice(["white", "black"]),
            "elo_change": get_random_elo_change(result)
        })
    
    return games

def get_random_opening() -> str:
    """קבלת פתיחה רנדומלית"""
    openings = [
        "Italian Game", "Spanish Opening", "Queen's Gambit", "King's Indian Defense",
        "Sicilian Defense", "French Defense", "English Opening", "Caro-Kann Defense",
        "Alekhine Defense", "Scandinavian Defense", "Pirc Defense", "Modern Defense"
    ]
    return random.choice(openings)

def get_random_elo_change(result: str) -> str:
    """קבלת שינוי ELO רנדומלי"""
    if result == 'win':
        return f"+{random.randint(8, 25)}"
    elif result == 'loss':
        return f"-{random.randint(8, 20)}"
    else:  # draw
        return f"{random.choice(['+', '-'])}{random.randint(1, 5)}"

def calculate_current_streak(user_id: str) -> int:
    """חישוב רצף נוכחי"""
    return random.randint(0, 8)

def format_game_duration(start_time: float) -> str:
    """פורמט משך משחק"""
    duration = int(time.time() - start_time)
    minutes = duration // 60
    seconds = duration % 60
    return f"{minutes}m {seconds}s"

def format_total_time(games_played: int) -> str:
    """פורמט זמן כולל"""
    total_minutes = games_played * random.randint(15, 30)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}h {minutes}m"

def format_uptime() -> str:
    """פורמט זמן פעילות שרת"""
    hours = random.randint(1, 72)
    minutes = random.randint(0, 59)
    return f"{hours}h {minutes}m"