# backend-python/auth_service.py
"""
שירות Authentication מקיף עם MongoDB אמיתי - מתוקן
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
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-here')
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
            # תיקון: שימוש ב-MONGO_URI במקום MONGODB_URL
            mongodb_url = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
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
            await self.sessions_collection.create_index("created_at", expireAfterSeconds=86400)  # 24 שעות
            
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
                'created_at': datetime.utcnow(),
                'last_active': datetime.utcnow(),
                'is_active': True,
                'profile': {
                    'display_name': username,
                    'rating': 1200,
                    'games_played': 0,
                    'games_won': 0,
                    'games_lost': 0,
                    'games_drawn': 0
                }
            }
            
            result = await self.users_collection.insert_one(user_doc)
            print(f"✅ User created: {username} ({user_id})")
            
            return {
                'user_id': user_id,
                'username': username,
                'email': email,
                'profile': user_doc['profile']
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Create user error: {e}")
            raise HTTPException(status_code=500, detail="Failed to create user")
    
    async def get_user_by_username(self, username: str) -> Optional[dict]:
        """חיפוש משתמש לפי שם משתמש"""
        try:
            user = await self.users_collection.find_one({"username": username})
            return user
        except Exception as e:
            print(f"❌ Get user error: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """חיפוש משתמש לפי ID"""
        try:
            user = await self.users_collection.find_one({"user_id": user_id})
            return user
        except Exception as e:
            print(f"❌ Get user by ID error: {e}")
            return None
    
    async def update_last_active(self, user_id: str):
        """עדכון זמן פעילות אחרונה"""
        try:
            await self.users_collection.update_one(
                {"user_id": user_id},
                {"$set": {"last_active": datetime.utcnow()}}
            )
        except Exception as e:
            print(f"❌ Update last active error: {e}")
    
    async def create_session(self, user_id: str, device_info: dict = None) -> str:
        """יצירת session חדש"""
        try:
            session_id = str(uuid.uuid4())
            session_doc = {
                'session_id': session_id,
                'user_id': user_id,
                'created_at': datetime.utcnow(),
                'last_used': datetime.utcnow(),
                'device_info': device_info or {},
                'is_active': True
            }
            
            await self.sessions_collection.insert_one(session_doc)
            return session_id
            
        except Exception as e:
            print(f"❌ Create session error: {e}")
            raise HTTPException(status_code=500, detail="Failed to create session")
    
    async def get_stats(self):
        """סטטיסטיקות של המסד נתונים"""
        try:
            users_count = await self.users_collection.count_documents({})
            active_sessions = await self.sessions_collection.count_documents({"is_active": True})
            total_games = await self.games_collection.count_documents({})
            
            return {
                'users': users_count,
                'active_sessions': active_sessions,
                'total_games': total_games
            }
        except Exception as e:
            print(f"❌ Get stats error: {e}")
            return {'users': 0, 'active_sessions': 0, 'total_games': 0}
    
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
            print(f"❌ Get user games error: {e}")
            return []

# יצירת instance גלובלי
db = MongoDBService()

class AuthService:
    """שירות אימות משתמשים"""
    
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
    def verify_jwt_token(token: str) -> dict:
        """אימות JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    @staticmethod
    async def register_user(username: str, password: str, email: str = None) -> dict:
        """רישום משתמש חדש"""
        # בדיקת תקינות
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # יצירת משתמש
        user = await db.create_user(username, password, email)
        
        # יצירת session
        session_id = await db.create_session(user['user_id'])
        
        # יצירת tokens
        access_token = AuthService.create_jwt_token(user['user_id'], username)
        refresh_token = str(uuid.uuid4())  # TODO: implement proper refresh token
        
        return {
            'user': user,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'session_id': session_id
        }
    
    @staticmethod
    async def login_user(username: str, password: str, device_info: dict = None) -> dict:
        """התחברות משתמש"""
        # חיפוש משתמש
        user = await db.get_user_by_username(username)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # בדיקת סיסמה
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # עדכון last_active
        await db.update_last_active(user['user_id'])
        
        # יצירת session
        session_id = await db.create_session(user['user_id'], device_info)
        
        # יצירת tokens
        access_token = AuthService.create_jwt_token(user['user_id'], username)
        refresh_token = str(uuid.uuid4())  # TODO: implement proper refresh token
        
        # הכנת תגובה
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return {
            'user': user_data,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'session_id': session_id
        }

# Dependency לקבלת משתמש מאומת
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """קבלת משתמש נוכחי מה-token"""
    token = credentials.credentials
    
    try:
        payload = AuthService.verify_jwt_token(token)
        user = await db.get_user_by_id(payload['user_id'])
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {k: v for k, v in user.items() if k != 'password_hash'}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get current user error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# WebSocket Manager
class WebSocketManager:
    """מנהל חיבורי WebSocket"""
    
    def __init__(self):
        self.active_connections: Dict[str, dict] = {}
        self.user_connections: Dict[str, List[str]] = {}
        self.rooms: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str = None):
        """חיבור WebSocket חדש"""
        await websocket.accept()
        
        self.active_connections[connection_id] = {
            'websocket': websocket,
            'user_id': user_id,
            'connected_at': datetime.utcnow(),
            'rooms': set()
        }
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(connection_id)
        
        print(f"✅ WebSocket connected: {connection_id} (User: {user_id or 'Anonymous'})")
    
    def disconnect(self, connection_id: str):
        """ניתוק WebSocket"""
        if connection_id in self.active_connections:
            conn_info = self.active_connections[connection_id]
            user_id = conn_info['user_id']
            
            # הסרה מחדרים
            for room_id in conn_info['rooms']:
                self.leave_room(connection_id, room_id)
            
            # הסרה מרשימת משתמש
            if user_id and user_id in self.user_connections:
                self.user_connections[user_id].remove(connection_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            # הסרת החיבור
            del self.active_connections[connection_id]
            
            print(f"❌ WebSocket disconnected: {connection_id}")
    
    async def send_to_connection(self, connection_id: str, message: dict) -> bool:
        """שליחת הודעה לחיבור ספציפי"""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]['websocket']
                await websocket.send_json(message)
                return True
            except Exception as e:
                print(f"❌ Failed to send to {connection_id}: {e}")
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
    
    async def broadcast(self, message: dict, exclude_connection: str = None) -> int:
        """שידור הודעה לכל החיבורים"""
        sent_count = 0
        for connection_id in list(self.active_connections.keys()):
            if connection_id != exclude_connection:
                if await self.send_to_connection(connection_id, message):
                    sent_count += 1
        return sent_count
    
    def join_room(self, connection_id: str, room_id: str) -> bool:
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
        print(f"🔐 Authenticating WebSocket with token: {token[:20]}...")
        payload = AuthService.verify_jwt_token(token)
        print(f"✅ Token valid for user: {payload['user_id']}")
        
        user = await db.get_user_by_id(payload['user_id'])
        if user:
            print(f"👤 User authenticated: {user['username']}")
            return user
        else:
            print(f"❌ User not found: {payload['user_id']}")
            return None
            
    except Exception as e:
        print(f"❌ WebSocket authentication failed: {e}")
        return None