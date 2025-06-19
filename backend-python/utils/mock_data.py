# backend-python/utils/mock_data.py
"""
Mock Database - כל המידע הדמה במקום אחד
"""

import uuid
import time
from datetime import datetime
from typing import Dict, List, Optional

class MockDatabase:
    """מסד נתונים דמה לפיתוח"""
    
    def __init__(self):
        self.users: Dict[str, dict] = {}
        self.sessions: Dict[str, dict] = {}
        self.games: Dict[str, dict] = {}
        self.connected_players: Dict[str, dict] = {}
        self.waiting_queue: List[str] = []
        
        # נתונים ראשוניים
        self._init_sample_data()
    
    def _init_sample_data(self):
        """יצירת נתונים דמה ראשוניים"""
        # משתמש לדוגמה
        sample_user_id = str(uuid.uuid4())
        self.users[sample_user_id] = {
            'user_id': sample_user_id,
            'username': 'TestPlayer',
            'email': 'test@chessmentor.com',
            'elo_rating': 1350,
            'games_played': 23,
            'games_won': 15,
            'created_at': datetime.now().isoformat(),
            'last_active': datetime.now().isoformat(),
            'preferences': {
                'theme': 'light',
                'board_theme': 'classic',
                'piece_style': 'classic',
                'sound_enabled': True,
                'show_legal_moves': True,
                'auto_save': True
            }
        }
        
        # עוד כמה משתמשים לדוגמה
        for i in range(1, 4):
            user_id = str(uuid.uuid4())
            self.users[user_id] = {
                'user_id': user_id,
                'username': f'Player{i}',
                'email': f'player{i}@chessmentor.com',
                'elo_rating': 1200 + (i * 100),
                'games_played': i * 5,
                'games_won': i * 2,
                'created_at': datetime.now().isoformat(),
                'last_active': datetime.now().isoformat(),
                'preferences': {
                    'theme': 'light' if i % 2 == 0 else 'dark',
                    'board_theme': 'classic',
                    'piece_style': 'classic',
                    'sound_enabled': True,
                    'show_legal_moves': True,
                    'auto_save': True
                }
            }
        
        print(f"✅ Mock database initialized with {len(self.users)} sample users")
    
    def create_user(self, username: str, email: str = None, password: str = None) -> dict:
        """יצירת משתמש חדש"""
        user_id = str(uuid.uuid4())
        user_data = {
            'user_id': user_id,
            'username': username,
            'email': email,
            'password_hash': f"hashed_{password}" if password else None,  # hash דמה
            'elo_rating': 1200,
            'games_played': 0,
            'games_won': 0,
            'created_at': datetime.now().isoformat(),
            'last_active': datetime.now().isoformat(),
            'preferences': {
                'theme': 'light',
                'board_theme': 'classic',
                'piece_style': 'classic',
                'sound_enabled': True,
                'show_legal_moves': True,
                'auto_save': True
            }
        }
        self.users[user_id] = user_data
        print(f"✅ Created user: {username} (ID: {user_id[:8]})")
        return user_data
    
    def create_session(self, user_id: str = None, username: str = "Guest", elo: int = 1200, is_guest: bool = False) -> str:
        """יצירת session חדש"""
        session_id = str(uuid.uuid4())
        session_data = {
            'session_id': session_id,
            'user_id': user_id,
            'username': username,
            'elo': elo,
            'is_guest': is_guest,
            'created_at': datetime.now().isoformat(),
            'timestamp': time.time(),
            'active': True
        }
        self.sessions[session_id] = session_data
        print(f"✅ Created session: {username} (Session: {session_id[:8]})")
        return session_id
    
    def get_user_by_username(self, username: str) -> Optional[dict]:
        """חיפוש משתמש לפי שם"""
        for user in self.users.values():
            if user['username'].lower() == username.lower():
                return user
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """חיפוש משתמש לפי ID"""
        return self.users.get(user_id)
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """קבלת session"""
        return self.sessions.get(session_id)
    
    def validate_session(self, session_id: str) -> bool:
        """בדיקת תקינות session"""
        session = self.get_session(session_id)
        if not session:
            return False
        
        # בדיקת תוקף - sessions תקפים ל-24 שעות
        session_time = session.get('timestamp', 0)
        current_time = time.time()
        if current_time - session_time > 86400:  # 24 שעות
            self.delete_session(session_id)
            return False
        
        return session.get('active', False)
    
    def delete_session(self, session_id: str) -> bool:
        """מחיקת session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            print(f"🗑️ Deleted session: {session_id[:8]}")
            return True
        return False
    
    def create_game(self, game_type: str, white_player: str, black_player: str = None) -> str:
        """יצירת משחק חדש"""
        game_id = str(uuid.uuid4())
        game_data = {
            'id': game_id,
            'type': game_type,  # 'ai' או 'multiplayer'
            'white_player': white_player,
            'black_player': black_player or 'AI',
            'status': 'active',  # 'active', 'finished', 'paused'
            'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'moves': [],  # רשימת מהלכים בפורמט UCI
            'move_history': [],  # היסטוריה מפורטת
            'start_time': time.time(),
            'last_move_time': time.time(),
            'chat_history': [],
            'result': None,
            'time_control': None,  # בקרת זמן
            'metadata': {
                'created_at': datetime.now().isoformat(),
                'white_elo': 1200,
                'black_elo': 1200 if black_player != 'AI' else 1500
            }
        }
        self.games[game_id] = game_data
        print(f"🎮 Created {game_type} game: {game_id[:8]} ({white_player} vs {black_player or 'AI'})")
        return game_id
    
    def get_game(self, game_id: str) -> Optional[dict]:
        """קבלת משחק לפי ID"""
        return self.games.get(game_id)
    
    def update_game(self, game_id: str, updates: dict) -> bool:
        """עדכון משחק"""
        if game_id in self.games:
            self.games[game_id].update(updates)
            self.games[game_id]['last_move_time'] = time.time()
            return True
        return False
    
    def finish_game(self, game_id: str, result: str) -> bool:
        """סיום משחק"""
        if game_id in self.games:
            self.games[game_id]['status'] = 'finished'
            self.games[game_id]['result'] = result
            self.games[game_id]['finished_at'] = datetime.now().isoformat()
            print(f"🏁 Game finished: {game_id[:8]} - {result}")
            return True
        return False
    
    def get_active_games(self) -> List[dict]:
        """קבלת רשימת משחקים פעילים"""
        return [game for game in self.games.values() if game['status'] == 'active']
    
    def get_user_games(self, user_id: str, limit: int = 20) -> List[dict]:
        """קבלת משחקי משתמש"""
        user_games = []
        for game in self.games.values():
            if game['white_player'] == user_id or game['black_player'] == user_id:
                user_games.append(game)
        
        # מיון לפי זמן יצירה (החדשים ביותר קודם)
        user_games.sort(key=lambda g: g.get('start_time', 0), reverse=True)
        return user_games[:limit]
    
    def update_user_stats(self, user_id: str, game_result: str) -> bool:
        """עדכון סטטיסטיקות משתמש אחרי משחק"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user['games_played'] += 1
        user['last_active'] = datetime.now().isoformat()
        
        if 'win' in game_result.lower():
            user['games_won'] += 1
            # עדכון ELO (פשוט)
            user['elo_rating'] += 15
        elif 'loss' in game_result.lower():
            user['elo_rating'] = max(800, user['elo_rating'] - 10)  # מינימום 800
        # draw - אין שינוי ב-ELO
        
        print(f"📊 Updated stats for {user['username']}: {user['games_won']}/{user['games_played']} (ELO: {user['elo_rating']})")
        return True
    
    def cleanup_old_sessions(self) -> int:
        """ניקוי sessions ישנים"""
        current_time = time.time()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            session_time = session.get('timestamp', 0)
            if current_time - session_time > 86400:  # 24 שעות
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.sessions[session_id]
        
        if expired_sessions:
            print(f"🧹 Cleaned up {len(expired_sessions)} expired sessions")
        
        return len(expired_sessions)
    
    def get_statistics(self) -> dict:
        """קבלת סטטיסטיקות כלליות"""
        active_games = len([g for g in self.games.values() if g['status'] == 'active'])
        total_moves = sum(len(g['moves']) for g in self.games.values())
        
        return {
            'total_users': len(self.users),
            'active_sessions': len(self.sessions),
            'total_games': len(self.games),
            'active_games': active_games,
            'finished_games': len(self.games) - active_games,
            'connected_players': len(self.connected_players),
            'waiting_queue': len(self.waiting_queue),
            'total_moves_played': total_moves
        }
    
    def reset_all_data(self):
        """איפוס כל הנתונים (לבדיקות)"""
        self.users.clear()
        self.sessions.clear()
        self.games.clear()
        self.connected_players.clear()
        self.waiting_queue.clear()
        self._init_sample_data()
        print("🔄 All data reset to initial state")

# יצירת instance גלובלי
mock_db = MockDatabase()