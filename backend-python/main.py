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

app = FastAPI(
    title="Authentication & WebSocket API",
    description="מערכת התחברות מקיפה עם תמיכה ב-WebSocket ו-MongoDB",
    version="1.0.0"
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

# ============= Startup/Shutdown Events =============

@app.on_event("startup")
async def startup_event():
    """התחברות ל-MongoDB בעת הפעלת השרת"""
    print("🚀 Starting server...")
    
    # Debug: הצגת משתני סביבה
    mongo_uri = os.getenv('MONGO_URI')
    if mongo_uri:
        print(f"✅ Found MONGO_URI: {mongo_uri[:30]}...{mongo_uri[-10:]}")
    else:
        print("❌ MONGO_URI not found in environment variables!")
        print("📝 Available env vars starting with 'MONGO':")
        for key in os.environ:
            if key.startswith('MONGO'):
                print(f"   - {key}")
    
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

@app.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """רענון access token"""
    try:
        # כאן תוכל להוסיף לוגיקה לרענון טוקן
        raise HTTPException(status_code=501, detail="Refresh token not implemented yet")
    except HTTPException as e:
        raise e

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """התנתקות משתמש"""
    try:
        # כאן תוכל להוסיף לוגיקה לביטול sessions
        return JSONResponse({
            "success": True,
            "message": "Logout successful"
        })
    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """קבלת מידע על המשתמש הנוכחי"""
    return JSONResponse({
        "success": True,
        "user": {k: v for k, v in current_user.items() if k != 'password_hash'}
    })

@app.put("/auth/profile")
async def update_profile(
    profile_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """עדכון פרופיל משתמש"""
    try:
        user_id = current_user['user_id']
        
        # עדכון שדות מורשים בלבד
        allowed_fields = {'display_name', 'bio', 'avatar_url'}
        update_data = {}
        
        for field, value in profile_data.items():
            if field in allowed_fields:
                update_data[f'profile.{field}'] = value
        
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
                print(f"❌ WebSocket message handling error: {e}")
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "data": {"message": "Internal server error"}
                })
    
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected: {connection_id}")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        websocket_manager.disconnect(connection_id)

async def handle_websocket_message(connection_id: str, message_data: dict, user_id: str = None):
    """טיפול בהודעות WebSocket"""
    
    message_type = message_data.get('type')
    data = message_data.get('data', {})
    
    print(f"📨 WebSocket message: {message_type} from {connection_id} (User: {user_id or 'Anonymous'})")
    
    try:
        if message_type == "ping":
            await websocket_manager.send_to_connection(connection_id, {
                "type": "pong",
                "data": {"timestamp": data.get('timestamp')}
            })
        
        elif message_type == "join_room":
            room_id = data.get('room_id', 'general')  # default room
            success = websocket_manager.join_room(connection_id, room_id)
            
            if success:
                print(f"✅ {connection_id} joined room: {room_id}")
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "room_joined",
                    "data": {"room_id": room_id}
                })
                
                # הודעה לחדר על משתמש חדש
                username = "Anonymous"
                if user_id:
                    try:
                        user = await db.get_user_by_id(user_id)
                        username = user['username'] if user else "Unknown User"
                    except:
                        username = "Unknown User"
                
                await websocket_manager.broadcast_to_room(room_id, {
                    "type": "user_joined_room",
                    "data": {
                        "room_id": room_id,
                        "user_id": user_id,
                        "username": username,
                        "connection_id": connection_id
                    }
                }, exclude_connection=connection_id)
            else:
                print(f"❌ Failed to join room: {room_id}")
        
        elif message_type == "leave_room":
            room_id = data.get('room_id')
            if room_id:
                websocket_manager.leave_room(connection_id, room_id)
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "room_left",
                    "data": {"room_id": room_id}
                })
        
        elif message_type == "send_to_room":
            room_id = data.get('room_id')
            message_content = data.get('message')
            
            if room_id and message_content:
                # כרגע לא נשמור chat messages ב-DB (רק games)
                # אפשר להוסיף collection נפרד לchat messages אם צריך
                
                # קבלת שם המשתמש
                username = "Anonymous"
                if user_id:
                    try:
                        user = await db.get_user_by_id(user_id)
                        username = user['username'] if user else "Unknown User"
                    except:
                        username = "Unknown User"
                
                await websocket_manager.broadcast_to_room(room_id, {
                    "type": "room_message",
                    "data": {
                        "room_id": room_id,
                        "user_id": user_id,
                        "username": username,
                        "connection_id": connection_id,
                        "message": message_content,
                        "timestamp": data.get('timestamp')
                    }
                }, exclude_connection=connection_id)
                
                print(f"📢 Broadcast message to room {room_id}: {message_content[:50]}...")
        
        elif message_type == "send_to_user":
            target_user_id = data.get('target_user_id')
            message_content = data.get('message')
            
            if target_user_id and message_content and user_id:  # Only authenticated users can send private messages
                sent_count = await websocket_manager.send_to_user(target_user_id, {
                    "type": "private_message",
                    "data": {
                        "from_user_id": user_id,
                        "from_connection_id": connection_id,
                        "message": message_content,
                        "timestamp": data.get('timestamp')
                    }
                })
                
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "message_sent",
                    "data": {
                        "target_user_id": target_user_id,
                        "sent_to_connections": sent_count
                    }
                })
            elif not user_id:
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "error",
                    "data": {"message": "Authentication required for private messages"}
                })
        
        elif message_type == "get_stats":
            if user_id:  # Only authenticated users can get stats
                ws_stats = websocket_manager.get_stats()
                db_stats = await db.get_stats()
                
                await websocket_manager.send_to_connection(connection_id, {
                    "type": "stats",
                    "data": {
                        "websocket": ws_stats,
                        "database": db_stats
                    }
                })
        
        else:
            await websocket_manager.send_to_connection(connection_id, {
                "type": "error",
                "data": {"message": f"Unknown message type: {message_type}"}
            })
    
    except Exception as e:
        print(f"❌ Error handling WebSocket message: {e}")
        await websocket_manager.send_to_connection(connection_id, {
            "type": "error",
            "data": {"message": "Error processing message"}
        })

# ============= API Routes =============

@app.get("/api/stats")
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    """סטטיסטיקות מערכת"""
    try:
        # סטטיסטיקות WebSocket
        ws_stats = websocket_manager.get_stats()
        
        # סטטיסטיקות MongoDB
        db_stats = await db.get_stats()
        
        return JSONResponse({
            "success": True,
            "stats": {
                "websocket": ws_stats,
                "database": db_stats,
                "mongodb_connected": db.client is not None
            }
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
    print("🚀 Starting Authentication & WebSocket server with MongoDB...")
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)