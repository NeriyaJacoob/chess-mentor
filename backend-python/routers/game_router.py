# backend-python/routers/game_router.py
"""
Game Routes - נתיבים של משחקים ומאמן
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel

# יבוא הסרוויסים הנדרשים
import sys
sys.path.append('..')
from auth_service import get_current_user, db

router = APIRouter()

# Models
class CoachChatRequest(BaseModel):
    sessionId: str
    message: str
    gameState: Optional[Dict[str, Any]] = None
    analysisType: Optional[str] = "general"

class GameActionRequest(BaseModel):
    game_id: str
    action: str
    data: Optional[Dict[str, Any]] = None

# מאגר זמני למשחקים פעילים
active_games = {}

# תגובות מדומות למאמן
COACH_RESPONSES = {
    "general": [
        "תמיד חשוב להסתכל על כל הלוח לפני ביצוע מהלך. חפש איומים והזדמנויות.",
        "שליטה במרכז הלוח היא אחד העקרונות החשובים ביותר בשח.",
        "זכור לפתח את הכלים שלך לפני שאתה מתקיף. פיתוח טוב הוא המפתח להצלחה.",
        "אל תזיז את אותו כלי פעמיים בפתיחה אלא אם זה הכרחי.",
        "בדוק תמיד אם יש לך או ליריב תקיפות או איומים על כלים חשובים."
    ],
    "opening": [
        "בפתיחה, המטרות העיקריות הן: שליטה במרכז, פיתוח כלים, והגנה על המלך.",
        "e4 ו-d4 הם המהלכים הפופולריים ביותר בפתיחה כי הם שולטים במרכז.",
        "אל תוציא את המלכה מוקדם מדי - היא עלולה להיות מותקפת על ידי כלים קטנים.",
        "הצרחה מוקדם כדי להביא את המלך למקום בטוח.",
        "נסה לפתח פרשים לפני רצים בדרך כלל."
    ],
    "middlegame": [
        "במשחק האמצעי, חפש נקודות חולשה במחנה היריב.",
        "צור איומים מרובים - זה מאלץ את היריב לבחור מה להגן.",
        "חשוב על תוכניות ארוכות טווח, לא רק על המהלך הבא.",
        "שמור על הרגלים שלך מחוברים ומוגנים.",
        "חפש הזדמנויות לשיפור מיקום הכלים שלך."
    ],
    "endgame": [
        "בסיום, המלך הופך לכלי אקטיבי - הוצא אותו למרכז.",
        "רגלים הופכים חשובים מאוד בסיום - הם יכולים להפוך למלכות.",
        "נסה ליצור רגלים חופשיים ומוגנים.",
        "במצבי צריח, שמור את הצריח מאחורי הרגלים החופשיים.",
        "דע את הסיומים הבסיסיים: מלך ומלכה נגד מלך, מלך וצריח נגד מלך."
    ],
    "tactics": [
        "חפש מזלגות - תקיפה של שני כלים בו זמנית.",
        "בדוק אם יש 'פינים' - כלי שלא יכול לזוז כי יחשוף כלי חשוב יותר.",
        "חפש 'skewers' - דומה לפין אבל הכלי החשוב נמצא מלפנים.",
        "תמיד בדוק אם יש מט בכמה מהלכים.",
        "לפעמים הקרבה של כלי יכולה להוביל ליתרון גדול."
    ]
}

def get_coach_response(message: str, analysis_type: str, game_state: Optional[dict] = None) -> str:
    """קבלת תגובה מתאימה מהמאמן"""
    # בחירת קטגוריה מתאימה
    responses = COACH_RESPONSES.get(analysis_type, COACH_RESPONSES["general"])
    
    # בחירת תגובה אקראית מהקטגוריה
    import random
    base_response = random.choice(responses)
    
    # הוספת התייחסות להודעה המקורית
    if "?" in message.lower():
        intro = "שאלה מצוינת! "
    elif any(word in message.lower() for word in ["עזור", "help", "טיפ", "tip"]):
        intro = "בהחלט, הנה טיפ: "
    else:
        intro = ""
    
    return intro + base_response

@router.post("/chess/coach")
async def chess_coach_chat(
    request: CoachChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """צ'אט עם המאמן AI"""
    try:
        # קבלת תגובה מתואמת מהמאמן
        response_text = get_coach_response(
            request.message, 
            request.analysisType, 
            request.gameState
        )
        
        # הוספת מידע על המשתמש
        response_text += f"\n\n💡 {current_user['username']}, המשך לשאול שאלות!"
        
        return JSONResponse({
            'success': True,
            'response': response_text,
            'analysis_type': request.analysisType,
            'timestamp': datetime.now().isoformat(),
            'user': current_user['username']
        })
        
    except Exception as e:
        print(f"Error in coach chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from chess coach")

@router.get("/games/active")
async def get_active_games(current_user: dict = Depends(get_current_user)):
    """רשימת משחקים פעילים של המשתמש"""
    user_games = []
    
    for game_id, game in active_games.items():
        if game['white_player'] == current_user['user_id'] or game['black_player'] == current_user['user_id']:
            user_games.append({
                'game_id': game_id,
                'status': game['status'],
                'opponent': game.get('opponent_name', 'AI'),
                'color': 'white' if game['white_player'] == current_user['user_id'] else 'black',
                'created_at': game['created_at']
            })
    
    return JSONResponse({
        'success': True,
        'games': user_games,
        'total': len(user_games)
    })

@router.post("/games/new")
async def create_new_game(current_user: dict = Depends(get_current_user)):
    """יצירת משחק חדש"""
    game_id = str(uuid.uuid4())
    
    game = {
        'game_id': game_id,
        'white_player': current_user['user_id'],
        'black_player': 'ai',
        'opponent_name': 'ChessMentor AI',
        'status': 'active',
        'moves': [],
        'created_at': datetime.now().isoformat(),
        'last_move': None
    }
    
    active_games[game_id] = game
    
    return JSONResponse({
        'success': True,
        'game_id': game_id,
        'message': 'Game created successfully'
    })

@router.post("/games/action")
async def game_action(
    request: GameActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """ביצוע פעולה במשחק"""
    game = active_games.get(request.game_id)
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # וידוא שהמשתמש משתתף במשחק
    if game['white_player'] != current_user['user_id'] and game['black_player'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not your game")
    
    # טיפול בפעולות שונות
    if request.action == 'move':
        # הוספת מהלך
        move_data = request.data or {}
        game['moves'].append({
            'move': move_data.get('move'),
            'timestamp': datetime.now().isoformat(),
            'player': current_user['user_id']
        })
        game['last_move'] = datetime.now().isoformat()
        
    elif request.action == 'resign':
        game['status'] = 'completed'
        game['result'] = 'resigned'
        
    elif request.action == 'offer_draw':
        game['draw_offered'] = True
        
    else:
        raise HTTPException(status_code=400, detail="Unknown action")
    
    return JSONResponse({
        'success': True,
        'message': f'Action {request.action} completed',
        'game_status': game['status']
    })

@router.get("/games/{game_id}")
async def get_game_details(
    game_id: str,
    current_user: dict = Depends(get_current_user)
):
    """קבלת פרטי משחק"""
    game = active_games.get(game_id)
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # וידוא שהמשתמש משתתף במשחק או שהמשחק ציבורי
    if game['white_player'] != current_user['user_id'] and game['black_player'] != current_user['user_id']:
        # במשחק אמיתי, בדוק אם המשחק ציבורי
        raise HTTPException(status_code=403, detail="Not authorized to view this game")
    
    return JSONResponse({
        'success': True,
        'game': game
    })

@router.get("/puzzles/daily")
async def get_daily_puzzle():
    """קבלת חידה יומית"""
    # חידה מדומה לדוגמה
    puzzle = {
        'id': 'daily_' + datetime.now().strftime('%Y%m%d'),
        'fen': 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        'solution': ['Bxc6', 'dxc6', 'Nxe5'],
        'difficulty': 'medium',
        'theme': 'tactics',
        'description': 'White to move and win material'
    }
    
    return JSONResponse({
        'success': True,
        'puzzle': puzzle
    })

@router.get("/stats/overview")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """סטטיסטיקות המשתמש"""
    # סטטיסטיקות מדומות
    stats = {
        'total_games': 42,
        'wins': 23,
        'losses': 15,
        'draws': 4,
        'rating': 1456,
        'puzzles_solved': 127,
        'accuracy': 0.76,
        'favorite_opening': 'Italian Game',
        'improvement_rate': '+12.3%'
    }
    
    return JSONResponse({
        'success': True,
        'stats': stats,
        'user': current_user['username']
    })