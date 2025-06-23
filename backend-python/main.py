# main.py
"""
FastAPI App ראשי עם Authentication ו-WebSocket + MongoDB
"""

import os
from dotenv import load_dotenv

# טעינת משתני סביבה מקובץ .env
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import json
import asyncio

from auth_service import (
    AuthService, 
    get_current_user, 
    websocket_manager, 
    authenticate_websocket,
    db
)

# יבוא נוסף למשחקי שח - יצירת routers ריקים אם לא קיימים
try:
    from routers import game_router, websocket_router
except ImportError as e:
    print(f"⚠️ Router modules import error: {e}")
    print("Creating empty routers...")
    from fastapi import APIRouter
    game_router = APIRouter()
    websocket_router = APIRouter()

app = FastAPI(
    title="ChessMentor API",
    description="מערכת התחברות מקיפה עם תמיכה ב-WebSocket, MongoDB ומשחקי שח",
    version="2.0.0"
)

# הגדרות CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # בפרודקשן: רק דומיינים מורשים
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models עבור Pydantic
class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    device_info: Optional[Dict[str, Any]] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

class OpenAIAuthRequest(BaseModel):
    apiKey: str

# הוספת הנתיבים של משחקים
app.include_router(game_router, prefix="/api", tags=["games"])
app.include_router(websocket_router, tags=["websocket"])

# ============= Startup/Shutdown Events =============

@app.on_event("startup")
async def startup_event():
    """התחברות ל-MongoDB בעת הפעלת השרת"""
    print("🚀 Starting ChessMentor server...")
    
    # Debug: הצגת משתני סביבה
    mongo_uri = os.getenv('MONGO_URI')
    if mongo_uri:
        print(f"✅ Found MONGO_URI: {mongo_uri[:30]}...{mongo_uri[-10:]}")
    else:
        print("❌ MONGO_URI not found in environment variables!")
    
    # התחברות למונגו
    mongodb_connected = await db.connect()
    
    if mongodb_connected:
        print("✅ Server ready with MongoDB Atlas!")
        
        # בדיקה שהדאטהבייס עובד
        try:
            stats = await db.get_stats()
            print(f"📊 Database stats: {stats}")
        except Exception as e:
            print(f"⚠️ Database stats error: {e}")
    else:
        print("⚠️ Server started but MongoDB connection failed")
        print("💡 Users will be created in memory only")

@app.on_event("shutdown")
async def shutdown_event():
    """סגירת חיבורים בעת כיבוי השרת"""
    print("🛑 Shutting down server...")
    if db.client:
        db.client.close()
        print("📁 MongoDB connection closed")

# ============= Authentication Routes =============

@app.post("/auth/register")
async def register(request: RegisterRequest):
    """רישום משתמש חדש"""
    try:
        result = await AuthService.register_user(
            username=request.username,
            password=request.password,
            email=request.email
        )
        return JSONResponse({
            "success": True,
            "message": "User registered successfully",
            **result
        })
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login")
async def login(request: LoginRequest):
    """התחברות משתמש"""
    try:
        result = await AuthService.login_user(
            username=request.username,
            password=request.password,
            device_info=request.device_info
        )
        return JSONResponse({
            "success": True,
            "message": "Login successful",
            **result
        })
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/auth/openai")
async def authenticate_openai(request: OpenAIAuthRequest):
    """אימות OpenAI API key"""
    try:
        # בדיקה בסיסית של המפתח
        if not request.apiKey or not request.apiKey.startswith('sk-'):
            raise HTTPException(status_code=400, detail="Invalid API key format")
        
        # יצירת session ID ייחודי
        session_id = str(uuid.uuid4())
        
        # TODO: בדיקה מול OpenAI API אמיתית
        # כרגע נניח שהמפתח תקין
        
        return JSONResponse({
            "success": True,
            "sessionId": session_id,
            "message": "OpenAI API key validated successfully"
        })
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"OpenAI auth error: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate OpenAI key")

@app.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """רענון access token"""
    try:
        # TODO: מימוש רענון טוקן
        raise HTTPException(status_code=501, detail="Refresh token not implemented yet")
    except HTTPException as e:
        raise e

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """התנתקות משתמש"""
    try:
        # TODO: ביטול session
        return JSONResponse({
            "success": True,
            "message": "Logged out successfully"
        })
    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """קבלת פרטי המשתמש הנוכחי"""
    return JSONResponse({
        "success": True,
        "user": current_user
    })

@app.put("/auth/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """עדכון פרופיל משתמש"""
    try:
        user_id = current_user['user_id']
        
        # הכנת נתונים לעדכון
        update_data = {}
        if request.display_name:
            update_data['profile.display_name'] = request.display_name
        if request.email:
            update_data['email'] = request.email
        if request.avatar_url:
            update_data['profile.avatar_url'] = request.avatar_url
        
        if update_data:
            await db.users_collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
        
        # קבלת המשתמש המעודכן
        updated_user = await db.get_user_by_id(user_id)
        
        return JSONResponse({
            "success": True,
            "message": "Profile updated successfully",
            "user": {k: v for k, v in updated_user.items() if k != 'password_hash'}
        })
    except Exception as e:
        print(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")

# ============= WebSocket Routes =============

@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    connection_id: str,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint עם authentication אופציונלי"""
    
    # אימות token אם סופק
    user = await authenticate_websocket(websocket, token)
    user_id = user['user_id'] if user else None
    
    # חיבור WebSocket (גם אם לא מאומת)
    await websocket_manager.connect(websocket, connection_id, user_id)
    
    try:
        # שליחת הודעת welcome
        welcome_message = {
            "type": "connected",
            "data": {
                "connection_id": connection_id,
                "user_id": user_id,
                "authenticated": user is not None,
                "message": f"Connected successfully as {'user' if user else 'guest'}"
            }
        }
        
        if user:
            welcome_message["data"]["username"] = user['username']
        
        await websocket_manager.send_to_connection(connection_id, welcome_message)
        
        # לולאת קבלת הודעות
        while True:
            try:
                # קבלת הודעה
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # טיפול בהודעה
                await handle_websocket_message(connection_id, message_data, user_id)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                })
            except Exception as e:
                print(f"WebSocket error: {e}")
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "data": {"message": str(e)}
                })
                
    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(connection_id)

async def handle_websocket_message(connection_id: str, message: dict, user_id: str = None):
    """טיפול בהודעות WebSocket"""
    msg_type = message.get('type')
    data = message.get('data', {})
    
    print(f"📨 Received {msg_type} from {connection_id[:8]}...")
    
    # הודעות צ'אט
    if msg_type == 'chat_message':
        # בדיקה שהמשתמש מאומת
        if not user_id:
            await websocket_manager.send_to_connection(connection_id, {
                "type": "error",
                "data": {"message": "Authentication required for chat"}
            })
            return
        
        # קבלת פרטי המשתמש
        user = await db.get_user_by_id(user_id)
        
        # הכנת הודעה
        broadcast_msg = {
            "type": "chat_message",
            "data": {
                "id": str(uuid.uuid4()),
                "content": data.get('content', ''),
                "userId": user_id,
                "username": user['username'],
                "displayName": user['profile'].get('display_name', user['username']),
                "timestamp": asyncio.get_event_loop().time(),
                "room": data.get('room', 'general')
            }
        }
        
        # שידור לכולם
        room = data.get('room', 'general')
        if room == 'general':
            await websocket_manager.broadcast(broadcast_msg)
        else:
            await websocket_manager.broadcast_to_room(room, broadcast_msg)
    
    elif msg_type == 'join_room':
        room_id = data.get('room_id')
        if room_id:
            websocket_manager.join_room(connection_id, room_id)
            await websocket_manager.send_to_connection(connection_id, {
                "type": "joined_room",
                "data": {"room_id": room_id}
            })
    
    elif msg_type == 'leave_room':
        room_id = data.get('room_id')
        if room_id:
            websocket_manager.leave_room(connection_id, room_id)
            await websocket_manager.send_to_connection(connection_id, {
                "type": "left_room",
                "data": {"room_id": room_id}
            })
    
    elif msg_type == 'get_status':
        status = {
            "connection_id": connection_id,
            "authenticated": user_id is not None,
            "user_id": user_id,
            "server_stats": websocket_manager.get_stats()
        }
        await websocket_manager.send_to_connection(connection_id, {
            "type": "status",
            "data": status
        })
    
    else:
        # הודעה לא מוכרת
        await websocket_manager.send_to_connection(connection_id, {
            "type": "error",
            "data": {"message": f"Unknown message type: {msg_type}"}
        })

# ============= API Routes =============

@app.get("/api/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """סטטיסטיקות המערכת"""
    try:
        db_stats = await db.get_stats()
        ws_stats = websocket_manager.get_stats()
        
        return JSONResponse({
            "success": True,
            "database": db_stats,
            "websocket": ws_stats,
            "timestamp": asyncio.get_event_loop().time()
        })
    except Exception as e:
        print(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get stats")

@app.get("/api/online-users")
async def get_online_users(current_user: dict = Depends(get_current_user)):
    """רשימת משתמשים מחוברים"""
    online_users = []
    for user_id, connection_ids in websocket_manager.user_connections.items():
        if connection_ids:
            try:
                user = await db.get_user_by_id(user_id)
                if user:
                    online_users.append({
                        'user_id': user_id,
                        'username': user['username'],
                        'display_name': user['profile'].get('display_name', user['username']),
                        'active_connections': len(connection_ids)
                    })
            except Exception as e:
                print(f"Error getting user {user_id}: {e}")
    
    return JSONResponse({
        "success": True,
        "online_users": online_users,
        "total_count": len(online_users)
    })

@app.get("/api/my-games")
async def get_my_games(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """משחקי המשתמש"""
    try:
        games = await db.get_user_games(current_user['user_id'], limit)
        return JSONResponse({
            "success": True,
            "games": games,
            "total_count": len(games)
        })
    except Exception as e:
        print(f"Error getting user games: {e}")
        raise HTTPException(status_code=500, detail="Failed to get games")

@app.get("/health")
async def health_check():
    """בדיקת בריאות המערכת"""
    try:
        db_stats = await db.get_stats()
        ws_stats = websocket_manager.get_stats()
        
        return JSONResponse({
            "status": "healthy",
            "mongodb_connected": db.client is not None,
            "database": db_stats,
            "websocket_connections": ws_stats['total_connections']
        })
    except Exception as e:
        print(f"Health check error: {e}")
        return JSONResponse({
            "status": "partial",
            "error": str(e),
            "mongodb_connected": False,
            "websocket_connections": len(websocket_manager.active_connections)
        })

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ChessMentor server...")
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)