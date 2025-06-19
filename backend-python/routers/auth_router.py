# backend-python/routers/auth_router.py
"""
Authentication Routes - כל הנתיבים של אימות
"""

import time
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from utils.mock_data import mock_db

router = APIRouter()

@router.post("/register")
async def register_user(request_data: dict):
    """רישום משתמש חדש"""
    try:
        username = request_data.get('username', '').strip()
        email = request_data.get('email', '').strip()
        password = request_data.get('password', '')
        
        # בדיקות בסיסיות
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        if len(password) < 4:
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
        
        # בדיקה אם המשתמש קיים
        existing_user = mock_db.get_user_by_username(username)
        if existing_user:
            raise HTTPException(status_code=409, detail="Username already exists")
        
        # יצירת משתמש חדש
        user_data = mock_db.create_user(username, email, password)
        session_id = mock_db.create_session(
            user_id=user_data['user_id'], 
            username=username,
            elo=user_data['elo_rating']
        )
        
        # הסרת סיסמה מהתגובה
        safe_user_data = {k: v for k, v in user_data.items() if k != 'password_hash'}
        
        return JSONResponse({
            "success": True,
            "session_id": session_id,
            "user": safe_user_data,
            "message": "User registered successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login_user(request_data: dict):
    """התחברות משתמש"""
    try:
        username = request_data.get('username', '').strip()
        password = request_data.get('password', '')
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        # חיפוש משתמש
        user = mock_db.get_user_by_username(username)
        
        if not user:
            # יצירת משתמש חדש אם לא קיים (למטרות פיתוח)
            print(f"⚠️ User {username} not found, creating new user")
            user = mock_db.create_user(username, password=password)
        else:
            # בדיקת סיסמה פשוטה (לפיתוח - כל סיסמה מתקבלת)
            expected_hash = f"hashed_{password}"
            if user.get('password_hash') and user['password_hash'] != expected_hash:
                # במצב פיתוח, נעדכן את הסיסמה
                user['password_hash'] = expected_hash
                print(f"🔄 Updated password for {username}")
        
        # יצירת session
        session_id = mock_db.create_session(
            user_id=user['user_id'], 
            username=username,
            elo=user['elo_rating']
        )
        
        # עדכון זמן פעילות אחרון
        user['last_active'] = time.time()
        
        # הסרת סיסמה מהתגובה
        safe_user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return JSONResponse({
            "success": True,
            "session_id": session_id,
            "user": safe_user_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/guest")
async def guest_login(request_data: dict):
    """התחברות כאורח"""
    try:
        name = request_data.get('name', '').strip()
        
        # יצירת שם אורח אם לא סופק
        if not name:
            name = f'Guest_{uuid.uuid4().hex[:8]}'
        
        # ווידוא שהשם לא תפוס
        counter = 1
        original_name = name
        while mock_db.get_user_by_username(name):
            name = f"{original_name}_{counter}"
            counter += 1
        
        session_id = mock_db.create_session(
            username=name, 
            elo=1200,
            is_guest=True
        )
        
        guest_user = {
            'user_id': None,
            'username': name,
            'elo_rating': 1200,
            'games_played': 0,
            'games_won': 0,
            'is_guest': True,
            'preferences': {
                'theme': 'light',
                'board_theme': 'classic',
                'piece_style': 'classic',
                'sound_enabled': True
            }
        }
        
        return JSONResponse({
            "success": True,
            "session_id": session_id,
            "user": guest_user
        })
        
    except Exception as e:
        print(f"Guest login error: {e}")
        raise HTTPException(status_code=500, detail="Guest login failed")

@router.post("/openai")
async def authenticate_openai(request_data: dict):
    """אימות מפתח OpenAI"""
    try:
        api_key = request_data.get('apiKey', '').strip()
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API key is required")

        # בדיקה פשוטה - כל מפתח שמתחיל ב-sk מתקבל
        if not api_key.startswith('sk-'):
            raise HTTPException(status_code=401, detail="Invalid API key format")
        
        # בדיקת אורך מינימלי
        if len(api_key) < 20:
            raise HTTPException(status_code=401, detail="API key too short")
        
        session_id = str(uuid.uuid4())
        
        # שמירת session OpenAI - עם השם הנכון שהפרונט מצפה לו
        mock_db.sessions[session_id] = {
            'session_id': session_id,
            'api_key': api_key[:10] + "...",  # שמירת חלק מהמפתח בלבד
            'timestamp': time.time(),
            'type': 'openai',
            'active': True,
            'created_at': time.time(),
            'isAuthenticated': True,  # הוסף את זה!
            'isOpenAIConnected': True  # וגם את זה!
        }
        
        print(f"✅ OpenAI API key authenticated: {api_key[:10]}...")
        
        return JSONResponse({
            'success': True,
            'sessionId': session_id,
            'message': 'API key validated successfully',
            'isAuthenticated': True,  # הוסף גם כאן
            'isOpenAIConnected': True
        })
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error validating API key: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout")
async def logout(request_data: dict):
    """התנתקות"""
    try:
        session_id = request_data.get('sessionId', '').strip()
        
        if not session_id:
            return JSONResponse({
                'success': True,
                'message': 'No session to logout'
            })
        
        # מחיקת ה-session
        deleted = mock_db.delete_session(session_id)
        
        return JSONResponse({
            'success': True,
            'message': 'Logged out successfully' if deleted else 'Session not found'
        })
        
    except Exception as e:
        print(f"Error during logout: {e}")
        return JSONResponse({
            'success': False, 
            'error': 'Logout failed'
        }, status_code=400)

@router.get("/validate")
async def validate_session(session_id: str):
    """בדיקת תקינות session"""
    try:
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        is_valid = mock_db.validate_session(session_id)
        
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        session = mock_db.get_session(session_id)
        
        return JSONResponse({
            'success': True,
            'valid': True,
            'session': {
                'session_id': session_id,
                'username': session.get('username'),
                'is_guest': session.get('is_guest', False),
                'created_at': session.get('created_at')
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Session validation error: {e}")
        raise HTTPException(status_code=500, detail="Validation failed")

@router.post("/refresh")
async def refresh_session(request_data: dict):
    """חידוש session"""
    try:
        session_id = request_data.get('sessionId', '').strip()
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        session = mock_db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=401, detail="Session not found")
        
        # עדכון זמן
        session['timestamp'] = time.time()
        session['last_refresh'] = time.time()
        
        return JSONResponse({
            'success': True,
            'message': 'Session refreshed successfully',
            'expires_in': 86400  # 24 שעות
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Session refresh error: {e}")
        raise HTTPException(status_code=500, detail="Refresh failed")

@router.get("/cleanup")
async def cleanup_sessions():
    """ניקוי sessions ישנים (endpoint לבדיקות)"""
    try:
        cleaned = mock_db.cleanup_old_sessions()
        
        return JSONResponse({
            'success': True,
            'message': f'Cleaned {cleaned} expired sessions',
            'remaining_sessions': len(mock_db.sessions)
        })
        
    except Exception as e:
        print(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")
    
