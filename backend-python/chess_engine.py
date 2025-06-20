# backend-python/chess_engine.py - גרסה מהירה ומותאמת
"""
Stockfish Chess Engine - Fast Response Version
מנוע שחמט מהיר עם תגובות מיידיות
"""

import chess
import chess.engine
import os
import time
from typing import Dict, Any

class ChessEngine:
    """מנוע שחמט מבוסס Stockfish - גרסה מהירה"""
    
    def __init__(self, stockfish_path: str = None, skill_level: int = 3):
        self.stockfish_path = stockfish_path or self._find_stockfish()
        self.skill_level = skill_level
        self.engine = None
        self.board = chess.Board()
        self.game_history = []
        
        # ✅ הגדרות מהירות
        self.fast_mode = True
        self.max_think_time = 0.5  # חצי שנייה מקסימום
        self.min_think_time = 0.1  # מינימום 100ms
        
    def _find_stockfish(self) -> str:
        """מציאת נתיב Stockfish"""
        env_path = os.getenv('STOCKFISH_PATH')
        print(f"🔍 Looking for Stockfish at: {env_path}")
        
        if env_path and os.path.exists(env_path):
            print(f"✅ Found Stockfish: {env_path}")
            return env_path
        
        common_paths = [
            'stockfish',
            'stockfish.exe',
            '/usr/local/bin/stockfish',
            '/usr/bin/stockfish',
            'C:\\stockfish\\stockfish.exe',
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                print(f"✅ Found Stockfish: {path}")
                return path
                
        raise FileNotFoundError("Stockfish not found")
    
    def start_engine(self):
        """התחלת מנוע Stockfish מהיר"""
        try:
            if not self.engine:
                print(f"🚀 Starting FAST Stockfish: {self.stockfish_path}")
                self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
                
                # ✅ הגדרות מהירות למנוע
                try:
                    # הגדרת רמת skill נמוכה למהירות
                    fast_skill = min(self.skill_level, 8)  # מקסימום רמה 8
                    self.engine.configure({
                        "Skill Level": fast_skill,
                        "Hash": 16,  # מעט זיכרון למהירות
                        "Threads": 1,  # thread אחד למהירות
                        "Move Overhead": 50,  # overhead נמוך
                        "nodestime": 1000  # פחות nodes לחישוב
                    })
                    print(f"✅ FAST Stockfish ready - Level: {fast_skill}")
                except Exception as e:
                    print(f"⚠️ Could not configure fast settings: {e}")
                
        except Exception as e:
            print(f"❌ Failed to start Stockfish: {e}")
            raise
    
    def stop_engine(self):
        """עצירת המנוע"""
        if self.engine:
            try:
                self.engine.quit()
            except:
                pass
            self.engine = None
            print("🔴 Stockfish stopped")
    
    def _get_fast_time_limit(self, base_time: float = None) -> float:
        """חישוב זמן חשיבה מהיר"""
        if not self.fast_mode:
            return base_time or 1.0
            
        # ✅ זמנים מהירים לפי רמת הקושי
        time_by_level = {
            1: 0.1,   # מיידי
            2: 0.15,  # מהיר מאוד
            3: 0.2,   # מהיר
            4: 0.3,   # נורמלי
            5: 0.4,   # קצת איטי
            6: 0.5,   # בינוני
            7: 0.6,   # חכם
            8: 0.8,   # מומחה
        }
        
        return time_by_level.get(self.skill_level, 0.3)
    
    def get_ai_move(self, time_limit: float = None) -> Dict[str, Any]:
        """קבלת מהלך AI מהיר"""
        if not self.engine:
            self.start_engine()
            
        if self.board.is_game_over():
            return {
                "success": False,
                "error": "Game is over",
                "is_game_over": True
            }
        
        try:
            # ✅ זמן חשיבה מהיר
            think_time = self._get_fast_time_limit(time_limit)
            print(f"🤖 AI thinking for {think_time}s (Level {self.skill_level})")
            
            start_time = time.time()
            
            # ✅ חישוב מהיר עם timeout קצר
            result = self.engine.play(
                self.board, 
                chess.engine.Limit(time=think_time),
                info=chess.engine.INFO_NONE  # ללא מידע נוסף למהירות
            )
            
            actual_time = time.time() - start_time
            print(f"⚡ AI decided in {actual_time:.2f}s: {result.move}")
            
            if result.move:
                san_notation = self.board.san(result.move)
                self.board.push(result.move)
                
                self.game_history.append({
                    "move": result.move.uci(),
                    "san": san_notation,
                    "timestamp": time.time(),
                    "think_time": actual_time
                })
                
                return {
                    "success": True,
                    "move": result.move.uci(),
                    "san": san_notation,
                    "fen": self.board.fen(),
                    "legal_moves": [m.uci() for m in self.board.legal_moves],
                    "turn": "black" if self.board.turn else "white",
                    "is_game_over": self.board.is_game_over(),
                    "think_time": actual_time
                }
            else:
                return {
                    "success": False,
                    "error": "Engine returned no move"
                }
                
        except Exception as e:
            print(f"❌ AI move failed: {e}")
            return {
                "success": False,
                "error": f"Engine error: {str(e)}"
            }
    
    def _skill_to_elo(self, skill_level: int) -> int:
        """המרת רמת skill ל-ELO משוער - מהירות"""
        # ✅ רמות נמוכות יותר למהירות
        return 800 + (skill_level * 150)
    
    def new_game(self) -> Dict[str, Any]:
        """התחלת משחק חדש מהיר"""
        self.board = chess.Board()
        self.game_history = []
        
        return {
            "fen": self.board.fen(),
            "legal_moves": [move.uci() for move in self.board.legal_moves],
            "turn": "white",
            "status": "active",
            "move_count": 0,
            "fast_mode": self.fast_mode
        }
    
    def make_move(self, move_uci: str) -> Dict[str, Any]:
        """ביצוע מהלך מהיר"""
        try:
            move = chess.Move.from_uci(move_uci)
            
            if move not in self.board.legal_moves:
                return {
                    "success": False,
                    "error": f"Illegal move: {move_uci}",
                    "legal_moves": [m.uci() for m in self.board.legal_moves]
                }
            
            san_notation = self.board.san(move)
            self.board.push(move)
            
            self.game_history.append({
                "move": move_uci,
                "san": san_notation,
                "timestamp": time.time()
            })
            
            return {
                "success": True,
                "move": move_uci,
                "san": san_notation,
                "fen": self.board.fen(),
                "legal_moves": [m.uci() for m in self.board.legal_moves],
                "turn": "black" if self.board.turn else "white",
                "is_game_over": self.board.is_game_over()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Invalid move: {str(e)}"
            }
    
    def get_game_result(self) -> str:
        """תוצאת המשחק"""
        if not self.board.is_game_over():
            return "game in progress"
        elif self.board.is_checkmate():
            winner = "black" if self.board.turn == chess.WHITE else "white"
            return f"{winner} wins by checkmate"
        elif self.board.is_stalemate():
            return "draw by stalemate"
        elif self.board.is_insufficient_material():
            return "draw by insufficient material"
        elif self.board.is_fivefold_repetition():
            return "draw by repetition"
        elif self.board.is_seventyfive_moves():
            return "draw by 75-move rule"
        else:
            return "game in progress"
    
    def set_skill_level(self, level: int):
        """עדכון רמת הקושי - מהיר"""
        # ✅ הגבל לרמות נמוכות למהירות
        self.skill_level = max(1, min(8, level))
        print(f"🎯 FAST skill level: {self.skill_level} (ELO: ~{self._skill_to_elo(self.skill_level)})")
        
        # ✅ עדכן הגדרות מהירות אם המנוע פועל
        if self.engine:
            try:
                self.engine.configure({
                    "Skill Level": self.skill_level,
                    "Hash": 16,  # קטן למהירות
                    "Threads": 1
                })
            except:
                pass
    
    def set_fast_mode(self, enabled: bool):
        """הפעל/כבה מצב מהיר"""
        self.fast_mode = enabled
        if enabled:
            self.max_think_time = 0.5
            print("⚡ Fast mode enabled - quick responses")
        else:
            self.max_think_time = 2.0
            print("🐌 Normal mode enabled - thoughtful moves")
    
    def load_fen(self, fen: str) -> bool:
        """טעינת מיקום מ-FEN"""
        try:
            self.board = chess.Board(fen)
            self.game_history = []
            return True
        except Exception as e:
            print(f"❌ Invalid FEN: {e}")
            return False

# ✅ Instance גלובלי מהיר
chess_engine = ChessEngine(skill_level=3)  # התחל מרמה נמוכה

# ✅ Helper functions מהירים
def init_engine(skill_level: int = 3):
    """אתחול מנוע מהיר"""
    chess_engine.set_skill_level(skill_level)
    chess_engine.set_fast_mode(True)  # מצב מהיר
    chess_engine.start_engine()

def cleanup_engine():
    """ניקוי המנוע"""
    chess_engine.stop_engine()

def test_stockfish():
    """בדיקת Stockfish מהירה"""
    try:
        test_engine = ChessEngine(skill_level=1)
        test_engine.set_fast_mode(True)
        test_engine.start_engine()
        
        # Test move מהיר
        start_time = time.time()
        result = test_engine.get_ai_move(0.1)  # 100ms test
        test_time = time.time() - start_time
        
        test_engine.stop_engine()
        
        if result['success']:
            print(f"✅ FAST Stockfish test passed: {result['move']} in {test_time:.2f}s")
            return True
        else:
            print(f"❌ Stockfish test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Stockfish test error: {e}")
        return False

# ✅ Test מהירות בעת import
if __name__ == "__main__":
    print("🚀 Testing fast chess engine...")
    test_stockfish()