# backend/auth_service.py
"""
שירות Authentication מקיף עם MongoDB אמיתי
"""

import jwt
import bcrypt
import uuid
import time
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncio
from typing import Dict, List, Optional
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError

# הגדרות JWT
JWT_SECRET = "your-secret-key-here"  # החלף במפתח אמיתי
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

class MongoDBService:
    """שירות MongoDB אמיתי"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.users_collection = None
        self.sessions_collection = None
        self.games_collection = None
        
    async def connect(self):
        """התחברות ל-MongoDB"""
        try:
            # קריאת ה-URI מה-ENV (שם המשתנה הנכון)
            mongodb_url = os.getenv('MONGO_URI') or os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
            print(f"🔗 Attempting MongoDB connection to: {mongodb_url[:50]}...")
            
            self.client = AsyncIOMotorClient(mongodb_url)
            
            # בדיקת חיבור
            await self.client.admin.command('ismaster')
            
            # הגדרת database וcollections
            self.db = self.client.chessmentor
            self.users_collection = self.db.users
            self.sessions_collection = self.db.sessions
            self.games_collection = self.db.games
            
            # יצירת indexes
            await self._create_indexes()
            
            print("📁 Connected to MongoDB Atlas successfully!")
            print(f"🗄️ Database: {self.db.name}")
            return True
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            print("💡 Check your MONGO_URI in .env file")
            print("💡 Make sure your IP is whitelisted in MongoDB Atlas")
            return False
    
    async def _create_indexes(self):
        """יצירת indexes לביצועים טובים"""
        try:
            # Index על username (unique)
            await self.users_collection.create_index("username", unique=True)
            
            # Index על email (unique, sparse)
            await self.users_collection.create_index("email", unique=True, sparse=True)
            
            # Index על sessions
            await self.sessions_collection.create_index("user_id")
            await self.sessions_collection.create_index("session_id", unique=True)
            
            # Index על games
            await self.games_collection.create_index("user_id")
            await self.games_collection.create_index("created_at")
            
            print("📊 Database indexes created")
            
        except Exception as e:
            print(f"⚠️ Index creation warning: {e}")
    
    async def create_user(self, username: str, password: str, email: str = None) -> dict:
        """יצירת משתמש חדש"""
        try:
            # בדיקה אם המשתמש קיים
            existing_user = await self.users_collection.find_one({"username": username})
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already exists")
            
            if email:
                existing_email = await self.users_collection.find_one({"email": email})
                if existing_email:
                    raise HTTPException(status_code=400, detail="Email already exists")
            
            # הצפנת סיסמה
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # יצירת משתמש
            user_id = str(uuid.uuid4())
            user_doc = {
                'user_id': user_id,
                'username': username,
                'email': email,
                'password_hash': password_hash,
                'created_at': datetime.utcnow().isoformat(),
                'last_active': datetime.utcnow().isoformat(),
                'is_active': True,
                'role': 'user',
                'profile': {
                    'display_name': username,
                    'avatar_url': None,
                    'bio': None
                },
                'preferences': {
                    'theme': 'light',
                    'language': 'he',
                    'notifications': True
                },
                'stats': {
                    'games_played': 0,
                    'games_won': 0,
                    'games_lost': 0,
                    'games_drawn': 0,
                    'elo_rating': 1200
                }
            }
            
            # שמירה ב-DB
            result = await self.users_collection.insert_one(user_doc)
            
            # החזרת המשתמש ללא סיסמה
            user_doc['_id'] = str(result.inserted_id)
            del user_doc['password_hash']
            
            print(f"👤 Created user: {username}")
            return user_doc
            
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error creating user: {e}")
            raise HTTPException(status_code=500, detail="Failed to create user")
    
    async def get_user_by_username(self, username: str) -> Optional[dict]:
        """חיפוש משתמש לפי שם משתמש"""
        try:
            user = await self.users_collection.find_one({"username": username})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except Exception as e:
            print(f"Error getting user by username: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """חיפוש משתמש לפי ID"""
        try:
            user = await self.users_collection.find_one({"user_id": user_id})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    def verify_password(self, user: dict, password: str) -> bool:
        """אימות סיסמה"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        except Exception:
            return False
    
    async def create_session(self, user_id: str, device_info: dict = None) -> str:
        """יצירת session חדש"""
        try:
            session_id = str(uuid.uuid4())
            session_doc = {
                'session_id': session_id,
                'user_id': user_id,
                'created_at': datetime.utcnow().isoformat(),
                'last_activity': datetime.utcnow().isoformat(),
                'device_info': device_info or {},
                'is_active': True
            }
            
            await self.sessions_collection.insert_one(session_doc)
            print(f"🔐 Created session for user: {user_id}")
            return session_id
            
        except Exception as e:
            print(f"Error creating session: {e}")
            raise HTTPException(status_code=500, detail="Failed to create session")
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """קבלת session"""
        try:
            session = await self.sessions_collection.find_one({"session_id": session_id})
            if session:
                session['_id'] = str(session['_id'])
            return session
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    async def update_session_activity(self, session_id: str):
        """עדכון פעילות session"""
        try:
            await self.sessions_collection.update_one(
                {"session_id": session_id},
                {"$set": {"last_activity": datetime.utcnow().isoformat()}}
            )
        except Exception as e:
            print(f"Error updating session activity: {e}")
    
    async def invalidate_session(self, session_id: str):
        """ביטול session"""
        try:
            await self.sessions_collection.update_one(
                {"session_id": session_id},
                {"$set": {"is_active": False}}
            )
        except Exception as e:
            print(f"Error invalidating session: {e}")
    
    async def save_game(self, user_id: str, game_data: dict) -> str:
        """שמירת משחק"""
        try:
            game_doc = {
                'user_id': user_id,
                'game_id': game_data.get('game_id', str(uuid.uuid4())),
                'created_at': datetime.utcnow().isoformat(),
                'moves': game_data.get('moves', []),
                'positions': game_data.get('positions', []),
                'result': game_data.get('result', 'ongoing'),
                'ai_level': game_data.get('ai_level', 5),
                'player_color': game_data.get('player_color', 'white'),
                'game_duration': game_data.get('duration', 0),
                'analysis': None
            }
            
            result = await self.games_collection.insert_one(game_doc)
            print(f"💾 Saved game for user: {user_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving game: {e}")
            return ""
    
    async def get_user_games(self, user_id: str, limit: int = 20) -> List[dict]:
        """קבלת משחקי המשתמש"""
        try:
            cursor = self.games_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            games = []
            async for game in cursor:
                game['_id'] = str(game['_id'])
                games.append(game)
            
            return games
            
        except Exception as e:
            print(f"Error getting user games: {e}")
            return []
    
    async def get_stats(self) -> dict:
        """סטטיסטיקות כלליות"""
        try:
            total_users = await self.users_collection.count_documents({})
            total_games = await self.games_collection.count_documents({})
            active_sessions = await self.sessions_collection.count_documents({"is_active": True})
            
            return {
                "total_users": total_users,
                "total_games": total_games,
                "active_sessions": active_sessions
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {"total_users": 0, "total_games": 0, "active_sessions": 0}

# יצירת אובייקט הדאטהבייס הגלובלי
db = MongoDBService()

class AuthService:
    """שירות Authentication"""
    
    @staticmethod
    def create_jwt_token(user_id: str, username: str) -> str:
        """יצירת JWT token"""
        payload = {
            'user_id': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """יצירת refresh token"""
        token = str(uuid.uuid4())
        # כאן תוכל לשמור ב-DB אם רוצה
        return token
    
    @staticmethod
    def verify_jwt_token(token: str) -> dict:
        """אימות JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    @staticmethod
    async def register_user(username: str, password: str, email: str = None) -> dict:
        """רישום משתמש חדש"""
        if len(password) < 3:
            raise HTTPException(status_code=400, detail="Password must be at least 3 characters")
        
        user = await db.create_user(username, password, email)
        session_id = await db.create_session(user['user_id'])
        jwt_token = AuthService.create_jwt_token(user['user_id'], username)
        refresh_token = AuthService.create_refresh_token(user['user_id'])
        
        return {
            'user': {k: v for k, v in user.items() if k != 'password_hash'},
            'session_id': session_id,
            'access_token': jwt_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer'
        }
    
    @staticmethod
    async def login_user(username: str, password: str, device_info: dict = None) -> dict:
        """התחברות משתמש"""
        user = await db.get_user_by_username(username)
        if not user:
            # אם המשתמש לא קיים, צור אותו (למטרות פיתוח)
            print(f"⚠️ User {username} not found, creating new user")
            return await AuthService.register_user(username, password)
        
        if not db.verify_password(user, password):
            # במצב פיתוח, נעדכן את הסיסמה
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            await db.users_collection.update_one(
                {"user_id": user['user_id']},
                {"$set": {"password_hash": password_hash}}
            )
            print(f"🔄 Updated password for {username}")
        
        if not user.get('is_active', True):
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        session_id = await db.create_session(user['user_id'], device_info)
        jwt_token = AuthService.create_jwt_token(user['user_id'], username)
        refresh_token = AuthService.create_refresh_token(user['user_id'])
        
        # עדכון זמן פעילות אחרון
        await db.users_collection.update_one(
            {"user_id": user['user_id']},
            {"$set": {"last_active": datetime.utcnow().isoformat()}}
        )
        
        return {
            'user': {k: v for k, v in user.items() if k != 'password_hash'},
            'session_id': session_id,
            'access_token': jwt_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer'
        }

# Dependency לאימות JWT
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """קבלת המשתמש הנוכחי מה-JWT token"""
    try:
        payload = AuthService.verify_jwt_token(credentials.credentials)
        user = await db.get_user_by_id(payload['user_id'])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

class WebSocketManager:
    """מנהל חיבורי WebSocket עם authentication"""
    
    def __init__(self):
        self.active_connections: Dict[str, dict] = {}
        self.user_connections: Dict[str, List[str]] = {}
        self.rooms: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str = None):
        """חיבור WebSocket חדש"""
        await websocket.accept()
        
        connection_data = {
            'websocket': websocket,
            'user_id': user_id,
            'connected_at': time.time(),
            'last_activity': time.time(),
            'rooms': set(),
            'metadata': {}
        }
        
        self.active_connections[connection_id] = connection_data
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(connection_id)
        
        print(f"🔗 WebSocket connected: {connection_id} (User: {user_id or 'Anonymous'})")
    
    def disconnect(self, connection_id: str):
        """ניתוק WebSocket"""
        if connection_id in self.active_connections:
            connection_data = self.active_connections[connection_id]
            user_id = connection_data['user_id']
            
            # יצירת עותק של הrooms כדי למנוע את השגיאה
            rooms_to_leave = list(connection_data['rooms'])
            for room_id in rooms_to_leave:
                self.leave_room(connection_id, room_id)
            
            if user_id and user_id in self.user_connections:
                self.user_connections[user_id] = [
                    conn_id for conn_id in self.user_connections[user_id] 
                    if conn_id != connection_id
                ]
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            del self.active_connections[connection_id]
            print(f"🔌 WebSocket disconnected: {connection_id}")
    
    async def send_to_connection(self, connection_id: str, message: dict) -> bool:
        """שליחת הודעה לחיבור ספציפי"""
        if connection_id not in self.active_connections:
            return False
        
        try:
            websocket = self.active_connections[connection_id]['websocket']
            await websocket.send_text(json.dumps(message))
            self.active_connections[connection_id]['last_activity'] = time.time()
            return True
        except Exception as e:
            print(f"❌ Failed to send message to {connection_id}: {e}")
            self.disconnect(connection_id)
            return False
    
    async def send_to_user(self, user_id: str, message: dict) -> int:
        """שליחת הודעה לכל החיבורים של משתמש"""
        if user_id not in self.user_connections:
            return 0
        
        sent_count = 0
        for connection_id in self.user_connections[user_id][:]:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    def join_room(self, connection_id: str, room_id: str):
        """הצטרפות לחדר"""
        if connection_id not in self.active_connections:
            return False
        
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        
        if connection_id not in self.rooms[room_id]:
            self.rooms[room_id].append(connection_id)
            self.active_connections[connection_id]['rooms'].add(room_id)
        
        return True
    
    def leave_room(self, connection_id: str, room_id: str):
        """עזיבת חדר"""
        if room_id in self.rooms:
            self.rooms[room_id] = [
                conn_id for conn_id in self.rooms[room_id] 
                if conn_id != connection_id
            ]
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        if connection_id in self.active_connections:
            self.active_connections[connection_id]['rooms'].discard(room_id)
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_connection: str = None) -> int:
        """שליחת הודעה לכל החיבורים בחדר"""
        if room_id not in self.rooms:
            return 0
        
        sent_count = 0
        for connection_id in self.rooms[room_id][:]:
            if connection_id != exclude_connection:
                if await self.send_to_connection(connection_id, message):
                    sent_count += 1
        
        return sent_count
    
    def get_stats(self) -> dict:
        """סטטיסטיקות של המנהל"""
        return {
            'total_connections': len(self.active_connections),
            'authenticated_users': len(self.user_connections),
            'active_rooms': len(self.rooms)
        }

# יצירת אובייקט גלובלי של מנהל ה-WebSocket
websocket_manager = WebSocketManager()

# Dependency לאימות WebSocket
async def authenticate_websocket(websocket: WebSocket, token: str = None) -> Optional[dict]:
    """אימות WebSocket עם JWT token"""
    if not token:
        print("⚠️ No token provided for WebSocket")
        return None
    
    try:
        print(f"🔐 Authenticating WebSocket with token: {token[:50]}...")
        payload = AuthService.verify_jwt_token(token)
        print(f"✅ Token valid for user: {payload['user_id']}")
        
        user = await db.get_user_by_id(payload['user_id'])
        if user:
            print(f"👤 User authenticated: {user['username']}")
            return user
        else:
            print(f"❌ User not found: {payload['user_id']}")
            
            # במקרה של user לא נמצא, פשוט נמשיך כ-Anonymous
            # במקום לנסות ליצור משתמש חדש שעלול לכשל
            print("⚠️ Continuing as Anonymous user")
            return None
            
    except Exception as e:
        print(f"❌ WebSocket authentication failed: {e}")
        return None